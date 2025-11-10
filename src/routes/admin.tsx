import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  UserCheck, 
  Eye, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWeb3 } from '@/contexts/Web3Context';
import { useNotifications } from '@/contexts/NotificationContext';
import { Ticket, TicketStatus, UserRole } from '@/types';

export const Route = createFileRoute('/admin')({
  component: AdminPanel,
});

function AdminPanel() {
  const { user, contract } = useWeb3();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  
  const [unassignedTickets, setUnassignedTickets] = useState<Ticket[]>([]);
  const [inProgressTickets, setInProgressTickets] = useState<Ticket[]>([]);
  const [resolvedTickets, setResolvedTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);
  const [closing, setClosing] = useState<string | null>(null);
  const [agentAddress, setAgentAddress] = useState('');

  useEffect(() => {
    loadAdminData();
  }, [contract]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // Load tickets from localStorage (same as dashboard)
      const userTickets = JSON.parse(localStorage.getItem('blockdesk-tickets') || '[]');
      
      // Filter for unassigned tickets (Open status, no agent)
      const unassigned = userTickets.filter((ticket: any) => 
        ticket.status === 'Open' && !ticket.agent
      );
      
      // Filter for in-progress tickets
      const inProgress = userTickets.filter((ticket: any) => 
        ticket.status === 'In-Progress'
      );
      
      // Filter for resolved tickets  
      const resolved = userTickets.filter((ticket: any) => 
        ticket.status === 'Resolved'
      );
      
      // TODO: Replace with actual contract calls when deployed
      // if (contract) {
      //   const unassigned = await contract.getUnassignedTickets();
      //   const resolved = await contract.getResolvedTickets();
      //   setUnassignedTickets(parseTicketsFromContract(unassigned));
      //   setResolvedTickets(parseTicketsFromContract(resolved));
      // }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setUnassignedTickets(unassigned);
      setInProgressTickets(inProgress);
      setResolvedTickets(resolved);
    } catch (error) {
      console.error('Error loading admin data:', error);
      addNotification({
        type: 'error',
        title: 'Failed to load admin data',
        message: 'Unable to fetch tickets'
      });
    } finally {
      setLoading(false);
    }
  };

  const assignTicket = async (ticketId: string, agentAddr: string) => {
    if (!agentAddr) return;

    setAssigning(ticketId);
    try {
      addNotification({
        type: 'info',
        title: 'Assigning Ticket...',
        message: 'Updating ticket assignment',
        duration: 0
      });

      // Update ticket in localStorage
      const userTickets = JSON.parse(localStorage.getItem('blockdesk-tickets') || '[]');
      const updatedTickets = userTickets.map((ticket: any) => {
        if (ticket.id === ticketId) {
          return {
            ...ticket,
            agent: agentAddr,
            status: 'In-Progress'
          };
        }
        return ticket;
      });

      localStorage.setItem('blockdesk-tickets', JSON.stringify(updatedTickets));

      // TODO: Call smart contract when deployed
      // const tx = await contract.assignTicket(ticketId, agentAddr);
      // await tx.wait();

      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      addNotification({
        type: 'success',
        title: 'Ticket Assigned',
        message: `Ticket #${ticketId} assigned to ${agentAddr.slice(0, 10)}...`
      });

      // Reload data
      loadAdminData();
      setAgentAddress('');

    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Assignment Failed',
        message: error.message
      });
    } finally {
      setAssigning(null);
    }
  };

  const closeTicket = async (ticketId: string) => {
    setClosing(ticketId);
    try {
      addNotification({
        type: 'info',
        title: 'Closing Ticket...',
        message: 'Updating ticket status',
        duration: 0
      });

      // Update ticket in localStorage
      const userTickets = JSON.parse(localStorage.getItem('blockdesk-tickets') || '[]');
      const updatedTickets = userTickets.map((ticket: any) => {
        if (ticket.id === ticketId) {
          return {
            ...ticket,
            status: 'Closed'
          };
        }
        return ticket;
      });

      localStorage.setItem('blockdesk-tickets', JSON.stringify(updatedTickets));

      // TODO: Call smart contract when deployed
      // const tx = await contract.closeTicket(ticketId);
      // await tx.wait();

      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      addNotification({
        type: 'success',
        title: 'Ticket Closed',
        message: `Ticket #${ticketId} has been closed`
      });

      // Reload data
      loadAdminData();

    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Close Failed',
        message: error.message
      });
    } finally {
      setClosing(null);
    }
  };

  const resolveTicket = async (ticketId: string) => {
    setResolving(ticketId);
    try {
      addNotification({
        type: 'info',
        title: 'Resolving Ticket...',
        message: 'Marking ticket as resolved',
        duration: 0
      });

      // Update ticket in localStorage
      const userTickets = JSON.parse(localStorage.getItem('blockdesk-tickets') || '[]');
      const updatedTickets = userTickets.map((ticket: any) => {
        if (ticket.id === ticketId) {
          return {
            ...ticket,
            status: 'Resolved'
          };
        }
        return ticket;
      });

      localStorage.setItem('blockdesk-tickets', JSON.stringify(updatedTickets));

      // TODO: Call smart contract when deployed
      // const tx = await contract.resolveTicket(ticketId);
      // await tx.wait();

      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      addNotification({
        type: 'success',
        title: 'Ticket Resolved',
        message: `Ticket #${ticketId} has been marked as resolved`
      });

      // Reload data
      loadAdminData();

    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Resolve Failed',
        message: error.message
      });
    } finally {
      setResolving(null);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if user has admin privileges
  if (!user || (user.role !== UserRole.MANAGER && user.role !== UserRole.AGENT)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 mb-2">
              <AlertTriangle size={48} className="mx-auto mb-4" />
            </div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              Access Denied
            </h2>
            <p className="text-red-700 mb-4">
              You need Manager or Admin privileges to access the admin panel.
            </p>
            <Button onClick={() => navigate({ to: '/dashboard' })}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="text-cyan-500" size={32} />
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        </div>
        <p className="text-gray-600">
          Manage ticket assignments and resolve completed tickets
        </p>
      </div>

      {/* User Info */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex items-center gap-3">
          <User className="text-gray-500" size={20} />
          <div>
            <p className="text-sm font-medium text-gray-700">
              Logged in as: <span className="font-mono">{formatAddress(user.address)}</span>
            </p>
            <p className="text-sm text-gray-500">Role: {user.role}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          <span className="ml-2 text-gray-600">Loading admin data...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Unassigned Tickets */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="text-orange-500" size={24} />
              <h2 className="text-xl font-semibold text-gray-900">
                Unassigned Tickets ({unassignedTickets.length})
              </h2>
            </div>

            {unassignedTickets.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No unassigned tickets found
              </p>
            ) : (
              <div className="space-y-4">
                {unassignedTickets.map((ticket) => (
                  <div key={ticket.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">#{ticket.id}</h3>
                        <p className="text-sm text-gray-700 mb-1">{ticket.title}</p>
                        <p className="text-xs text-gray-500">
                          Created by {formatAddress(ticket.creator)} on {formatDate(ticket.createdAt)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate({ to: `/ticket/${ticket.id}` as any })}
                      >
                        <Eye size={16} />
                        View
                      </Button>
                    </div>

                    {user.role === UserRole.MANAGER && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Agent wallet address..."
                            value={agentAddress}
                            onChange={(e) => setAgentAddress(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                            disabled={assigning === ticket.id}
                          />
                          <Button
                            size="sm"
                            onClick={() => assignTicket(ticket.id, agentAddress)}
                            disabled={!agentAddress || assigning === ticket.id}
                          >
                            {assigning === ticket.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <>
                                <UserCheck size={16} />
                                Assign
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* In-Progress Tickets */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="text-yellow-500" size={24} />
              <h2 className="text-xl font-semibold text-gray-900">
                In-Progress Tickets ({inProgressTickets.length})
              </h2>
            </div>

            {inProgressTickets.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No tickets in progress
              </p>
            ) : (
              <div className="space-y-4">
                {inProgressTickets.map((ticket) => (
                  <div key={ticket.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">#{ticket.id}</h3>
                        <p className="text-sm text-gray-700 mb-1">{ticket.title}</p>
                        <p className="text-xs text-gray-500">
                          Created by {formatAddress(ticket.creator)} on {formatDate(ticket.createdAt)}
                        </p>
                        {ticket.agent && (
                          <p className="text-xs text-blue-600">
                            Agent: {formatAddress(ticket.agent)}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate({ to: `/ticket/${ticket.id}` as any })}
                      >
                        <Eye size={16} />
                        View
                      </Button>
                    </div>

                    {user.role === UserRole.MANAGER && (
                      <div className="mt-3 pt-3 border-t">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => resolveTicket(ticket.id)}
                          disabled={resolving === ticket.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {resolving === ticket.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                              Resolving...
                            </>
                          ) : (
                            <>
                              <CheckCircle size={16} />
                              Mark as Resolved
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resolved Tickets */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="text-green-500" size={24} />
              <h2 className="text-xl font-semibold text-gray-900">
                Resolved Tickets ({resolvedTickets.length})
              </h2>
            </div>

            {resolvedTickets.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No resolved tickets found
              </p>
            ) : (
              <div className="space-y-4">
                {resolvedTickets.map((ticket) => (
                  <div key={ticket.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">#{ticket.id}</h3>
                        <p className="text-sm text-gray-700 mb-1">{ticket.title}</p>
                        <p className="text-xs text-gray-500">
                          Created by {formatAddress(ticket.creator)} • 
                          Resolved by {ticket.agent ? formatAddress(ticket.agent) : 'Unknown'}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate({ to: `/ticket/${ticket.id}` as any })}
                      >
                        <Eye size={16} />
                        View
                      </Button>
                    </div>

                    {user.role === UserRole.MANAGER && (
                      <div className="mt-3 pt-3 border-t">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => closeTicket(ticket.id)}
                          disabled={closing === ticket.id}
                        >
                          {closing === ticket.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <XCircle size={16} />
                              Close Ticket
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Admin Functions:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Ticket Assignment:</strong> Assign open tickets to IT support agents</li>
          <li>• <strong>Ticket Closure:</strong> Close resolved tickets to finalize them</li>
          <li>• <strong>Blockchain Operations:</strong> All actions are recorded immutably</li>
          <li>• <strong>Role-based Access:</strong> Only Managers and Agents can access admin functions</li>
        </ul>
      </div>
    </div>
  );
}