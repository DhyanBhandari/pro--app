@echo off
echo Starting Backend Server...
echo.

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Start the simple server on port 8000
echo Starting FastAPI server on http://localhost:8000
python main_simple.py

pause