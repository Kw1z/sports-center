
from sqlalchemy import select, inspect
from sqlalchemy.orm import Session

from database import engine
from models import Role

with Session(engine) as db:
    roles = db.scalars(select(Role)).all()

    print("Роли в базе данных:")

    for role in roles:
        print(f"ID: {role.id}, код: {role.code}")

inspector = inspect(engine)
columns = inspector.get_columns("users")

for column in columns:
    if column["name"] == "id":
        print(
            "Генерация users.id:",
            "identity =", column.get("identity"),
            "default =", column.get("default")
        )
