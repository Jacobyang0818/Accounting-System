from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.database import get_db
import app.models as models
import app.schemas as schemas

router = APIRouter(prefix="/api/ledgers", tags=["Ledgers"])

@router.get("", response_model=List[schemas.LedgerResponse])
def get_ledgers(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    account_group_ids: Optional[List[int]] = Query(None),
    accounting_subj_ids: Optional[List[int]] = Query(None),
    vendor_ids: Optional[List[int]] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(models.Ledger)
    if start_date:
        query = query.filter(models.Ledger.date >= start_date)
    if end_date:
        query = query.filter(models.Ledger.date <= end_date)
    if account_group_ids:
        query = query.filter(models.Ledger.account_group_id.in_(account_group_ids))
    if accounting_subj_ids:
        query = query.filter(models.Ledger.accounting_subj.in_(accounting_subj_ids))
    if vendor_ids:
        query = query.filter(models.Ledger.vendor_id.in_(vendor_ids))
    
    ledgers = query.order_by(models.Ledger.date.desc()).all()
    
    result = []
    for l in ledgers:
        schema = schemas.LedgerResponse.model_validate(l)
        if l.account_group:
            schema.account_group_color_code = l.account_group.color_code
            schema.account_group_name = l.account_group.name
        if l.vendor:
            schema.vendor_name = l.vendor.name
        if l.accounting_subj:
            d = db.query(models.ImportDict).filter(models.ImportDict.id == l.accounting_subj).first()
            if d: schema.accounting_subj_label = d.value
        if l.transaction_basis:
            d = db.query(models.ImportDict).filter(models.ImportDict.id == l.transaction_basis).first()
            if d: schema.transaction_basis_label = d.value
        result.append(schema)

    return result

@router.post("", response_model=schemas.LedgerResponse)
def create_ledger(ledger: schemas.LedgerCreate, db: Session = Depends(get_db)):
    db_ledger = models.Ledger(**ledger.model_dump())
    db.add(db_ledger)
    db.commit()
    db.refresh(db_ledger)
    
    schema = schemas.LedgerResponse.model_validate(db_ledger)
    if db_ledger.account_group:
        schema.account_group_color_code = db_ledger.account_group.color_code
    if db_ledger.vendor:
        schema.vendor_name = db_ledger.vendor.name
    return schema

@router.put("/{ledger_id}", response_model=schemas.LedgerResponse)
def update_ledger(ledger_id: int, ledger: schemas.LedgerCreate, db: Session = Depends(get_db)):
    db_ledger = db.query(models.Ledger).filter(models.Ledger.id == ledger_id).first()
    if not db_ledger:
        raise HTTPException(status_code=404, detail="Ledger not found")
    
    for key, value in ledger.model_dump().items():
        setattr(db_ledger, key, value)
    
    db.commit()
    db.refresh(db_ledger)
    
    schema = schemas.LedgerResponse.model_validate(db_ledger)
    if db_ledger.account_group:
        schema.account_group_color_code = db_ledger.account_group.color_code
    if db_ledger.vendor:
        schema.vendor_name = db_ledger.vendor.name
    return schema

@router.delete("/{ledger_id}")
def delete_ledger(ledger_id: int, db: Session = Depends(get_db)):
    db_ledger = db.query(models.Ledger).filter(models.Ledger.id == ledger_id).first()
    if not db_ledger:
        raise HTTPException(status_code=404, detail="Ledger not found")
    db.delete(db_ledger)
    db.commit()
    return {"ok": True}
