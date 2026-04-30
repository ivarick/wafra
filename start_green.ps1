$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Starting WAFRA services from $root" -ForegroundColor Cyan

@(8000, 8001, 9000) | ForEach-Object {
    $proc = Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique
    if ($proc) {
        Write-Host "Stopping process on port $_ (PID $proc)" -ForegroundColor Yellow
        Stop-Process -Id $proc -Force -ErrorAction SilentlyContinue
    }
}

$chatbotPython = Join-Path $root "chatbot\.venv\Scripts\python.exe"
$diseasePython = Join-Path $root "disease\venv\Scripts\python.exe"

if (-not (Test-Path $chatbotPython) -or -not (Test-Path $diseasePython)) {
    throw "Missing venv(s). Run .\setup_venvs.ps1 first."
}

$chatbotEnvFile = Join-Path $root "chatbot\.env.local"
$groqApiKey = $env:GROQ_API_KEY
$openWeatherKey = $env:OPENWEATHER_API_KEY
if (-not $groqApiKey -and (Test-Path $chatbotEnvFile)) {
    $line = Get-Content $chatbotEnvFile |
        Where-Object { $_ -match "^\s*GROQ_API_KEY\s*=" } |
        Select-Object -First 1
    if ($line) {
        $groqApiKey = ($line -split "=", 2)[1].Trim().Trim("'`"")
    }
}
if (-not $openWeatherKey -and (Test-Path $chatbotEnvFile)) {
    $line = Get-Content $chatbotEnvFile |
        Where-Object { $_ -match "^\s*OPENWEATHER_API_KEY\s*=" } |
        Select-Object -First 1
    if ($line) {
        $openWeatherKey = ($line -split "=", 2)[1].Trim().Trim("'`"")
    }
}

if (-not $groqApiKey) {
    throw "Missing GROQ_API_KEY. Set it in environment or chatbot\.env.local."
}

# ── Disease API (port 8001) ──────────────────────────────────────────────────
Start-Process $diseasePython `
    -ArgumentList "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001" `
    -WorkingDirectory (Join-Path $root "disease") `
    -WindowStyle Normal

# ── Chatbot API (port 9000) ──────────────────────────────────────────────────
$previousGroqApiKey = $env:GROQ_API_KEY
$previousOpenWeatherKey = $env:OPENWEATHER_API_KEY
$env:GROQ_API_KEY = $groqApiKey
$env:OPENWEATHER_API_KEY = $openWeatherKey
Start-Process $chatbotPython `
    -ArgumentList "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "9000" `
    -WorkingDirectory (Join-Path $root "chatbot") `
    -WindowStyle Normal
$env:GROQ_API_KEY = $previousGroqApiKey
$env:OPENWEATHER_API_KEY = $previousOpenWeatherKey

# ── Django backend (port 8000) ──────────────────────────────────────────────
$djangoRoot   = "C:\Users\Ivarick\Desktop\green\backend"
$djangoPython = "C:\Users\Ivarick\Desktop\green\backend\.venv\Scripts\python.exe"
if (Test-Path $djangoPython) {
    Start-Process $djangoPython `
        -ArgumentList "manage.py", "runserver", "0.0.0.0:8000" `
        -WorkingDirectory $djangoRoot `
        -WindowStyle Normal
    Write-Host "Django API:  http://localhost:8000" -ForegroundColor Green
} else {
    Write-Host "Django venv not found. Map/locator features will be unavailable." -ForegroundColor Yellow
    Write-Host "To set up: open a new terminal and run:" -ForegroundColor Yellow
    Write-Host "  cd `"$djangoRoot`"" -ForegroundColor Yellow
    Write-Host "  python -m venv .venv" -ForegroundColor Yellow
    Write-Host "  .venv\Scripts\pip install -r requirements.txt" -ForegroundColor Yellow
    Write-Host "  .venv\Scripts\python manage.py migrate" -ForegroundColor Yellow
}

Write-Host "Disease API: http://localhost:8001" -ForegroundColor Green
Write-Host "Chatbot API: http://localhost:9000" -ForegroundColor Green
