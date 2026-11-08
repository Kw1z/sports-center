
import csv
import os
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from database import engine
from models import Role, User
from security import hash_password


# Папки и файлы проекта
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BACKEND_DIR.parent
CSV_FILE = PROJECT_DIR / "database" / "demo_clients.csv"

# Загружаем локальные настройки
load_dotenv(BACKEND_DIR / ".env")

demo_password = os.getenv("DEMO_CLIENT_PASSWORD")

if not demo_password or len(demo_password) < 12:
    raise SystemExit(
        "Укажи DEMO_CLIENT_PASSWORD длиной от 12 символов "
        "в backend/.env"
    )

if not CSV_FILE.is_file():
    raise SystemExit("Не найден файл database/demo_clients.csv")


created = 0
skipped = 0

with Session(engine) as db:
    client_role = db.scalar(
        select(Role).where(Role.code == "client")
    )

    if client_role is None:
        raise SystemExit("В базе отсутствует роль client")

    with CSV_FILE.open(
        "r", encoding="utf-8-sig", newline=""
    ) as file:
        reader = csv.DictReader(file)

        for row in reader:
            name = row["full_name"].strip()
            email = row["email"].strip().lower()

            if not name or not email:
                raise ValueError("В CSV есть пустое имя или email")

            existing_user = db.scalar(
                select(User).where(
                    func.lower(User.email) == email
                )
            )

            if existing_user is not None:
                skipped += 1
                continue

            user = User(
                role_id=client_role.id,
                full_name=name,
                email=email,
                password_hash=hash_password(demo_password),
                phone=None,
                is_active=True,
                created_at=datetime.now(timezone.utc).replace(
                    tzinfo=None
                ),
            )

            db.add(user)
            db.flush()
            created += 1

    db.commit()

print(f"Создано клиентов: {created}")
print(f"Уже существовали: {skipped}")
print("Готово!")
