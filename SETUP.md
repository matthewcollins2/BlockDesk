# BlockDesk Setup Guide

## Quick Setup (Recommended)

This automated script handles everything for you.

### Steps:

1. **Run the setup script:**
   ```powershell
   .\setup-blockchain.ps1
   ```

2. **Start the frontend:**
   ```powershell
   npm run dev
   ```

### What it does:
- Starts Ganache in background
- Deploys smart contracts
- Sets manager roles for both accounts
- Shows all manager account addresses

### To check if Ganache is running:
```powershell
Get-Job
```

### To stop Ganache:
```powershell
Stop-Job -Name Ganache
Remove-Job -Name Ganache
```

### Notes:
- Run the setup script every time you start working (it's fast!)
- Your blockchain data will be fresh each time
- Perfect for development and testing

---

## Manager Accounts

After setup, these accounts have Manager role:

1. **0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266** (1000 ETH)
   - First Ganache account (deployer)
   
2. **0x70997970C51812dc3A010C7d01b50e0d17dc79C8** (1000 ETH)
   - Second Ganache account

## MetaMask Setup

1. Add network:
   - Network Name: Ganache
   - RPC URL: `http://127.0.0.1:7545`
   - Chain ID: `1337`
   - Currency: ETH

2. Import accounts using private keys from Ganache output

---

## Troubleshooting

**"Network ID mismatch"**
- Ganache was restarted, redeploy contracts

**"Manager role not working"**
- Re-run the setManager script
- Hard refresh browser (Ctrl+Shift+R)

**"No ETH in account"**
- Import one of the manager accounts from Ganache
- All Ganache accounts start with 1000 ETH each
