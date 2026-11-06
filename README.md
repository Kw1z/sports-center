# sports-center
Web application for online booking in a sports center

## Локальный запуск BluePulse (Windows)

Для запуска проекта понадобятся:

- Git
- Docker Desktop
- Python 3.14
- Node.js и npm (для Frontend)

Все компоненты можно использовать бесплатно для учебного проекта.

### 1. Запуск PostgreSQL

Откройте терминал CMD в корневой папке проекта.

Создайте файл `.env` из примера:

```bat
copy .env.example .env
```

Откройте созданный `.env` и замените значение
`POSTGRES_PASSWORD` на собственный пароль.

Не отправляйте файл `.env` в GitHub.

Запустите PostgreSQL:

```bat
docker compose up -d db
```

Docker автоматически создаст базу `sports_center`,
таблицы и тестовые данные при первом запуске
с пустым хранилищем.

Проверьте состояние контейнера:

```bat
docker compose ps
```

PostgreSQL должна иметь статус `healthy`.

По умолчанию база доступна на:

- Хост: `127.0.0.1`
- Порт: `5432`
- База: `sports_center`
- Пользователь: `sport_app`

Пароль — тот, который указан в корневом `.env`.


### 2. Запуск Backend (FastAPI)

Откройте новое окно CMD в корневой папке проекта.

Перейдите в папку Backend:

```bat
cd backend
```

Создайте виртуальное окружение Python 3.14:

```bat
py -3.14 -m venv .venv
```

Установите зависимости:

```bat
.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Создайте файл настроек Backend:

```bat
copy .env.example .env
```

Откройте файл `backend/.env` и настройте:

- `DB_HOST=127.0.0.1`
- `DB_PORT=5432`
- `DB_NAME=sports_center`
- `DB_USER=sport_app`
- `DB_PASSWORD` — такой же пароль, как `POSTGRES_PASSWORD`
  в корневом `.env`.
- `JWT_SECRET_KEY` — собственная случайная секретная строка
  длиной не менее 32 символов.

Не загружайте `.env` в GitHub.

Запустите FastAPI:

```bat
.venv\Scripts\python.exe -m uvicorn main:app --reload
```

После запуска Backend будет доступен по адресам:

- API: http://127.0.0.1:8000
- Swagger: http://127.0.0.1:8000/docs

Не закрывайте терминал, пока используете Backend.


### 3. Запуск Frontend (React)

Откройте третье окно CMD в корневой папке проекта.

Перейдите в папку Frontend:

```bat
cd frontend
```

Установите зависимости:

```bat
npm install
```

Запустите React:

```bat
npm run dev
```

Откройте сайт:

http://localhost:5173

Перед запуском убедитесь, что:
- PostgreSQL запущена через Docker.
- FastAPI запущен на http://127.0.0.1:8000.
- React запущен на http://localhost:5173.

Документация API:
http://127.0.0.1:8000/docs
