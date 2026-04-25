# ⚡ DataClean Pro — Full-Stack Data Cleaning Dashboard

A full-stack app with a **Python FastAPI backend** and **React + Vite frontend** for cleaning CSV/Excel files and visualizing data quality with a Power BI-style dashboard.

---

## 📁 Project Structure

```
dataclean-pro/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── requirements.txt
│   ├── api/
│   │   └── routes.py            # All API endpoints
│   ├── cleaner/
│   │   ├── analyzer.py          # Data quality analysis & reports
│   │   ├── null_handler.py      # Null/missing value detection & fixing
│   │   ├── duplicate_checker.py # Duplicate row detection & removal
│   │   ├── type_checker.py      # Data type mismatch detection & coercion
│   │   └── spell_checker.py     # Whitespace, casing, formatting fixes
│   └── utils/
│       └── file_parser.py       # CSV/Excel file parsing
│
└── frontend/
    ├── index.html
    ├── vite.config.js           # Vite + proxy config
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx              # Root component, page routing
        ├── index.css            # Global dark theme styles
        ├── utils/
        │   └── api.js           # Axios API calls to backend
        ├── components/
        │   ├── Navbar.jsx
        │   └── Clean/
        │       ├── StatBar.jsx      # Quality score cards
        │       ├── IssuesList.jsx   # Per-column issue breakdown
        │       └── DataPreview.jsx  # Scrollable data table
        └── pages/
            ├── UploadPage.jsx    # Drag & drop file upload
            ├── CleanPage.jsx     # Cleaning tools & issue list
            └── DashboardPage.jsx # Charts & analytics dashboard
```

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API will be live at: http://localhost:8000  
Swagger docs at: http://localhost:8000/docs

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App will open at: http://localhost:5173

---

## 🔌 API Endpoints

| Method | Endpoint              | Description                          |
|--------|-----------------------|--------------------------------------|
| POST   | /api/upload           | Upload CSV/Excel → returns report    |
| POST   | /api/fix/nulls        | Fill null values (auto/mean/mode)    |
| POST   | /api/fix/duplicates   | Remove duplicate rows                |
| POST   | /api/fix/types        | Auto-coerce column types             |
| POST   | /api/fix/spelling     | Fix whitespace, casing               |
| POST   | /api/fix/all          | Run all fixes in sequence            |
| GET    | /api/report/{id}      | Get quality report for session       |
| GET    | /api/dashboard/{id}   | Get chart data for dashboard         |
| GET    | /api/export/{id}      | Download cleaned CSV                 |

---

## ✨ Features

- **Null Handling** — Detects empty, N/A, null, undefined. Auto-fills with mean (numeric) or mode (text)
- **Duplicate Detection** — Finds and removes exact duplicate rows
- **Type Checking** — Detects text in numeric columns, auto-coerces types
- **Spelling Fix** — Trims whitespace, fixes name casing, normalizes emails
- **Quality Score** — 0–100 score based on total issues vs total cells
- **Dashboard** — Donut charts, bar charts, histograms, value counts
- **Export** — Download cleaned CSV at any point

---

## 🛠 Tech Stack

| Layer    | Technology                  |
|----------|-----------------------------|
| Backend  | Python, FastAPI, Pandas, NumPy |
| Frontend | React 18, Vite, Chart.js    |
| Styling  | Pure CSS (dark theme)       |
| File I/O | PapaParse, SheetJS (xlsx)   |
