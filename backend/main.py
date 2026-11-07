
from datetime import datetime, timezone


from fastapi.middleware.cors import CORSMiddleware


from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials,
)

from sqlalchemy import text, select, func
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy.orm import Session

from jwt.exceptions import InvalidTokenError

from database import engine

from models import (
    Role,
    User,
    Service,
    Room,
    Staff,
    Booking,
    Session as TrainingSession,
)

from schemas import (
    UserRegister,
    UserResponse,
    UserLogin,
    TokenResponse,
    ServiceResponse,
    SessionResponse,
    BookingCreate,
    BookingResponse,
    ServiceCreate,
    ServicePriceUpdate,
    ServiceStatusUpdate,
    RoomResponse,
    RoomCreate,
    RoomCapacityUpdate,
    RoomNameUpdate,
    RoomStatusUpdate,
    ServiceDetailsUpdate,
)

from security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)


app = FastAPI(
    title="BluePulse API",
    description="Backend спортивного центра BluePulse",
    version="0.2.0",
)


# Разрешаем Frontend BluePulse обращаться к Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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


# Общий запрос для получения занятий
def sessions_query():
    return (
        select(
            TrainingSession.id,
            TrainingSession.service_id,
            Service.name.label("service_name"),
            TrainingSession.room_id,
            Room.name.label("room_name"),
            TrainingSession.staff_id,
            Staff.display_name.label("staff_name"),
            TrainingSession.starts_at,
            TrainingSession.ends_at,
            TrainingSession.capacity,
            TrainingSession.status,
        )
        .join(
            Service,
            TrainingSession.service_id == Service.id
        )
        .join(
            Room,
            TrainingSession.room_id == Room.id
        )
        .outerjoin(
            Staff,
            TrainingSession.staff_id == Staff.id
        )
    )


# Получить список предстоящих занятий
@app.get(
    "/api/sessions",
    response_model=list[SessionResponse]
)
def get_sessions(db: Session = Depends(get_db)):
    rows = db.execute(
        sessions_query()
        .where(
            TrainingSession.status == "open",
            TrainingSession.starts_at >= datetime.now(timezone.utc)
        )
        .order_by(TrainingSession.starts_at)
    ).mappings().all()

    return [dict(row) for row in rows]


# Получить одно занятие по ID
@app.get(
    "/api/sessions/{session_id}",
    response_model=SessionResponse
)
def get_session(
    session_id: int,
    db: Session = Depends(get_db)
):
    row = db.execute(
        sessions_query()
        .where(
            TrainingSession.id == session_id,
            TrainingSession.status == "open",
            TrainingSession.starts_at >= datetime.now(timezone.utc)
        )
    ).mappings().one_or_none()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Занятие не найдено"
        )

    return dict(row)


@app.post(
    "/api/bookings",
    response_model=BookingResponse,
    status_code=201
)
def create_booking(
    data: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Бронировать могут только клиенты
    role_code = db.scalar(
        select(Role.code).where(
            Role.id == current_user.role_id
        )
    )

    if role_code != "client":
        raise HTTPException(
            status_code=403,
            detail="Бронирование доступно только клиентам"
        )

    # 2. Блокируем занятие на время бронирования
    # Это защищает от одновременной записи сверх лимита
    training = db.scalar(
        select(TrainingSession)
        .where(TrainingSession.id == data.session_id)
        .with_for_update()
    )

    if training is None:
        raise HTTPException(
            status_code=404,
            detail="Занятие не найдено"
        )

    # 3. Проверяем доступность занятия
    if (
        training.status != "open"
        or training.starts_at <= datetime.now(timezone.utc)
    ):
        raise HTTPException(
            status_code=409,
            detail="Запись на занятие недоступна"
        )

    # 4. Проверяем повторную запись клиента
    duplicate = db.scalar(
        select(Booking.id).where(
            Booking.client_id == current_user.id,
            Booking.session_id == training.id,
            Booking.status == "reserved",
        )
    )

    if duplicate is not None:
        raise HTTPException(
            status_code=409,
            detail="Вы уже записаны на это занятие"
        )

    # 5. Считаем занятые места
    occupied = db.scalar(
        select(func.count(Booking.id)).where(
            Booking.session_id == training.id,
            Booking.status == "reserved",
        )
    )

    if occupied >= training.capacity:
        raise HTTPException(
            status_code=409,
            detail="Свободных мест больше нет"
        )

    # 6. Получаем актуальную цену услуги
    service = db.get(Service, training.service_id)

    if service is None or not service.is_active:
        raise HTTPException(
            status_code=409,
            detail="Услуга недоступна"
        )

    # 7. Создаём бронирование
    booking = Booking(
        client_id=current_user.id,
        session_id=training.id,
        service_id=service.id,
        price_at_booking=service.price,
        currency_at_booking=service.currency_code,
        status="reserved",
        booked_at=datetime.now(timezone.utc),
        cancelled_at=None,
    )

    db.add(booking)

    try:
        db.commit()
        db.refresh(booking)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Не удалось создать бронирование"
        )

    return booking


# Получить бронирования текущего пользователя
@app.get(
    "/api/bookings/my",
    response_model=list[BookingResponse]
)
def get_my_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    bookings = db.scalars(
        select(Booking)
        .where(
            Booking.client_id == current_user.id
        )
        .order_by(Booking.booked_at.desc())
    ).all()

    return bookings


# Отмена бронирования текущим пользователем
@app.patch(
    "/api/bookings/{booking_id}/cancel",
    response_model=BookingResponse
)
def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Ищем бронирование только текущего клиента
    booking_ref = db.scalar(
        select(Booking).where(
            Booking.id == booking_id,
            Booking.client_id == current_user.id
        )
    )

    if booking_ref is None:
        raise HTTPException(
            status_code=404,
            detail="Бронирование не найдено"
        )

    # 2. Блокируем занятие, чтобы изменение числа
    # свободных мест согласовывалось с созданием записей
    training = db.scalar(
        select(TrainingSession)
        .where(TrainingSession.id == booking_ref.session_id)
        .with_for_update()
    )

    if training is None:
        raise HTTPException(
            status_code=404,
            detail="Занятие не найдено"
        )

    # 3. Повторно читаем бронирование под блокировкой
    booking = db.scalar(
        select(Booking)
        .where(
            Booking.id == booking_id,
            Booking.client_id == current_user.id
        )
        .with_for_update()
        .execution_options(populate_existing=True)
    )

    if booking is None:
        raise HTTPException(
            status_code=404,
            detail="Бронирование не найдено"
        )

    # 4. Проверяем, что запись ещё активна
    if booking.status != "reserved":
        raise HTTPException(
            status_code=409,
            detail="Бронирование уже нельзя отменить"
        )

    # 5. Отменять можно только до начала занятия
    if training.starts_at <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=409,
            detail="Занятие уже началось или завершилось"
        )

    # 6. Меняем статус и сохраняем время отмены
    booking.status = "cancelled"
    booking.cancelled_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(booking)

    return booking


# Проверяем, является ли пользователь администратором
def get_current_admin(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    role_code = db.scalar(
        select(Role.code).where(
            Role.id == current_user.role_id
        )
    )

    if role_code != "admin":
        raise HTTPException(
            status_code=403,
            detail="Доступ только для администратора"
        )

    return current_user


# Проверка доступа к административному API
@app.get("/api/admin/check")
def check_admin_access(
    admin: User = Depends(get_current_admin)
):
    return {
        "message": "Доступ администратора подтверждён",
        "admin_id": admin.id
    }


# Создание новой услуги администратором
@app.post(
    "/api/admin/services",
    response_model=ServiceResponse,
    status_code=201
)
def create_service(
    data: ServiceCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Проверяем, существует ли услуга с таким кодом
    existing_service = db.scalar(
        select(Service).where(
            Service.code == data.code
        )
    )

    if existing_service is not None:
        raise HTTPException(
            status_code=409,
            detail="Услуга с таким кодом уже существует"
        )

    # Создаём новую услугу
    service = Service(
        code=data.code,
        name=data.name,
        description=data.description,
        booking_type=data.booking_type,
        duration_minutes=data.duration_minutes,
        requires_staff=data.requires_staff,
        price=data.price,
        currency_code=data.currency_code,
        is_active=True
    )

    db.add(service)

    try:
        db.commit()
        db.refresh(service)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Не удалось создать услугу"
        )

    return service


# Изменение цены услуги администратором
@app.patch(
    "/api/admin/services/{service_id}/price",
    response_model=ServiceResponse
)
def update_service_price(
    service_id: int,
    data: ServicePriceUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # 1. Находим услугу
    service = db.get(Service, service_id)

    if service is None:
        raise HTTPException(
            status_code=404,
            detail="Услуга не найдена"
        )

    # 2. Устанавливаем новую цену
    service.price = data.price

    # 3. Сохраняем изменение в PostgreSQL
    try:
        db.commit()
        db.refresh(service)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Не удалось обновить цену услуги"
        )

    return service


# Включение и отключение услуги администратором
@app.patch(
    "/api/admin/services/{service_id}/status",
    response_model=ServiceResponse
)
def update_service_status(
    service_id: int,
    data: ServiceStatusUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # 1. Находим услугу в PostgreSQL
    service = db.get(Service, service_id)

    if service is None:
        raise HTTPException(
            status_code=404,
            detail="Услуга не найдена"
        )

    # 2. Меняем активность услуги
    service.is_active = data.is_active

    # 3. Сохраняем изменение
    try:
        db.commit()
        db.refresh(service)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Не удалось изменить статус услуги"
        )

    return service


# Получение списка всех залов администратором
@app.get(
    "/api/admin/rooms",
    response_model=list[RoomResponse]
)
def get_admin_rooms(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    rooms = db.scalars(
        select(Room).order_by(Room.id)
    ).all()

    return rooms


# Создание нового зала администратором
@app.post(
    "/api/admin/rooms",
    response_model=RoomResponse,
    status_code=201
)
def create_admin_room(
    data: RoomCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # 1. Проверяем, нет ли зала с таким кодом
    existing_room = db.scalar(
        select(Room).where(
            Room.code == data.code
        )
    )

    if existing_room is not None:
        raise HTTPException(
            status_code=409,
            detail="Зал с таким кодом уже существует"
        )

    # 2. Создаём новый зал
    room = Room(
        code=data.code,
        name=data.name,
        max_capacity=data.max_capacity,
        is_active=True
    )

    db.add(room)

    # 3. Сохраняем в PostgreSQL
    try:
        db.commit()
        db.refresh(room)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Не удалось создать зал"
        )

    return room


# Изменение вместимости зала администратором
@app.patch(
    "/api/admin/rooms/{room_id}/capacity",
    response_model=RoomResponse
)
def update_room_capacity(
    room_id: int,
    data: RoomCapacityUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # 1. Находим и блокируем зал
    room = db.scalar(
        select(Room)
        .where(Room.id == room_id)
        .with_for_update()
    )

    if room is None:
        raise HTTPException(
            status_code=404,
            detail="Зал не найден"
        )

    # 2. Проверяем предстоящие занятия
    conflicting_session = db.scalar(
        select(TrainingSession.id)
        .where(
            TrainingSession.room_id == room.id,
            TrainingSession.status.in_(
                ["draft", "open"]
            ),
            TrainingSession.ends_at > datetime.now(
                timezone.utc
            ),
            TrainingSession.capacity > data.max_capacity
        )
        .limit(1)
    )

    if conflicting_session is not None:
        raise HTTPException(
            status_code=409,
            detail=(
                "Нельзя уменьшить вместимость: "
                "есть занятия с большим количеством мест"
            )
        )

    # 3. Устанавливаем новую вместимость
    room.max_capacity = data.max_capacity

    # 4. Сохраняем изменения
    try:
        db.commit()
        db.refresh(room)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Не удалось изменить вместимость зала"
        )

    return room


# Изменение названия зала администратором
@app.patch(
    "/api/admin/rooms/{room_id}",
    response_model=RoomResponse
)
def update_room_name(
    room_id: int,
    data: RoomNameUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # 1. Ищем зал
    room = db.get(Room, room_id)

    if room is None:
        raise HTTPException(
            status_code=404,
            detail="Зал не найден"
        )

    # 2. Проверяем новое название
    new_name = data.name.strip()

    if not new_name:
        raise HTTPException(
            status_code=422,
            detail="Название зала не может быть пустым"
        )

    # 3. Изменяем название
    room.name = new_name

    # 4. Сохраняем в PostgreSQL
    try:
        db.commit()
        db.refresh(room)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Не удалось изменить название зала"
        )

    return room


# Включение и отключение зала администратором
@app.patch(
    "/api/admin/rooms/{room_id}/status",
    response_model=RoomResponse
)
def update_room_status(
    room_id: int,
    data: RoomStatusUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # 1. Находим и блокируем зал
    room = db.scalar(
        select(Room)
        .where(Room.id == room_id)
        .with_for_update()
    )

    if room is None:
        raise HTTPException(
            status_code=404,
            detail="Зал не найден"
        )

    # 2. Перед отключением проверяем будущие занятия
    if not data.is_active:
        future_session = db.scalar(
            select(TrainingSession.id)
            .where(
                TrainingSession.room_id == room.id,
                TrainingSession.status.in_(
                    ["draft", "open"]
                ),
                TrainingSession.ends_at
                > datetime.now(timezone.utc)
            )
            .limit(1)
        )

        if future_session is not None:
            raise HTTPException(
                status_code=409,
                detail=(
                    "Нельзя отключить зал: "
                    "в нём запланированы занятия"
                )
            )

    # 3. Изменяем статус зала
    room.is_active = data.is_active

    # 4. Сохраняем в PostgreSQL
    try:
        db.commit()
        db.refresh(room)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Не удалось изменить статус зала"
        )

    return room


# Удаление неиспользованного зала администратором
@app.delete(
    "/api/admin/rooms/{room_id}",
    status_code=204
)
def delete_admin_room(
    room_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # 1. Находим и блокируем зал
    room = db.scalar(
        select(Room)
        .where(Room.id == room_id)
        .with_for_update()
    )

    if room is None:
        raise HTTPException(
            status_code=404,
            detail="Зал не найден"
        )

    # 2. Проверяем, использовался ли зал в занятиях
    linked_session = db.scalar(
        select(TrainingSession.id)
        .where(TrainingSession.room_id == room_id)
        .limit(1)
    )

    if linked_session is not None:
        raise HTTPException(
            status_code=409,
            detail="Нельзя удалить зал: к нему привязаны занятия"
        )

    # 3. Удаляем зал
    db.delete(room)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Нельзя удалить зал: к нему привязаны занятия"
        )

    return None



# Изменение названия и описания услуги администратором
@app.patch(
    "/api/admin/services/{service_id}",
    response_model=ServiceResponse
)
def update_admin_service_details(
    service_id: int,
    data: ServiceDetailsUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # 1. Находим услугу
    service = db.get(Service, service_id)

    if service is None:
        raise HTTPException(
            status_code=404,
            detail="Услуга не найдена"
        )

    # 2. Проверяем название
    new_name = data.name.strip()

    if not new_name:
        raise HTTPException(
            status_code=422,
            detail="Название услуги не может быть пустым"
        )

    # 3. Обновляем название и описание
    service.name = new_name
    service.description = (
        data.description.strip()
        if data.description is not None
        else None
    )

    # 4. Сохраняем изменения
    try:
        db.commit()
        db.refresh(service)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Не удалось обновить услугу"
        )

    return service


# Просмотр всех услуг администратором
@app.get(
    "/api/admin/services",
    response_model=list[ServiceResponse]
)
def get_admin_services(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    services = db.scalars(
        select(Service).order_by(Service.id)
    ).all()

    return services


# Безопасное удаление услуги администратором
@app.delete(
    "/api/admin/services/{service_id}",
    status_code=204
)
def delete_admin_service(
    service_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # 1. Находим и блокируем услугу
    service = db.scalar(
        select(Service)
        .where(Service.id == service_id)
        .with_for_update()
    )

    if service is None:
        raise HTTPException(
            status_code=404,
            detail="Услуга не найдена"
        )

    # 2. Проверяем связи с другими таблицами
    has_links = db.scalar(
        text("""
            SELECT
                EXISTS (
                    SELECT 1 FROM sessions
                    WHERE service_id = :service_id
                )
                OR EXISTS (
                    SELECT 1 FROM bookings
                    WHERE service_id = :service_id
                )
                OR EXISTS (
                    SELECT 1 FROM staff_services
                    WHERE service_id = :service_id
                )
        """),
        {"service_id": service_id}
    )

    if has_links:
        raise HTTPException(
            status_code=409,
            detail=(
                "Нельзя удалить услугу: "
                "она связана с занятиями, "
                "бронированиями или сотрудниками"
            )
        )

    # 3. Удаляем неиспользованную услугу
    db.delete(service)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Нельзя удалить услугу: имеются связанные записи"
        )
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Не удалось удалить услугу"
        )

    return None
