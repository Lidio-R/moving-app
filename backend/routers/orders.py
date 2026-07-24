"""订单核心：下单、接单、状态流转、评价"""

import random
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import (
    User, Driver, Order, OrderStatusLog, VehicleType,
    OrderStatus, PaymentStatus, TransactionType, Transaction, Wallet, Coupon,
)
from schemas import OrderCreate, OrderOut, OrderDetailOut, OrderStatusUpdate, ReviewSubmit
from services.auth import get_current_user_id
from services.pricing import calculate_price

router = APIRouter(prefix="/api/orders", tags=["订单"])


def _generate_order_no() -> str:
    now = datetime.utcnow()
    rand = random.randint(1000, 9999)
    return f"BZ{now.strftime('%Y%m%d%H%M%S')}{rand}"


def _get_driver(db: Session, user_id: int) -> Driver:
    d = db.query(Driver).filter(Driver.user_id == user_id).first()
    if not d:
        raise HTTPException(403, "你不是司机")
    return d


# ─── 用户端 ────────────────────────────────────────────

@router.post("", response_model=OrderDetailOut)
def create_order(data: OrderCreate, user_id: int = Depends(get_current_user_id),
                 db: Session = Depends(get_db)):
    """用户下单（即时单 / 预约单）"""
    # 计价
    item_ids = [i.item_id for i in data.large_items]
    item_qtys = [i.qty for i in data.large_items]
    price = calculate_price(
        db, data.vehicle_type_id, data.distance_km,
        data.pickup_floor, data.dropoff_floor,
        data.pickup_has_elevator, data.dropoff_has_elevator,
        item_ids, item_qtys,
    )

    # 优惠券
    discount = 0.0
    if data.coupon_code:
        coupon = db.query(Coupon).filter(
            Coupon.code == data.coupon_code,
            Coupon.is_active == True,
            Coupon.used_count < Coupon.usage_limit,
        ).first()
        if coupon and price["total_price"] >= coupon.min_order_amount:
            if coupon.discount_type == "fixed":
                discount = min(coupon.discount_value, price["total_price"])
            else:
                discount = round(price["total_price"] * coupon.discount_value / 100, 2)
            coupon.used_count += 1

    total_price = round(price["total_price"] - discount, 2)

    order = Order(
        order_no=_generate_order_no(),
        user_id=user_id,
        pickup_address=data.pickup_address,
        pickup_lat=data.pickup_lat,
        pickup_lng=data.pickup_lng,
        dropoff_address=data.dropoff_address,
        dropoff_lat=data.dropoff_lat,
        dropoff_lng=data.dropoff_lng,
        distance_km=data.distance_km,
        vehicle_type_id=data.vehicle_type_id,
        pickup_floor=data.pickup_floor,
        dropoff_floor=data.dropoff_floor,
        pickup_has_elevator=data.pickup_has_elevator,
        dropoff_has_elevator=data.dropoff_has_elevator,
        large_items=[i.model_dump() for i in data.large_items],
        scheduled_time=data.scheduled_time,
        total_price=total_price,
        price_breakdown={**price, "discount": discount},
        status=OrderStatus.PENDING,
    )
    db.add(order)
    db.flush()

    # 状态日志
    db.add(OrderStatusLog(order_id=order.id, status=OrderStatus.PENDING, note="用户下单"))
    db.commit()
    db.refresh(order)
    return OrderDetailOut.model_validate(order)


@router.get("/my", response_model=list[OrderOut])
def list_my_orders(status: str | None = Query(None),
                   user_id: int = Depends(get_current_user_id),
                   db: Session = Depends(get_db)):
    """用户查看自己的订单"""
    q = db.query(Order).filter(Order.user_id == user_id)
    if status:
        q = q.filter(Order.status == status)
    q = q.order_by(Order.created_at.desc())
    return [OrderOut.model_validate(o) for o in q.all()]


@router.get("/{order_id}", response_model=OrderDetailOut)
def get_order(order_id: int, user_id: int = Depends(get_current_user_id),
              db: Session = Depends(get_db)):
    """订单详情"""
    o = db.query(Order).filter(Order.id == order_id).first()
    if not o:
        raise HTTPException(404, "订单不存在")
    if o.user_id != user_id and (not o.driver_id or
        db.query(Driver).filter(Driver.id == o.driver_id, Driver.user_id == user_id).first() is None):
        # 也允许管理员
        u = db.query(User).filter(User.id == user_id, User.is_admin == True).first()
        if not u:
            raise HTTPException(403, "无权查看")
    return OrderDetailOut.model_validate(o)


@router.post("/{order_id}/pay")
def pay_order(order_id: int, user_id: int = Depends(get_current_user_id),
              db: Session = Depends(get_db)):
    """模拟支付（微信支付对接留空，直接标记已付）"""
    o = db.query(Order).filter(Order.id == order_id, Order.user_id == user_id).first()
    if not o:
        raise HTTPException(404, "订单不存在")
    if o.payment_status == PaymentStatus.PAID:
        raise HTTPException(400, "已支付")
    o.payment_status = PaymentStatus.PAID
    db.commit()
    return {"msg": "支付成功"}


@router.post("/{order_id}/cancel")
def cancel_order(order_id: int, reason: str = "",
                 user_id: int = Depends(get_current_user_id),
                 db: Session = Depends(get_db)):
    """用户取消订单"""
    o = db.query(Order).filter(Order.id == order_id, Order.user_id == user_id).first()
    if not o:
        raise HTTPException(404, "订单不存在")
    if o.status not in [OrderStatus.PENDING, OrderStatus.ACCEPTED]:
        raise HTTPException(400, "当前状态不可取消")
    o.status = OrderStatus.CANCELLED
    o.cancel_reason = reason
    o.cancel_by = "user"
    db.add(OrderStatusLog(order_id=order_id, status=OrderStatus.CANCELLED, note=f"用户取消: {reason}"))
    db.commit()
    return {"msg": "已取消"}


@router.post("/{order_id}/review")
def review_order(order_id: int, data: ReviewSubmit,
                 user_id: int = Depends(get_current_user_id),
                 db: Session = Depends(get_db)):
    """用户评价订单"""
    o = db.query(Order).filter(Order.id == order_id, Order.user_id == user_id).first()
    if not o:
        raise HTTPException(404, "订单不存在")
    if o.status != OrderStatus.COMPLETED:
        raise HTTPException(400, "订单未完成，无法评价")
    o.rating = data.rating
    o.review_comment = data.comment
    db.commit()
    return {"msg": "评价成功"}


# ─── 司机端 ────────────────────────────────────────────

@router.get("/driver/available", response_model=list[OrderOut])
def get_available_orders(user_id: int = Depends(get_current_user_id),
                         db: Session = Depends(get_db)):
    """司机查看待接单池（可抢单）"""
    driver = _get_driver(db, user_id)
    if driver.status.value != "approved":
        raise HTTPException(403, "司机未审核通过")
    orders = db.query(Order).filter(
        Order.status == OrderStatus.PENDING,
        Order.vehicle_type_id == driver.vehicle_type_id,
    ).order_by(Order.created_at.desc()).all()
    return [OrderOut.model_validate(o) for o in orders]


@router.post("/{order_id}/accept")
def accept_order(order_id: int, user_id: int = Depends(get_current_user_id),
                 db: Session = Depends(get_db)):
    """司机接单"""
    driver = _get_driver(db, user_id)
    if driver.status.value != "approved":
        raise HTTPException(403, "司机未审核通过")
    o = db.query(Order).filter(Order.id == order_id, Order.status == OrderStatus.PENDING).first()
    if not o:
        raise HTTPException(404, "订单不存在或已被接")
    o.driver_id = driver.id
    o.status = OrderStatus.ACCEPTED
    db.add(OrderStatusLog(order_id=order_id, status=OrderStatus.ACCEPTED, note="司机接单"))
    db.commit()
    return {"msg": "接单成功"}


@router.post("/{order_id}/status")
def update_order_status(order_id: int, data: OrderStatusUpdate,
                        user_id: int = Depends(get_current_user_id),
                        db: Session = Depends(get_db)):
    """司机更新订单状态"""
    driver = _get_driver(db, user_id)
    o = db.query(Order).filter(Order.id == order_id, Order.driver_id == driver.id).first()
    if not o:
        raise HTTPException(404, "订单不存在")
    try:
        new_status = OrderStatus(data.status)
    except ValueError:
        raise HTTPException(400, f"无效状态: {data.status}")

    # 状态流转合法性检查
    valid_transitions = {
        OrderStatus.ACCEPTED: [OrderStatus.DRIVER_HEADING, OrderStatus.CANCELLED],
        OrderStatus.DRIVER_HEADING: [OrderStatus.LOADING],
        OrderStatus.LOADING: [OrderStatus.IN_TRANSIT],
        OrderStatus.IN_TRANSIT: [OrderStatus.UNLOADING],
        OrderStatus.UNLOADING: [OrderStatus.COMPLETED],
    }
    allowed = valid_transitions.get(o.status, [])
    if new_status not in allowed:
        raise HTTPException(400, f"不能从 {o.status.value} 变更为 {new_status.value}")

    o.status = new_status
    db.add(OrderStatusLog(order_id=order_id, status=new_status, note=data.note))

    if new_status == OrderStatus.COMPLETED:
        o.completed_at = datetime.utcnow()
        # 司机收入结算
        _settle_order(o, driver, db)

    db.commit()
    return {"msg": "状态已更新", "status": new_status.value}


def _settle_order(order: Order, driver: Driver, db: Session):
    """订单完成后的司机收入结算"""
    commission = round(order.total_price * driver.commission_rate / 100, 2)
    earning = round(order.total_price - commission, 2)

    wallet = db.query(Wallet).filter(Wallet.driver_id == driver.id).first()
    if not wallet:
        wallet = Wallet(driver_id=driver.id)
        db.add(wallet)
        db.flush()

    wallet.available_balance += earning
    wallet.total_earned += earning

    db.add(Transaction(wallet_id=wallet.id, order_id=order.id, amount=earning,
                       tx_type=TransactionType.EARNING, description=f"订单 {order.order_no} 收入"))
    db.add(Transaction(wallet_id=wallet.id, order_id=order.id, amount=-commission,
                       tx_type=TransactionType.COMMISSION, description=f"平台抽佣 ({driver.commission_rate}%)"))


@router.get("/driver/my-orders", response_model=list[OrderOut])
def list_driver_orders(status: str | None = Query(None),
                       user_id: int = Depends(get_current_user_id),
                       db: Session = Depends(get_db)):
    """司机查看自己的订单"""
    driver = _get_driver(db, user_id)
    q = db.query(Order).filter(Order.driver_id == driver.id)
    if status:
        q = q.filter(Order.status == status)
    q = q.order_by(Order.created_at.desc())
    return [OrderOut.model_validate(o) for o in q.all()]
