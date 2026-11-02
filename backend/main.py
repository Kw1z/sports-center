from datetime import datetime, timezone

from fastapi import Depends
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models import User, Role
from schemas import UserRegister, UserResponse
from security import hash_password

from fastapi import FastAPI, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from database import engine

app = FastAPI(
    title="BluePulse API",
    description="Backend спортивного центра BluePulse",
    version="0.2.0",
)


@app.get("/")
def home():
    return {
        "message": "Добро пожаловать в BluePulse!"
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/health/db")
def database_health():
    try:
        with engine.connect() as connection:
            result = connection.execute(
                text("SELECT COUNT(*) FROM services")
            )

            services_count = result.scalar_one()

        return {
            "database": "connected",
            "services_count": services_count,
        }

    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Не удалось подключиться к PostgreSQL"
        ) from exc


def get_db():
    with Session(engine) as db:
        yield db


@app.post(
    "/api/auth/register",
    response_model=UserResponse,
    status_code=201
)
def register_user(
    data: UserRegister,
    db: Session = Depends(get_db)
):
    # Находим роль обычного клиента
    client_role = db.scalar(
        select(Role).where(Role.code == "client")
    )

    if client_role is None:
        raise HTTPException(
            status_code=503,
            detail="Роль клиента не настроена"
        )

    # Приводим email к единому формату
    email = str(data.email).strip().lower()

    # Проверяем, есть ли уже такой пользователь
    existing_user = db.scalar(
        select(User).where(
            func.lower(User.email) == email
        )
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=409,
            detail="Пользователь с таким email уже существует"
        )

    # Создаём нового пользователя
    new_user = User(
        role_id=client_role.id,
        full_name=data.full_name.strip(),
        email=email,
        password_hash=hash_password(data.password),
        phone=data.phone,
        is_active=True,
        created_at=datetime.now(timezone.utc).replace(
            tzinfo=None
        ),
    )

    db.add(new_user)

    try:
        db.commit()
        db.refresh(new_user)

    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Не удалось зарегистрировать пользователя"
        ) from exc

    return new_user

