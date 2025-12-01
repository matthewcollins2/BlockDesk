# MetaMask Setup Guide for BlockDesk

## 1. Installing MetaMask and Ganashe

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
// Add local network to MetaMask Networks
Network Name: {Localhost}
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
- For local development: Use Ganache built-in accounts

## 4. Smart Contract Deployment
Before using BlockDesk, you need to deploy the smart contract:

## 5. Truffle set up
npm install truffle

## 6. Smart contract (truffle)
cd blockchain
truffle compile
truffle migrate (truffle migrate --reset)

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