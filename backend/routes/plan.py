from fastapi import APIRouter
import pandas as pd
from datetime import datetime
import os
from optimization.rake_optimizer import optimize_rake_plan

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, 'data', 'synthetic_data')

def df_to_json(df):
    import numpy as np
    return df.replace({np.nan: None}).to_dict(orient='records')


@router.get("/rake-plan")
def get_rake_plan(max_rakes: int = 10):
    try:
        plan = optimize_rake_plan(max_rakes=max_rakes)
        if len(plan) == 0:
            return {"status": "error", "message": "No rakes could be planned"}
        return {
            "status": "success",
            "date": datetime.now().strftime('%Y-%m-%d'),
            "total_rakes": len(plan),
            "total_orders": int(plan['orders_clubbed'].sum()),
            "avg_fill": round(float(plan['fill_percentage'].mean()), 1),
            "total_cost": round(float(plan['total_cost'].sum()), 2),
            "plan": df_to_json(plan)
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/dispatch-order/{order_id}")
def dispatch_order(order_id: str):
    try:
        path = os.path.join(DATA_DIR, 'customer_orders.csv')
        orders = pd.read_csv(path)
        if order_id not in orders['order_id'].values:
            return {"status": "error", "message": "Order not found"}
        orders.loc[orders['order_id'] == order_id, 'status'] = 'Dispatched'
        orders.to_csv(path, index=False)
        remaining = len(orders[orders['status'] == 'Pending'])
        return {
            "status": "success",
            "message": f"{order_id} marked as dispatched",
            "remaining_orders": remaining
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/dispatch-rake/{rake_id}")
def dispatch_rake(rake_id: str, order_ids: str):
    try:
        path = os.path.join(DATA_DIR, 'customer_orders.csv')
        orders = pd.read_csv(path)
        ids = [oid.strip() for oid in order_ids.split(',')]
        orders.loc[orders['order_id'].isin(ids), 'status'] = 'Dispatched'
        orders.to_csv(path, index=False)
        remaining = len(orders[orders['status'] == 'Pending'])
        return {
            "status": "success",
            "message": f"Rake {rake_id} dispatched — {len(ids)} orders completed",
            "orders_dispatched": len(ids),
            "remaining_orders": remaining
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}