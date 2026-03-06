Set-Location "$PSScriptRoot\backend"

if (!(Test-Path ".\.venv")) { py -m venv .venv }

.\.venv\Scripts\Activate.ps1

py -m pip install --upgrade pip | Out-Null
py -m pip install -r requirements.txt | Out-Null

uvicorn main:app --reload --port 8000