// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract BlockDesk {
    enum TicketStatus { Open, InProgress, Resolved, Closed }
    enum UserRole { User, Manager }
    
    // Packed Struct + No Strings
    // This struct now only uses 3 Storage Slots (down from ~10+)
    struct Ticket {
        // SLOT 1 (20 + 8 + 1 = 29 bytes) 
        address creator;      // 20 bytes 
        uint64 createdAt;     // 8 bytes 
        TicketStatus status;  // 1 byte 
        
        // SLOT 2 (20 + 8 = 28 bytes) 
        address assignedTo;   // 20 bytes
        uint64 updatedAt;     // 8 bytes

        // SLOT 3 (32 bytes) 
        uint256 id;           // 32 bytes
    }
    
    struct Comment {
        uint256 id;
        uint256 ticketId;
        address author;
        string content; // Comments still kept on-chain for now, or could be optimized similarly
        uint256 createdAt;
    }
    
    mapping(uint256 => Ticket) public tickets;
    mapping(address => UserRole) public userRoles;
    mapping(uint256 => Comment[]) public ticketComments;

    uint256 public nextTicketId = 1;
    uint256 public nextCommentId = 1;

    // Store data in Events instead of State
    event TicketCreated(
        uint256 indexed ticketId, 
        address indexed creator, 
        string title, 
        string description, 
        string attachmentHash
    );
    
    event StatusUpdated(uint256 indexed ticketId, TicketStatus status, address indexed updater);
    event TicketAssigned(uint256 indexed ticketId, address indexed assignee, address indexed assigner);
    event TicketReopened(uint256 indexed ticketId, address indexed reopener);
    event CommentAdded(uint256 indexed ticketId, uint256 indexed commentId, address indexed author);

    constructor() {
        userRoles[msg.sender] = UserRole.Manager;
    }
    
    modifier onlyManager() {
        require(userRoles[msg.sender] == UserRole.Manager, "Not authorized: Manager only");
        _;
    }
    
    // Use 'calldata' instead of 'memory' for read-only string args
    function createTicket(
        string calldata title,
        string calldata description,
        string calldata attachmentHash
    ) external returns (uint256) {
        uint256 ticketId = nextTicketId++;
        
        // Write only essential data to storage
        tickets[ticketId] = Ticket({
            creator: msg.sender,
            createdAt: uint64(block.timestamp),
            status: TicketStatus.Open,
            assignedTo: address(0),
            updatedAt: uint64(block.timestamp),
            id: ticketId
        });

        // Emit heavy data to the logs
        emit TicketCreated(ticketId, msg.sender, title, description, attachmentHash);
        
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
        tickets[ticketId].updatedAt = uint64(block.timestamp);
        
        emit StatusUpdated(ticketId, status, msg.sender);
    }
    
    function assignTicket(uint256 ticketId, address assignee) external onlyManager {
        require(tickets[ticketId].id != 0, "Ticket does not exist");
        require(userRoles[assignee] == UserRole.Manager, "Can only assign to Managers");
        
        tickets[ticketId].assignedTo = assignee;
        tickets[ticketId].status = TicketStatus.InProgress;
        tickets[ticketId].updatedAt = uint64(block.timestamp);
        
        emit TicketAssigned(ticketId, assignee, msg.sender);
    }

    function resolveTicket(uint256 ticketId) external onlyManager {
        require(tickets[ticketId].id != 0, "Ticket does not exist");
        
        tickets[ticketId].status = TicketStatus.Resolved;
        tickets[ticketId].updatedAt = uint64(block.timestamp);
        
        emit StatusUpdated(ticketId, TicketStatus.Resolved, msg.sender);
    }

    function closeTicket(uint256 ticketId) external onlyManager {
        require(tickets[ticketId].id != 0, "Ticket does not exist");
        
        tickets[ticketId].status = TicketStatus.Closed;
        tickets[ticketId].updatedAt = uint64(block.timestamp);
        
        emit StatusUpdated(ticketId, TicketStatus.Closed, msg.sender);
    }
    
    function reopenTicket(uint256 ticketId) external onlyManager {
        require(tickets[ticketId].id != 0, "Ticket does not exist");
        require(
            tickets[ticketId].status == TicketStatus.Closed || 
            tickets[ticketId].status == TicketStatus.Resolved,
            "Only closed or resolved tickets can be reopened"
        );

        tickets[ticketId].status = TicketStatus.InProgress;
        tickets[ticketId].assignedTo = msg.sender;
        tickets[ticketId].updatedAt = uint64(block.timestamp);
        
        emit TicketReopened(ticketId, msg.sender);
        emit TicketAssigned(ticketId, msg.sender, msg.sender);
    }
    
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
    
    function getTicketComments(uint256 ticketId) external view returns (Comment[] memory) {
        require(tickets[ticketId].id != 0, "Ticket does not exist");
        return ticketComments[ticketId];
    }
    
    function setUserRole(address user, UserRole role) external onlyManager {
        userRoles[user] = role;
    }
    
    // This no longer returns title/description. 
    // Frontend must fetch these from 'TicketCreated' events.
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