@echo off
REM ==================================================
REM Unite-Hub Docker - Start Script (Windows)
REM ==================================================

echo Starting Unite-Hub Docker Services...

REM Check if .env.local exists
if not exist .env.local (
    echo WARNING: .env.local not found
    echo Copying .env.example to .env.local...
    copy .env.example .env.local
    echo WARNING: Please edit .env.local with your actual values before proceeding
    pause
    exit /b 1
)

REM Parse arguments
set COMPOSE_FILE=docker-compose.yml
set PROFILE=
set BUILD_FLAG=

:parse_args
if "%1"=="" goto start_services
if "%1"=="--dev" (
    set COMPOSE_FILE=docker-compose.yml -f docker-compose.dev.yml
    echo Using development mode
    shift
    goto parse_args
)
if "%1"=="--local-db" (
    set PROFILE=%PROFILE% --profile local-db
    echo Using local PostgreSQL database
    shift
    goto parse_args
)
if "%1"=="--proxy" (
    set PROFILE=%PROFILE% --profile proxy
    echo Using Nginx reverse proxy
    shift
    goto parse_args
)
if "%1"=="--build" (
    set BUILD_FLAG=--build
    echo Rebuilding images
    shift
    goto parse_args
)
echo Unknown option: %1
echo Usage: docker\start.bat [--dev] [--local-db] [--proxy] [--build]
exit /b 1

:start_services
echo Starting containers...
docker-compose -f %COMPOSE_FILE% %PROFILE% up -d %BUILD_FLAG%

echo.
echo Waiting for services to be healthy...
timeout /t 5 /nobreak >nul

echo.
echo Services started successfully!
echo.
docker-compose ps

echo.
echo Unite-Hub is ready!
echo Application: http://localhost:3008
echo Redis: localhost:6379
echo.
echo Useful commands:
echo   View logs:    docker-compose logs -f
echo   Stop:         docker-compose down
echo   Restart:      docker-compose restart
echo   Shell:        docker-compose exec app sh
echo.
