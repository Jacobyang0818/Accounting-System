import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date
from io import BytesIO

from app.database import get_db
import app.models as models

router = APIRouter(prefix="/api", tags=["Files"])

VALID_TARGETS = ["vendors", "account-groups", "import-dict", "ledgers"]

def _clean(row: dict) -> dict:
    return {k: (v if pd.notna(v) else None) for k, v in row.items()}

@router.post("/import/{target}")
async def import_data(target: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    if target not in VALID_TARGETS:
        raise HTTPException(status_code=400, detail=f"無效的匯入目標。可用選項: {VALID_TARGETS}")

    contents = await file.read()
    try:
        df = pd.read_excel(BytesIO(contents))
    except Exception:
        raise HTTPException(status_code=400, detail="無效的 Excel 檔案格式")

    records = df.to_dict(orient="records")
    inserted, skipped = 0, 0

    for row in records:
        row = _clean(row)
        try:
            if target == "vendors":
                # 廠商資料: 廠商名稱, 統一編號, 地址, 電話, 銀行名稱, 分行名稱, 匯款帳號
                name = row.get("廠商名稱") or row.get("name")
                if not name:
                    skipped += 1; continue
                existing = db.query(models.Vendor).filter(models.Vendor.name == name).first()
                if existing:
                    skipped += 1; continue
                obj = models.Vendor(
                    name=name,
                    tax_id=row.get("統一編號") or row.get("tax_id"),
                    address=row.get("地址") or row.get("address"),
                    phone=row.get("電話") or row.get("phone"),
                    bank_name=row.get("銀行名稱") or row.get("bank_name"),
                    branch_name=row.get("分行名稱") or row.get("branch_name"),
                    bank_account=row.get("匯款帳號") or row.get("bank_account"),
                )
                db.add(obj); inserted += 1

            elif target == "account-groups":
                # 寶號資料: 寶號名稱, 色號
                name = row.get("寶號名稱") or row.get("name")
                if not name:
                    skipped += 1; continue
                existing = db.query(models.AccountGroup).filter(models.AccountGroup.name == name).first()
                if existing:
                    color = row.get("色號") or row.get("color_code")
                    if color:
                        existing.color_code = color
                    skipped += 1; continue
                obj = models.AccountGroup(
                    name=name,
                    color_code=row.get("色號") or row.get("color_code") or "#FFFFFF",
                )
                db.add(obj); inserted += 1

            elif target == "import-dict":
                # 匯入資料: 會計科目 and/or 出/入帳依據 columns (each row may have one or both)
                acc_subj = row.get("會計科目")
                trans_basis = row.get("出/入帳依據")
                added = False

                if acc_subj:
                    existing = db.query(models.ImportDict).filter(
                        models.ImportDict.category == "accounting_subj",
                        models.ImportDict.value == str(acc_subj)
                    ).first()
                    if not existing:
                        db.add(models.ImportDict(category="accounting_subj", value=str(acc_subj)))
                        inserted += 1; added = True
                    else:
                        if not added: skipped += 1

                if trans_basis:
                    existing = db.query(models.ImportDict).filter(
                        models.ImportDict.category == "transaction_basis",
                        models.ImportDict.value == str(trans_basis)
                    ).first()
                    if not existing:
                        db.add(models.ImportDict(category="transaction_basis", value=str(trans_basis)))
                        inserted += 1; added = True
                    else:
                        if not added: skipped += 1

                if not acc_subj and not trans_basis:
                    skipped += 1

                continue  # don't hit the generic path below

            elif target == "ledgers":
                # 總帳: 歸帳寶號, 日期, 會計科目, 工程名稱, 摘要, 支出金額, 收入金額, 已請款未收付, 憑證, 廠商, 出/入帳依據, 備註
                def lookup_group(name_val):
                    if not name_val: return None
                    r = db.query(models.AccountGroup).filter(models.AccountGroup.name == str(name_val)).first()
                    return r.id if r else None

                def lookup_vendor(name_val):
                    if not name_val: return None
                    r = db.query(models.Vendor).filter(models.Vendor.name == str(name_val)).first()
                    return r.id if r else None

                def lookup_dict(cat, val):
                    if not val: return None
                    r = db.query(models.ImportDict).filter(
                        models.ImportDict.category == cat,
                        models.ImportDict.value == str(val)
                    ).first()
                    return r.id if r else None

                # Support both Chinese and English column names
                group_id = lookup_group(row.get("歸帳寶號")) or row.get("account_group_id")
                vendor_id = lookup_vendor(row.get("廠商")) or row.get("vendor_id")
                acc_subj_id = lookup_dict("accounting_subj", row.get("會計科目")) or row.get("accounting_subj")
                trans_basis_id = lookup_dict("transaction_basis", row.get("出/入帳依據")) or row.get("transaction_basis")

                raw_date = row.get("日期") or row.get("date")
                if raw_date is None:
                    skipped += 1; continue

                obj = models.Ledger(
                    date=raw_date,
                    account_group_id=group_id,
                    voucher_no=row.get("憑證") or row.get("voucher_no"),
                    accounting_subj=acc_subj_id,
                    project_name=row.get("工程名稱") or row.get("project_name"),
                    summary=row.get("摘要") or row.get("summary"),
                    expense_amt=row.get("支出金額") or row.get("expense_amt") or 0,
                    income_amt=row.get("收入金額") or row.get("income_amt") or 0,
                    payment_status=row.get("已請款未收付") or row.get("payment_status"),
                    receipt_no=row.get("收據號碼") or row.get("receipt_no"),
                    vendor_id=vendor_id,
                    transaction_basis=trans_basis_id,
                    notes=row.get("備註") or row.get("notes"),
                )
                db.add(obj); inserted += 1

        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"資料寫入錯誤: {str(e)}")

    try:
        db.commit()
        return {"message": f"匯入完成：新增 {inserted} 筆，略過 {skipped} 筆（已存在或空值）"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"資料庫錯誤: {str(e).split('DETAIL:')[0]}")


@router.get("/export/ledgers")
def export_ledgers(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    account_group_ids: Optional[List[int]] = Query(None),
    accounting_subj_ids: Optional[List[int]] = Query(None),
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

    ledgers = query.order_by(models.Ledger.date.desc()).all()

    data = []
    for l in ledgers:
        # Look up accounting subject and transaction basis labels
        acc_subj_label = db.query(models.ImportDict).filter(models.ImportDict.id == l.accounting_subj).first()
        trans_basis_label = db.query(models.ImportDict).filter(models.ImportDict.id == l.transaction_basis).first()
        data.append({
            "日期": l.date,
            "歸帳寶號": l.account_group.name if l.account_group else "",
            "憑證": l.voucher_no,
            "會計科目": acc_subj_label.value if acc_subj_label else "",
            "工程名稱": l.project_name,
            "摘要": l.summary,
            "支出金額": float(l.expense_amt),
            "收入金額": float(l.income_amt),
            "已請款未收付": l.payment_status,
            "廠商": l.vendor.name if l.vendor else "",
            "出/入帳依據": trans_basis_label.value if trans_basis_label else "",
            "備註": l.notes,
        })

    df = pd.DataFrame(data)
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=ledgers_export.xlsx"}
    )
