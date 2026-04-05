from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
import app.models as models
import app.schemas as schemas

router = APIRouter(prefix="/api/options", tags=["Options"])

@router.get("/account-groups")
def get_account_groups(db: Session = Depends(get_db)):
    groups = db.query(models.AccountGroup).all()
    return [{"id": g.id, "name": g.name, "color_code": g.color_code} for g in groups]

@router.get("/vendors")
def get_vendors(db: Session = Depends(get_db)):
    vendors = db.query(models.Vendor).all()
    return [{"id": v.id, "name": v.name} for v in vendors]

@router.get("/import-dict/{category}")
def get_import_dict(category: str, db: Session = Depends(get_db)):
    items = db.query(models.ImportDict).filter(models.ImportDict.category == category).all()
    return [{"id": i.id, "value": i.value} for i in items]
