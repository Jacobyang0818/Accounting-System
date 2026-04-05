from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
import random
import string
import smtplib
from email.mime.text import MIMEText
import os

from app.database import get_db
import app.models as models
import app.schemas as schemas
from app.auth_utils import verify_password, get_password_hash, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    from jose import jwt, JWTError
    from app.auth_utils import SECRET_KEY, ALGORITHM
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@router.get("/check-init")
def check_init(db: Session = Depends(get_db)):
    """Check if the system has been initialized (at least one user exists)"""
    user_count = db.query(models.User).count()
    return {"initialized": user_count > 0}

@router.post("/init", response_model=schemas.UserResponse)
def init_admin(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    """Create the first admin user. Fails if a user already exists."""
    user_count = db.query(models.User).count()
    if user_count > 0:
        raise HTTPException(status_code=400, detail="System already initialized")
    
    hashed_password = get_password_hash(user_in.password)
    new_user = models.User(email=user_in.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.post("/reset-password")
def reset_password(req: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password by generating a new random one, updating DB, and sending an email."""
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Generate new random password
    chars = string.ascii_letters + string.digits
    new_password = ''.join(random.choice(chars) for _ in range(12))
    
    # Update Database
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    
    # Send Email
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = os.getenv("SMTP_PORT")
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM_EMAIL", smtp_username)

    email_body = f"""
    您好，
    
    您在會計系統上的密碼已被重設。
    您的臨時新密碼為： {new_password}
    
    請使用新密碼登入後，至「設定」頁面修改您的密碼。
    """

    if smtp_server and smtp_username and smtp_password:
        try:
            msg = MIMEText(email_body)
            msg['Subject'] = "會計系統 - 密碼重設通知"
            msg['From'] = smtp_from
            msg['To'] = user.email
            
            with smtplib.SMTP(smtp_server, int(smtp_port)) as server:
                server.starttls()
                server.login(smtp_username, smtp_password)
                server.send_message(msg)
        except Exception as e:
            print(f"Failed to send email: {e}")
            # we won't fail the request since password was reset, but log error
            return {"ok": True, "message": "密碼已重設，但信件發送失敗。請檢查伺服器紀錄。"}
    else:
        # Fallback to printing in console if SMTP is not configured
        print("====== PASSWORD RESET ======")
        print(f"Email: {user.email}")
        print(f"New Password: {new_password}")
        print("============================")
        return {"ok": True, "message": "SMTP未設定。臨時密碼已列印在後端終端機。"}

    return {"ok": True, "message": "臨時密碼已寄送至您的信箱。"}

@router.post("/change-password")
def change_password(req: schemas.ChangePasswordRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(req.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="舊密碼錯誤")
    
    current_user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    return {"ok": True, "message": "密碼修改成功"}
