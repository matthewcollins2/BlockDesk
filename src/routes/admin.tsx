import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Eye, 
  CheckCircle, 
  AlertTriangle, 
  User, 
  XCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWeb3 } from '@/contexts/Web3Context';
import { useNotifications } from '@/contexts/NotificationContext';
import { Ticket, TicketStatus, UserRole } from '@/types';
import { mapStatus } from '@/lib/utils';

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
  const [closedTickets, setClosedTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [managerAddress, setManagerAddress] = useState('');
  const [reassignAddresses, setReassignAddresses] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if(contract) loadAdminData();
  }, [contract]);

  // Helper to prevent crashes if address is missing
  const formatAddress = (addr?: string) => {
    if (!addr || addr === '0x0000000000000000000000000000000000000000') return 'Unknown';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const loadAdminData = async () => {
    setLoading(true);
    try {
      if (!contract) return;
      const rawTickets = await contract.getAllTickets();
      
      const allTickets: Ticket[] = rawTickets.map((t: any) => ({
        id: t.id.toString(),
        title: t.title,
        status: mapStatus(Number(t.status)) as TicketStatus,
        creator: t.creator,
        // Handle empty address from contract
        assignedTo: t.assignedTo === '0x0000000000000000000000000000000000000000' ? undefined : t.assignedTo,
        createdAt: Number(t.createdAt) * 1000
      }));

      setUnassignedTickets(allTickets.filter(t => t.status === TicketStatus.OPEN));
      setInProgressTickets(allTickets.filter(t => t.status === TicketStatus.IN_PROGRESS));
      setResolvedTickets(allTickets.filter(t => t.status === TicketStatus.RESOLVED));
      setClosedTickets(allTickets.filter(t => t.status === TicketStatus.CLOSED));
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignTicket = async (ticketId: string, assignee: string) => {
    if (!assignee || !contract) return;
    setActioningId(ticketId);
    try {
      addNotification({ type: 'info', title: 'Confirm Assignment', message: 'Please confirm in MetaMask', duration: 0 });
      // Added gasLimit for safety
      const tx = await contract.assignTicket(ticketId, assignee, { gasLimit: 500000 });
      await tx.wait();
      addNotification({ type: 'success', title: 'Ticket Assigned', message: `Ticket #${ticketId} assigned.` });
      loadAdminData();
      setManagerAddress('');
    } catch (error: any) {
      addNotification({ type: 'error', title: 'Assignment Failed', message: error.reason || error.message });
    } finally {
      setActioningId(null);
    }
  };

  const resolveTicket = async (ticketId: string) => {
    if (!contract) return;
    setActioningId(ticketId);
    try {
      const tx = await contract.resolveTicket(ticketId, { gasLimit: 500000 });
      await tx.wait();
      addNotification({ type: 'success', title: 'Ticket Resolved', message: `Ticket #${ticketId} resolved.` });
      loadAdminData();
    } catch (error: any) {
      addNotification({ type: 'error', title: 'Failed', message: error.reason || error.message });
    } finally {
      setActioningId(null);
    }
  };

  const closeTicket = async (ticketId: string) => {
    if (!contract) return;
    setActioningId(ticketId);
    try {
      const tx = await contract.closeTicket(ticketId, { gasLimit: 500000 });
      await tx.wait();
      addNotification({ type: 'success', title: 'Ticket Closed', message: `Ticket #${ticketId} closed.` });
      loadAdminData();
    } catch (error: any) {
      addNotification({ type: 'error', title: 'Failed', message: error.reason || error.message });
    } finally {
      setActioningId(null);
    }
  };

  const reopenTicket = async (ticketId: string) => {
    if (!contract) return;
    setActioningId(ticketId);
    try {
      const tx = await contract.reopenTicket(ticketId, { gasLimit: 500000 });
      await tx.wait();
      addNotification({ type: 'success', title: 'Ticket Reopened', message: `Ticket #${ticketId} reopened.` });
      loadAdminData();
    } catch (error: any) {
      addNotification({ type: 'error', title: 'Failed', message: error.reason || error.message });
    } finally {
      setActioningId(null);
    }
  };

  if (!user || user.role !== UserRole.MANAGER) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-lg mx-auto">
          <AlertTriangle size={48} className="mx-auto mb-4 text-red-600" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-700 mb-4">You need Manager privileges to access the admin panel.</p>
          <Button onClick={() => navigate({ to: '/dashboard' })}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="text-cyan-500" size={32} />
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        </div>
        
        {/* Manager Info Card */}
        <div className="bg-white border rounded-lg p-4 shadow-sm inline-flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
             <User className="text-cyan-700" size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Logged in as Manager</p>
            <p className="text-xs text-gray-500 font-mono">{formatAddress(user.address)}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mb-4"></div>
          <p className="text-gray-500">Syncing with blockchain...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Unassigned Tickets */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 pb-2 border-b">
              <Users className="text-orange-500" size={20}/> 
              Unassigned Tickets 
              <span className="text-sm font-normal text-gray-500 ml-auto">({unassignedTickets.length})</span>
            </h2>
            
            {unassignedTickets.length === 0 ? (
               <div className="text-center py-8 text-gray-400 italic">No new tickets to assign</div>
            ) : (
              <div className="space-y-4">
                {unassignedTickets.map(t => (
                  <div key={t.id} className="border p-4 rounded-lg bg-gray-50 hover:bg-white transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="font-mono font-bold text-cyan-700 text-sm">#{t.id}</span>
                        <h3 className="font-medium text-gray-900">{t.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">Created by: {formatAddress(t.creator)}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => navigate({ to: `/ticket/${t.id}` as any })}>
                        <Eye size={16}/>
                      </Button>
                    </div>
                    
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Manager Address (0x...)" 
                        className="border rounded px-3 py-1 text-sm flex-1" 
                        value={managerAddress} 
                        onChange={e => setManagerAddress(e.target.value)} 
                      />
                      <Button 
                        size="sm" 
                        disabled={actioningId === t.id || !managerAddress} 
                        onClick={() => assignTicket(t.id, managerAddress)}
                        className="bg-cyan-600 hover:bg-cyan-700"
                      >
                        {actioningId === t.id ? 'Assigning...' : 'Assign'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* In Progress & Resolved */}
          <div className="space-y-6">
            {/* In Progress */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 pb-2 border-b">
                <AlertTriangle className="text-yellow-500" size={20}/> 
                In Progress
                <span className="text-sm font-normal text-gray-500 ml-auto">({inProgressTickets.length})</span>
              </h2>
              
              {inProgressTickets.length === 0 ? (
                 <div className="text-center py-8 text-gray-400 italic">No active tickets</div>
              ) : (
                <div className="space-y-3">
                  {inProgressTickets.map(t => (
                    <div key={t.id} className="border p-3 rounded-lg bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium text-sm">#{t.id} {t.title}</div>
                          <div className="text-xs text-gray-500">Assigned: {formatAddress(t.assignedTo)}</div>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 h-8" 
                          disabled={actioningId === t.id} 
                          onClick={() => resolveTicket(t.id)}
                        >
                           {actioningId === t.id ? 'Resolving...' : 'Resolve'}
                        </Button>
                      </div>
                      
                      {/* Reassign section */}
                      <div className="flex gap-2 mt-2 pt-2 border-t">
                        <input 
                          type="text" 
                          placeholder="New Manager Address (0x...)" 
                          className="border rounded px-2 py-1 text-xs flex-1" 
                          value={reassignAddresses[t.id] || ''} 
                          onChange={e => setReassignAddresses({...reassignAddresses, [t.id]: e.target.value})} 
                        />
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-7 text-xs border-cyan-600 text-cyan-600 hover:bg-cyan-50"
                          disabled={actioningId === t.id || !reassignAddresses[t.id]} 
                          onClick={() => assignTicket(t.id, reassignAddresses[t.id])}
                        >
                          {actioningId === t.id ? 'Reassigning...' : 'Reassign'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resolved */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 pb-2 border-b">
                <CheckCircle className="text-green-500" size={20}/> 
                Resolved
                <span className="text-sm font-normal text-gray-500 ml-auto">({resolvedTickets.length})</span>
              </h2>
              
              {resolvedTickets.length === 0 ? (
                 <div className="text-center py-8 text-gray-400 italic">No resolved tickets pending closure</div>
              ) : (
                <div className="space-y-3">
                  {resolvedTickets.map(t => (
                    <div key={t.id} className="border p-3 rounded-lg flex justify-between items-center bg-gray-50">
                      <div>
                        <div className="font-medium text-sm">#{t.id} {t.title}</div>
                        <div className="text-xs text-gray-500">Wait for review</div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        className="h-8"
                        disabled={actioningId === t.id} 
                        onClick={() => closeTicket(t.id)}
                      >
                        {actioningId === t.id ? 'Closing...' : 'Close'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Closed Tickets */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 pb-2 border-b">
                <XCircle className="text-gray-500" size={20}/> 
                Closed Tickets
                <span className="text-sm font-normal text-gray-500 ml-auto">({closedTickets.length})</span>
              </h2>
              
              {closedTickets.length === 0 ? (
                 <div className="text-center py-8 text-gray-400 italic">No closed tickets</div>
              ) : (
                <div className="space-y-3">
                  {closedTickets.map(t => (
                    <div key={t.id} className="border p-3 rounded-lg flex justify-between items-center bg-gray-50">
                      <div>
                        <div className="font-medium text-sm">#{t.id} {t.title}</div>
                        <div className="text-xs text-gray-500">Closed on {new Date(t.createdAt).toLocaleDateString()}</div>
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700 h-8"
                        disabled={actioningId === t.id} 
                        onClick={() => reopenTicket(t.id)}
                      >
                        {actioningId === t.id ? 'Reopening...' : 'Reopen'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}