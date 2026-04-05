from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import date
from io import BytesIO
import pandas as pd

from app.database import get_db
import app.models as models

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/summary")
def report_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    account_group_ids: Optional[List[int]] = Query(None),
    vendor_ids: Optional[List[int]] = Query(None),
    db: Session = Depends(get_db),
):
    """Return totals grouped by accounting subject."""
    query = db.query(
        models.Ledger.accounting_subj,
        func.sum(models.Ledger.expense_amt).label("total_expense"),
        func.sum(models.Ledger.income_amt).label("total_income"),
        func.sum(models.Ledger.payment_status).label("total_payment"),
    ).group_by(models.Ledger.accounting_subj)

    if start_date:
        query = query.filter(models.Ledger.date >= start_date)
    if end_date:
        query = query.filter(models.Ledger.date <= end_date)
    if account_group_ids:
        query = query.filter(models.Ledger.account_group_id.in_(account_group_ids))
    if vendor_ids:
        query = query.filter(models.Ledger.vendor_id.in_(vendor_ids))

    rows = query.all()
    result = []
    for r in rows:
        label = None
        if r.accounting_subj:
            d = db.query(models.ImportDict).filter(models.ImportDict.id == r.accounting_subj).first()
            if d:
                label = d.value
        result.append({
            "accounting_subj_id": r.accounting_subj,
            "accounting_subj_label": label or f"ID:{r.accounting_subj}",
            "total_expense": float(r.total_expense or 0),
            "total_income": float(r.total_income or 0),
            "total_payment": float(r.total_payment or 0),
        })

    return result


@router.get("/summary/export")
def export_report_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    account_group_ids: Optional[List[int]] = Query(None),
    vendor_ids: Optional[List[int]] = Query(None),
    db: Session = Depends(get_db),
):
    data = report_summary(start_date, end_date, account_group_ids, vendor_ids, db)

    rows = [{"會計科目": r["accounting_subj_label"], "支出金額合計": r["total_expense"],
              "收入金額合計": r["total_income"], "已請款未收付合計": r["total_payment"]} for r in data]
    rows.append({
        "會計科目": "【合計】",
        "支出金額合計": sum(r["total_expense"] for r in data),
        "收入金額合計": sum(r["total_income"] for r in data),
        "已請款未收付合計": sum(r["total_payment"] for r in data),
    })

    df = pd.DataFrame(rows)
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False)
    output.seek(0)
    from urllib.parse import quote
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{quote('report_summary.xlsx', safe='')}"},
    )
