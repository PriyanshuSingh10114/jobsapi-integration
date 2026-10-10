# PowerShell script to start the consolidated JobsAPI & Dice automation environment
Write-Host "Starting JobsAPI Consolidated Environment (1 Backend, 1 Frontend)..." -ForegroundColor Cyan

# Check if MongoDB & Redis are running, or start via Docker if requested
Write-Host "Starting Backend on port 5000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

Write-Host "Starting Frontend on port 5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "`nConsolidated Services Running:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "  Backend API: http://localhost:5000" -ForegroundColor White
Write-Host "  Dice Module: http://localhost:5000/api/dice" -ForegroundColor White
