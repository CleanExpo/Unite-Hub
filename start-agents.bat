@echo off
REM ==============================================
REM Unite-Hub Multi-Agent System Startup Script (Windows)
REM ==============================================

echo 🚀 Starting Unite-Hub Multi-Agent System...
echo.

REM Check if docker-compose is installed
where docker-compose >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ docker-compose not found. Please install Docker Compose.
    exit /b 1
)

REM Check if .env.local exists
if not exist ".env.local" (
    echo ❌ .env.local not found. Please create it with required credentials.
    exit /b 1
)

REM Load environment variables from .env.local
for /f "usebackq tokens=1,* delims==" %%a in (".env.local") do (
    if not "%%a"=="" if not "%%a:~0,1%"=="#" set %%a=%%b
)

REM Set default RabbitMQ credentials if not set
if not defined RABBITMQ_USER set RABBITMQ_USER=unite_hub
if not defined RABBITMQ_PASSWORD set RABBITMQ_PASSWORD=unite_hub_pass

echo 📋 Configuration:
echo    Supabase URL: %NEXT_PUBLIC_SUPABASE_URL%
echo    RabbitMQ User: %RABBITMQ_USER%
echo.

REM Step 1: Start main infrastructure
echo 1️⃣  Starting main infrastructure...
docker-compose up -d redis

REM Wait for Redis
echo ⏳ Waiting for Redis...
timeout /t 5 /nobreak >nul

REM Step 2: Create network if it doesn't exist
echo 2️⃣  Creating Docker network...
docker network create unite-hub-network 2>nul || echo    Network already exists

REM Step 3: Start multi-agent system
echo 3️⃣  Starting multi-agent system...
docker-compose -f docker-compose.agents.yml up -d

REM Step 4: Wait for services
echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Step 5: Show status
echo.
echo ✅ Multi-Agent System Status:
docker-compose -f docker-compose.agents.yml ps

echo.
echo 📊 RabbitMQ Management UI:
echo    URL: http://localhost:15672
echo    Username: %RABBITMQ_USER%
echo    Password: %RABBITMQ_PASSWORD%

echo.
echo 📋 Useful Commands:
echo    View logs: docker-compose -f docker-compose.agents.yml logs -f [service]
echo    Stop agents: docker-compose -f docker-compose.agents.yml down
echo    Restart agent: docker-compose -f docker-compose.agents.yml restart [service]
echo.
echo ✅ Multi-agent system is running!
pause
