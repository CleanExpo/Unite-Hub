@echo off
REM ==================================================
REM Unite-Hub Docker - Logs Script (Windows)
REM ==================================================

set SERVICE=
set FOLLOW=-f

:parse_args
if "%1"=="" goto view_logs
if "%1"=="app" (
    set SERVICE=app
    echo Viewing logs for: app
    shift
    goto parse_args
)
if "%1"=="redis" (
    set SERVICE=redis
    echo Viewing logs for: redis
    shift
    goto parse_args
)
if "%1"=="postgres" (
    set SERVICE=postgres
    echo Viewing logs for: postgres
    shift
    goto parse_args
)
if "%1"=="nginx" (
    set SERVICE=nginx
    echo Viewing logs for: nginx
    shift
    goto parse_args
)
if "%1"=="--no-follow" (
    set FOLLOW=
    shift
    goto parse_args
)
echo Unknown option: %1
echo Usage: docker\logs.bat [app^|redis^|postgres^|nginx] [--no-follow]
exit /b 1

:view_logs
if "%SERVICE%"=="" (
    echo Viewing logs for all services
    docker-compose logs %FOLLOW%
) else (
    docker-compose logs %FOLLOW% %SERVICE%
)
