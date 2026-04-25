# RakeAI
**AI/ML Decision Support System for Rake Formation — SAIL Bokaro Steel Plant**

---

## Problem

SAIL Bokaro manually plans railway rake dispatch every morning using SAP and Excel. This process:
- Takes 3–4 hours daily per logistics planner
- Results in ~70% average rake fill (30% capacity wasted)
- Causes missed deadlines due to poor order prioritization
- Has no predictive visibility into delays or stockouts
- Costs crores in avoidable demurrage and penalty charges

---

## Solution

RakeAI automates the entire planning process using AI/ML:
- **Optimizer** clubs multiple orders into single rakes to maximize fill rate
- **ML models** predict delay risk per order before dispatch
- **ARIMA forecasting** predicts next 7 days demand per product
- **What-If simulator** models financial impact of delays in real time
- **Smart alerts** flag critical orders, low stock, and fill anomalies proactively

Result: A logistics planner opens the dashboard at 8am and the optimal rake plan is already ready.

---

## Results

- Rake fill rate: **94.3%** vs industry average of 70%
- Estimated saving: **₹1.93 Crore/day** → ₹704 Crore/year
- Planning time: **30 seconds** vs 3–4 hours manually

---

## ML Models

| Model | Algorithm | Result |
|---|---|---|
| Delay Prediction | XGBoost Classifier | 65% accuracy, ROC-AUC 0.74 |
| Fill % Prediction | XGBoost Regressor | R² = 0.96, MAE = 1.31% |
| Demand Forecast | ARIMA (2,0,2) | 7 products × 7 days ahead |

---

## Tech Stack

- **Backend:** Python, FastAPI, Scikit-learn, XGBoost, Statsmodels
- **Frontend:** React, Recharts
- **Data:** Synthetic data based on Indian Railways freight parameters and SAIL Annual Report 2023–24

---

## Setup

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Generate data
python data/generate_data.py

# 3. Train models (run all cells in each notebook)
# ml/delay_prediction.ipynb
# ml/fill_prediction.ipynb
# ml/demand_forecast.ipynb

# 4. Start backend
uvicorn backend.main:app --reload

# 5. Start frontend
cd frontend && npm install && npm start
```

Dashboard → `http://localhost:3000`
API Docs  → `http://127.0.0.1:8000/docs`

---

## Note on Data

Real SAIL data is proprietary. Synthetic data mirrors real operational parameters. In production, only the data ingestion layer needs replacing with SAP API connectors — all ML models and optimization logic remain unchanged.
