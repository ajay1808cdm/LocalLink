$serverProcess = Start-Process -FilePath "npx.cmd" -ArgumentList "serve -s ../frontend/build -l 3000" -PassThru -NoNewWindow
Start-Sleep -Seconds 5
Write-Host "Server started, running tests..."
npm run test:all
Write-Host "Tests completed, stopping server..."
Stop-Process -Id $serverProcess.Id -Force
