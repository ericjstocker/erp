import jwt
import hashlib
import os
from datetime import datetime, timedelta
from typing import Optional

SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-change-in-production')
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 10080  # 7 days

# hardcoded single user for simplicity
ADMIN_USER = 'admin'
ADMIN_PASSWORD = 'admin123'


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(plain: str, hashed: str) -> bool:
    return hash_password(plain) == hashed


def create_access_token(username: str, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta is None:
        expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.utcnow() + expires_delta
    to_encode = {'sub': username, 'exp': expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get('sub')
    except:
        return None
