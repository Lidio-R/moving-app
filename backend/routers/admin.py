"""管理后台：仪表盘、订单管理、财务对账"""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import User, Driver, Order, OrderStatus, PaymentStatus, Transaction, Withdrawal, Coupon
from schemas import DashboardStats, OrderDetailOut, CouponCreate, CouponOut
from services.auth import get_current_user_id

router = APIRouter(prefix="/api/admin", tags=["管理后台"])


def _require_admin(db: Session, user_id: int):
    u = db.query(User).filter(User.id == user_id, User.is_admin == True).first()
    if not u:
        raise HTTPException(403, "无管理员权限")


# ─── 仪表盘 ────────────────────────────────────────────

@router.get("/dashboard", response_model=DashboardStats)
def dashboard(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    _require_admin(db, user_id)
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    total_revenue = db.query(func.coalesce(func.sum(Order.total_price), 0)).filter(
        Order.status == OrderStatus.COMPLETED, Order.payment_status == PaymentStatus.PAID
    ).scalar() or 0.0

    # 平台抽佣总和
    commission = db.query(func.coalesce(func.sum(func.abs(Transaction.amount)), 0)).filter(
        Transaction.tx_type == "commission"
    ).scalar() or 0.0

    return DashboardStats(
        total_users=db.query(func.count(User.id)).filter(User.is_admin == False).scalar() or 0,
        total_drivers=db.query(func.count(Driver.id)).scalar() or 0,
        pending_drivers=db.query(func.count(Driver.id)).filter(Driver.status == "pending").scalar() or 0,
        total_orders=db.query(func.count(Order.id)).scalar() or 0,
        today_orders=db.query(func.count(Order.id)).filter(Order.created_at >= today).scalar() or 0,
        total_revenue=total_revenue,
        platform_commission=commission,
    )


# ─── 全部订单 ──────────────────────────────────────────

@router.get("/orders", response_model=list[OrderDetailOut])
def list_all_orders(status: str | None = Query(None),
                    page: int = Query(1, ge=1), page_size: int = Query(20, le=100),
                    user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    _require_admin(db, user_id)
    q = db.query(Order)
    if status:
        q = q.filter(Order.status == status)
    q = q.order_by(Order.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    return [OrderDetailOut.model_validate(o) for o in q.all()]


@router.put("/orders/{order_id}/price")
def admin_update_price(order_id: int, new_price: float,
                       user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """管理员手动改价"""
    _require_admin(db, user_id)
    o = db.query(Order).filter(Order.id == order_id).first()
    if not o:
        raise HTTPException(404, "订单不存在")
    o.total_price = new_price
    db.commit()
    return {"msg": "价格已更新", "total_price": new_price}


@router.post("/orders/{order_id}/cancel")
def admin_cancel_order(order_id: int, reason: str = "",
                       user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """管理员取消订单"""
    _require_admin(db, user_id)
    o = db.query(Order).filter(Order.id == order_id).first()
    if not o:
        raise HTTPException(404, "订单不存在")
    o.status = OrderStatus.CANCELLED
    o.cancel_reason = reason
    o.cancel_by = "admin"
    db.commit()
    return {"msg": "订单已取消"}


# ─── 优惠券管理 ────────────────────────────────────────

@router.get("/coupons", response_model=list[CouponOut])
def list_coupons(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    _require_admin(db, user_id)
    return [CouponOut.model_validate(c) for c in db.query(Coupon).order_by(Coupon.created_at.desc()).all()]


@router.post("/coupons", response_model=CouponOut)
def create_coupon(data: CouponCreate,
                  user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    _require_admin(db, user_id)
    if db.query(Coupon).filter(Coupon.code == data.code).first():
        raise HTTPException(400, "优惠券码已存在")
    c = Coupon(**data.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return CouponOut.model_validate(c)


# ─── 财务汇总 ──────────────────────────────────────────

@router.get("/finance/summary")
def finance_summary(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """财务总览"""
    _require_admin(db, user_id)
    total_earnings = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.tx_type == "earning"
    ).scalar() or 0.0
    total_commission = db.query(func.coalesce(func.sum(func.abs(Transaction.amount)), 0)).filter(
        Transaction.tx_type == "commission"
    ).scalar() or 0.0
    pending_withdrawals = db.query(func.coalesce(func.sum(Withdrawal.amount), 0)).filter(
        Withdrawal.status == "pending"
    ).scalar() or 0.0

    return {
        "total_earnings": total_earnings,
        "total_commission": total_commission,
        "pending_withdrawals": pending_withdrawals,
    }
