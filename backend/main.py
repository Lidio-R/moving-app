"""搬家小程序 — 后端主入口"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import users, pricing, orders, drivers, wallet, admin

app = FastAPI(
    title="搬家服务 API",
    description="用户端 + 司机端 + 管理后台 三端统一后端",
    version="1.0.0",
)

# CORS — 允许前端跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(users.router)
app.include_router(pricing.router)
app.include_router(orders.router)
app.include_router(drivers.router)
app.include_router(wallet.router)
app.include_router(admin.router)


@app.on_event("startup")
def on_startup():
    init_db()
    _seed_data()


def _seed_data():
    """首次启动时写入种子数据：默认车型、大件物品、管理员账号"""
    from database import SessionLocal
    from models import VehicleType, LargeItem, User
    from services.auth import hash_password

    db = SessionLocal()
    try:
        # 默认车型
        if db.query(VehicleType).count() == 0:
            db.add_all([
                VehicleType(name="微面", description="小型面包车，适合少量搬家",
                            max_load_kg=500, max_volume="2.5m³",
                            base_price=30, price_per_km=5,
                            floor_fee_with_elevator=0, floor_fee_no_elevator=10),
                VehicleType(name="金杯", description="金杯海狮，适合中等搬家",
                            max_load_kg=1000, max_volume="5m³",
                            base_price=50, price_per_km=8,
                            floor_fee_with_elevator=0, floor_fee_no_elevator=15),
                VehicleType(name="厢货", description="4.2米厢式货车，适合大型搬家",
                            max_load_kg=3000, max_volume="16m³",
                            base_price=80, price_per_km=12,
                            floor_fee_with_elevator=0, floor_fee_no_elevator=20),
            ])

        # 默认大件物品
        if db.query(LargeItem).count() == 0:
            db.add_all([
                LargeItem(name="冰箱", additional_fee=50),
                LargeItem(name="洗衣机", additional_fee=40),
                LargeItem(name="空调（拆装）", additional_fee=120),
                LargeItem(name="衣柜（拆装）", additional_fee=80),
                LargeItem(name="床（拆装）", additional_fee=100),
                LargeItem(name="沙发", additional_fee=60),
                LargeItem(name="钢琴", additional_fee=200),
                LargeItem(name="保险柜", additional_fee=80),
            ])

        # 默认管理员
        if db.query(User).filter(User.phone == "admin").count() == 0:
            db.add(User(
                phone="admin",
                name="系统管理员",
                hashed_password=hash_password("admin123"),
                is_admin=True,
            ))

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
