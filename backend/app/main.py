from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import router
from app.database.connection import engine
from app.models import Base

# Create tables at startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AdaptiveTutor Backend", version="1.0.0")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router.api_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to AdaptiveTutor API"}

