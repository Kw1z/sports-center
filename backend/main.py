
from fastapi import FastAPI

app = FastAPI(
    title="BluePulse API",
    description="Backend спортивного центра BluePulse",
    version="0.1.0"
)


@app.get("/")
def home():
    return {"message": "Добро пожаловать в BluePulse!"}


@app.get("/api/health")
def health():
    return {"status": "ok"}
