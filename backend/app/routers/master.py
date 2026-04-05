from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from io import BytesIO
import pandas as pd

from app.database import get_db
import app.models as models

router = APIRouter(prefix="/api", tags=["Master Data"])

# ──────────── Export helpers ────────────
def _xlsx_response(df: pd.DataFrame, filename: str) -> StreamingResponse:
    from urllib.parse import quote
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False)
    output.seek(0)
    encoded_name = quote(filename, safe='')
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{encoded_name}"},
    )

# ──────────── Vendors ────────────
@router.get("/vendors")
def list_vendors(db: Session = Depends(get_db)):
    return db.query(models.Vendor).order_by(models.Vendor.name).all()

class VendorPayload(BaseModel):
    name: str
    tax_id: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    bank_name: Optional[str] = None
    branch_name: Optional[str] = None
    bank_account: Optional[str] = None

@router.post("/vendors")
def create_vendor(payload: VendorPayload, db: Session = Depends(get_db)):
    existing = db.query(models.Vendor).filter(models.Vendor.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="廠商名稱已存在")
    obj = models.Vendor(**payload.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj

@router.put("/vendors/{vendor_id}")
def update_vendor(vendor_id: int, payload: VendorPayload, db: Session = Depends(get_db)):
    obj = db.query(models.Vendor).filter(models.Vendor.id == vendor_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="廠商不存在")
    for k, v in payload.model_dump().items():
        setattr(obj, k, v)
    db.commit(); db.refresh(obj)
    return obj

@router.delete("/vendors/{vendor_id}")
def delete_vendor(vendor_id: int, db: Session = Depends(get_db)):
    obj = db.query(models.Vendor).filter(models.Vendor.id == vendor_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="廠商不存在")
    db.delete(obj); db.commit()
    return {"ok": True}

# ──────────── Account Groups ────────────
@router.get("/account-groups")
def list_account_groups(db: Session = Depends(get_db)):
    return db.query(models.AccountGroup).order_by(models.AccountGroup.name).all()

class AccountGroupPayload(BaseModel):
    name: str
    color_code: str = "#FFFFFF"

@router.post("/account-groups")
def create_account_group(payload: AccountGroupPayload, db: Session = Depends(get_db)):
    existing = db.query(models.AccountGroup).filter(models.AccountGroup.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="寶號名稱已存在")
    obj = models.AccountGroup(name=payload.name, color_code=payload.color_code)
    db.add(obj); db.commit(); db.refresh(obj)
    return obj

class ColorPayload(BaseModel):
    color_code: str

@router.put("/account-groups/{group_id}/color")
def update_group_color(group_id: int, payload: ColorPayload, db: Session = Depends(get_db)):
    obj = db.query(models.AccountGroup).filter(models.AccountGroup.id == group_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="寶號不存在")
    obj.color_code = payload.color_code
    db.commit(); db.refresh(obj)
    return obj

@router.put("/account-groups/{group_id}")
def update_account_group(group_id: int, payload: AccountGroupPayload, db: Session = Depends(get_db)):
    obj = db.query(models.AccountGroup).filter(models.AccountGroup.id == group_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="寶號不存在")
    obj.name = payload.name
    obj.color_code = payload.color_code
    db.commit(); db.refresh(obj)
    return obj

@router.delete("/account-groups/{group_id}")
def delete_account_group(group_id: int, db: Session = Depends(get_db)):
    obj = db.query(models.AccountGroup).filter(models.AccountGroup.id == group_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="寶號不存在")
    db.delete(obj); db.commit()
    return {"ok": True}

# ──────────── Import Dict ────────────
@router.get("/import-dict")
def list_import_dict(db: Session = Depends(get_db)):
    return db.query(models.ImportDict).order_by(models.ImportDict.category, models.ImportDict.value).all()

class ImportDictPayload(BaseModel):
    category: str  # accounting_subj | transaction_basis
    value: str

@router.post("/import-dict")
def create_import_dict(payload: ImportDictPayload, db: Session = Depends(get_db)):
    existing = db.query(models.ImportDict).filter(
        models.ImportDict.category == payload.category,
        models.ImportDict.value == payload.value
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="項目已存在")
    obj = models.ImportDict(category=payload.category, value=payload.value)
    db.add(obj); db.commit(); db.refresh(obj)
    return obj

@router.put("/import-dict/{item_id}")
def update_import_dict(item_id: int, payload: ImportDictPayload, db: Session = Depends(get_db)):
    obj = db.query(models.ImportDict).filter(models.ImportDict.id == item_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="項目不存在")
    obj.value = payload.value
    db.commit(); db.refresh(obj)
    return obj

@router.delete("/import-dict/{item_id}")
def delete_import_dict(item_id: int, db: Session = Depends(get_db)):
    obj = db.query(models.ImportDict).filter(models.ImportDict.id == item_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="項目不存在")
    db.delete(obj); db.commit()
    return {"ok": True}

# ──────────── Clear All Data ────────────
class ClearPayload(BaseModel):
    confirm: str

@router.delete("/clear-all")
def clear_all_data(payload: ClearPayload, db: Session = Depends(get_db)):
    if payload.confirm != "確定刪除資料庫":
        raise HTTPException(status_code=400, detail="確認文字錯誤，請輸入「確定刪除資料庫」")
    db.query(models.Ledger).delete()
    db.query(models.ImportDict).delete()
    db.query(models.Vendor).delete()
    db.query(models.AccountGroup).delete()
    db.commit()
    return {"message": "所有資料已清空"}

# ──────────── Xlsx Exports ────────────
def _today() -> str:
    return date.today().strftime("%Y%m%d")

@router.get("/vendors/export")
def export_vendors(db: Session = Depends(get_db)):
    rows = db.query(models.Vendor).order_by(models.Vendor.name).all()
    df = pd.DataFrame([{"廠商名稱": r.name, "統一編號": r.tax_id, "地址": r.address,"電話": r.phone, "銀行名稱": r.bank_name, "分行名稱": r.branch_name, "匯款帳號": r.bank_account} for r in rows])
    return _xlsx_response(df, f"廠商資料_{_today()}.xlsx")

@router.get("/account-groups/export")
def export_account_groups(db: Session = Depends(get_db)):
    rows = db.query(models.AccountGroup).order_by(models.AccountGroup.name).all()
    df = pd.DataFrame([{"寶號名稱": r.name, "色號": r.color_code} for r in rows])
    return _xlsx_response(df, f"寶號資料_{_today()}.xlsx")

@router.get("/import-dict/export")
def export_import_dict(db: Session = Depends(get_db)):
    rows = db.query(models.ImportDict).order_by(models.ImportDict.category, models.ImportDict.value).all()
    df = pd.DataFrame([{
        "會計科目": r.value if r.category == "accounting_subj" else "",
        "出/入帳依據": r.value if r.category == "transaction_basis" else "",
    } for r in rows])
    return _xlsx_response(df, f"匯入資料_{_today()}.xlsx")

