
from sqlalchemy import inspect
from database import engine

# Получаем структуру базы данных
inspector = inspect(engine)

# Получаем список таблиц
tables = inspector.get_table_names(schema="public")

print(f"Найдено таблиц: {len(tables)}")

for table_name in tables:
    print(f"\n=== {table_name} ===")

    # Показываем все поля таблицы
    columns = inspector.get_columns(
        table_name,
        schema="public"
    )

    for column in columns:
        print(
            f"Поле: {column['name']} | "
            f"Тип: {column['type']} | "
            f"NULL: {column['nullable']}"
        )

    # Показываем внешние ключи
    foreign_keys = inspector.get_foreign_keys(
        table_name,
        schema="public"
    )

    for fk in foreign_keys:
        source = ", ".join(fk["constrained_columns"])
        target = ", ".join(fk["referred_columns"])

        print(
            f"Связь: {source} -> "
            f"{fk['referred_table']}({target})"
        )
