import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { User, UserRole } from '../types';
// @ts-ignore
import BlockDeskArtifact from '../contracts/BlockDesk.json'; 

// Extend Window type to include MetaMask's ethereum object
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface Web3ContextType {
  isConnected: boolean;
  isConnecting: boolean;
  user: User | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  contract: ethers.Contract | null;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: ReactNode }) {
  // Connection state - tracks MetaMask connection status
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // User data - stores address, role (User/Manager), and ETH balance
  const [user, setUser] = useState<User | null>(null);
  
  // Web3 objects for blockchain interaction
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null); // Read-only access
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null); // Can sign transactions
  const [contract, setContract] = useState<ethers.Contract | null>(null); // BlockDesk smart contract instance

  // Connect to MetaMask and initialize Web3 connection
  // Connect to MetaMask and initialize Web3 connection
  const connectWallet = async () => {
    console.log('=== Starting MetaMask Connection ===');
    
    // Check if MetaMask is installed
    if (!window.ethereum) {
      console.error('MetaMask not detected');
      alert('Please install MetaMask!');
      return;
    }
    
    console.log('MetaMask detected, requesting accounts...');
    setIsConnecting(true);
    
    try {
      // Request user to connect their MetaMask account
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log('Accounts received:', accounts);

      if (accounts.length > 0) {
        const address = accounts[0];
        console.log('User address:', address);
        
        // Set basic connection immediately (fast response for user)
        setUser({
          address: address,
          role: UserRole.USER,
          balance: '0'
        });
        setIsConnected(true);
        console.log('=== Basic Connection Successful ===');
        
        // Load blockchain data in background (with slight delay to avoid blocking UI)
        setTimeout(async () => {
          try {
            console.log('Creating provider...');
            const web3Provider = new ethers.BrowserProvider(window.ethereum);
            
            console.log('Getting signer...');
            const web3Signer = await web3Provider.getSigner();
            
            console.log('Getting balance...');
            const balance = await web3Provider.getBalance(address);
            console.log('Balance:', ethers.formatEther(balance), 'ETH');
            
            console.log('Getting network info...');
            const networkId = await window.ethereum.request({ method: 'net_version' });
            console.log('Network ID:', networkId);
            
            // Try to load the deployed contract
            let blockDeskContract = null;
            let role = UserRole.USER;
            
            const deployedNetwork = (BlockDeskArtifact.networks as any)?.[networkId];
            console.log('Available deployments:', Object.keys((BlockDeskArtifact.networks as any) || {}));
            
            if (deployedNetwork) {
              console.log('Contract found at:', deployedNetwork.address);
              // Create contract instance with signer (so we can call functions)
              blockDeskContract = new ethers.Contract(
                deployedNetwork.address,
                BlockDeskArtifact.abi,
                web3Signer
              );

              try {
                // Check if user has Manager role (1) or User role (0)
                const roleIdx = await blockDeskContract.userRoles(address);
                role = Number(roleIdx) === 1 ? UserRole.MANAGER : UserRole.USER;
                console.log('User role:', role);
              } catch (e) { 
                console.warn('Could not fetch role:', e); 
              }
            } else {
              console.warn('No contract for network:', networkId);
            }
            
            // Update state with full blockchain data
            setProvider(web3Provider);
            setSigner(web3Signer);
            setContract(blockDeskContract);
            
            setUser({
              address: address,
              role: role,
              balance: ethers.formatEther(balance)
            });
            console.log('=== Full Connection Successful ===');
          } catch (error: any) {
            console.warn('RPC connection failed:', error.message);
          }
        }, 100);
      }
    } catch (error: any) {
      console.error('=== Connection Failed ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      
      if (error.code === 4001) {
        alert('MetaMask connection was rejected. Please try again and approve the connection.');
      } else {
        alert(`Failed to connect to MetaMask: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Clear all connection data when user disconnects
  // Clear all connection data when user disconnects
  const disconnectWallet = () => {
    setIsConnected(false);
    setUser(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
  };

  // Listen for MetaMask account changes (user switches accounts or disconnects)
  useEffect(() => {
    if (window.ethereum && isConnected) {
      const handleAccountsChanged = (accounts: string[]) => {
        // If no accounts or different account, disconnect current session
        if (accounts.length === 0 || (user && accounts[0].toLowerCase() !== user.address.toLowerCase())) {
          disconnectWallet();
          // Optional: Automatically reconnect with new account
          // connectWallet(); 
        }
      };
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [user, isConnected]);

  // Provide Web3 context to all child components
  const value: Web3ContextType = {
    isConnected,
    isConnecting,
    user,
    connectWallet,
    disconnectWallet,
    provider,
    signer,
    contract
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

// Custom hook to use Web3 context in components
export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}