// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

contract Ticketing {

    enum Status {
        OPEN,
        ASSIGNED,
        IN_PROGRESS,
        CLOSED
    }

    struct Ticket {
        uint256 id;
        address creator;
        address assignedTo;
        string ipfsHash;
        Status status;
    }

    uint256 public ticketCount = 0;
    mapping(uint256 => Ticket) public tickets;

    event TicketCreated(uint256 id, address creator);
    event TicketAssigned(uint256 id, address agent);
    event TicketStatusChanged(uint256 id, Status status, address changedBy);
    event TicketClosed(uint256 id, address closedBy);

    function createTicket(string memory _ipfsHash) public returns (uint256) {
        ticketCount++;
        tickets[ticketCount] = Ticket(ticketCount, msg.sender, address(0), _ipfsHash, Status.OPEN);

        emit TicketCreated(ticketCount, msg.sender);

        return ticketCount;
    }

    function assignTicket(uint256 _id, address _agent) public {
        require(_id > 0 && _id <= ticketCount, "Invalid ticket");
        Ticket storage t = tickets[_id];
        t.assignedTo = _agent;
        t.status = Status.ASSIGNED;

        emit TicketAssigned(_id, _agent);
    }

    function updateStatus(uint256 _id, Status _status) public {
        require(_id > 0 && _id <= ticketCount, "Invalid ticket");
        Ticket storage t = tickets[_id];
        require(msg.sender == t.creator || msg.sender == t.assignedTo, "Not authorized");

        t.status = _status;

        emit TicketStatusChanged(_id, _status, msg.sender);
    }

    function closeTicket(uint256 _id) public {
        require(_id > 0 && _id <= ticketCount, "Invalid ticket");
        Ticket storage t = tickets[_id];

        t.status = Status.CLOSED;

        emit TicketClosed(_id, msg.sender);
    }

    function getTicket(uint256 _id) public view returns (Ticket memory) {
        require(_id > 0 && _id <= ticketCount, "Invalid ticket");
        return tickets[_id];
    }
}
