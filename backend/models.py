"""数据库模型定义"""

import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text,
    ForeignKey, Enum, JSON
)
from sqlalchemy.orm import relationship
from database import Base


# ─── 枚举类型 ───────────────────────────────────────────

class DriverStatus(str, enum.Enum):
    PENDING = "pending"          # 待审核
    APPROVED = "approved"        # 审核通过
    REJECTED = "rejected"        # 审核拒绝
    DISABLED = "disabled"        # 已禁用


class OrderStatus(str, enum.Enum):
    PENDING = "pending"                    # 待接单
    ACCEPTED = "accepted"                  # 已接单
    DRIVER_HEADING = "driver_heading"      # 司机赶往装货地
    LOADING = "loading"                    # 装货中
    IN_TRANSIT = "in_transit"              # 运输中
    UNLOADING = "unloading"                # 卸货中
    COMPLETED = "completed"                # 已完成
    CANCELLED = "cancelled"                # 已取消


class PaymentStatus(str, enum.Enum):
    UNPAID = "unpaid"
    PAID = "paid"
    REFUNDED = "refunded"


class TransactionType(str, enum.Enum):
    EARNING = "earning"          # 订单收入
    COMMISSION = "commission"    # 平台抽佣
    WITHDRAWAL = "withdrawal"    # 提现
    FINE = "fine"                # 罚款
    FREEZE = "freeze"            # 保证金冻结
    UNFREEZE = "unfreeze"        # 保证金解冻


class WithdrawalStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"


# ─── 用户表 ─────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    phone = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(50), nullable=False)
    avatar = Column(String(500), default="")
    hashed_password = Column(String(200), nullable=False)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("Order", back_populates="user", foreign_keys="Order.user_id")


# ─── 司机表 ─────────────────────────────────────────────

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    # 资质信息
    real_name = Column(String(50), nullable=False)
    id_card = Column(String(18), nullable=False)
    driver_license_no = Column(String(50), nullable=False)
    vehicle_license_no = Column(String(50), nullable=False)

    # 图片材料（JSON 数组存储多张 URL）
    id_card_photos = Column(JSON, default=[])
    driver_license_photos = Column(JSON, default=[])
    vehicle_license_photos = Column(JSON, default=[])
    vehicle_photos = Column(JSON, default=[])
    face_verified = Column(Boolean, default=False)

    # 审核状态
    status = Column(Enum(DriverStatus), default=DriverStatus.PENDING)

    # 接单相关
    vehicle_type_id = Column(Integer, ForeignKey("vehicle_types.id"), nullable=True)
    is_online = Column(Boolean, default=False)
    current_lat = Column(Float, default=0.0)
    current_lng = Column(Float, default=0.0)

    # 抽佣比例（百分比，如 15 表示抽 15%）—— 平台可自定义
    commission_rate = Column(Float, default=15.0)

    # 保证金
    deposit_amount = Column(Float, default=0.0)
    deposit_frozen = Column(Float, default=0.0)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    orders = relationship("Order", back_populates="driver", foreign_keys="Order.driver_id")
    wallet = relationship("Wallet", back_populates="driver", uselist=False)


# ─── 车型表 ─────────────────────────────────────────────

class VehicleType(Base):
    __tablename__ = "vehicle_types"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False)       # 微面 / 金杯 / 厢货
    description = Column(String(200), default="")
    max_load_kg = Column(Float, default=500.0)                   # 最大载重 (kg)
    max_volume = Column(String(50), default="")                  # 容积描述

    # 默认计价参数（可被 PricingRule 覆盖）
    base_price = Column(Float, default=30.0)                     # 起步价 (元)
    price_per_km = Column(Float, default=5.0)                    # 每公里加价
    floor_fee_with_elevator = Column(Float, default=0.0)         # 有电梯楼层费
    floor_fee_no_elevator = Column(Float, default=10.0)          # 无电梯楼层费

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ─── 大件物品 ───────────────────────────────────────────

class LargeItem(Base):
    """可附加的大件物品类型（如冰箱、洗衣机、钢琴等）"""
    __tablename__ = "large_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    additional_fee = Column(Float, default=50.0)    # 每件附加费
    is_active = Column(Boolean, default=True)


# ─── 订单表 ─────────────────────────────────────────────

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_no = Column(String(30), unique=True, nullable=False, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)

    # 地址信息
    pickup_address = Column(String(300), nullable=False)
    pickup_lat = Column(Float, default=0.0)
    pickup_lng = Column(Float, default=0.0)
    dropoff_address = Column(String(300), nullable=False)
    dropoff_lat = Column(Float, default=0.0)
    dropoff_lng = Column(Float, default=0.0)

    # 里程
    distance_km = Column(Float, default=0.0)

    # 车型
    vehicle_type_id = Column(Integer, ForeignKey("vehicle_types.id"), nullable=True)

    # 楼层
    pickup_floor = Column(Integer, default=1)
    dropoff_floor = Column(Integer, default=1)
    pickup_has_elevator = Column(Boolean, default=True)
    dropoff_has_elevator = Column(Boolean, default=True)

    # 大件物品（JSON: [{"item_id":1,"name":"冰箱","qty":1,"fee":50}, ...]）
    large_items = Column(JSON, default=[])

    # 预约时间（None = 即时单）
    scheduled_time = Column(DateTime, nullable=True)

    # 价格
    total_price = Column(Float, default=0.0)
    price_breakdown = Column(JSON, default={})   # 费用明细 JSON
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.UNPAID)

    # 状态
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)

    # 取消
    cancel_reason = Column(String(300), default="")
    cancel_by = Column(String(20), default="")   # "user" / "driver" / "admin"

    # 评价
    rating = Column(Integer, default=0)           # 1-5
    review_comment = Column(String(500), default="")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="orders", foreign_keys=[user_id])
    driver = relationship("Driver", back_populates="orders", foreign_keys=[driver_id])
    vehicle_type = relationship("VehicleType")
    status_logs = relationship("OrderStatusLog", back_populates="order", order_by="OrderStatusLog.created_at")


# ─── 订单状态日志 ───────────────────────────────────────

class OrderStatusLog(Base):
    __tablename__ = "order_status_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    status = Column(Enum(OrderStatus), nullable=False)
    note = Column(String(300), default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="status_logs")


# ─── 司机钱包 ──────────────────────────────────────────

class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), unique=True, nullable=False)

    available_balance = Column(Float, default=0.0)     # 可提现余额
    frozen_balance = Column(Float, default=0.0)        # 冻结余额（保证金）
    total_earned = Column(Float, default=0.0)          # 累计收入
    total_withdrawn = Column(Float, default=0.0)       # 累计提现

    driver = relationship("Driver", back_populates="wallet")
    transactions = relationship("Transaction", back_populates="wallet")


# ─── 交易流水 ──────────────────────────────────────────

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    wallet_id = Column(Integer, ForeignKey("wallets.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)

    amount = Column(Float, nullable=False)
    tx_type = Column(Enum(TransactionType), nullable=False)
    description = Column(String(300), default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    wallet = relationship("Wallet", back_populates="transactions")


# ─── 提现申请 ──────────────────────────────────────────

class Withdrawal(Base):
    __tablename__ = "withdrawals"

    id = Column(Integer, primary_key=True, autoincrement=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(Enum(WithdrawalStatus), default=WithdrawalStatus.PENDING)
    bank_name = Column(String(100), default="")
    bank_account = Column(String(50), default="")
    remark = Column(String(300), default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)

    driver = relationship("Driver")


# ─── 优惠券 ────────────────────────────────────────────

class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(50), unique=True, nullable=False)
    discount_type = Column(String(20), default="fixed")   # "fixed" 固定金额 / "percent" 百分比
    discount_value = Column(Float, default=0.0)
    min_order_amount = Column(Float, default=0.0)         # 最低订单金额
    valid_from = Column(DateTime, nullable=False)
    valid_to = Column(DateTime, nullable=False)
    usage_limit = Column(Integer, default=100)
    used_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
