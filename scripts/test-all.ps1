# PowerShell script to run complete test and build validation suite
Write-Host "Running Backend Tests..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot/../backend"
npm test
if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend tests failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`nRunning Frontend Lint..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot/../frontend"
npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend lint failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`nRunning Frontend Production Build..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`nALL CONSOLIDATED VERIFICATIONS PASSED!" -ForegroundColor Green
