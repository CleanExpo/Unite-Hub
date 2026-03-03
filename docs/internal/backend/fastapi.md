# FastAPI Documentation

> Official documentation sourced from [fastapi.tiangolo.com](https://fastapi.tiangolo.com)

## Overview

FastAPI is a modern, fast (high-performance) web framework for building APIs with Python based on standard Python type hints.

Key features:

- **Fast**: Very high performance, on par with NodeJS and Go
- **Fast to code**: Increase development speed by 200%-300%
- **Fewer bugs**: Reduce about 40% of human-induced errors
- **Intuitive**: Editor support, autocompletion everywhere
- **Easy**: Designed to be easy to use and learn
- **Short**: Minimize code duplication
- **Robust**: Get production-ready code with automatic interactive documentation
- **Standards-based**: Based on OpenAPI and JSON Schema

## Installation

```bash
pip install fastapi
pip install "uvicorn[standard]"
```

## Basic Setup

```python
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello World"}
```

## Run the Server

```bash
uvicorn main:app --reload
```

## Path Parameters

```python
@app.get("/items/{item_id}")
async def read_item(item_id: int):
    return {"item_id": item_id}

# With path parameter validation
from fastapi import Path

@app.get("/items/{item_id}")
async def read_item(
    item_id: int = Path(..., title="The ID of the item", ge=1)
):
    return {"item_id": item_id}
```

## Query Parameters

```python
@app.get("/items/")
async def read_items(skip: int = 0, limit: int = 10):
    return {"skip": skip, "limit": limit}

# Optional query parameters
@app.get("/items/{item_id}")
async def read_item(item_id: int, q: str | None = None):
    if q:
        return {"item_id": item_id, "q": q}
    return {"item_id": item_id}
```

## Pydantic Models (v2)

```python
from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=100)

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserResponse(UserBase):
    id: int

    model_config = {"from_attributes": True}  # Pydantic v2 syntax
```

## Request Body

```python
class Item(BaseModel):
    name: str
    description: str | None = None
    price: float
    tax: float | None = None

@app.post("/items/")
async def create_item(item: Item):
    return item
```

## Authentication

### OAuth2 with Bearer Token

```python
from fastapi import Depends, FastAPI
from fastapi.security import OAuth2PasswordBearer

app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@app.get("/items/")
async def read_items(token: str = Depends(oauth2_scheme)):
    return {"token": token}
```

### JWT Authentication

```python
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from datetime import datetime, timedelta

security = HTTPBearer()

class AuthMiddleware:
    def __init__(self, secret_key: str):
        self.secret_key = secret_key

    def create_token(self, user_id: str, expires_delta: timedelta = None):
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(hours=1)

        to_encode = {"sub": user_id, "exp": expire}
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm="HS256")
        return encoded_jwt

    def verify_token(self, credentials: HTTPAuthorizationCredentials = Depends(security)):
        try:
            payload = jwt.decode(credentials.credentials, self.secret_key, algorithms=["HS256"])
            user_id = payload.get("sub")
            if user_id is None:
                raise HTTPException(status_code=401, detail="Invalid token")
            return user_id
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")
```

### Protected Endpoints

```python
from fastapi import Depends

# Required authentication
@app.get("/protected")
async def protected_endpoint(current_user: dict = Depends(get_current_user)):
    return {"message": f"Hello {current_user['username']}"}

# Optional authentication
@app.get("/public")
async def public_endpoint(user: dict | None = Depends(get_optional_user)):
    if user:
        return {"premium_content": True}
    return {"premium_content": False}

# Admin only
@app.get("/admin", dependencies=[Depends(get_current_superuser)])
async def admin_endpoint():
    return {"admin_data": "sensitive"}
```

## Middleware

### Custom Middleware

```python
import time
from fastapi import FastAPI, Request

app = FastAPI()

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    process_time = time.perf_counter() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response
```

### Auth Middleware

```python
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            user_id = validate_token(token)
            if user_id:
                request.scope["user_id"] = user_id
                request.scope["is_authenticated"] = True
            else:
                request.scope["is_authenticated"] = False
        else:
            request.scope["is_authenticated"] = False

        response = await call_next(request)
        return response

app.add_middleware(AuthMiddleware)
```

## Dependency Injection

```python
from fastapi import Depends

async def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/users")
async def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()
```

## Route Groups with Router

```python
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1", tags=["users"])

@router.get("/users")
async def get_users():
    return []

@router.post("/users")
async def create_user(user: UserCreate):
    return user

# Include in main app
app.include_router(router)
```

## Error Handling

```python
from fastapi import HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()}
    )

@app.get("/item/{item_id}")
async def get_item(item_id: int):
    if item_id not in items:
        raise HTTPException(status_code=404, detail="Item not found")
    return items[item_id]
```

## CORS Configuration

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Background Tasks

```python
from fastapi import BackgroundTasks

def send_email(email: str, message: str):
    # Send email logic
    pass

@app.post("/send-notification")
async def send_notification(
    email: str,
    background_tasks: BackgroundTasks
):
    background_tasks.add_task(send_email, email, "Welcome!")
    return {"message": "Notification sent in background"}
```

## Async Database Operations

```python
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

engine = create_async_engine("postgresql+asyncpg://user:pass@localhost/db")
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_async_db():
    async with async_session() as session:
        yield session

@app.get("/users")
async def get_users(db: AsyncSession = Depends(get_async_db)):
    result = await db.execute(select(User))
    return result.scalars().all()
```

## File Upload

```python
from fastapi import File, UploadFile

@app.post("/uploadfile/")
async def create_upload_file(file: UploadFile = File(...)):
    contents = await file.read()
    return {"filename": file.filename, "size": len(contents)}
```

## WebSocket

```python
from fastapi import WebSocket

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        await websocket.send_text(f"Message received: {data}")
```

## Pydantic v2 Migration

FastAPI now fully supports Pydantic v2. Key changes:

```python
# Pydantic v1 (deprecated)
class Config:
    orm_mode = True

# Pydantic v2 (current)
model_config = {"from_attributes": True}

# For gradual migration, you can use pydantic.v1
from pydantic.v1 import BaseModel
```

## Official Resources

- **Documentation**: [fastapi.tiangolo.com](https://fastapi.tiangolo.com)
- **Tutorial**: [fastapi.tiangolo.com/tutorial](https://fastapi.tiangolo.com/tutorial/)
- **GitHub**: [github.com/tiangolo/fastapi](https://github.com/tiangolo/fastapi)
