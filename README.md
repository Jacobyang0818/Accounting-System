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

## Quick Start (Dockerized Production)

The fastest and most stable way to spin up the system is using Docker Desktop. 

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

### 3. Open the Dashboard
Navigate to `http://localhost:3018` in your browser.
Upon launching for the first time, you will be prompted to setup an initial admin account. Input an email and secure password!

## Local Development
If you prefer running components dynamically via watch servers, please look inside the individual directories details:
- [Backend Documentation](./backend/README.md)
- [Frontend Documentation](./frontend/README.md)

## Screenshots
Please reference the walkthrough documents for full feature displays.
