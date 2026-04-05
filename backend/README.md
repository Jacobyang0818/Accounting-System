# Ledger API Service (Backend)

The backend engine that drives the Accounting System, powered by **FastAPI**.

## Technologies

*   **Runtime:** Python 3.13
*   **Web Framework:** FastAPI + Uvicorn
*   **Database ORM:** SQLAlchemy
*   **Database Migration:** Alembic
*   **Database:** PostgreSQL (`psycopg2-binary`)
*   **Security:** `python-jose` (JWT), `bcrypt` (Hashing)

## Setup for Development

1.  **Initialize Python Environment**
    We recommend using `uv` to orchestrate environments.
    ```bash
    uv venv
    ```
2.  **Activate Virtual Environment**
    ```bash
    # Windows
    .venv\Scripts\activate
    ```
3.  **Install Dependencies**
    ```bash
    uv pip sync requirements.txt
    ```
4.  **Database Initial State**
    Before booting up, you must spin up a `postgres` database instance. You can either deploy one natively or run just the database service via Docker Compose from the root.

5.  **Environmental File**
    Run:
    ```bash
    cp .env.example .env
    ```
    Then update the SMTP App Passwords properly for the Email service to initiate password resets.

## Database Migrations
We utilize `alembic` to keep schema revisions. If you make alterations to `models.py`, navigate into this directory and execute:
```bash
alembic revision --autogenerate -m "message"
alembic upgrade head
```

## Running the Server
To run exactly for local debugging:
```bash
uv run uvicorn app.main:app --reload --port 8000
```
Then visit `http://localhost:8000/docs` to visualize the OpenAPI REST specifications.
