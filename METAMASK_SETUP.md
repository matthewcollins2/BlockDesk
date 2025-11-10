# MetaMask Setup Guide for BlockDesk

## 1. Installing MetaMask

### Option A: Browser Extension (Recommended)
1. Visit [MetaMask.io](https://metamask.io/)
2. Click "Download" and select your browser
3. Add the extension to your browser
4. Create a new wallet or import an existing one
5. Follow the setup process and **SAVE YOUR SEED PHRASE SECURELY**

### Option B: Mobile App
1. Download MetaMask from App Store (iOS) or Google Play (Android)
2. Set up your wallet following the in-app instructions

## 2. Network Configuration

### For Development (Local Blockchain)
```javascript
// Add local network to MetaMask
Network Name: Local Blockchain
RPC URL: http://127.0.0.1:8545
Chain ID: 1337 (or your local chain ID)
Currency Symbol: ETH
```

### For Testnet (Sepolia - Recommended for testing)
```javascript
Network Name: Sepolia Testnet
RPC URL: https://sepolia.infura.io/v3/YOUR_PROJECT_ID
Chain ID: 11155111
Currency Symbol: SepoliaETH
Block Explorer: https://sepolia.etherscan.io
```

## 3. Getting Test ETH
- For Sepolia: Use [Sepolia Faucet](https://sepoliafaucet.com/)
- For local development: Use Hardhat or Ganache built-in accounts

## 4. Smart Contract Deployment

Before using BlockDesk, you need to deploy the smart contract:

### Sample Smart Contract (Solidity)
```solidity
// contracts/BlockDesk.sol
pragma solidity ^0.8.19;

contract BlockDesk {
    enum TicketStatus { Open, InProgress, Resolved, Closed }
    enum UserRole { User, Agent, Manager }
    
    struct Ticket {
        uint256 id;
        address creator;
        address assignedAgent;
        string title;
        string description;
        string attachmentHash;
        TicketStatus status;
        uint256 createdAt;
        uint256 updatedAt;
    }
    
    mapping(uint256 => Ticket) public tickets;
    mapping(address => UserRole) public userRoles;
    uint256 public nextTicketId = 1;
    
    event TicketCreated(uint256 indexed ticketId, address indexed creator, string title);
    event StatusUpdated(uint256 indexed ticketId, TicketStatus status, address indexed updater);
    event TicketAssigned(uint256 indexed ticketId, address indexed agent, address indexed assigner);
    
    constructor() {
        userRoles[msg.sender] = UserRole.Manager; // Contract deployer is manager
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
            assignedAgent: address(0),
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
            tickets[ticketId].assignedAgent == msg.sender ||
            userRoles[msg.sender] == UserRole.Manager,
            "Not authorized"
        );
        
        tickets[ticketId].status = status;
        tickets[ticketId].updatedAt = block.timestamp;
        
        emit StatusUpdated(ticketId, status, msg.sender);
    }
    
    function assignTicket(uint256 ticketId, address agent) external {
        require(tickets[ticketId].id != 0, "Ticket does not exist");
        require(userRoles[msg.sender] == UserRole.Manager, "Only managers can assign tickets");
        require(
            userRoles[agent] == UserRole.Agent || userRoles[agent] == UserRole.Manager,
            "Can only assign to agents or managers"
        );
        
        tickets[ticketId].assignedAgent = agent;
        tickets[ticketId].updatedAt = block.timestamp;
        
        emit TicketAssigned(ticketId, agent, msg.sender);
    }
    
    function setUserRole(address user, UserRole role) external {
        require(userRoles[msg.sender] == UserRole.Manager, "Only managers can set roles");
        userRoles[user] = role;
    }
    
    function getTicket(uint256 ticketId) external view returns (Ticket memory) {
        require(tickets[ticketId].id != 0, "Ticket does not exist");
        return tickets[ticketId];
    }
}
```

## 5. Deployment Script (Hardhat)
```javascript
// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
    const BlockDesk = await ethers.getContractFactory("BlockDesk");
    const blockdesk = await BlockDesk.deploy();
    
    await blockdesk.deployed();
    
    console.log("BlockDesk deployed to:", blockdesk.address);
    
    // Set up some initial roles for testing
    const [deployer, agent1, agent2] = await ethers.getSigners();
    
    await blockdesk.setUserRole(agent1.address, 1); // Agent role
    await blockdesk.setUserRole(agent2.address, 1); // Agent role
    
    console.log("Deployer (Manager):", deployer.address);
    console.log("Agent 1:", agent1.address);
    console.log("Agent 2:", agent2.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
```

## 6. Hardhat Configuration
```javascript
// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
    solidity: "0.8.19",
    networks: {
        localhost: {
            url: "http://127.0.0.1:8545"
        },
        sepolia: {
            url: "https://sepolia.infura.io/v3/YOUR_PROJECT_ID",
            accounts: ["YOUR_PRIVATE_KEY"] // Use environment variables in production
        }
    }
};
```

## 7. Transaction Signing Best Practices

### Error Handling
- Always handle user rejections gracefully
- Provide clear error messages
- Implement retry mechanisms
- Show transaction status updates

### Gas Estimation
- Estimate gas before transactions
- Allow users to adjust gas fees
- Handle failed transactions

### User Experience
- Show transaction progress
- Provide transaction hashes for tracking
- Implement pending state indicators
- Show confirmation dialogs

## 8. Security Considerations

### Never Store Private Keys
- Use MetaMask's secure key management
- Never ask users for private keys
- Use signed messages for authentication

### Validate All Inputs
- Sanitize user inputs
- Validate addresses
- Check contract responses

### Handle Network Changes
- Detect network switches
- Validate contract addresses per network
- Handle unsupported networks gracefully

## 9. Testing Your Setup

1. Deploy the contract to a testnet
2. Update the contract address in Web3Context.tsx
3. Connect MetaMask to the same network
4. Test wallet connection
5. Create a test ticket
6. Verify transaction on block explorer

## 10. Troubleshooting

### Common Issues:
- **MetaMask not detected**: Refresh page, check browser
- **Wrong network**: Switch to correct network in MetaMask
- **Transaction failed**: Check gas fees and network congestion
- **Contract not found**: Verify contract address and network