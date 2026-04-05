from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import date
from decimal import Decimal

class AccountGroupBase(BaseModel):
    name: str
    color_code: str = "#FFFFFF"

class AccountGroupCreate(AccountGroupBase):
    pass

class AccountGroupResponse(AccountGroupBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class VendorBase(BaseModel):
    name: str
    tax_id: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    bank_name: Optional[str] = None
    branch_name: Optional[str] = None
    bank_account: Optional[str] = None

class VendorCreate(VendorBase):
    pass

class VendorResponse(VendorBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ImportDictBase(BaseModel):
    category: str
    value: str

class ImportDictCreate(ImportDictBase):
    pass

class ImportDictResponse(ImportDictBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class LedgerBase(BaseModel):
    date: date
    account_group_id: Optional[int] = None
    voucher_no: Optional[str] = None
    accounting_subj: Optional[int] = None
    project_name: Optional[str] = None
    summary: Optional[str] = None
    expense_amt: Decimal = Decimal('0.00')
    income_amt: Decimal = Decimal('0.00')
    payment_status: Optional[Decimal] = None
    receipt_no: Optional[str] = None
    vendor_id: Optional[int] = None
    transaction_basis: Optional[int] = None
    notes: Optional[str] = None

class LedgerCreate(LedgerBase):
    pass

class LedgerResponse(LedgerBase):
    id: int
    account_group_color_code: Optional[str] = None
    account_group_name: Optional[str] = None
    vendor_name: Optional[str] = None
    accounting_subj_label: Optional[str] = None
    transaction_basis_label: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    model_config = ConfigDict(from_attributes=True)

class ResetPasswordRequest(BaseModel):
    email: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
