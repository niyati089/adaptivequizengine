from app.database.connection import SessionLocal, engine
from app.misconceptions.seed_tags import seed_misconception_tags
from app.models import Base


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_misconception_tags(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
