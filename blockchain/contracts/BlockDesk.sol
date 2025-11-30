// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract BlockDesk {
    enum TicketStatus { Open, InProgress, Resolved, Closed }
    enum UserRole { User, Manager }
    
    struct Ticket {
        uint256 id;
        address creator;
        address assignedTo; // Changed from assignedAgent
        string title;
        string description;
        string attachmentHash;
        TicketStatus status;
        uint256 createdAt;
        uint256 updatedAt;
    }
    
    struct Comment {
        uint256 id;
        uint256 ticketId;
        address author;
        string content;
        uint256 createdAt;
    }
    
    mapping(uint256 => Ticket) public tickets;
    mapping(address => UserRole) public userRoles;
    mapping(uint256 => Comment[]) public ticketComments; // ticketId => array of comments
    uint256 public nextTicketId = 1;
    uint256 public nextCommentId = 1;
    
    event TicketCreated(uint256 indexed ticketId, address indexed creator, string title);
    event StatusUpdated(uint256 indexed ticketId, TicketStatus status, address indexed updater);
    event TicketAssigned(uint256 indexed ticketId, address indexed assignee, address indexed assigner);
    event TicketReopened(uint256 indexed ticketId, address indexed reopener);
    event CommentAdded(uint256 indexed ticketId, uint256 indexed commentId, address indexed author);
    
    constructor() {
        userRoles[msg.sender] = UserRole.Manager; // Contract deployer is manager
    }
    
    modifier onlyManager() {
        require(userRoles[msg.sender] == UserRole.Manager, "Not authorized: Manager only");
        _;
    }
    
    function createTicket(
        string memory title,
        string memory description,
        string memory attachmentHash
    ) external returns (uint256) {
        uint256 ticketId = nextTicketId++;
        
        tickets[ticketId] = Ticket({
            id: ticketId,
            creator: msg.sender,
            assignedTo: address(0),
            title: title,
            description: description,
            attachmentHash: attachmentHash,
            status: TicketStatus.Open,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        emit TicketCreated(ticketId, msg.sender, title);
        return ticketId;
    }
    
    function updateStatus(uint256 ticketId, TicketStatus status) external {
        require(tickets[ticketId].id != 0, "Ticket does not exist");
        require(
            tickets[ticketId].creator == msg.sender ||
            tickets[ticketId].assignedTo == msg.sender ||
            userRoles[msg.sender] == UserRole.Manager,
            "Not authorized"
        );
        
        tickets[ticketId].status = status;
        tickets[ticketId].updatedAt = block.timestamp;
        
        emit StatusUpdated(ticketId, status, msg.sender);
    }
    
    // Only Managers can be assigned tickets now
    function assignTicket(uint256 ticketId, address assignee) external onlyManager {
        require(tickets[ticketId].id != 0, "Ticket does not exist");
        // Ensure the assignee is a Manager (or allow assigning to self if Manager)
        require(userRoles[assignee] == UserRole.Manager, "Can only assign to Managers");
        
        tickets[ticketId].assignedTo = assignee;
        tickets[ticketId].status = TicketStatus.InProgress;
        tickets[ticketId].updatedAt = block.timestamp;
        
        emit TicketAssigned(ticketId, assignee, msg.sender);
    }

    // Only Managers can resolve tickets
    function resolveTicket(uint256 ticketId) external onlyManager {
        require(tickets[ticketId].id != 0, "Ticket does not exist");
        tickets[ticketId].status = TicketStatus.Resolved;
        tickets[ticketId].updatedAt = block.timestamp;
        emit StatusUpdated(ticketId, TicketStatus.Resolved, msg.sender);
    }

    function closeTicket(uint256 ticketId) external onlyManager {
        require(tickets[ticketId].id != 0, "Ticket does not exist");
        tickets[ticketId].status = TicketStatus.Closed;
        tickets[ticketId].updatedAt = block.timestamp;
        emit StatusUpdated(ticketId, TicketStatus.Closed, msg.sender);
    }
    
    // New: Reopen a closed or resolved ticket
    function reopenTicket(uint256 ticketId) external onlyManager {
        require(tickets[ticketId].id != 0, "Ticket does not exist");
        require(
            tickets[ticketId].status == TicketStatus.Closed || 
            tickets[ticketId].status == TicketStatus.Resolved,
            "Only closed or resolved tickets can be reopened"
        );
        
        tickets[ticketId].status = TicketStatus.Open;
        tickets[ticketId].assignedTo = address(0); // Clear assignment
        tickets[ticketId].updatedAt = block.timestamp;
        emit TicketReopened(ticketId, msg.sender);
    }
    
    // New: Add a comment to a ticket
    function addComment(uint256 ticketId, string memory content) external {
        require(tickets[ticketId].id != 0, "Ticket does not exist");
        require(bytes(content).length > 0, "Comment cannot be empty");
        
        uint256 commentId = nextCommentId++;
        Comment memory newComment = Comment({
            id: commentId,
            ticketId: ticketId,
            author: msg.sender,
            content: content,
            createdAt: block.timestamp
        });
        
        ticketComments[ticketId].push(newComment);
        emit CommentAdded(ticketId, commentId, msg.sender);
    }
    
    // Get all comments for a ticket
    function getTicketComments(uint256 ticketId) external view returns (Comment[] memory) {
        require(tickets[ticketId].id != 0, "Ticket does not exist");
        return ticketComments[ticketId];
    }
    
    function setUserRole(address user, UserRole role) external onlyManager {
        userRoles[user] = role;
    }
    
    function getTicket(uint256 ticketId) external view returns (Ticket memory) {
        require(tickets[ticketId].id != 0, "Ticket does not exist");
        return tickets[ticketId];
    }

    function getAllTickets() external view returns (Ticket[] memory) {
        uint256 count = nextTicketId - 1;
        Ticket[] memory allTickets = new Ticket[](count);
        
        for (uint256 i = 1; i <= count; i++) {
            allTickets[i - 1] = tickets[i];
        }
        
        return allTickets;
    }
}