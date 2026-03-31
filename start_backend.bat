@echo off
echo Starting InvestAI Backend...
cd /d "%~dp0backend"
python manage.py runserver 8000
