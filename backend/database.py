
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import URL

# Загружаем настройки из файла .env
load_dotenv(Path(__file__).resolve().parent / ".env")

# Создаём адрес подключения к PostgreSQL
database_url = URL.create(
    drivername="postgresql+psycopg",
    username=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST", "127.0.0.1"),
    port=int(os.getenv("DB_PORT", "5432")),
    database=os.getenv("DB_NAME", "sports_center"),
)

# Создаём подключение через SQLAlchemy
engine = create_engine(
    database_url,
    pool_pre_ping=True,
)
