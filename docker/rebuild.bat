@echo off
REM ==================================================
REM Unite-Hub Docker - Rebuild Script (Windows)
REM ==================================================

echo Rebuilding Unite-Hub Docker Images...

set NO_CACHE=

:parse_args
if "%1"=="" goto rebuild
if "%1"=="--no-cache" (
    set NO_CACHE=--no-cache
    echo Building without cache
    shift
    goto parse_args
)
echo Unknown option: %1
echo Usage: docker\rebuild.bat [--no-cache]
exit /b 1

:rebuild
echo Stopping existing containers...
docker-compose down

echo.
echo Removing old images...
docker-compose rm -f

echo.
echo Building new images...
docker-compose build %NO_CACHE%

echo.
echo Starting services...
docker-compose up -d

echo.
echo Rebuild complete!
echo Application: http://localhost:3008
echo.
docker-compose ps
