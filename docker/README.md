# Docker Helper Scripts - Unite-Hub

Quick reference for Docker helper scripts.

## Available Scripts

### Linux/Mac (Bash)

```bash
# Start services
./docker/start.sh [--dev] [--local-db] [--proxy] [--build]

# Stop services
./docker/stop.sh [--clean]

# Rebuild images
./docker/rebuild.sh [--no-cache]

# View logs
./docker/logs.sh [app|redis|postgres|nginx] [--no-follow]
```

### Windows (Batch)

```cmd
REM Start services
docker\start.bat [--dev] [--local-db] [--proxy] [--build]

REM Stop services
docker\stop.bat [--clean]

REM Rebuild images
docker\rebuild.bat [--no-cache]

REM View logs
docker\logs.bat [app|redis|postgres|nginx] [--no-follow]
```

## Options Explained

### start.sh / start.bat

- `--dev`: Development mode with hot reload
- `--local-db`: Include local PostgreSQL container
- `--proxy`: Include Nginx reverse proxy
- `--build`: Rebuild images before starting

### stop.sh / stop.bat

- `--clean`: Remove volumes (deletes all data)

### rebuild.sh / rebuild.bat

- `--no-cache`: Build without using Docker cache

### logs.sh / logs.bat

- `app|redis|postgres|nginx`: Specific service to view
- `--no-follow`: Don't follow logs (show and exit)

## Quick Start Examples

### Development

```bash
# Linux/Mac
./docker/start.sh --dev

# Windows
docker\start.bat --dev
```

### Production

```bash
# Linux/Mac
./docker/start.sh --build

# Windows
docker\start.bat --build
```

### With Local Database

```bash
# Linux/Mac
./docker/start.sh --local-db --proxy

# Windows
docker\start.bat --local-db --proxy
```

### View Logs

```bash
# Linux/Mac
./docker/logs.sh app

# Windows
docker\logs.bat app
```

### Clean Rebuild

```bash
# Linux/Mac
./docker/stop.sh --clean
./docker/rebuild.sh --no-cache

# Windows
docker\stop.bat --clean
docker\rebuild.bat --no-cache
```

## Troubleshooting

If scripts don't work:

1. **Linux/Mac**: Make executable
   ```bash
   chmod +x docker/*.sh
   ```

2. **Windows**: Run from project root
   ```cmd
   cd D:\Unite-Hub
   docker\start.bat
   ```

3. **Both**: Ensure Docker is running
   ```bash
   docker --version
   docker-compose --version
   ```

## Full Documentation

See [DOCKER_SETUP.md](../docs/DOCKER_SETUP.md) for complete guide.
