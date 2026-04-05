# Ledger Management System (會計總帳管理系統)

A full-stack, modular web application built with **FastAPI** (Python 3.13) and **React** (TypeScript, Vite, Tailwind CSS 4). The system is designed to seamlessly manage accounting ledgers, account groups, and vendors with a modern, high-contrast, responsive UI.

## Features

*   ✅ **Dynamic Accounting Ledgers**: Manage daily incomes/expenses mapped directly to account groups and vendors.
*   ✅ **Bulk Excel Handling**: Import records effortlessly via drag-and-drop; export customized filtered tables to `.xlsx`.
*   ✅ **Deep Search & Filtering**: Client-side sorting and powerful querying using TanStack Table with sub-group summaries.
*   ✅ **Theme Switching**: Includes a meticulously designed **Dark Mode** toggle leveraging Tailwind v4 variables for all components.
*   ✅ **Authentication System**: Securely access the portal utilizing JWT. Provides an initial registration process, dynamic password hashing, and forgot password via SMTP.
*   ✅ **Containerized Deployment**: Zero-hassle deployments orchestrating the UI, Backend API, and Postgres sequentially.

## Architecture

*   **Frontend**: React + Vite + TypeScript + TailwindCSS v4
*   **Backend**: FastAPI + SQLAlchemy (PostgreSQL) + Alembic
*   **Database**: PostgreSQL 15 

## Quick Start (Deploy via Docker Hub)

If you just want to run the system without downloading the source code, you can deploy it natively using our pre-built Docker Hub images.

### 1. Create a Work Directory
Create an empty folder on your server and navigate into it:
```bash
mkdir accounting-system && cd accounting-system
```

### 2. Configure Environment Variables (`.env`)
Create a `.env` file in the directory to store your credentials:
```bash
touch .env
```
Populate `.env` with the following template:
```env
# Authentication Configuration
SECRET_KEY=super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# SMTP Email Configuration for Password Reset
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM_EMAIL=your_email@gmail.com
```

### 3. Create `docker-compose.yml`
Create a `docker-compose.yml` file and paste the following runtime orchestrator logic:
```yaml
version: '3.8'

services:
  frontend:
    image: jacob860818/accounting-system-frontend:latest
    ports:
      - "3018:80"
    depends_on:
      - backend

  backend:
    image: jacob860818/accounting-system-backend:latest
    ports:
      - "8018:8000"
    env_file:
      - .env
    depends_on:
      - db
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ledger_user
      POSTGRES_PASSWORD: ledger_password
      POSTGRES_DB: ledger_db
    ports:
      - "5418:5432"
    volumes:
      - ./pgdata:/var/lib/postgresql/data
```

### 4. Launch the System
Download the images and boot the portal:
```bash
docker compose up -d
```
Navigate to `http://localhost:3018` in your browser. Upon the first launch, it will prompt you to set up an admin account.

---

## Deploy from Source Code

### 1. Configure the `.env`
Navigate to the `backend` folder and duplicate the example environment variables file:
```bash
cp backend/.env.example backend/.env
```
Make sure you replace the `SMTP_USERNAME`, `SMTP_PASSWORD` and `SMTP_FROM_EMAIL` properties in `backend/.env` with an active Gmail account and Google App Password respectively if you want the "Forgot Password" feature to work.

*(Note: The `.env` file should **NEVER** be committed to the repository for security reasons!)*

### 2. Launch the Application
In this project root directly run:
```bash
docker compose up -d --build
```
This automatically initiates the Database, Backend (Port `8018`), and Frontend (Port `3018`).

## Local Development
If you prefer running components dynamically via watch servers, please look inside the individual directories details:
- [Backend Documentation](./backend/README.md)
- [Frontend Documentation](./frontend/README.md)

## Screenshots
Please reference the walkthrough documents for full feature displays.
