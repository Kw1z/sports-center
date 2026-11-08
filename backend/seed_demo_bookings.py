
import csv
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.orm import Session as DbSession

from database import engine
from models import (
    Booking,
    Role,
    Service,
    Session as TrainingSession,
    User,
)


# Берём клиентов из общего CSV-файла
PROJECT_DIR = Path(__file__).resolve().parent.parent
CSV_FILE = PROJECT_DIR / "database" / "demo_clients.csv"

with CSV_FILE.open("r", encoding="utf-8-sig", newline="") as file:
    rows = list(csv.DictReader(file))

emails = [
    row["email"].strip().lower()
    for row in rows
]

if not emails or len(emails) != len(set(emails)):
    raise SystemExit("Проверь список клиентов в CSV")


# Направления для распределения бронирований
service_order = [
    "yoga",
    "pilates",
    "cycling",
    "stretching",
    "massage",
    "diagnostics",
]

created = 0
now = datetime.now(timezone.utc)

with DbSession(engine) as db:
    # Находим только активных демонстрационных клиентов
    clients = db.scalars(
        select(User)
        .join(Role)
        .where(
            func.lower(User.email).in_(emails),
            Role.code == "client",
            User.is_active.is_(True),
        )
    ).all()

    clients_by_email = {
        user.email.lower(): user
        for user in clients
    }

    missing = [
        email for email in emails
        if email not in clients_by_email
    ]

    if missing:
        raise SystemExit(
            f"Не найдены активные клиенты: {missing}"
        )

    # Получаем будущие занятия и их услуги
    sessions = db.execute(
        select(TrainingSession, Service)
        .join(
            Service,
            TrainingSession.service_id == Service.id,
        )
        .where(
            TrainingSession.status == "open",
            TrainingSession.starts_at > now,
            Service.is_active.is_(True),
        )
        .order_by(TrainingSession.starts_at, TrainingSession.id)
    ).all()

    # Группируем занятия по дням
    sessions_by_day = defaultdict(list)

    for session, service in sessions:
        sessions_by_day[session.starts_at.date()].append(
            (session, service)
        )

    days = sorted(sessions_by_day)

    if len(days) < 6:
        raise SystemExit(
            "Для демонстрации нужно минимум 6 дней расписания"
        )

    # Считаем уже занятые места
    occupied = dict(
        db.execute(
            select(
                Booking.session_id,
                func.count(Booking.id),
            )
            .where(Booking.status != "cancelled")
            .group_by(Booking.session_id)
        ).all()
    )

    # Проверяем существующие бронирования клиентов
    booked_days = defaultdict(set)

    existing = db.execute(
        select(
            Booking.client_id,
            TrainingSession.starts_at,
        )
        .join(
            TrainingSession,
            Booking.session_id == TrainingSession.id,
        )
        .where(
            Booking.client_id.in_(
                [user.id for user in clients]
            )
        )
    ).all()

    for client_id, starts_at in existing:
        booked_days[client_id].add(starts_at.date())

    # Создаём до 6 записей каждому клиенту
    for client_index, email in enumerate(emails):
        client = clients_by_email[email]

        for booking_index in range(6):
            day = days[
                (client_index + booking_index) % len(days)
            ]

            # Не создаём повторную запись в тот же день
            if day in booked_days[client.id]:
                continue

            preferred = (
                client_index + booking_index
            ) % len(service_order)

            # Чередуем направления
            candidates = sorted(
                sessions_by_day[day],
                key=lambda item: (
                    (
                        service_order.index(item[1].code)
                        - preferred
                    ) % len(service_order),
                    item[0].starts_at,
                    item[0].id,
                ),
            )

            for session, service in candidates:
                # Не превышаем вместимость
                if occupied.get(session.id, 0) >= session.capacity:
                    continue

                booking = Booking(
                    client_id=client.id,
                    session_id=session.id,
                    service_id=service.id,
                    price_at_booking=service.price,
                    currency_at_booking=service.currency_code,
                    status="reserved",
                    booked_at=now,
                    cancelled_at=None,
                )

                db.add(booking)
                db.flush()

                occupied[session.id] = (
                    occupied.get(session.id, 0) + 1
                )

                booked_days[client.id].add(day)
                created += 1
                break

    db.commit()

print(f"Создано бронирований: {created}")
print("Готово!")
