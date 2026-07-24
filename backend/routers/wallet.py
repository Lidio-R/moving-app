"""司机钱包 & 提现"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import User, Driver, Wallet, Transaction, Withdrawal, WithdrawalStatus, TransactionType
from schemas import WalletOut, WithdrawalRequest, WithdrawalAudit, TransactionOut
from services.auth import get_current_user_id

router = APIRouter(prefix="/api/wallet", tags=["钱包"])


def _get_driver(db: Session, user_id: int) -> Driver:
    d = db.query(Driver).filter(Driver.user_id == user_id).first()
    if not d:
        raise HTTPException(403, "你不是司机")
    return d


def _is_admin(db: Session, user_id: int) -> bool:
    u = db.query(User).filter(User.id == user_id, User.is_admin == True).first()
    return u is not None


# ─── 司机端 ────────────────────────────────────────────

@router.get("/my", response_model=WalletOut)
def get_my_wallet(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """我的钱包"""
    driver = _get_driver(db, user_id)
    wallet = db.query(Wallet).filter(Wallet.driver_id == driver.id).first()
    if not wallet:
        wallet = Wallet(driver_id=driver.id)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return WalletOut.model_validate(wallet)


@router.get("/transactions", response_model=list[TransactionOut])
def get_transactions(limit: int = Query(50, le=200),
                     user_id: int = Depends(get_current_user_id),
                     db: Session = Depends(get_db)):
    """我的交易流水"""
    driver = _get_driver(db, user_id)
    wallet = db.query(Wallet).filter(Wallet.driver_id == driver.id).first()
    if not wallet:
        return []
    txs = db.query(Transaction).filter(Transaction.wallet_id == wallet.id)\
        .order_by(Transaction.created_at.desc()).limit(limit).all()
    return [TransactionOut.model_validate(t) for t in txs]


@router.post("/withdraw")
def request_withdrawal(data: WithdrawalRequest,
                       user_id: int = Depends(get_current_user_id),
                       db: Session = Depends(get_db)):
    """司机申请提现"""
    driver = _get_driver(db, user_id)
    wallet = db.query(Wallet).filter(Wallet.driver_id == driver.id).first()
    if not wallet or wallet.available_balance < data.amount:
        raise HTTPException(400, "可提现余额不足")

    wallet.available_balance -= data.amount
    wallet.frozen_balance += data.amount

    wd = Withdrawal(
        driver_id=driver.id,
        amount=data.amount,
        bank_name=data.bank_name,
        bank_account=data.bank_account,
    )
    db.add(wd)
    db.add(Transaction(
        wallet_id=wallet.id,
        amount=-data.amount,
        tx_type=TransactionType.FREEZE,
        description=f"提现申请 {data.amount} 元 — 冻结中",
    ))
    db.commit()
    return {"msg": "提现申请已提交，等待审核"}


@router.get("/withdrawals")
def get_my_withdrawals(user_id: int = Depends(get_current_user_id),
                       db: Session = Depends(get_db)):
    """我的提现记录"""
    driver = _get_driver(db, user_id)
    wds = db.query(Withdrawal).filter(Withdrawal.driver_id == driver.id)\
        .order_by(Withdrawal.created_at.desc()).all()
    return [{"id": w.id, "amount": w.amount, "status": w.status.value,
             "created_at": w.created_at, "processed_at": w.processed_at} for w in wds]


# ─── 管理员端 ──────────────────────────────────────────

@router.get("/admin/withdrawals")
def admin_list_withdrawals(status: str | None = Query(None, alias="status"),
                           user_id: int = Depends(get_current_user_id),
                           db: Session = Depends(get_db)):
    """管理员查看所有提现申请"""
    if not _is_admin(db, user_id):
        raise HTTPException(403, "无权限")
    q = db.query(Withdrawal)
    if status:
        q = q.filter(Withdrawal.status == status)
    q = q.order_by(Withdrawal.created_at.desc())
    return [{"id": w.id, "driver_id": w.driver_id, "amount": w.amount,
             "status": w.status.value, "bank_name": w.bank_name,
             "bank_account": w.bank_account, "created_at": w.created_at} for w in q.all()]


@router.post("/admin/withdrawals/{wd_id}/audit")
def audit_withdrawal(wd_id: int, data: WithdrawalAudit,
                     user_id: int = Depends(get_current_user_id),
                     db: Session = Depends(get_db)):
    """管理员审核提现"""
    if not _is_admin(db, user_id):
        raise HTTPException(403, "无权限")
    wd = db.query(Withdrawal).filter(Withdrawal.id == wd_id).first()
    if not wd:
        raise HTTPException(404, "提现申请不存在")
    if wd.status != WithdrawalStatus.PENDING:
        raise HTTPException(400, "该申请已处理")

    wallet = db.query(Wallet).filter(Wallet.driver_id == wd.driver_id).first()
    if not wallet:
        raise HTTPException(404, "钱包不存在")

    from datetime import datetime
    if data.status == "approved":
        wd.status = WithdrawalStatus.COMPLETED
        wallet.frozen_balance -= wd.amount
        wallet.total_withdrawn += wd.amount
        db.add(Transaction(
            wallet_id=wallet.id,
            amount=0,  # 仅记录
            tx_type=TransactionType.WITHDRAWAL,
            description=f"提现 {wd.amount} 元审核通过",
        ))
    else:
        wd.status = WithdrawalStatus.REJECTED
        wallet.available_balance += wd.amount
        wallet.frozen_balance -= wd.amount
        db.add(Transaction(
            wallet_id=wallet.id,
            amount=wd.amount,
            tx_type=TransactionType.UNFREEZE,
            description=f"提现驳回，解冻 {wd.amount} 元",
        ))
    wd.processed_at = datetime.utcnow()
    wd.remark = data.remark
    db.commit()
    return {"msg": "审核完成"}
