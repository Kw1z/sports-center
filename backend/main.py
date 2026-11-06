
from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials,
)
from jwt.exceptions import InvalidTokenError

from datetime import datetime, timezone

from fastapi import Depends
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models import User, Role, Service
from schemas import UserRegister, UserResponse, UserLogin, TokenResponse, ServiceResponse
from security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)

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


@app.post(
    "/api/auth/login",
    response_model=TokenResponse
)
def login_user(
    data: UserLogin,
    db: Session = Depends(get_db)
):
    # Приводим email к единому виду
    email = str(data.email).strip().lower()

    # Находим пользователя по email
    user = db.scalar(
        select(User).where(
            func.lower(User.email) == email
        )
    )

    # Проверяем, что пользователь существует
    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Неверный email или пароль"
        )

    # Проверяем правильность пароля
    if not verify_password(
        data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Неверный email или пароль"
        )

    # Проверяем, что аккаунт активен
    if not user.is_active:
        raise HTTPException(
            status_code=401,
            detail="Неверный email или пароль"
        )

    
    access_token = create_access_token(user.id)

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }



# Схема авторизации Bearer
bearer_scheme = HTTPBearer(auto_error=False)


# Получаем текущего пользователя по токену
def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
    db: Session = Depends(get_db),
):
    auth_error = HTTPException(
        status_code=401,
        detail="Недействительный или отсутствующий токен",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise auth_error

    try:
        payload = decode_access_token(
            credentials.credentials
        )

        user_id = payload.get("sub")

        if (
            not isinstance(user_id, str)
            or not user_id.isdecimal()
            or int(user_id) <= 0
        ):
            raise auth_error

    except InvalidTokenError:
        raise auth_error

    user = db.get(User, int(user_id))

    if user is None or not user.is_active:
        raise auth_error

    return user


# Личный кабинет текущего пользователя
@app.get(
    "/api/auth/me",
    response_model=UserResponse
)
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user


@app.get(
    "/api/services",
    response_model=list[ServiceResponse]
)
def get_services(db: Session = Depends(get_db)):
    services = db.scalars(
        select(Service)
        .where(Service.is_active.is_(True))
        .order_by(Service.id)
    ).all()

    return services


@app.get(
    "/api/services/{service_id}",
    response_model=ServiceResponse
)
def get_service(
    service_id: int,
    db: Session = Depends(get_db)
):
    service = db.get(Service, service_id)

    if service is None or not service.is_active:
        raise HTTPException(
            status_code=404,
            detail="Услуга не найдена"
        )

    return service
