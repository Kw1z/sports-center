# BluePulse

Веб-приложение спортивного центра: тренеры, расписание, запись на занятия и личные кабинеты.

**Стек:** React + TypeScript, FastAPI + SQLAlchemy, PostgreSQL 17 (Docker).

> Все команды ниже — для **Windows PowerShell**. Выполняйте их из корня проекта, если не указано иное.

## 1. Что нужно

- [GitHub-репозиторий](https://github.com/Kw1z/sports-center) и SourceTree
- Docker Desktop
- Python 3.14
- Node.js + npm

## 2. Первый запуск

**1.** Скачайте ветку `main` через SourceTree и откройте папку проекта в PowerShell.

**2.** Создайте настройки (если файлов ещё нет):

```powershell
if (!(Test-Path .env)) { Copy-Item .env.example .env }
if (!(Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
```

Заполните файлы своими значениями:

**`.env`** — настройки Docker:

```dotenv
POSTGRES_USER=sport_app
POSTGRES_PASSWORD=ВАШ_ПАРОЛЬ_БАЗЫ
POSTGRES_DB=sports_center
```

**`backend/.env`** — настройки приложения:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=sports_center
DB_USER=sport_app
DB_PASSWORD=ВАШ_ПАРОЛЬ_БАЗЫ
JWT_SECRET_KEY=ВАШ_СЛУЧАЙНЫЙ_СЕКРЕТ
DEMO_CLIENT_PASSWORD=ВАШ_ТЕСТОВЫЙ_ПАРОЛЬ
DEMO_ADMIN_PASSWORD=ВАШ_ТЕСТОВЫЙ_ПАРОЛЬ
DEMO_STAFF_PASSWORD=ВАШ_ТЕСТОВЫЙ_ПАРОЛЬ
```

`DB_PASSWORD` должен совпадать с `POSTGRES_PASSWORD`. Для `JWT_SECRET_KEY` создайте случайную строку длиной не менее 64 символов. Тестовые пароли — не менее 12 символов.

Получить секрет можно командой:

```powershell
py -3.14 -c "import secrets; print(secrets.token_urlsafe(64))"
```

**3.** Запустите Docker Desktop и базу:

```powershell
docker compose up -d db
```

**4.** Установите Backend и создайте демонстрационные записи:

```powershell
cd backend
py -3.14 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe seed_demo_all.py
```

Проверьте показанный адрес базы. Если он верный, введите `YES`.

**5.** Установите зависимости Frontend (в новом PowerShell из корня проекта):

```powershell
cd frontend
npm install
```

Далее запускайте проект по разделу 3.

## 3. Запуск проекта

Откройте **три терминала PowerShell**:

**PostgreSQL** — из корня проекта:

```powershell
docker compose up -d db
```

**Backend** — из корня проекта:

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn main:app --reload
```

**Frontend** — из корня проекта:

```powershell
cd frontend
npm run dev
```

- **Сайт:** http://127.0.0.1:5173/
- **Документация API:** http://127.0.0.1:8000/docs

## 4. Обновление уже существующей базы

После `Pull` ветки `main` в SourceTree новые SQL-файлы **не применяются автоматически** к заполненной базе. Чтобы обновить расписание и стандартные фото тренеров, выполните из корня проекта:

```powershell
# Используйте тот же Docker Compose-проект, что и при создании базы.
docker compose up -d db
$db = docker compose ps -q db
if (-not $db) { throw "Контейнер PostgreSQL не найден" }
$dbUser = (docker exec $db printenv POSTGRES_USER).Trim()
$dbName = (docker exec $db printenv POSTGRES_DB).Trim()

# Расписание до 31 декабря 2026 года.
docker cp ".\database\seed_sessions.sql" "${db}:/tmp/seed_sessions.sql"
docker exec $db psql -U $dbUser -d $dbName -v ON_ERROR_STOP=1 --single-transaction -f /tmp/seed_sessions.sql

# Стандартные фото: не заменяем фотографии, загруженные через админку.
docker exec $db psql -U $dbUser -d $dbName -v ON_ERROR_STOP=1 -c "UPDATE public.staff SET photo_url = '/static/trainers/' || code || '.webp' WHERE code IN ('anna_smirnova', 'maxim_volkov', 'ekaterina_orlova', 'dmitry_kuznetsov', 'maria_sokolova', 'olga_petrova') AND (photo_url IS NULL OR photo_url LIKE '/static/trainers/%');"
```

Для недостающих демонстрационных клиентов и бронирований (в том же PowerShell):

```powershell
$portMatch = [regex]::Match((docker compose port db 5432), ':(\d+)$')
if (-not $portMatch.Success) { throw "Порт PostgreSQL не найден" }
$env:DB_HOST = "127.0.0.1"
$env:DB_PORT = $portMatch.Groups[1].Value
cd backend
.\.venv\Scripts\python.exe seed_demo_all.py
```

Проверьте адрес базы перед вводом `YES`. Скрипт добавляет недостающие данные, не удаляя существующие бронирования.

**Важно:**

- Расписание в текущей версии рассчитано **до 31 декабря 2026 года**, а не на все будущие годы.
- Новая пустая база получает 6 услуг, 6 залов, 6 тренеров с фотографиями и расписание автоматически. Демонстрационные аккаунты и бронирования создаются скриптом `seed_demo_all.py`.
- Локальные PostgreSQL на разных компьютерах **не синхронизируются через GitHub**.
- **Не выполняйте `docker compose down -v`**: так можно удалить данные базы. Не добавляйте `.env` и пароли в Git.
