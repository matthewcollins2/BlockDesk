# BlockDesk Blockchain Setup Script
# This script starts Ganache, deploys contracts, and sets manager roles

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BlockDesk Blockchain Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Ganache is already running
$existingJob = Get-Job -Name "Ganache" -ErrorAction SilentlyContinue
if ($existingJob) {
    Write-Host "[OK] Ganache is already running" -ForegroundColor Green
} else {
    Write-Host "Starting Ganache..." -ForegroundColor Yellow
    Start-Job -ScriptBlock { 
        ganache --port 7545 --mnemonic "test test test test test test test test test test test junk" 
    } -Name "Ganache" | Out-Null
    
    Write-Host "[OK] Ganache started on port 7545" -ForegroundColor Green
    Write-Host "  Waiting for Ganache to initialize..." -ForegroundColor Gray
    Start-Sleep -Seconds 3
}

Write-Host ""
Write-Host "Deploying smart contracts..." -ForegroundColor Yellow
Set-Location blockchain
$deployOutput = npx truffle migrate --reset --network development 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Smart contracts deployed successfully" -ForegroundColor Green
} else {
    Write-Host "[X] Contract deployment failed" -ForegroundColor Red
    Write-Host $deployOutput -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host ""
Write-Host "Setting manager roles..." -ForegroundColor Yellow
$managerOutput = npx truffle exec scripts/setManager.js --network development 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Manager roles configured" -ForegroundColor Green
} else {
    Write-Host "[X] Manager setup failed" -ForegroundColor Red
    Write-Host $managerOutput -ForegroundColor Red
}

Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Run 'npm run dev' to start the frontend" -ForegroundColor White
Write-Host "  2. Connect MetaMask to http://127.0.0.1:7545" -ForegroundColor White
Write-Host "  3. Import manager account if needed" -ForegroundColor White
Write-Host ""
Write-Host "Manager Accounts (all have Manager role):" -ForegroundColor Yellow
Write-Host "  - 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 - 1000 ETH" -ForegroundColor White
Write-Host "  - 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 - 1000 ETH" -ForegroundColor White
Write-Host ""
Write-Host "To check Ganache status: Get-Job" -ForegroundColor Gray
Write-Host 'To stop Ganache: Stop-Job -Name Ganache; Remove-Job -Name Ganache' -ForegroundColor Gray
Write-Host ""
