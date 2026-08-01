from fastapi import APIRouter
import pandas as pd
import numpy as np
import joblib
import os
import random
from datetime import datetime, timedelta
from optimization.rake_optimizer import optimize_rake_plan, load_orders, load_inventory

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS_DIR = os.path.join(BASE_DIR, 'ml', 'saved_models')

def df_to_json(df):
    return df.replace({np.nan: None}).to_dict(orient='records')


@router.get("/orders")
def get_orders():
    try:
        orders = load_orders()
        try:
            model = joblib.load(os.path.join(MODELS_DIR, 'delay_prediction_model.pkl'))
            features = joblib.load(os.path.join(MODELS_DIR, 'delay_features.pkl'))
            feature_data = pd.DataFrame([{
                'num_wagons': 40,
                'quantity_tonnes': row['quantity_tonnes'],
                'distance_km': row['distance_km'],
                'pending_orders_count': len(orders),
                'inventory_level': round(random.uniform(0.2, 1.0), 2),
                'dock_utilization': round(random.uniform(0.3, 1.0), 2),
                'is_month_end': 1 if datetime.now().day >= 25 else 0,
                'fill_percentage': 85.0,
                'day_of_week': datetime.now().weekday(),
                'month': datetime.now().month,
                'wagon_type_encoded': 0,
                'destination_encoded': 0,
            } for _, row in orders.iterrows()])
            probs = model.predict_proba(feature_data[features])[:, 1]
            orders['delay_risk'] = (probs.astype(float) * 100).round(1)
        except:
            orders['delay_risk'] = 30.0

        return {
            "status": "success",
            "total_orders": len(orders),
            "critical": int((orders['priority'] == 'Critical').sum()),
            "high": int((orders['priority'] == 'High').sum()),
            "medium": int((orders['priority'] == 'Medium').sum()),
            "low": int((orders['priority'] == 'Low').sum()),
            "orders": df_to_json(orders)
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.get("/alerts")
def get_alerts():
    try:
        orders = load_orders()
        inventory = load_inventory()
        plan_data = optimize_rake_plan(max_rakes=10)
        alerts = []
        today = datetime.now().date()

        tomorrow = today + timedelta(days=1)
        due_tomorrow = orders[orders['deadline'] == tomorrow]
        if len(due_tomorrow) > 0:
            alerts.append({
                "type": "warning",
                "title": f"{len(due_tomorrow)} orders due tomorrow",
                "detail": f"Priorities: {', '.join(due_tomorrow['priority'].unique().tolist())}"
            })

        low_stock = inventory[inventory['quantity_tonnes'] < 300]
        if len(low_stock) > 0:
            alerts.append({
                "type": "warning",
                "title": f"Low stock: {len(low_stock)} items below 300T",
                "detail": f"{low_stock.iloc[0]['product']} at {low_stock.iloc[0]['stockyard_name']}"
            })

        if len(plan_data) > 0 and plan_data['fill_percentage'].mean() >= 90:
            alerts.append({
                "type": "success",
                "title": f"Excellent fill rate: {plan_data['fill_percentage'].mean():.1f}%",
                "detail": "All rakes optimally loaded above target"
            })

        critical_orders = orders[orders['priority'] == 'Critical']
        if len(plan_data) > 0:
            assigned_ids = []
            for ids in plan_data['order_ids']:
                assigned_ids.extend([i.strip() for i in ids.split(',')])
            unassigned = critical_orders[~critical_orders['order_id'].isin(assigned_ids)]
            if len(unassigned) > 0:
                alerts.append({
                    "type": "danger",
                    "title": f"{len(unassigned)} Critical orders not assigned to any rake",
                    "detail": "Immediate action required"
                })

        return {"status": "success", "total_alerts": len(alerts), "alerts": alerts}
    except Exception as e:
        return {"status": "error", "message": str(e)}