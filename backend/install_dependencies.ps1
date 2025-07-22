# PowerShell script to install backend dependencies

Write-Host "Installing backend dependencies..." -ForegroundColor Green
Write-Host ""

Write-Host "Step 1: Installing core dependencies from requirements.txt" -ForegroundColor Yellow
pip install -r requirements.txt

Write-Host ""
Write-Host "Step 2: Installing optional dependencies for advanced features" -ForegroundColor Yellow

Write-Host "Installing Google Generative AI..." -ForegroundColor Cyan
pip install google-generativeai

Write-Host "Installing spaCy..." -ForegroundColor Cyan
pip install spacy

Write-Host "Downloading spaCy English model..." -ForegroundColor Cyan
python -m spacy download en_core_web_sm

Write-Host "Installing Firebase Admin SDK..." -ForegroundColor Cyan
pip install firebase-admin

Write-Host ""
Write-Host "Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To test the setup, run: python test_basic_setup.py" -ForegroundColor White
Write-Host "To start the backend, run: python main_simple.py" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")