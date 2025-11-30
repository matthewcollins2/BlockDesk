export interface Ticket {
  assignedTo: any;
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  creator: string;
  agent?: string;
  createdAt: number;
  attachment?: string; // IPFS hash
}

export interface Comment {
  id: string;
  ticketId: string;
  author: string;
  content: string;
  createdAt: number;
}

export enum TicketStatus {
  OPEN = "Open",
  IN_PROGRESS = "In-Progress", 
  RESOLVED = "Resolved",
  CLOSED = "Closed"
}

export interface TicketEvent {
  id: string;
  ticketId: string;
  eventType: string;
  actor: string;
  timestamp: number;
  transactionHash: string;
  data?: any;
}

export enum UserRole {
  USER = "User",
  MANAGER = "Manager"
}

export interface User {
  address: string;
  role: UserRole;
  balance?: string;
}