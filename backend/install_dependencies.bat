@echo off
echo Installing backend dependencies...
echo.

echo Step 1: Installing core dependencies from requirements.txt
pip install -r requirements.txt

echo.
echo Step 2: Installing optional dependencies for advanced features
echo Installing Google Generative AI...
pip install google-generativeai

echo Installing spaCy...
pip install spacy

echo Downloading spaCy English model...
python -m spacy download en_core_web_sm

echo Installing Firebase Admin SDK...
pip install firebase-admin

echo.
echo Installation complete!
echo.
echo To test the setup, run: python test_basic_setup.py
echo To start the backend, run: python main_simple.py
pause