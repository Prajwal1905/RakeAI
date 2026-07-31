from fastapi import APIRouter
import pandas as pd
import os

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, 'ml', 'saved_models')


@router.get("/forecast")
def get_forecast():
    try:
        forecast_path = os.path.join(MODELS_DIR, 'next_7_day_forecast.csv')
        forecast_df = pd.read_csv(forecast_path)
        result = {}
        forecast_df = forecast_df.loc[:, ~forecast_df.columns.str.contains('^Unnamed')]
        for col in forecast_df.columns:
            try:
                values = pd.to_numeric(forecast_df[col], errors='coerce').fillna(0)
                result[col] = {
                    "daily": [round(float(v), 2) for v in values.tolist()],
                    "total": round(float(values.sum()), 2),
                    "avg": round(float(values.mean()), 2)
                }
            except Exception:
                continue
        return {"status": "success", "days": 7, "forecast": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}