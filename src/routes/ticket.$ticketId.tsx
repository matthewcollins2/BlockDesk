import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Edit, 
  Paperclip,
  Clock,
  AlertCircle,
  CheckCircle,
  Pause,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWeb3 } from '@/contexts/Web3Context';
import { useNotifications } from '@/contexts/NotificationContext';
import { Ticket, TicketStatus, TicketEvent, UserRole } from '@/types';

export const Route = createFileRoute('/ticket/$ticketId')({
  component: TicketDetails,
});

function TicketDetails() {
  const { ticketId } = useParams({ from: '/ticket/$ticketId' });
  const { user, contract } = useWeb3();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [ticketEvents, setTicketEvents] = useState<TicketEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadTicketDetails();
  }, [ticketId, contract]);

  const loadTicketDetails = async () => {
    setLoading(true);
    try {
      // Load tickets from localStorage and find the specific ticket
      const userTickets = JSON.parse(localStorage.getItem('blockdesk-tickets') || '[]');
      
      // Find the specific ticket by ID (only from user-created tickets)
      const foundTicket = userTickets.find((t: any) => t.id === ticketId);
      
      if (!foundTicket) {
        throw new Error('Ticket not found');
      }
      
      // TODO: Replace with actual contract calls when deployed
      // if (contract) {
      //   const ticketData = await contract.getTicket(ticketId);
      //   const events = await contract.getTicketEvents(ticketId);
      //   setTicket(parseTicketFromContract(ticketData));
      //   setTicketEvents(parseEventsFromContract(events));
      // }
      
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setTicket(foundTicket);
      
      // Create events for the ticket
      const events = [
        {
          id: "1",
          ticketId: ticketId,
          eventType: "Ticket Created",
          actor: foundTicket.creator,
          timestamp: foundTicket.createdAt,
          transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
          data: { title: foundTicket.title }
        }
      ];
      
      setTicketEvents(events);
    } catch (error) {
      console.error('Error loading ticket details:', error);
      addNotification({
        type: 'error',
        title: 'Failed to load ticket',
        message: 'Unable to fetch ticket details'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (newStatus: TicketStatus) => {
    if (!contract || !ticket) return;

    setUpdating(true);
    try {
      addNotification({
        type: 'info',
        title: 'Updating Status...',
        message: 'Please confirm the transaction in MetaMask',
        duration: 0
      });

      // TODO: Call smart contract
      // const tx = await contract.updateStatus(ticketId, newStatus);
      // await tx.wait();

      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 2000));

      addNotification({
        type: 'success',
        title: 'Status Updated',
        message: `Ticket status changed to ${newStatus}`
      });

      // Reload ticket data
      loadTicketDetails();

    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.message
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN:
        return <AlertCircle className="text-red-500" size={24} />;
      case TicketStatus.IN_PROGRESS:
        return <Pause className="text-yellow-500" size={24} />;
      case TicketStatus.RESOLVED:
        return <CheckCircle className="text-green-500" size={24} />;
      case TicketStatus.CLOSED:
        return <XCircle className="text-gray-500" size={24} />;
      default:
        return <Clock className="text-gray-400" size={24} />;
    }
  };

  const getStatusBadgeClass = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN:
        return "bg-red-100 text-red-800 border-red-200";
      case TicketStatus.IN_PROGRESS:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case TicketStatus.RESOLVED:
        return "bg-green-100 text-green-800 border-green-200";
      case TicketStatus.CLOSED:
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-500 border-gray-200";
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canUpdateStatus = () => {
    return user && (
      user.role === UserRole.AGENT || 
      user.role === UserRole.MANAGER
    ) && ticket?.status !== TicketStatus.CLOSED;
  };

  const getNextStatuses = () => {
    if (!ticket) return [];
    
    switch (ticket.status) {
      case TicketStatus.OPEN:
        return [TicketStatus.IN_PROGRESS];
      case TicketStatus.IN_PROGRESS:
        return [TicketStatus.RESOLVED];
      case TicketStatus.RESOLVED:
        return [TicketStatus.CLOSED];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          <span className="ml-2 text-gray-600">Loading ticket details...</span>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Ticket Not Found</h2>
          <p className="text-gray-500 mb-4">The requested ticket could not be found.</p>
          <Button onClick={() => navigate({ to: '/dashboard' })}>
            <ArrowLeft size={16} />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: '/dashboard' })}
          className="mb-4"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Ticket #{ticket.id}
            </h1>
            <p className="text-xl text-gray-700">{ticket.title}</p>
          </div>
          
          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border ${getStatusBadgeClass(ticket.status)}`}>
            {getStatusIcon(ticket.status)}
            {ticket.status}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Details */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </p>
            
            {ticket.attachment && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Attachment</h3>
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Paperclip size={16} />
                  <a 
                    href={`https://ipfs.io/ipfs/${ticket.attachment}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    View File ({ticket.attachment})
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Action Panel */}
          {canUpdateStatus() && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-3">
                {getNextStatuses().map((status) => (
                  <Button
                    key={status}
                    onClick={() => updateTicketStatus(status)}
                    disabled={updating}
                    className="mr-2"
                  >
                    <Edit size={16} />
                    Update to {status}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Event History */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ticket History</h2>
            <div className="space-y-4">
              {ticketEvents.map((event) => (
                <div key={event.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center">
                      <Clock size={16} className="text-cyan-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">
                        {event.eventType}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatDate(event.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      by {formatAddress(event.actor)}
                    </p>
                    <a
                      href={`https://etherscan.io/tx/${event.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Tx: {event.transactionHash.slice(0, 10)}...
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ticket Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Created By</label>
                <p className="text-sm text-gray-900 font-mono">{formatAddress(ticket.creator)}</p>
              </div>
              
              {ticket.agent && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Assigned Agent</label>
                  <p className="text-sm text-gray-900 font-mono">{formatAddress(ticket.agent)}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-500">Created Date</label>
                <p className="text-sm text-gray-900">{formatDate(ticket.createdAt)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="text-sm text-gray-900">{ticket.status}</p>
              </div>
            </div>
          </div>

          {/* Blockchain Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Blockchain Transparency</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• All changes are immutably recorded</li>
              <li>• Full audit trail maintained</li>
              <li>• Decentralized and transparent</li>
              <li>• No data can be altered or deleted</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}