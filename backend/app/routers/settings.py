from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
import app.models as models

router = APIRouter(prefix="/api", tags=["Settings"])

class ColorPayload(BaseModel):
    color_code: str

@router.put("/account-groups/{group_id}/color")
def update_group_color(group_id: int, payload: ColorPayload, db: Session = Depends(get_db)):
    group = db.query(models.AccountGroup).filter(models.AccountGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Account group not found")
    
    group.color_code = payload.color_code
    db.commit()
    db.refresh(group)
    return {"message": "Color updated successfully", "color_code": group.color_code}
