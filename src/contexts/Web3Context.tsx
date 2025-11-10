import { createContext, useContext, useState, ReactNode } from 'react';
import { ethers } from 'ethers';
import { User, UserRole } from '../types';

interface Web3ContextType {
  isConnected: boolean;
  isConnecting: boolean;
  user: User | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  contract: ethers.Contract | null;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }
    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        const balance = await web3Provider.getBalance(accounts[0]);
        setProvider(web3Provider);
        
        // Determine role based on wallet address (demo purposes)
        const getUserRole = (address: string): UserRole => {
          // Manager addresses (full admin access) - SPECIFIC ADDRESSES ONLY
          const managerAddresses = [
            '0x2580fd5d3652b9fce4c7f14f30bbb77e5aeafd7d', // Your wallet address - ADMIN
            // Add more specific manager addresses here if needed
          ];
          
          // Agent addresses (can assign tickets to themselves, update status)  
          const agentAddresses: string[] = [
            // Add agent wallet addresses here if you want to test agent role
            // '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          ];
          
          // Demo mode: Check URL params for role override (for easy testing)
          const urlParams = new URLSearchParams(window.location.search);
          const roleParam = urlParams.get('role');
          if (roleParam === 'user') return UserRole.USER;
          if (roleParam === 'agent') return UserRole.AGENT;
          if (roleParam === 'manager') return UserRole.MANAGER;
          
          // Check if address matches your specific admin wallet
          if (managerAddresses.includes(address.toLowerCase())) {
            return UserRole.MANAGER;
          }
          
          // Check if address is an agent
          if (agentAddresses.includes(address.toLowerCase())) {
            return UserRole.AGENT;
          }
          
          // Default to regular user for any other wallet
          return UserRole.USER;
        };
        
        setUser({
          address: accounts[0],
          role: getUserRole(accounts[0]),
          balance: ethers.formatEther(balance)
        });
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setUser(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
  };

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

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}

