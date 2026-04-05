# Ledger Frontend Client

The frontend interface for the Accounting System, utilizing incredibly fast modular components under React.

## Technologies

*   **Build Engine**: Vite
*   **Library**: React (TypeScript)
*   **Styling**: Tailwind CSS v4, Lucide React (Icons)
*   **Data Handling**: TanStack React Table v8, React Hook Form
*   **Routing**: React Router DOM (v6)

## Setup for Local Development

Make sure you have `Node.js` (LTS Version 18+) installed natively.

1.  **Install Dependencies**
    Execute within `/frontend`:
    ```bash
    npm install
    ```
2.  **Start Development Server**
    You can easily boot up the dev-proxy server with Hot Modular Replacement (HMR) targeting `8000` default Python environments natively mapping `api/` requests implicitly.
    ```bash
    npm run dev
    ```
    (The Server normally launches at `http://localhost:5173`)
3.  **Building for Production**
    This strips out dev-only artifacts.
    ```bash
    npm run build
    ```
    The `/dist` chunk files will be served statically via an Nginx proxy defined in `/frontend/Dockerfile`.
