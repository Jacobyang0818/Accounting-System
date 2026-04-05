from sqlalchemy import Column, Integer, String, Date, Numeric, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)

class AccountGroup(Base):
    __tablename__ = 'account_groups'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    color_code = Column(String(10), default='#FFFFFF')

class Vendor(Base):
    __tablename__ = 'vendors'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    tax_id = Column(String(20), nullable=True)
    address = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    bank_name = Column(String(50), nullable=True)
    branch_name = Column(String(50), nullable=True)
    bank_account = Column(String(50), nullable=True)

class ImportDict(Base):
    __tablename__ = 'import_dict'
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(20), nullable=False) # 'accounting_subj', 'transaction_basis'
    value = Column(String(100), nullable=False)

class Ledger(Base):
    __tablename__ = 'ledgers'
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    account_group_id = Column(Integer, ForeignKey('account_groups.id'))
    voucher_no = Column(String(50), nullable=True)
    accounting_subj = Column(Integer, ForeignKey('import_dict.id'))
    project_name = Column(String(100), nullable=True)
    summary = Column(Text, nullable=True)
    expense_amt = Column(Numeric(12,2), default=0)
    income_amt = Column(Numeric(12,2), default=0)
    payment_status = Column(Numeric(15,2), nullable=True, default=0)
    receipt_no = Column(String(50), nullable=True)
    vendor_id = Column(Integer, ForeignKey('vendors.id'))
    transaction_basis = Column(Integer, ForeignKey('import_dict.id'))
    notes = Column(Text, nullable=True)

    account_group = relationship("AccountGroup")
    accounting_subject_rel = relationship("ImportDict", foreign_keys=[accounting_subj])
    vendor = relationship("Vendor")
    transaction_basis_rel = relationship("ImportDict", foreign_keys=[transaction_basis])
