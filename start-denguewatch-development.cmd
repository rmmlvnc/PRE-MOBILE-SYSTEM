@echo off
setlocal

rem Starts both services required by Expo Go during local development:
rem   1. Django API on port 8000, reachable by phones on the LAN
rem   2. Expo Metro on port 8081 in this mobile project

set "DJANGO_ROOT=%USERPROFILE%\django-env"
set "DJANGO_PROJECT=%DJANGO_ROOT%\denguewatch"
set "DJANGO_PYTHON=%DJANGO_ROOT%\Scripts\python.exe"

if not exist "%DJANGO_PYTHON%" (
  echo Django virtual-environment Python was not found:
  echo %DJANGO_PYTHON%
  echo Edit DJANGO_ROOT in this file if your django-env folder is elsewhere.
  pause
  exit /b 1
)

if not exist "%DJANGO_PROJECT%\manage.py" (
  echo Django project was not found:
  echo %DJANGO_PROJECT%
  echo Edit DJANGO_PROJECT in this file if your project is elsewhere.
  pause
  exit /b 1
)

echo Starting Django API in a second terminal window...
start "DengueWatch Django API" /D "%DJANGO_PROJECT%" cmd /k ""%DJANGO_PYTHON%" manage.py runserver 0.0.0.0:8000"

echo Waiting briefly for the API, then starting Expo...
timeout /t 3 /nobreak >nul
npx expo start --clear
