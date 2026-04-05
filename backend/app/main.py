from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import app.models as models
from app.database import engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Ledger Management System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Since it's behind a proxy or local port, allow * or specific frontend port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routers import options, ledgers, settings, files, master, reports, auth
from fastapi import Depends
from app.routers.auth import get_current_user

app.include_router(auth.router)

# Protect all other routers with authentication
auth_deps = [Depends(get_current_user)]
app.include_router(options.router, dependencies=auth_deps)
app.include_router(ledgers.router, dependencies=auth_deps)
app.include_router(settings.router, dependencies=auth_deps)
app.include_router(files.router, dependencies=auth_deps)
app.include_router(master.router, dependencies=auth_deps)
app.include_router(reports.router, dependencies=auth_deps)

@app.get("/health")
def health_check():
    return {"status": "ok"}
