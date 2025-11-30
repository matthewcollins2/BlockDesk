import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Eye, Filter, Search, Clock, User, CheckCircle, AlertCircle, Pause, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWeb3 } from '@/contexts/Web3Context';
import { Ticket, TicketStatus } from '@/types';
import { mapStatus } from '@/lib/utils'; 

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
});

function Dashboard() {
  const { user, contract } = useWeb3();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'my' | 'open'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (contract) {
      loadTickets();
    }
  }, [contract, user]); // Added user dependency to reload on account switch

  useEffect(() => {
    filterTickets();
  }, [tickets, filter, searchTerm, user]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      if (contract) {
        const rawTickets = await contract.getAllTickets();
        
        const formattedTickets: Ticket[] = rawTickets.map((t: any) => ({
          id: t.id.toString(),
          title: t.title,
          description: t.description,
          status: mapStatus(Number(t.status)) as TicketStatus,
          creator: t.creator,
          assignedTo: t.assignedTo === '0x0000000000000000000000000000000000000000' ? undefined : t.assignedTo,
          attachment: t.attachmentHash,
          createdAt: Number(t.createdAt) * 1000,
        }));
        
        setTickets(formattedTickets.reverse());
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = [...tickets];
    if (filter === 'my' && user) {
      filtered = filtered.filter(ticket => 
        ticket.assignedTo?.toLowerCase() === user.address.toLowerCase()
      );
    } else if (filter === 'open') {
      filtered = filtered.filter(ticket => ticket.status === TicketStatus.OPEN);
    }
    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.id.includes(searchTerm)
      );
    }
    setFilteredTickets(filtered);
  };

  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN: return <AlertCircle className="text-red-500" size={16} />;
      case TicketStatus.IN_PROGRESS: return <Pause className="text-yellow-500" size={16} />;
      case TicketStatus.RESOLVED: return <CheckCircle className="text-green-500" size={16} />;
      case TicketStatus.CLOSED: return <XCircle className="text-gray-500" size={16} />;
      default: return <Clock className="text-gray-400" size={16} />;
    }
  };

  const getStatusBadgeClass = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN: return "bg-red-100 text-red-800 border-red-200";
      case TicketStatus.IN_PROGRESS: return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case TicketStatus.RESOLVED: return "bg-green-100 text-green-800 border-green-200";
      case TicketStatus.CLOSED: return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-500 border-gray-200";
    }
  };

  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;
  const formatDate = (timestamp: number) => new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <User size={48} className="mx-auto mb-4 text-yellow-600" />
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">Wallet Connection Required</h2>
          <p className="text-yellow-700">Please connect your MetaMask wallet to view the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ticket Dashboard</h1>
        <p className="text-gray-600">Manage and track support tickets on the blockchain</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2">
            <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>All Tickets</Button>
            <Button variant={filter === 'my' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('my')}>My Tickets</Button>
            <Button variant={filter === 'open' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('open')}>Open Tickets</Button>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border rounded-lg" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto"></div><p className="mt-2 text-gray-500">Loading from blockchain...</p></div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-8 text-center text-gray-500"><Filter size={48} className="mx-auto mb-4 text-gray-300" /><p>No tickets found.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creator</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate({ to: `/ticket/${ticket.id}` as any })}>
                    <td className="px-6 py-4 text-sm font-medium">#{ticket.id}</td>
                    <td className="px-6 py-4 text-sm truncate max-w-xs">{ticket.title}</td>
                    <td className="px-6 py-4"><span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(ticket.status)}`}>{getStatusIcon(ticket.status)}{ticket.status}</span></td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-500">{formatAddress(ticket.creator)}</td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-500">{ticket.assignedTo ? formatAddress(ticket.assignedTo) : '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(ticket.createdAt)}</td>
                    <td className="px-6 py-4"><Button variant="ghost" size="sm"><Eye size={16} /> View</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}