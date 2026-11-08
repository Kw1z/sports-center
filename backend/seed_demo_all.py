
from pathlib import Path
import subprocess
import sys

from sqlalchemy import inspect

from database import engine


BACKEND_DIR = Path(__file__).resolve().parent

REQUIRED_TABLES = {
    "roles",
    "users",
    "services",
    "rooms",
    "staff",
    "staff_services",
    "sessions",
    "bookings",
}

SCRIPTS = [
    "seed_demo_clients.py",
    "seed_demo_accounts.py",
    "seed_demo_bookings.py",
]


def main():
    print("=== Заполнение демонстрационной базы BluePulse ===")

    # Показываем подключение, но скрываем пароль.
    database_url = engine.url.render_as_string(
        hide_password=True
    )

    print(f"База данных: {database_url}")

    # Проверяем, что таблицы уже созданы через Docker.
    existing_tables = set(inspect(engine).get_table_names())
    missing_tables = REQUIRED_TABLES - existing_tables

    if missing_tables:
        print("Ошибка: отсутствуют таблицы:")
        for table in sorted(missing_tables):
            print(f"  - {table}")
        sys.exit(1)

    # Защита от случайного запуска не в той базе.
    confirmation = input(
        "Введите YES, чтобы заполнить указанную базу: "
    )

    if confirmation != "YES":
        print("Отменено. Данные не изменены.")
        return

    # Запускаем существующие скрипты по очереди.
    for script_name in SCRIPTS:
        print(f"\nЗапускаем {script_name}...", flush=True)

        subprocess.run(
            [sys.executable, str(BACKEND_DIR / script_name)],
            cwd=BACKEND_DIR,
            check=True,
        )

    print("\nДемонстрационная база BluePulse готова!")


if __name__ == "__main__":
    main()
