from fastapi import FastAPI
from app.api import router

app = FastAPI(title="AdaptiveTutor Backend", version="1.0.0")

app.include_router(router.api_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to AdaptiveTutor API"}
