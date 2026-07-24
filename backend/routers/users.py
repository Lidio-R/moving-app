"""用户注册/登录"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Driver
from schemas import UserRegister, UserLogin, UserOut, TokenOut
from services.auth import hash_password, verify_password, create_access_token, get_current_user_id

router = APIRouter(prefix="/api/users", tags=["用户"])


@router.post("/register", response_model=TokenOut)
def register(data: UserRegister, db: Session = Depends(get_db)):
    """用户注册"""
    if db.query(User).filter(User.phone == data.phone).first():
        raise HTTPException(400, "手机号已注册")
    user = User(
        phone=data.phone,
        name=data.name,
        hashed_password=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"user_id": user.id})
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenOut)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """用户登录（含管理员）"""
    user = db.query(User).filter(User.phone == data.phone).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(401, "手机号或密码错误")
    token = create_access_token({"user_id": user.id})
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def get_me(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """获取当前登录用户信息"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "用户不存在")
    return UserOut.model_validate(user)
