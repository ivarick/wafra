$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Ensure-Venv {
    param(
        [Parameter(Mandatory = $true)][string]$ProjectPath,
        [Parameter(Mandatory = $true)][string]$VenvPath,
        [Parameter(Mandatory = $true)][string]$RequirementsPath
    )

    $fullProjectPath = Join-Path $root $ProjectPath
    $fullVenvPath = Join-Path $root $VenvPath
    $fullRequirementsPath = Join-Path $root $RequirementsPath

    if (-not (Test-Path $fullVenvPath)) {
        Write-Host "Creating venv at $VenvPath" -ForegroundColor Cyan
        py -3.10 -m venv $fullVenvPath
    } else {
        Write-Host "Using existing venv at $VenvPath" -ForegroundColor DarkCyan
    }

    $python = Join-Path $fullVenvPath "Scripts\\python.exe"

    Write-Host "Installing dependencies for $ProjectPath" -ForegroundColor Green
    & $python -m pip install --upgrade pip
    & $python -m pip install -r $fullRequirementsPath
}

Ensure-Venv -ProjectPath "chatbot" -VenvPath "chatbot\.venv" -RequirementsPath "chatbot\requirements.txt"
Ensure-Venv -ProjectPath "disease" -VenvPath "disease\venv" -RequirementsPath "disease\requirements.txt"

Write-Host ""
Write-Host "Done." -ForegroundColor Green
Write-Host "Chatbot activate: .\chatbot\.venv\Scripts\Activate.ps1" -ForegroundColor White
Write-Host "Disease activate: .\disease\venv\Scripts\Activate.ps1" -ForegroundColor White
