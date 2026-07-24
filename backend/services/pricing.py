"""计价引擎：根据车型、里程、楼层、大件物品计算费用"""

from sqlalchemy.orm import Session
from models import VehicleType, LargeItem


def calculate_price(
    db: Session,
    vehicle_type_id: int,
    distance_km: float,
    pickup_floor: int,
    dropoff_floor: int,
    pickup_has_elevator: bool,
    dropoff_has_elevator: bool,
    large_item_ids: list[int],
    large_item_quantities: list[int],
) -> dict:
    """
    返回完整的费用明细。
    计算公式：
      总价 = 起步价 + 里程费 + 楼层费 + 大件附加费
    """

    vt = db.query(VehicleType).filter(VehicleType.id == vehicle_type_id).first()
    if not vt:
        raise ValueError(f"车型不存在: {vehicle_type_id}")

    # 1. 起步价
    base_price = vt.base_price

    # 2. 里程费：distance_km * price_per_km，最低按 1 公里算
    effective_distance = max(distance_km, 1.0)
    distance_fee = round(effective_distance * vt.price_per_km, 2)

    # 3. 楼层费
    def floor_fee(floor: int, has_elevator: bool) -> float:
        if floor <= 1:
            return 0.0
        extra_floors = floor - 1
        if has_elevator:
            return extra_floors * vt.floor_fee_with_elevator
        else:
            return extra_floors * vt.floor_fee_no_elevator

    pickup_floor_cost = floor_fee(pickup_floor, pickup_has_elevator)
    dropoff_floor_cost = floor_fee(dropoff_floor, dropoff_has_elevator)
    total_floor_fee = round(pickup_floor_cost + dropoff_floor_cost, 2)

    # 4. 大件附加费
    large_item_fee = 0.0
    large_item_details = []
    for item_id, qty in zip(large_item_ids, large_item_quantities):
        item = db.query(LargeItem).filter(LargeItem.id == item_id, LargeItem.is_active == True).first()
        if item:
            fee = round(item.additional_fee * qty, 2)
            large_item_fee += fee
            large_item_details.append({
                "item_id": item.id,
                "name": item.name,
                "qty": qty,
                "unit_fee": item.additional_fee,
                "total_fee": fee,
            })

    total_price = round(base_price + distance_fee + total_floor_fee + large_item_fee, 2)

    return {
        "vehicle_type": vt.name,
        "base_price": base_price,
        "distance_km": distance_km,
        "price_per_km": vt.price_per_km,
        "distance_fee": distance_fee,
        "floor_fee": total_floor_fee,
        "pickup_floor_fee": pickup_floor_cost,
        "dropoff_floor_fee": dropoff_floor_cost,
        "large_item_fee": large_item_fee,
        "large_item_details": large_item_details,
        "total_price": total_price,
    }
