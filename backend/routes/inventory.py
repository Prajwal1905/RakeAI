from fastapi import APIRouter
import pandas as pd
import numpy as np
import os
from optimization.rake_optimizer import load_inventory, load_rakes

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, 'ml', 'saved_models')

def df_to_json(df):
    return df.replace({np.nan: None}).to_dict(orient='records')


@router.get("/inventory")
def get_inventory():
    try:
        inventory = load_inventory()
        total_qty = float(inventory['quantity_tonnes'].sum())
        return {
            "status": "success",
            "total_quantity": round(total_qty, 2),
            "total_records": len(inventory),
            "inventory": df_to_json(inventory)
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.get("/rakes")
def get_rakes():
    try:
        rakes = load_rakes()
        return {
            "status": "success",
            "available_rakes": len(rakes),
            "total_capacity": round(float(rakes['total_capacity'].sum()), 2),
            "rakes": df_to_json(rakes)
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.get("/reorder-alerts")
def get_reorder_alerts():
    try:
        inventory = load_inventory()
        forecast_path = os.path.join(MODELS_DIR, 'next_7_day_forecast.csv')
        forecast_df = pd.read_csv(forecast_path)
        alerts = []

        for product in inventory['product'].unique():
            total_stock = float(inventory[inventory['product'] == product]['quantity_tonnes'].sum())
            if product in forecast_df.columns:
                daily_demand = float(forecast_df[product].mean())
            else:
                daily_demand = 500.0
            days_left = round(total_stock / daily_demand, 1) if daily_demand > 0 else 999

            if days_left <= 2:
                status = "critical"
            elif days_left <= 5:
                status = "warning"
            else:
                status = "safe"

            alerts.append({
                "product": product,
                "total_stock": round(total_stock, 2),
                "daily_demand": round(daily_demand, 2),
                "days_left": days_left,
                "status": status,
                "reorder_qty": round(daily_demand * 7, 2)
            })

        alerts.sort(key=lambda x: x['days_left'])

        return {
            "status": "success",
            "total_products": len(alerts),
            "critical": len([a for a in alerts if a['status'] == 'critical']),
            "warning": len([a for a in alerts if a['status'] == 'warning']),
            "safe": len([a for a in alerts if a['status'] == 'safe']),
            "alerts": alerts
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}