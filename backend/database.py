import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

DB_USER = os.getenv("DB_USER").strip('"')
DB_PASSWORD = os.getenv("DB_PASSWORD").strip('"')
DB_HOST = os.getenv("DB_HOST").strip('"')
DB_PORT = os.getenv("DB_PORT").strip('"')
DB_NAME = os.getenv("DB_NAME").strip('"')

DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
