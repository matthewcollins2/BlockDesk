import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Paperclip,
  Clock,
  AlertCircle,
  CheckCircle,
  Pause,
  XCircle,
  User as UserIcon,
  Play,
  Shield,
  MessageSquare,
  Send,
  Users,
  RotateCcw,
  Monitor,
  Hash,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWeb3 } from '@/contexts/Web3Context';
import { useNotifications } from '@/contexts/NotificationContext';
import { Ticket, TicketStatus, UserRole, TicketEvent, Comment } from '@/types';
import { mapStatus } from '@/lib/utils';
import { getIPFSUrl, isIPFSHash, uploadTextToIPFS } from '@/lib/ipfs';

export const Route = createFileRoute('/ticket/$ticketId')({
  component: TicketDetails,
});

function TicketDetails() {
  const { ticketId } = useParams({ from: '/ticket/$ticketId' });
  const { user, contract, isConnected } = useWeb3();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  
  // Component states
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [ticketEvents, setTicketEvents] = useState<TicketEvent[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [descriptionFromIPFS, setDescriptionFromIPFS] = useState(false);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [reassignAddress, setReassignAddress] = useState('');
  
  // NEW: State for attachment URL (handles local cache vs gateway)
  const [attachmentUrl, setAttachmentUrl] = useState('');

  // Load ticket data when component mounts or ticketId/contract changes
  useEffect(() => {
    if (contract && ticketId) {
      loadTicketDetails();
      loadTicketHistory();
      loadComments();
    }
  }, [ticketId, contract]);

  // NEW: Effect to resolve attachment URL
  useEffect(() => {
    if (ticket?.attachment && isIPFSHash(ticket.attachment)) {
      // 1. Try to get instant preview from localStorage
      const cached = localStorage.getItem(`ipfs_${ticket.attachment}`);
      if (cached) {
        setAttachmentUrl(cached);
      } else {
        // 2. Fallback to IPFS Gateway
        setAttachmentUrl(getIPFSUrl(ticket.attachment));
      }
    }
  }, [ticket]);

  // Fetch ticket details from blockchain and IPFS
  const loadTicketDetails = async () => {
    setLoading(true);
    try {
      if (!contract) return;
      
      const rawTicket = await contract.getTicket(ticketId);
      
      if (rawTicket.id.toString() === "0") {
        throw new Error('Ticket not found');
      }

      const filter = contract.filters.TicketCreated(ticketId);
      const events = await contract.queryFilter(filter);

      if (events.length === 0) {
        throw new Error('Ticket creation event not found');
      }

      const eventArgs = (events[0] as any).args;
      const titleFromEvent = eventArgs.title;
      const descriptionFromEvent = eventArgs.description;
      const attachmentFromEvent = eventArgs.attachmentHash;

      // Handle IPFS Logic
      let descriptionText = descriptionFromEvent;
      let isFromIPFS = false;
      
      if (descriptionFromEvent && descriptionFromEvent.startsWith('Qm')) {
        const storedDescription = localStorage.getItem(`ipfs_${descriptionFromEvent}`);
        if (storedDescription) {
          descriptionText = storedDescription;
          isFromIPFS = true;
        }
      }

      const formattedTicket: Ticket = {
        id: rawTicket.id.toString(),
        title: titleFromEvent,
        description: descriptionText,
        attachment: attachmentFromEvent,
        status: mapStatus(Number(rawTicket.status)) as TicketStatus,
        creator: rawTicket.creator,
        assignedTo: rawTicket.assignedTo === '0x0000000000000000000000000000000000000000' 
          ? undefined 
          : rawTicket.assignedTo,
        createdAt: Number(rawTicket.createdAt) * 1000,
      };
      
      setDescriptionFromIPFS(isFromIPFS);
      setTicket(formattedTicket);

    } catch (error) {
      console.error('Error loading ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to safely parse potentially JSON description
  const getTicketMetadata = (desc: string) => {
    try {
      const parsed = JSON.parse(desc);
      if (parsed && typeof parsed === 'object' && 'description' in parsed) {
        return {
          isStructured: true,
          description: parsed.description || '',
          issueType: parsed.issueType,
          equipmentType: parsed.equipmentType,
          serialNumber: parsed.serialNumber,
          remedialAction: parsed.remedialAction
        };
      }
    } catch (e) {
      // Not JSON, fall back to plain text
    }
    return {
      isStructured: false,
      description: desc,
      issueType: null,
      equipmentType: null,
      serialNumber: null,
      remedialAction: null
    };
  };

  const loadTicketHistory = async () => {
    if (!contract) return;
    try {
      const filterCreated = contract.filters.TicketCreated(ticketId);
      const filterStatus = contract.filters.StatusUpdated(ticketId);
      const filterAssigned = contract.filters.TicketAssigned(ticketId);

      const [createdLogs, statusLogs, assignedLogs] = await Promise.all([
        contract.queryFilter(filterCreated),
        contract.queryFilter(filterStatus),
        contract.queryFilter(filterAssigned)
      ]);

      const events: TicketEvent[] = [];

      for (const log of createdLogs) {
        const block = await log.getBlock();
        events.push({
          id: log.transactionHash,
          ticketId,
          eventType: 'Ticket Created',
          actor: (log as any).args[1],
          timestamp: block.timestamp * 1000,
          transactionHash: log.transactionHash
        });
      }

      for (const log of statusLogs) {
        const block = await log.getBlock();
        const statusIdx = Number((log as any).args[1]);
        events.push({
          id: log.transactionHash,
          ticketId,
          eventType: `Status: ${mapStatus(statusIdx)}`,
          actor: (log as any).args[2],
          timestamp: block.timestamp * 1000,
          transactionHash: log.transactionHash
        });
      }

      for (const log of assignedLogs) {
        const block = await log.getBlock();
        events.push({
          id: log.transactionHash,
          ticketId,
          eventType: 'Ticket Assigned',
          actor: (log as any).args[2], 
          timestamp: block.timestamp * 1000,
          transactionHash: log.transactionHash,
          data: { assignee: (log as any).args[1] } 
        });
      }

      setTicketEvents(events.sort((a, b) => b.timestamp - a.timestamp));
    } catch (e) {
      console.warn("Could not fetch history:", e);
    }
  };

  const loadComments = async () => {
    if (!contract) return;
    try {
      const rawComments = await contract.getTicketComments(ticketId);
      const formattedComments: Comment[] = rawComments.map((c: any) => {
        let commentText = c.content;
        
        if (c.content.startsWith('Qm')) {
          const stored = localStorage.getItem(`ipfs_${c.content}`);
          if (stored) {
            commentText = stored;
          }
        }
        
        return {
          id: c.id.toString(),
          ticketId: c.ticketId.toString(),
          author: c.author,
          content: commentText,
          createdAt: Number(c.createdAt) * 1000
        };
      });
      setComments(formattedComments);
    } catch (e) {
      console.warn("Could not fetch comments:", e);
    }
  };

  const handleAddComment = async () => {
    if (!contract || !newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const commentResult = await uploadTextToIPFS(newComment);
      const commentHash = commentResult.hash;
      
      localStorage.setItem(`ipfs_${commentHash}`, newComment);
      console.log('✓ Comment uploaded to IPFS');
      
      const tx = await contract.addComment(ticketId, commentHash);
      await tx.wait();
      addNotification({ type: 'success', title: 'Comment Added', message: 'Your comment has been posted' });
      setNewComment('');
      loadComments();
    } catch (error: any) {
      console.error(error);
      addNotification({ type: 'error', title: 'Error', message: error.reason || error.message });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStartWork = async () => {
    if (!contract || !user) return;
    setUpdating(true);
    try {
      const tx = await contract.assignTicket(ticketId, user.address);
      await tx.wait();
      
      addNotification({ type: 'success', title: 'Work Started', message: 'Ticket assigned to you and marked In Progress' });
      loadTicketDetails();
      loadTicketHistory();
    } catch (error: any) {
      console.error(error);
      addNotification({ type: 'error', title: 'Error', message: error.reason || error.message });
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateStatus = async (newStatus: TicketStatus) => {
    if (!contract) return;
    setUpdating(true);
    try {
      let statusIdx = 0;
      if (newStatus === TicketStatus.IN_PROGRESS) statusIdx = 1;
      else if (newStatus === TicketStatus.RESOLVED) statusIdx = 2;
      else if (newStatus === TicketStatus.CLOSED) statusIdx = 3;
      
      const tx = await contract.updateStatus(ticketId, statusIdx, { gasLimit: 100000 });
      await tx.wait();
      addNotification({ type: 'success', title: 'Updated', message: `Status changed to ${newStatus}` });
      loadTicketDetails();
      loadTicketHistory();
    } catch (error: any) {
      console.error(error);
      addNotification({ type: 'error', title: 'Error', message: error.reason || error.message });
    } finally {
      setUpdating(false);
    }
  };

  const handleReassign = async () => {
    if (!contract || !reassignAddress.trim()) return;
    setUpdating(true);
    try {
      const tx = await contract.assignTicket(ticketId, reassignAddress);
      await tx.wait();
      addNotification({ type: 'success', title: 'Ticket Reassigned', message: 'Ticket has been reassigned successfully' });
      setShowReassignDialog(false);
      setReassignAddress('');
      loadTicketDetails();
      loadTicketHistory();
    } catch (error: any) {
      console.error(error);
      addNotification({ type: 'error', title: 'Error', message: error.reason || error.message });
    } finally {
      setUpdating(false);
    }
  };

  const handleReopen = async () => {
    if (!contract) return;
    setUpdating(true);
    try {
      const tx = await contract.reopenTicket(ticketId, { gasLimit: 100000 });
      await tx.wait();
      addNotification({ type: 'success', title: 'Ticket Reopened', message: 'Ticket has been reopened and assigned to you' });
      loadTicketDetails();
      loadTicketHistory();
    } catch (error: any) {
      console.error(error);
      addNotification({ type: 'error', title: 'Error', message: error.reason || error.message });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN: return <AlertCircle className="text-red-500" size={24} />;
      case TicketStatus.IN_PROGRESS: return <Pause className="text-yellow-500" size={24} />;
      case TicketStatus.RESOLVED: return <CheckCircle className="text-green-500" size={24} />;
      case TicketStatus.CLOSED: return <XCircle className="text-gray-500" size={24} />;
      default: return <Clock className="text-gray-400" size={24} />;
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
  const formatDate = (ts: number) => new Date(ts).toLocaleString();

  if (!isConnected || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <UserIcon size={48} className="mx-auto mb-4 text-yellow-600" />
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">Wallet Connection Required</h2>
          <p className="text-yellow-700">Please connect your wallet to view ticket details.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading ticket details...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Ticket Not Found</h2>
        <Button onClick={() => navigate({ to: '/dashboard' })}>Back to Dashboard</Button>
      </div>
    );
  }

  const isManager = user.role === UserRole.MANAGER;
  const isAssignedToMe = ticket.assignedTo?.toLowerCase() === user.address.toLowerCase();
  
  // Parse metadata for rendering
  const metadata = getTicketMetadata(ticket.description);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate({ to: '/dashboard' })} className="mb-4">
          <ArrowLeft size={16} className="mr-2"/> Back to Dashboard
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              Ticket #{ticket.id}
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadgeClass(ticket.status)}`}>
                {getStatusIcon(ticket.status)}
                {ticket.status}
              </span>
            </h1>
            <p className="text-xl text-gray-700">{ticket.title}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {ticket.status === TicketStatus.OPEN && isManager && (
              <Button onClick={handleStartWork} disabled={updating} className="bg-cyan-600 hover:bg-cyan-700">
                <Play size={16} className="mr-2" /> Start Work
              </Button>
            )}

            {ticket.assignedTo && isManager && ticket.status !== TicketStatus.CLOSED && ticket.status !== TicketStatus.RESOLVED && (
              <Button onClick={() => setShowReassignDialog(true)} disabled={updating} variant="outline" className="border-cyan-600 text-cyan-600 hover:bg-cyan-50">
                <Users size={16} className="mr-2" /> Reassign
              </Button>
            )}

            {ticket.status === TicketStatus.IN_PROGRESS && (isAssignedToMe || isManager) && (
              <Button onClick={() => handleUpdateStatus(TicketStatus.RESOLVED)} disabled={updating} className="bg-green-600 hover:bg-green-700">
                <CheckCircle size={16} className="mr-2" /> Resolve Ticket
              </Button>
            )}

            {ticket.status === TicketStatus.RESOLVED && isManager && (
              <>
                <Button onClick={handleReopen} disabled={updating} className="bg-blue-600 hover:bg-blue-700">
                  <RotateCcw size={16} className="mr-2" /> Reopen Ticket
                </Button>
                <Button onClick={() => handleUpdateStatus(TicketStatus.CLOSED)} disabled={updating} variant="destructive">
                  <XCircle size={16} className="mr-2" /> Close Ticket
                </Button>
              </>
            )}

            {ticket.status === TicketStatus.CLOSED && isManager && (
              <Button onClick={handleReopen} disabled={updating} className="bg-blue-600 hover:bg-blue-700">
                <RotateCcw size={16} className="mr-2" /> Reopen Ticket
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              Request Details
              {descriptionFromIPFS && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-normal">IPFS</span>
              )}
            </h2>

            {/* Structured Metadata Grid */}
            {metadata.isStructured && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded-lg border">
                <div>
                  <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                    <AlertTriangle size={14} />
                    <span className="text-xs font-medium uppercase tracking-wider">Issue Type</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{metadata.issueType}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                    <Monitor size={14} />
                    <span className="text-xs font-medium uppercase tracking-wider">Equipment</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{metadata.equipmentType}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                    <Hash size={14} />
                    <span className="text-xs font-medium uppercase tracking-wider">Serial Number</span>
                  </div>
                  <p className="text-sm font-mono text-gray-900">{metadata.serialNumber}</p>
                </div>
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {metadata.description}
              </p>
            </div>

            {/* Remedial Action (if exists) */}
            {metadata.remedialAction && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">Remedial Action Taken</h3>
                <p className="text-sm text-blue-800 whitespace-pre-wrap">{metadata.remedialAction}</p>
              </div>
            )}
            
            {ticket.attachment && (
              <div className="mt-6 pt-4 border-t">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  Attachment
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-normal">IPFS</span>
                </h3>
                {isIPFSHash(ticket.attachment) ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border">
                      <Paperclip size={16} className="text-gray-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">Attachment</p>
                        <p className="text-xs text-gray-500 font-mono mt-1 truncate">{ticket.attachment}</p>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden bg-gray-50">
                      <div className="p-4">
                        <p className="text-xs text-gray-500 mb-2">Preview:</p>
                        {/* UPDATED: Use attachmentUrl state which handles local cache */}
                        <img 
                          src={attachmentUrl} 
                          alt="Ticket attachment" 
                          className="max-w-full h-auto rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border">
                    <Paperclip size={16} className="text-gray-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Attachment</p>
                      <p className="text-xs text-gray-500 mt-1">{ticket.attachment}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare size={20} className="text-cyan-500" />
              Comments ({comments.length})
            </h2>
            
            <div className="mb-6 pb-6 border-b">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                rows={3}
                disabled={submittingComment}
              />
              <div className="flex justify-end mt-2">
                <Button 
                  onClick={handleAddComment} 
                  disabled={!newComment.trim() || submittingComment}
                  className="bg-cyan-600 hover:bg-cyan-700"
                  size="sm"
                >
                  {submittingComment ? 'Posting...' : (
                    <>
                      <Send size={14} className="mr-2" /> Post Comment
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                        <UserIcon size={20} className="text-cyan-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 font-mono">
                          {formatAddress(comment.author)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Ticket History */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ticket History</h2>
            <div className="space-y-4">
              {ticketEvents.length === 0 ? (
                <p className="text-sm text-gray-500">No history events found.</p>
              ) : (
                ticketEvents.map((event) => (
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
                        {event.data?.assignee && (
                          <span className="text-gray-500"> → assigned to <span className="font-mono">{formatAddress(event.data.assignee)}</span></span>
                        )}
                      </p>
                      <div className="text-xs text-gray-400 mt-1 font-mono">
                        Tx: {event.transactionHash.slice(0, 10)}...
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ticket Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Created By</label>
                <p className="text-sm text-gray-900 font-mono">{formatAddress(ticket.creator)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Assigned To</label>
                <p className="text-sm text-gray-900 font-mono">
                  {ticket.assignedTo ? formatAddress(ticket.assignedTo) : 'Unassigned'}
                </p>
              </div>
              
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

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
              <Shield size={16}/> Blockchain Verified
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Immutable record</li>
              <li>• Full audit trail</li>
              <li>• Decentralized storage</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Reassign Dialog */}
      {showReassignDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users size={20} className="text-cyan-600" />
              Reassign Ticket
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter the wallet address of the manager you want to assign this ticket to.
            </p>
            <input
              type="text"
              value={reassignAddress}
              onChange={(e) => setReassignAddress(e.target.value)}
              placeholder="0x..."
              className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 mb-4"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReassignDialog(false);
                  setReassignAddress('');
                }}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReassign}
                disabled={!reassignAddress.trim() || updating}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                {updating ? 'Reassigning...' : 'Reassign'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}