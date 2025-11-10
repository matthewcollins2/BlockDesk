import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { 
  Ticket, 
  Plus, 
  Home, 
  Menu, 
  X,
  Shield
} from 'lucide-react';
import WalletConnection from './WalletConnection';
import { useWeb3 } from '../contexts/Web3Context';
import { UserRole } from '../types';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useWeb3();

  return (
    <>
      <header className="p-4 flex items-center justify-between bg-gray-800 text-white shadow-lg">
        <div className="flex items-center">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <h1 className="ml-4 text-xl font-semibold">
            <Link to="/" className="flex items-center gap-2 hover:text-cyan-400 transition-colors">
              <Ticket size={24} className="text-cyan-400" />
              BlockDesk
            </Link>
          </h1>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Link 
            to="/dashboard" 
            className="hover:text-cyan-400 transition-colors"
            activeProps={{ className: "text-cyan-400" }}
          >
            Dashboard
          </Link>
          <Link 
            to="/create-ticket" 
            className="hover:text-cyan-400 transition-colors"
            activeProps={{ className: "text-cyan-400" }}
          >
            Create Ticket
          </Link>
          {user && (user.role === UserRole.MANAGER || user.role === UserRole.AGENT) && (
            <Link 
              to="/admin" 
              className="hover:text-cyan-400 transition-colors"
              activeProps={{ className: "text-cyan-400" }}
            >
              Admin Panel
            </Link>
          )}
        </nav>

        <WalletConnection />
      </header>

      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-gray-900 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Menu</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <Home size={20} />
            <span className="font-medium">Home</span>
          </Link>

          <Link
            to="/dashboard"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <Ticket size={20} />
            <span className="font-medium">Dashboard</span>
          </Link>

          <Link
            to="/create-ticket"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <Plus size={20} />
            <span className="font-medium">Create Ticket</span>
          </Link>

          {user && (user.role === UserRole.MANAGER || user.role === UserRole.AGENT) && (
            <Link
              to="/admin"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
              activeProps={{
                className:
                  'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
              }}
            >
              <Shield size={20} />
              <span className="font-medium">Admin Panel</span>
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            <p>Built by:</p>
            <p className="text-white">Chris Vo, Matthew Collins, Shu Zhang</p>
          </div>
        </div>
      </aside>
    </>
  );
}
