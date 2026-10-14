@echo off
setlocal

rem Starts both services required by Expo Go during local development:
rem   1. Django API on port 8000, reachable by phones on the LAN
rem   2. Expo Metro on port 8081 in this mobile project

rem Defaults match the sibling PRE-SYSTEM and detect either common venv location:
rem   PRE-MOBILE-SYSTEM\start-denguewatch-development.cmd
rem   PRE-SYSTEM\manage.py
rem   PRE-SYSTEM\django-env\Scripts\python.exe OR ..\django-env\Scripts\python.exe
rem Override DJANGO_PROJECT or DJANGO_PYTHON before running if your folders differ.
if not defined DJANGO_PROJECT set "DJANGO_PROJECT=%~dp0..\PRE-SYSTEM"
if not defined DJANGO_PYTHON set "DJANGO_PYTHON=%DJANGO_PROJECT%\django-env\Scripts\python.exe"
if not exist "%DJANGO_PYTHON%" set "DJANGO_PYTHON=%DJANGO_PROJECT%..\django-env\Scripts\python.exe"
if not exist "%DJANGO_PYTHON%" set "DJANGO_PYTHON=%USERPROFILE%\django-env\Scripts\python.exe"

if not exist "%DJANGO_PYTHON%" (
  echo Django virtual-environment Python was not found:
  echo %DJANGO_PYTHON%
  echo Expected the venv at %DJANGO_PYTHON%
  echo Create it with: python -m venv django-env
  echo Or set DJANGO_PYTHON to your venv's Scripts\python.exe path.
  pause
  exit /b 1
)

if not exist "%DJANGO_PROJECT%\manage.py" (
  echo Django project was not found:
  echo %DJANGO_PROJECT%
  echo Set DJANGO_PROJECT to the folder containing manage.py.
  pause
  exit /b 1
)

echo Starting Django API in a second terminal window...
start "DengueWatch Django API" /D "%DJANGO_PROJECT%" cmd /k ""%DJANGO_PYTHON%" manage.py runserver 0.0.0.0:8000"

echo Waiting briefly for the API, then starting Expo...
timeout /t 3 /nobreak >nul
npx expo start --lan --clear
