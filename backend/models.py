
from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
)
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column,
    relationship,
)


# Общий базовый класс для всех моделей
class Base(DeclarativeBase):
    pass


# 1. Роли пользователей
class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(
        SmallInteger, primary_key=True
    )
    code: Mapped[str] = mapped_column(String(16))

    users: Mapped[list[User]] = relationship(
        back_populates="role"
    )


# 2. Пользователи
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True
    )
    role_id: Mapped[int] = mapped_column(
        SmallInteger, ForeignKey("roles.id")
    )
    full_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(254))
    password_hash: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False)
    )

    role: Mapped[Role] = relationship(
        back_populates="users"
    )
    staff_records: Mapped[list[Staff]] = relationship(
        back_populates="user"
    )
    bookings: Mapped[list[Booking]] = relationship(
        back_populates="client"
    )


# 3. Сотрудники
class Staff(Base):
    __tablename__ = "staff"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True
    )
    user_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("users.id"),
        nullable=True,
    )
    display_name: Mapped[str] = mapped_column(String(120))
    position: Mapped[str] = mapped_column(String(60))
    is_active: Mapped[bool] = mapped_column(Boolean)

    user: Mapped[User | None] = relationship(
        back_populates="staff_records"
    )
    service_links: Mapped[list[StaffService]] = relationship(
        back_populates="staff"
    )


# 4. Услуги и цены
class Service(Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True
    )
    code: Mapped[str] = mapped_column(String(40))
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    booking_type: Mapped[str] = mapped_column(String(12))
    duration_minutes: Mapped[int] = mapped_column(SmallInteger)
    requires_staff: Mapped[bool] = mapped_column(Boolean)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    currency_code: Mapped[str] = mapped_column(String(3))
    is_active: Mapped[bool] = mapped_column(Boolean)

    staff_links: Mapped[list[StaffService]] = relationship(
        back_populates="service"
    )
    sessions: Mapped[list[Session]] = relationship(
        back_populates="service"
    )


# 5. Связи сотрудников с услугами
class StaffService(Base):
    __tablename__ = "staff_services"

    staff_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("staff.id"),
        primary_key=True,
    )
    service_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("services.id"),
        primary_key=True,
    )

    staff: Mapped[Staff] = relationship(
        back_populates="service_links"
    )
    service: Mapped[Service] = relationship(
        back_populates="staff_links"
    )
    sessions: Mapped[list[Session]] = relationship(
        back_populates="staff_service",
        viewonly=True,
    )


# 6. Помещения
class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True
    )
    code: Mapped[str] = mapped_column(String(20))
    name: Mapped[str] = mapped_column(String(80))
    max_capacity: Mapped[int] = mapped_column(SmallInteger)
    is_active: Mapped[bool] = mapped_column(Boolean)

    sessions: Mapped[list[Session]] = relationship(
        back_populates="room"
    )


# 7. Сеансы
class Session(Base):
    __tablename__ = "sessions"

    __table_args__ = (
        ForeignKeyConstraint(
            ["staff_id", "service_id"],
            ["staff_services.staff_id", "staff_services.service_id"],
        ),
    )

    id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True
    )
    service_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("services.id")
    )
    room_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("rooms.id")
    )
    staff_id: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )
    
    starts_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True)
    )
    ends_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True)
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True)
    )

    capacity: Mapped[int] = mapped_column(SmallInteger)
    status: Mapped[str] = mapped_column(String(12))
    

    service: Mapped[Service] = relationship(
        back_populates="sessions",
        foreign_keys=[service_id],
    )
    room: Mapped[Room] = relationship(
        back_populates="sessions"
    )
    staff_service: Mapped[StaffService | None] = relationship(
        back_populates="sessions",
        foreign_keys=[staff_id, service_id],
        viewonly=True,
    )
    bookings: Mapped[list[Booking]] = relationship(
        back_populates="session"
    )


# 8. Бронирования
class Booking(Base):
    __tablename__ = "bookings"

    __table_args__ = (
        ForeignKeyConstraint(
            ["session_id", "service_id"],
            ["sessions.id", "sessions.service_id"],
        ),
    )

    id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True
    )
    client_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id")
    )
    session_id: Mapped[int] = mapped_column(BigInteger)
    service_id: Mapped[int] = mapped_column(Integer)
    price_at_booking: Mapped[Decimal] = mapped_column(
        Numeric(10, 2)
    )
    currency_at_booking: Mapped[str] = mapped_column(String(3))
    status: Mapped[str] = mapped_column(String(12))
    
    booked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True)
    )

    cancelled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )


    client: Mapped[User] = relationship(
        back_populates="bookings"
    )
    session: Mapped[Session] = relationship(
        back_populates="bookings"
    )
