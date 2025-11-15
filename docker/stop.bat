@echo off
REM ==================================================
REM Unite-Hub Docker - Stop Script (Windows)
REM ==================================================

echo Stopping Unite-Hub Docker Services...

set REMOVE_VOLUMES=

:parse_args
if "%1"=="" goto stop_services
if "%1"=="--clean" (
    set REMOVE_VOLUMES=-v
    echo WARNING: Removing volumes (data will be deleted)
    shift
    goto parse_args
)
echo Unknown option: %1
echo Usage: docker\stop.bat [--clean]
exit /b 1

:stop_services
echo Stopping containers...
docker-compose down %REMOVE_VOLUMES%

echo.
echo Services stopped successfully!
if not "%REMOVE_VOLUMES%"=="" (
    echo WARNING: All data has been removed
)
