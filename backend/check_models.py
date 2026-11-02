
from sqlalchemy import inspect, select, func
from sqlalchemy.orm import Session as DbSession, configure_mappers

from database import engine
from models import Base, Service

# Проверяем связи между моделями
configure_mappers()

inspector = inspect(engine)

db_tables = set(
    inspector.get_table_names(schema="public")
)
model_tables = set(Base.metadata.tables.keys())

if db_tables != model_tables:
    raise RuntimeError(
        f"Таблицы не совпадают: {db_tables ^ model_tables}"
    )

for table_name, model_table in Base.metadata.tables.items():
    db_columns = {
        col["name"]
        for col in inspector.get_columns(
            table_name, schema="public"
        )
    }
    model_columns = set(model_table.columns.keys())

    if db_columns != model_columns:
        raise RuntimeError(
            f"Поля не совпадают в {table_name}"
        )

    # Проверяем первичные ключи
    db_pk = set(
        inspector.get_pk_constraint(
            table_name, schema="public"
        )["constrained_columns"]
    )
    model_pk = {
        col.name for col in model_table.primary_key
    }

    if db_pk != model_pk:
        raise RuntimeError(
            f"Первичные ключи не совпадают в {table_name}"
        )

    print(f"OK: {table_name}")

# Проверяем чтение данных
with DbSession(engine) as db:
    count = db.scalar(
        select(func.count()).select_from(Service)
    )

print(f"\nУслуг в базе: {count}")
print("Проверка моделей завершена!")
