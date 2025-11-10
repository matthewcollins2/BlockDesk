import { useState } from 'react';
import { Wallet, LogOut, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { useWeb3 } from '../contexts/Web3Context';

export default function WalletConnection() {
  const { isConnected, isConnecting, user, connectWallet, disconnectWallet } = useWeb3();
  const [showFullAddress, setShowFullAddress] = useState(false);

  const formatAddress = (address: string) => {
    if (showFullAddress) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    return num.toFixed(4);
  };

  if (isConnected && user) {
    return (
      <div className="flex items-center gap-2">
        <div className="text-right text-sm">
          <div className="text-gray-300">
            <span className="text-gray-400">{user.role}</span>
          </div>
          <div 
            className="text-white cursor-pointer hover:text-cyan-400 transition-colors"
            onClick={() => setShowFullAddress(!showFullAddress)}
            title="Click to toggle full address"
          >
            {formatAddress(user.address)}
          </div>
          {user.balance && (
            <div className="text-gray-400 text-xs">
              {formatBalance(user.balance)} ETH
            </div>
          )}
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={disconnectWallet}
          className="bg-red-600 hover:bg-red-700 text-white border-red-500"
        >
          <LogOut size={16} />
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={connectWallet}
      disabled={isConnecting}
      className="bg-cyan-600 hover:bg-cyan-700 text-white"
    >
      {isConnecting ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Wallet size={16} />
          Connect MetaMask
        </>
      )}
    </Button>
  );
}