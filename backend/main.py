from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr

app = FastAPI(title="NovaRaid API")

# ===== CORS (permite o React chamar a API) =====
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== Auth config =====
SECRET_KEY = "CHANGE_ME_IN_PROD"  # depois vamos colocar em .env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# ===== "Banco" em memória =====
CHAMPIONSHIPS = [
    {"id": 1, "name": "NovaRaid Cup #1", "status": "draft"},
    {"id": 2, "name": "UEPB Campus V Open", "status": "published"},
]

USERS = []  # {id, name, email, password_hash}


# ===== Schemas =====
class ChampionshipCreate(BaseModel):
    name: str
    status: str = "draft"


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: int
    name: str
    email: EmailStr


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ===== Auth helpers =====
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def find_user_by_email(email: str):
    for u in USERS:
        if u["email"].lower() == email.lower():
            return u
    return None


def create_access_token(subject: str, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES) -> str:
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: Optional[str] = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Token inválido")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

    user = find_user_by_email(email)
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")

    return user


# ===== Rotas básicas =====
@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/version")
def version():
    return {"name": "NovaRaid API", "version": "0.1.0"}


# ===== Campeonatos =====
@app.get("/championships")
def list_championships():
    return CHAMPIONSHIPS

@app.get("/championships/{championship_id}")
def get_championship(championship_id: int):
    for c in CHAMPIONSHIPS:
        if c["id"] == championship_id:
            return c
    raise HTTPException(status_code=404, detail="Campeonato não encontrado")

@app.get("/public/championships")
def public_championships():
    return [c for c in CHAMPIONSHIPS if c["status"] == "published"]

@app.get("/public/championships/{championship_id}")
def public_championship_detail(championship_id: int):
    for c in CHAMPIONSHIPS:
        if c["id"] == championship_id and c["status"] == "published":
            return c
    raise HTTPException(status_code=404, detail="Campeonato não encontrado")

@app.post("/championships", status_code=201)
def create_championship(payload: ChampionshipCreate, current_user=Depends(get_current_user)):
    new_id = max([c["id"] for c in CHAMPIONSHIPS], default=0) + 1
    item = {"id": new_id, "name": payload.name, "status": payload.status}
    CHAMPIONSHIPS.append(item)
    return item

@app.patch("/championships/{championship_id}/publish")
def publish_championship(championship_id: int, current_user=Depends(get_current_user)):
    for c in CHAMPIONSHIPS:
        if c["id"] == championship_id:
            c["status"] = "published"
            return c
    raise HTTPException(status_code=404, detail="Campeonato não encontrado")

@app.patch("/championships/{championship_id}/unpublish")
def unpublish_championship(championship_id: int, current_user=Depends(get_current_user)):
    for c in CHAMPIONSHIPS:
        if c["id"] == championship_id:
            c["status"] = "draft"
            return c
    raise HTTPException(status_code=404, detail="Campeonato não encontrado")

@app.delete("/championships/{championship_id}", status_code=204)
def delete_championship(championship_id: int, current_user=Depends(get_current_user)):
    for i, c in enumerate(CHAMPIONSHIPS):
        if c["id"] == championship_id:
            CHAMPIONSHIPS.pop(i)
            return
    raise HTTPException(status_code=404, detail="Campeonato não encontrado")

# ===== Auth =====
@app.post("/auth/register", response_model=UserPublic, status_code=201)
def register(payload: UserCreate):
    if find_user_by_email(payload.email):
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")

    new_id = max([u["id"] for u in USERS], default=0) + 1
    user = {
        "id": new_id,
        "name": payload.name,
        "email": payload.email,
        "password_hash": hash_password(payload.password),
    }
    USERS.append(user)

    return {"id": user["id"], "name": user["name"], "email": user["email"]}


@app.post("/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # OAuth2PasswordRequestForm usa "username" e "password"
    user = find_user_by_email(form_data.username)
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
        )

    token = create_access_token(subject=user["email"])
    return {"access_token": token, "token_type": "bearer"}


@app.get("/auth/me", response_model=UserPublic)
def me(current_user=Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "name": current_user["name"],
        "email": current_user["email"],
    }