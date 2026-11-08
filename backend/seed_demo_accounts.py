
import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from pathlib import Path
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from database import engine
from models import Role, Staff, User
from security import hash_password


BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / ".env")

ADMIN_PASSWORD = os.getenv("DEMO_ADMIN_PASSWORD")
STAFF_PASSWORD = os.getenv("DEMO_STAFF_PASSWORD")

if not ADMIN_PASSWORD or len(ADMIN_PASSWORD) < 12:
    raise SystemExit(
        "Укажи DEMO_ADMIN_PASSWORD в backend/.env"
    )

if not STAFF_PASSWORD or len(STAFF_PASSWORD) < 12:
    raise SystemExit(
        "Укажи DEMO_STAFF_PASSWORD в backend/.env"
    )


# Коды тренеров и email демонстрационных аккаунтов
STAFF_ACCOUNTS = [
    ("anna_smirnova", "bluepulse.staff.anna.test2026@example.com"),
    ("maxim_volkov", "demo.staff.maxim@example.com"),
    ("ekaterina_orlova", "demo.staff.ekaterina@example.com"),
    ("dmitry_kuznetsov", "demo.staff.dmitry@example.com"),
    ("maria_sokolova", "demo.staff.maria@example.com"),
    ("olga_petrova", "demo.staff.olga@example.com"),
]


created = 0
linked = 0

with Session(engine) as db:
    admin_role = db.scalar(
        select(Role).where(Role.code == "admin")
    )
    staff_role = db.scalar(
        select(Role).where(Role.code == "staff")
    )

    if admin_role is None or staff_role is None:
        raise SystemExit("Не найдены роли admin или staff")

    def get_or_create_user(email, name, role, password):
        global created

        user = db.scalar(
            select(User).where(
                func.lower(User.email) == email.lower()
            )
        )

        if user is not None:
            if user.role_id != role.id:
                raise RuntimeError(
                    f"Неверная роль у пользователя {email}"
                )
            return user

        user = User(
            role_id=role.id,
            full_name=name,
            email=email,
            password_hash=hash_password(password),
            phone=None,
            is_active=True,
            created_at=datetime.now(timezone.utc).replace(
                tzinfo=None
            ),
        )

        db.add(user)
        db.flush()
        created += 1

        return user

    # Администратор
    get_or_create_user(
        "bluepulse.admin.test2026@example.com",
        "Администратор BluePulse",
        admin_role,
        ADMIN_PASSWORD,
    )

    # Учётные записи шести сотрудников
    for staff_code, email in STAFF_ACCOUNTS:
        employee = db.scalar(
            select(Staff).where(Staff.code == staff_code)
        )

        if employee is None:
            raise RuntimeError(
                f"Тренер {staff_code} не найден"
            )

        # Сохраняем существующую привязку
        if employee.user_id is not None:
            existing = db.get(User, employee.user_id)

            if existing is None or existing.role_id != staff_role.id:
                raise RuntimeError(
                    f"Неверная учётная запись у {staff_code}"
                )

            continue

        user = get_or_create_user(
            email,
            employee.display_name,
            staff_role,
            STAFF_PASSWORD,
        )

        other_staff = db.scalar(
            select(Staff).where(Staff.user_id == user.id)
        )

        if other_staff is not None:
            raise RuntimeError(
                f"Учётная запись {email} уже занята"
            )

        employee.user_id = user.id
        linked += 1

    db.commit()

print(f"Создано учётных записей: {created}")
print(f"Привязано сотрудников: {linked}")
print("Готово!")
