
import csv
from collections import defaultdict
from datetime import datetime, timezone
from math import gcd
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


# Файл с 20 демонстрационными клиентами
PROJECT_DIR = Path(__file__).resolve().parent.parent
CSV_FILE = PROJECT_DIR / "database" / "demo_clients.csv"

with CSV_FILE.open(
    "r",
    encoding="utf-8-sig",
    newline=""
) as file:
    rows = list(csv.DictReader(file))

emails = [
    row["email"].strip().lower()
    for row in rows
]

if not emails or len(emails) != len(set(emails)):
    raise SystemExit("Проверь список клиентов в CSV")


# Направления тренировок
service_order = [
    "yoga",
    "pilates",
    "cycling",
    "stretching",
    "massage",
    "diagnostics",
]


# До 6 бронирований на клиента в каждом месяце
DEMO_MONTHS = [
    (2026, 11),
    (2026, 12),
]

MAX_BOOKINGS_PER_MONTH = 6

now = datetime.now(timezone.utc)

created_by_month = defaultdict(int)


with DbSession(engine) as db:

    # 1. Получаем демонстрационных клиентов
    clients = db.scalars(
        select(User)
        .join(Role)
        .where(
            func.lower(User.email).in_(emails),
            Role.code == "client",
            User.is_active.is_(True)
        )
    ).all()

    clients_by_email = {
        user.email.lower(): user
        for user in clients
    }

    missing = [
        email
        for email in emails
        if email not in clients_by_email
    ]

    if missing:
        raise SystemExit(
            f"Не найдены демонстрационные клиенты: {missing}"
        )

    # 2. Получаем будущие занятия
    sessions = db.execute(
        select(TrainingSession, Service)
        .join(
            Service,
            TrainingSession.service_id == Service.id
        )
        .where(
            TrainingSession.status == "open",
            TrainingSession.starts_at > now,
            Service.is_active.is_(True)
        )
        .order_by(
            TrainingSession.starts_at,
            TrainingSession.id
        )
    ).all()

    # Распределяем занятия по месяцам и дням
    sessions_by_month = defaultdict(
        lambda: defaultdict(list)
    )

    for session, service in sessions:
        month = (
            session.starts_at.year,
            session.starts_at.month
        )

        day = session.starts_at.date()

        sessions_by_month[month][day].append(
            (session, service)
        )

    # 3. Считаем занятые места
    occupied = dict(
        db.execute(
            select(
                Booking.session_id,
                func.count(Booking.id)
            )
            .where(Booking.status != "cancelled")
            .group_by(Booking.session_id)
        ).all()
    )

    # 4. Получаем существующие бронирования клиентов
    booked_days = defaultdict(set)
    booking_counts = defaultdict(int)

    client_ids = [
        client.id
        for client in clients
    ]

    existing_bookings = db.execute(
        select(
            Booking.client_id,
            TrainingSession.starts_at
        )
        .join(
            TrainingSession,
            Booking.session_id == TrainingSession.id
        )
        .where(
            Booking.client_id.in_(client_ids),
            Booking.status != "cancelled"
        )
    ).all()

    for client_id, starts_at in existing_bookings:

        month = (
            starts_at.year,
            starts_at.month
        )

        booking_counts[(client_id, month)] += 1

        booked_days[client_id].add(
            starts_at.date()
        )

    # 5. Заполняем ноябрь и декабрь отдельно
    for month in DEMO_MONTHS:

        days_to_sessions = sessions_by_month[month]
        days = sorted(days_to_sessions)

        if not days:
            print(
                f"Нет будущих занятий за "
                f"{month[1]:02d}.{month[0]}"
            )
            continue

        # Подбираем шаг для распределения по месяцу
        step = max(
            1,
            len(days) // MAX_BOOKINGS_PER_MONTH
        )

        while gcd(step, len(days)) != 1:
            step += 1

        for client_index, email in enumerate(emails):

            client = clients_by_email[email]

            count_key = (client.id, month)

            # Не добавляем лишние бронирования
            if (
                booking_counts[count_key]
                >= MAX_BOOKINGS_PER_MONTH
            ):
                continue

            for booking_index in range(
                MAX_BOOKINGS_PER_MONTH
            ):

                if (
                    booking_counts[count_key]
                    >= MAX_BOOKINGS_PER_MONTH
                ):
                    break

                # Разные даты для разных клиентов
                day_index = (
                    client_index * 3
                    + booking_index * step
                ) % len(days)

                day = days[day_index]

                # Одна демонстрационная запись в день
                if day in booked_days[client.id]:
                    continue

                # Чередуем виды тренировок
                preferred = (
                    client_index + booking_index
                ) % len(service_order)

                def priority(item):
                    session, service = item

                    if service.code in service_order:
                        service_index = (
                            service_order.index(service.code)
                        )
                    else:
                        service_index = len(service_order)

                    return (
                        (service_index - preferred)
                        % len(service_order),
                        session.starts_at,
                        session.id
                    )

                candidates = sorted(
                    days_to_sessions[day],
                    key=priority
                )

                for session, service in candidates:

                    # Проверяем свободные места
                    if (
                        occupied.get(session.id, 0)
                        >= session.capacity
                    ):
                        continue

                    # Создаём бронирование
                    booking = Booking(
                        client_id=client.id,
                        session_id=session.id,
                        service_id=service.id,
                        price_at_booking=service.price,
                        currency_at_booking=service.currency_code,
                        status="reserved",
                        booked_at=now,
                        cancelled_at=None
                    )

                    db.add(booking)
                    db.flush()

                    # Обновляем счётчики
                    occupied[session.id] = (
                        occupied.get(session.id, 0) + 1
                    )

                    booked_days[client.id].add(day)

                    booking_counts[count_key] += 1

                    created_by_month[month] += 1

                    break

    # 6. Сохраняем все новые бронирования
    db.commit()


print(
    "Создано ноябрьских бронирований:",
    created_by_month[(2026, 11)]
)

print(
    "Создано декабрьских бронирований:",
    created_by_month[(2026, 12)]
)

print("Готово!")
