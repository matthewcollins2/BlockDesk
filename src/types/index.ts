export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  creator: string;
  agent?: string;
  createdAt: number;
  attachment?: string; // IPFS hash
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
  AGENT = "Agent", 
  MANAGER = "Manager"
}

export interface User {
  address: string;
  role: UserRole;
  balance?: string;
}