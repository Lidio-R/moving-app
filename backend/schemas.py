"""Pydantic 请求/响应模型"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# ─── 用户 ──────────────────────────────────────────────

class UserRegister(BaseModel):
    phone: str
    name: str
    password: str

class UserLogin(BaseModel):
    phone: str
    password: str

class UserOut(BaseModel):
    id: int
    phone: str
    name: str
    avatar: str
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ─── 车型 ──────────────────────────────────────────────

class VehicleTypeCreate(BaseModel):
    name: str
    description: str = ""
    max_load_kg: float = 500.0
    max_volume: str = ""
    base_price: float = 30.0
    price_per_km: float = 5.0
    floor_fee_with_elevator: float = 0.0
    floor_fee_no_elevator: float = 10.0

class VehicleTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    max_load_kg: Optional[float] = None
    max_volume: Optional[str] = None
    base_price: Optional[float] = None
    price_per_km: Optional[float] = None
    floor_fee_with_elevator: Optional[float] = None
    floor_fee_no_elevator: Optional[float] = None
    is_active: Optional[bool] = None

class VehicleTypeOut(BaseModel):
    id: int
    name: str
    description: str
    base_price: float
    price_per_km: float
    floor_fee_with_elevator: float
    floor_fee_no_elevator: float
    is_active: bool

    model_config = {"from_attributes": True}


# ─── 大件物品 ──────────────────────────────────────────

class LargeItemCreate(BaseModel):
    name: str
    additional_fee: float = 50.0

class LargeItemOut(BaseModel):
    id: int
    name: str
    additional_fee: float
    is_active: bool

    model_config = {"from_attributes": True}


# ─── 计价请求 ──────────────────────────────────────────

class PriceCalcRequest(BaseModel):
    vehicle_type_id: int
    distance_km: float
    pickup_floor: int = 1
    dropoff_floor: int = 1
    pickup_has_elevator: bool = True
    dropoff_has_elevator: bool = True
    large_item_ids: List[int] = []      # 选中的大件物品 ID
    large_item_quantities: List[int] = []  # 对应数量


class PriceBreakdown(BaseModel):
    base_price: float = 0.0
    distance_fee: float = 0.0
    floor_fee: float = 0.0
    large_item_fee: float = 0.0
    total_price: float = 0.0


# ─── 下单 ──────────────────────────────────────────────

class OrderItem(BaseModel):
    item_id: int
    name: str
    qty: int = 1
    fee: float = 0.0


class OrderCreate(BaseModel):
    pickup_address: str
    pickup_lat: float = 0.0
    pickup_lng: float = 0.0
    dropoff_address: str
    dropoff_lat: float = 0.0
    dropoff_lng: float = 0.0
    distance_km: float = 0.0
    vehicle_type_id: int
    pickup_floor: int = 1
    dropoff_floor: int = 1
    pickup_has_elevator: bool = True
    dropoff_has_elevator: bool = True
    large_items: List[OrderItem] = []
    scheduled_time: Optional[datetime] = None
    coupon_code: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: str
    note: str = ""


class OrderOut(BaseModel):
    id: int
    order_no: str
    user_id: int
    driver_id: Optional[int] = None
    pickup_address: str
    dropoff_address: str
    distance_km: float
    vehicle_type_id: Optional[int] = None
    total_price: float
    price_breakdown: dict = {}
    payment_status: str
    status: str
    rating: int
    review_comment: str
    scheduled_time: Optional[datetime] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class OrderDetailOut(OrderOut):
    pickup_lat: float
    pickup_lng: float
    dropoff_lat: float
    dropoff_lng: float
    pickup_floor: int
    dropoff_floor: int
    pickup_has_elevator: bool
    dropoff_has_elevator: bool
    large_items: list = []
    cancel_reason: str
    cancel_by: str

    model_config = {"from_attributes": True}


# ─── 司机 ──────────────────────────────────────────────

class DriverApply(BaseModel):
    real_name: str
    id_card: str
    driver_license_no: str
    vehicle_license_no: str
    vehicle_type_id: int


class DriverAudit(BaseModel):
    status: str   # "approved" / "rejected"
    commission_rate: Optional[float] = None
    deposit_amount: Optional[float] = None


class DriverUpdate(BaseModel):
    commission_rate: Optional[float] = None
    deposit_amount: Optional[float] = None
    is_online: Optional[bool] = None
    status: Optional[str] = None


class DriverOut(BaseModel):
    id: int
    user_id: int
    real_name: str
    status: str
    vehicle_type_id: Optional[int] = None
    is_online: bool
    commission_rate: float
    deposit_amount: float
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── 钱包 / 提现 ───────────────────────────────────────

class WalletOut(BaseModel):
    id: int
    driver_id: int
    available_balance: float
    frozen_balance: float
    total_earned: float
    total_withdrawn: float

    model_config = {"from_attributes": True}


class WithdrawalRequest(BaseModel):
    amount: float
    bank_name: str = ""
    bank_account: str = ""


class WithdrawalAudit(BaseModel):
    status: str   # "approved" / "rejected"
    remark: str = ""


class TransactionOut(BaseModel):
    id: int
    amount: float
    tx_type: str
    description: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── 评价 ──────────────────────────────────────────────

class ReviewSubmit(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = ""


# ─── 优惠券 ────────────────────────────────────────────

class CouponCreate(BaseModel):
    code: str
    discount_type: str = "fixed"
    discount_value: float = 0.0
    min_order_amount: float = 0.0
    valid_from: datetime
    valid_to: datetime
    usage_limit: int = 100


class CouponOut(BaseModel):
    id: int
    code: str
    discount_type: str
    discount_value: float
    min_order_amount: float
    valid_from: datetime
    valid_to: datetime
    usage_limit: int
    used_count: int
    is_active: bool

    model_config = {"from_attributes": True}


# ─── 统计数据 ──────────────────────────────────────────

class DashboardStats(BaseModel):
    total_users: int = 0
    total_drivers: int = 0
    pending_drivers: int = 0
    total_orders: int = 0
    today_orders: int = 0
    total_revenue: float = 0.0
    platform_commission: float = 0.0
