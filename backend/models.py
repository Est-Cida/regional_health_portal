from sqlalchemy import Column, Integer, String
from database import Base


class User(Base):
    __tablename__ = "portal_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    # role: country_admin | regional_admin | super_admin
    role = Column(String, nullable=False)
    # For country_admin: ISO-3 code (e.g. "NGA")
    country_code = Column(String(3), nullable=True)
    # For regional_admin: subregion name (e.g. "West")
    subregion = Column(String, nullable=True)
    is_active = Column(Integer, default=1)
