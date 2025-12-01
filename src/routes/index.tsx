import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Ticket,
  Shield,
  Zap,
  FileText,
  Users,
  Globe,
  CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWeb3 } from '@/contexts/Web3Context'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const { isConnected, user } = useWeb3()

  const features = [
    {
      icon: <Shield className="w-12 h-12 text-cyan-400" />,
      title: 'Blockchain Security',
      description:
        'All tickets are stored immutably on the blockchain, ensuring complete transparency and data integrity.',
    },
    {
      icon: <Zap className="w-12 h-12 text-cyan-400" />,
      title: 'Smart Contract Automation',
      description:
        'Automated ticket assignment and status updates powered by smart contracts for efficient IT support.',
    },
    {
      icon: <FileText className="w-12 h-12 text-cyan-400" />,
      title: 'Complete Audit Trail',
      description:
        'Every action is recorded on-chain with transaction hashes, providing a permanent audit trail.',
    },
    {
      icon: <Users className="w-12 h-12 text-cyan-400" />,
      title: 'Role-Based Access',
      description:
        'Different user roles (User, Agent, Manager) with appropriate permissions for secure ticket management.',
    },
    {
      icon: <Globe className="w-12 h-12 text-cyan-400" />,
      title: 'IPFS Integration',
      description:
        'File attachments are stored on IPFS for decentralized, permanent, and cost-effective storage.',
    },
    {
      icon: <CheckCircle className="w-12 h-12 text-cyan-400" />,
      title: 'Transparent Process',
      description:
        'Users can track ticket progress in real-time with full visibility into all status changes and assignments.',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-cyan-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="flex justify-center mb-8">
          <Ticket size={80} className="text-cyan-500" />
        </div>
        
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          BlockDesk
        </h1>
        
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          A decentralized IT support desk built on blockchain technology. 
          Experience transparent, immutable, and efficient ticket management with complete auditability.
        </p>

        {isConnected && user ? (
          <div className="space-x-4">
            <Link to="/dashboard">
              <Button size="lg" className="bg-cyan-600 hover:bg-cyan-700">
                View Dashboard
              </Button>
            </Link>
            <Link to="/create-ticket">
              <Button size="lg" variant="outline">
                Create New Ticket
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-yellow-800 mb-4">
              Connect your MetaMask wallet to get started
            </p>
            <p className="text-sm text-yellow-600">
              Make sure you have MetaMask installed and connected to the correct network
            </p>
          </div>
        )}
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Why Choose BlockDesk?
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-cyan-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-cyan-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Submit Ticket</h3>
              <p className="text-gray-600">
                Connect your wallet and submit IT support requests with optional file attachments
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-cyan-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-cyan-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Blockchain Storage</h3>
              <p className="text-gray-600">
                Tickets are stored immutably on the blockchain with IPFS for file storage
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-cyan-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-cyan-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Track Progress</h3>
              <p className="text-gray-600">
                Monitor real-time updates with complete transparency and audit trail
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Technology Stack */}
      <div className="bg-cyan-600 text-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Built With Modern Technology
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-colors">
              <h3 className="font-semibold mb-2">Blockchain</h3>
              <p className="text-sm text-cyan-100">Ethereum & Smart Contracts</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-colors">
              <h3 className="font-semibold mb-2">Storage</h3>
              <p className="text-sm text-cyan-100">IPFS Decentralized Storage</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-colors">
              <h3 className="font-semibold mb-2">Wallet</h3>
              <p className="text-sm text-cyan-100">MetaMask Integration</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-colors">
              <h3 className="font-semibold mb-2">Frontend</h3>
              <p className="text-sm text-cyan-100">React & TanStack Router</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Ticket size={24} className="text-cyan-400" />
            <span className="text-lg font-semibold">BlockDesk</span>
          </div>
          <p className="text-gray-400 mb-4">
            Built by Chris Vo, Matthew Collins, Shu Zhang
          </p>
          <div className="text-sm text-gray-500">
            <p>Academic Project • Blockchain Development • Smart Contracts</p>
          </div>
        </div>
      </footer>
    </div>
  )
}