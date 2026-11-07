from decimal import Decimal
from pydantic import BaseModel, EmailStr, Field, ConfigDict, AwareDatetime
from datetime import datetime
from typing import Literal


class UserRegister(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    phone: str | None = Field(default=None, max_length=20)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    phone: str | None
    is_active: bool


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"



class ServiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    description: str | None
    booking_type: str
    duration_minutes: int
    requires_staff: bool
    price: Decimal
    currency_code: str
    is_active: bool



class SessionResponse(BaseModel):
    id: int
    service_id: int
    service_name: str
    room_id: int
    room_name: str
    staff_id: int | None
    staff_name: str | None
    starts_at: datetime
    ends_at: datetime
    capacity: int
    status: str


class BookingCreate(BaseModel):
    session_id: int = Field(gt=0)



class BookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    client_id: int
    session_id: int
    service_id: int
    price_at_booking: Decimal
    currency_at_booking: str
    status: str
    booked_at: datetime
    cancelled_at: datetime | None = None


class ServiceCreate(BaseModel):
    code: str = Field(
        min_length=1,
        max_length=40,
        pattern=r"^[a-z0-9_]+$"
    )
    name: str = Field(
        min_length=1,
        max_length=100
    )
    description: str | None = None
    booking_type: Literal["group", "individual"]
    duration_minutes: int = Field(ge=5, le=480)
    requires_staff: bool
    price: Decimal = Field(
        ge=0,
        max_digits=10,
        decimal_places=2
    )
    currency_code: str = Field(
        pattern=r"^[A-Z]{3}$"
    )


# Данные для изменения цены услуги
class ServicePriceUpdate(BaseModel):
    price: Decimal = Field(
        ge=0,
        max_digits=10,
        decimal_places=2
    )



# Изменение названия и описания услуги
class ServiceDetailsUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None


# Включение и отключение услуги
class ServiceStatusUpdate(BaseModel):
    is_active: bool


# Информация о зале спортивного центра
class RoomResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    max_capacity: int
    is_active: bool


# Данные для создания нового зала
class RoomCreate(BaseModel):
    code: str = Field(
        min_length=1,
        max_length=20,
        pattern=r"^[a-z0-9_]+$"
    )

    name: str = Field(
        min_length=1,
        max_length=80
    )

    max_capacity: int = Field(
        ge=1,
        le=1000
    )


# Данные для изменения вместимости зала
class RoomCapacityUpdate(BaseModel):
    max_capacity: int = Field(
        ge=1,
        le=1000
    )


# Изменение названия зала
class RoomNameUpdate(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=80
    )


# Включение и отключение зала
class RoomStatusUpdate(BaseModel):
    is_active: bool


# Данные сотрудника для административного API
class StaffResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int | None
    display_name: str
    position: str
    is_active: bool


# Данные для создания нового сотрудника
class StaffCreate(BaseModel):
    display_name: str = Field(
        min_length=1,
        max_length=100
    )
    position: str = Field(
        min_length=1,
        max_length=100
    )


# Изменение имени и должности сотрудника
class StaffUpdate(BaseModel):
    display_name: str = Field(
        min_length=1,
        max_length=100
    )
    position: str = Field(
        min_length=1,
        max_length=100
    )


# Назначение услуги сотруднику
class StaffServiceAssign(BaseModel):
    service_id: int = Field(gt=0)


# Изменение активности сотрудника
class StaffStatusUpdate(BaseModel):
    is_active: bool


# Создание занятия администратором
class AdminSessionCreate(BaseModel):
    service_id: int = Field(gt=0)
    room_id: int = Field(gt=0)
    staff_id: int | None = Field(default=None, gt=0)

    starts_at: AwareDatetime
    ends_at: AwareDatetime

    capacity: int = Field(ge=1, le=1000)

    status: Literal["draft", "open"] = "draft"


# Редактирование занятия администратором
class AdminSessionUpdate(BaseModel):
    room_id: int | None = Field(default=None, gt=0)
    staff_id: int | None = Field(default=None, gt=0)

    starts_at: AwareDatetime | None = None
    ends_at: AwareDatetime | None = None

    capacity: int | None = Field(
        default=None,
        ge=1,
        le=1000
    )


# Изменение статуса занятия администратором
class AdminSessionStatusUpdate(BaseModel):
    status: Literal["draft", "open", "cancelled"]


# Данные пользователя для администратора
class AdminUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role_id: int
    full_name: str
    email: str
    phone: str | None
    is_active: bool
    created_at: datetime


# Изменение активности пользователя администратором
class AdminUserStatusUpdate(BaseModel):
    is_active: bool


# Основные показатели административной панели
class AdminDashboardResponse(BaseModel):
    total_users: int
    active_users: int

    total_staff: int
    active_staff: int

    total_sessions: int
    open_sessions: int

    total_bookings: int
    reserved_bookings: int
    cancelled_bookings: int
