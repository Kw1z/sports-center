from decimal import Decimal
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime


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

