"""计价 & 车型 & 大件物品查询"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import VehicleType, LargeItem
from schemas import (
    VehicleTypeCreate, VehicleTypeUpdate, VehicleTypeOut,
    LargeItemCreate, LargeItemOut,
    PriceCalcRequest, PriceBreakdown,
)
from services.pricing import calculate_price

router = APIRouter(prefix="/api/pricing", tags=["计价"])


# ─── 车型管理 ──────────────────────────────────────────

@router.get("/vehicles", response_model=list[VehicleTypeOut])
def list_vehicles(db: Session = Depends(get_db)):
    """获取所有可用车型"""
    return [VehicleTypeOut.model_validate(v) for v in
            db.query(VehicleType).filter(VehicleType.is_active == True).all()]


@router.post("/vehicles", response_model=VehicleTypeOut)
def create_vehicle(data: VehicleTypeCreate, db: Session = Depends(get_db)):
    vt = VehicleType(**data.model_dump())
    db.add(vt)
    db.commit()
    db.refresh(vt)
    return VehicleTypeOut.model_validate(vt)


@router.put("/vehicles/{vt_id}", response_model=VehicleTypeOut)
def update_vehicle(vt_id: int, data: VehicleTypeUpdate, db: Session = Depends(get_db)):
    vt = db.query(VehicleType).filter(VehicleType.id == vt_id).first()
    if not vt:
        raise HTTPException(404, "车型不存在")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(vt, k, v)
    db.commit()
    db.refresh(vt)
    return VehicleTypeOut.model_validate(vt)


# ─── 大件物品管理 ──────────────────────────────────────

@router.get("/items", response_model=list[LargeItemOut])
def list_items(db: Session = Depends(get_db)):
    return [LargeItemOut.model_validate(i) for i in
            db.query(LargeItem).filter(LargeItem.is_active == True).all()]


@router.post("/items", response_model=LargeItemOut)
def create_item(data: LargeItemCreate, db: Session = Depends(get_db)):
    item = LargeItem(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return LargeItemOut.model_validate(item)


@router.put("/items/{item_id}", response_model=LargeItemOut)
def update_item(item_id: int, data: LargeItemCreate, db: Session = Depends(get_db)):
    item = db.query(LargeItem).filter(LargeItem.id == item_id).first()
    if not item:
        raise HTTPException(404, "大件物品不存在")
    item.name = data.name
    item.additional_fee = data.additional_fee
    db.commit()
    db.refresh(item)
    return LargeItemOut.model_validate(item)


# ─── 实时计价 ──────────────────────────────────────────

@router.post("/calculate", response_model=PriceBreakdown)
def calc_price(data: PriceCalcRequest, db: Session = Depends(get_db)):
    """下单前实时计算预估价格"""
    result = calculate_price(
        db=db,
        vehicle_type_id=data.vehicle_type_id,
        distance_km=data.distance_km,
        pickup_floor=data.pickup_floor,
        dropoff_floor=data.dropoff_floor,
        pickup_has_elevator=data.pickup_has_elevator,
        dropoff_has_elevator=data.dropoff_has_elevator,
        large_item_ids=data.large_item_ids,
        large_item_quantities=data.large_item_quantities,
    )
    return PriceBreakdown(
        base_price=result["base_price"],
        distance_fee=result["distance_fee"],
        floor_fee=result["floor_fee"],
        large_item_fee=result["large_item_fee"],
        total_price=result["total_price"],
    )
