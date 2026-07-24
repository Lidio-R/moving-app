"""司机入驻 & 审核"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Driver, DriverStatus, VehicleType
from schemas import DriverApply, DriverAudit, DriverUpdate, DriverOut
from services.auth import get_current_user_id

router = APIRouter(prefix="/api/drivers", tags=["司机"])


def _get_driver(db: Session, user_id: int) -> Driver:
    d = db.query(Driver).filter(Driver.user_id == user_id).first()
    if not d:
        raise HTTPException(403, "你尚未注册为司机")
    return d


@router.post("/apply", response_model=DriverOut)
def apply_driver(data: DriverApply, user_id: int = Depends(get_current_user_id),
                 db: Session = Depends(get_db)):
    """用户申请成为司机"""
    if db.query(Driver).filter(Driver.user_id == user_id).first():
        raise HTTPException(400, "已申请过司机")

    vt = db.query(VehicleType).filter(VehicleType.id == data.vehicle_type_id, VehicleType.is_active == True).first()
    if not vt:
        raise HTTPException(400, "车型不可用")

    driver = Driver(
        user_id=user_id,
        real_name=data.real_name,
        id_card=data.id_card,
        driver_license_no=data.driver_license_no,
        vehicle_license_no=data.vehicle_license_no,
        vehicle_type_id=data.vehicle_type_id,
        status=DriverStatus.PENDING,
    )
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return DriverOut.model_validate(driver)


@router.get("/me", response_model=DriverOut)
def get_my_driver(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """获取我的司机信息"""
    return DriverOut.model_validate(_get_driver(db, user_id))


@router.post("/toggle-online")
def toggle_online(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """司机上线/离线切换"""
    driver = _get_driver(db, user_id)
    if driver.status != DriverStatus.APPROVED:
        raise HTTPException(403, "司机未审核通过")
    driver.is_online = not driver.is_online
    db.commit()
    return {"is_online": driver.is_online}


# ─── 管理员接口 ─────────────────────────────────────────

@router.get("/pending", response_model=list[DriverOut])
def list_pending_drivers(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """管理员查看待审核司机"""
    u = db.query(User).filter(User.id == user_id, User.is_admin == True).first()
    if not u:
        raise HTTPException(403, "无权限")
    drivers = db.query(Driver).filter(Driver.status == DriverStatus.PENDING).all()
    return [DriverOut.model_validate(d) for d in drivers]


@router.get("/all", response_model=list[DriverOut])
def list_all_drivers(status: str | None = None,
                     user_id: int = Depends(get_current_user_id),
                     db: Session = Depends(get_db)):
    """管理员查看所有司机"""
    u = db.query(User).filter(User.id == user_id, User.is_admin == True).first()
    if not u:
        raise HTTPException(403, "无权限")
    q = db.query(Driver)
    if status:
        q = q.filter(Driver.status == status)
    return [DriverOut.model_validate(d) for d in q.all()]


@router.post("/{driver_id}/audit", response_model=DriverOut)
def audit_driver(driver_id: int, data: DriverAudit,
                 user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """管理员审核司机"""
    u = db.query(User).filter(User.id == user_id, User.is_admin == True).first()
    if not u:
        raise HTTPException(403, "无权限")
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(404, "司机不存在")
    try:
        driver.status = DriverStatus(data.status)
    except ValueError:
        raise HTTPException(400, f"无效状态: {data.status}")
    if data.commission_rate is not None:
        driver.commission_rate = data.commission_rate
    if data.deposit_amount is not None:
        driver.deposit_amount = data.deposit_amount
    db.commit()
    db.refresh(driver)
    return DriverOut.model_validate(driver)


@router.put("/{driver_id}", response_model=DriverOut)
def update_driver(driver_id: int, data: DriverUpdate,
                  user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """管理员更新司机信息（抽佣比例、保证金、禁用等）"""
    u = db.query(User).filter(User.id == user_id, User.is_admin == True).first()
    if not u:
        raise HTTPException(403, "无权限")
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(404, "司机不存在")
    if data.commission_rate is not None:
        driver.commission_rate = data.commission_rate
    if data.deposit_amount is not None:
        driver.deposit_amount = data.deposit_amount
    if data.is_online is not None:
        driver.is_online = data.is_online
    if data.status is not None:
        try:
            driver.status = DriverStatus(data.status)
        except ValueError:
            raise HTTPException(400, f"无效状态: {data.status}")
    db.commit()
    db.refresh(driver)
    return DriverOut.model_validate(driver)
