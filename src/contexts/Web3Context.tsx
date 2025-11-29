import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { User, UserRole } from '../types';
// @ts-ignore
import BlockDeskArtifact from '../contracts/BlockDesk.json'; 

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
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }
    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Force Network Switch to Localhost
      const LOCAL_CHAIN_ID = '0x539'; // 1337
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: LOCAL_CHAIN_ID }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                  chainId: LOCAL_CHAIN_ID,
                  chainName: 'Localhost 8545',
                  rpcUrls: ['http://127.0.0.1:8545'],
                  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              }],
            });
          } catch (addError) { console.error(addError); }
        }
      }

      if (accounts.length > 0) {
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        const web3Signer = await web3Provider.getSigner();
        const address = accounts[0];
        const balance = await web3Provider.getBalance(address);
        
        const network = await web3Provider.getNetwork();
        const chainId = network.chainId.toString();

        // @ts-ignore
        const deployedNetwork = BlockDeskArtifact.networks[chainId] || BlockDeskArtifact.networks['5777'];
        
        if (deployedNetwork) {
          // *** NEW CHECK: Verify Contract Exists ***
          const code = await web3Provider.getCode(deployedNetwork.address);
          if (code === '0x') {
            alert('Error: Contract not found at address. \n\nDid you restart Ganache? Run "truffle migrate --reset" to fix this.');
            setIsConnecting(false);
            return;
          }

          const blockDeskContract = new ethers.Contract(
            deployedNetwork.address,
            BlockDeskArtifact.abi,
            web3Signer
          );

          let role = UserRole.USER;
          try {
            const roleIdx = await blockDeskContract.userRoles(address);
            role = Number(roleIdx) === 1 ? UserRole.MANAGER : UserRole.USER;
          } catch (e) { console.warn(e); }
          
          setProvider(web3Provider);
          setSigner(web3Signer);
          setContract(blockDeskContract);
          
          setUser({
            address: address,
            role: role,
            balance: ethers.formatEther(balance)
          });
          setIsConnected(true);
        } else {
          alert('Contract not deployed to this network. Run "truffle migrate".');
          setIsConnecting(false);
        }
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

  useEffect(() => {
    if (window.ethereum && isConnected) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0 || (user && accounts[0].toLowerCase() !== user.address.toLowerCase())) {
          disconnectWallet();
          // Optional: Auto-reconnect
          // connectWallet(); 
        }
      };
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [user, isConnected]);

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