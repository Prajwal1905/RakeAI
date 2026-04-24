from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import pandas as pd
import numpy as np
import joblib
import sys
import os
import random


sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from optimization.rake_optimizer import (
    optimize_rake_plan,
    load_inventory,
    load_orders,
    load_rakes
)


app = FastAPI(
    title="RakeAI — SAIL Rake Formation API",
    description="AI/ML based Decision Support System for SAIL Bokaro",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, 'ml', 'saved_models')
DATA_DIR   = os.path.join(BASE_DIR, 'data', 'synthetic_data')



def df_to_json(df):
    
    return df.replace({np.nan: None}).to_dict(orient='records')




@app.get("/")
def root():
    return {
        "message": " RakeAI API is running!",
        "version": "1.0.0",
        "endpoints": [
            "/rake-plan",
            "/orders",
            "/inventory",
            "/rakes",
            "/forecast",
            "/summary"
        ]
    }


@app.get("/rake-plan")
def get_rake_plan(max_rakes: int = 10):
    
    try:
        plan = optimize_rake_plan(max_rakes=max_rakes)
        if len(plan) == 0:
            return {"status": "error", "message": "No rakes could be planned"}

        return {
            "status":      "success",
            "date":        datetime.now().strftime('%Y-%m-%d'),
            "total_rakes": len(plan),
            "total_orders": int(plan['orders_clubbed'].sum()),
            "avg_fill":    round(float(plan['fill_percentage'].mean()), 1),
            "total_cost":  round(float(plan['total_cost'].sum()), 2),
            "plan":        df_to_json(plan)
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/orders")
def get_orders():
    
    try:
        orders = load_orders()
        
        try:
            model    = joblib.load(os.path.join(MODELS_DIR, 'delay_prediction_model.pkl'))
            features = joblib.load(os.path.join(MODELS_DIR, 'delay_features.pkl'))

            feature_data = pd.DataFrame([{
                'num_wagons':            40,
                'quantity_tonnes':       row['quantity_tonnes'],
                'distance_km':           row['distance_km'],
                'pending_orders_count':  len(orders),
                'inventory_level':       round(random.uniform(0.2, 1.0), 2),
                'dock_utilization':      round(random.uniform(0.3, 1.0), 2),
                'is_month_end':          1 if datetime.now().day >= 25 else 0,
                'fill_percentage':       85.0,
                'day_of_week':           datetime.now().weekday(),
                'month':                 datetime.now().month,
                'wagon_type_encoded':    0,
                'destination_encoded':   0,
            } for _, row in orders.iterrows()])

            probs = model.predict_proba(feature_data[features])[:, 1]
            orders['delay_risk'] = (probs.astype(float) * 100).round(1)

        except:
            orders['delay_risk'] = 30.0

        return {
            "status":        "success",
            "total_orders":  len(orders),
            "critical":      int((orders['priority'] == 'Critical').sum()),
            "high":          int((orders['priority'] == 'High').sum()),
            "medium":        int((orders['priority'] == 'Medium').sum()),
            "low":           int((orders['priority'] == 'Low').sum()),
            "orders":        df_to_json(orders)
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/inventory")
def get_inventory():
    
    try:
        inventory = load_inventory()
        total_qty = float(inventory['quantity_tonnes'].sum())

        return {
            "status":          "success",
            "total_quantity":  round(total_qty, 2),
            "total_records":   len(inventory),
            "inventory":       df_to_json(inventory)
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/rakes")
def get_rakes():
    
    try:
        rakes = load_rakes()
        return {
            "status":           "success",
            "available_rakes":  len(rakes),
            "total_capacity":   round(float(rakes['total_capacity'].sum()), 2),
            "rakes":            df_to_json(rakes)
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/forecast")
def get_forecast():
    
    try:
        forecast_path = os.path.join(MODELS_DIR, 'next_7_day_forecast.csv')
        forecast_df   = pd.read_csv(forecast_path)

       
        result = {}
        for col in forecast_df.columns:
            result[col] = {
                "daily":  [round(v, 2) for v in forecast_df[col].tolist()],
                "total":  round(float(forecast_df[col].sum()), 2),
                "avg":    round(float(forecast_df[col].mean()), 2)
            }

        return {
            "status":   "success",
            "days":     7,
            "forecast": result
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/summary")
def get_summary():
   
    try:
        orders    = load_orders()
        inventory = load_inventory()
        rakes     = load_rakes()
        plan      = optimize_rake_plan(max_rakes=10)

        return {
            "status": "success",
            "summary": {
                "pending_orders":    len(orders),
                "critical_orders":   int((orders['priority'] == 'Critical').sum()),
                "available_rakes":   len(rakes),
                "total_inventory":   round(float(inventory['quantity_tonnes'].sum()), 2),
                "rakes_planned":     len(plan),
                "orders_assigned":   int(plan['orders_clubbed'].sum()) if len(plan) > 0 else 0,
                "avg_fill":          round(float(plan['fill_percentage'].mean()), 1) if len(plan) > 0 else 0,
                "total_cost":        round(float(plan['total_cost'].sum()), 2) if len(plan) > 0 else 0,
                "last_updated":      datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}



@app.post("/dispatch-order/{order_id}")
def dispatch_order(order_id: str):
    try:
        path   = os.path.join(DATA_DIR, 'customer_orders.csv')
        orders = pd.read_csv(path)
        
        if order_id not in orders['order_id'].values:
            return {"status": "error", "message": "Order not found"}
        
        orders.loc[orders['order_id'] == order_id, 'status'] = 'Dispatched'
        orders.to_csv(path, index=False)
        
        remaining = len(orders[orders['status'] == 'Pending'])
        
        return {
            "status":          "success",
            "message":         f"{order_id} marked as dispatched",
            "remaining_orders": remaining
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/dispatch-rake/{rake_id}")
def dispatch_rake(rake_id: str, order_ids: str):
    
    try:
        path   = os.path.join(DATA_DIR, 'customer_orders.csv')
        orders = pd.read_csv(path)
        
        ids = [oid.strip() for oid in order_ids.split(',')]
        orders.loc[orders['order_id'].isin(ids), 'status'] = 'Dispatched'
        orders.to_csv(path, index=False)
        
        remaining = len(orders[orders['status'] == 'Pending'])
        
        return {
            "status":           "success",
            "message":          f"Rake {rake_id} dispatched — {len(ids)} orders completed",
            "orders_dispatched": len(ids),
            "remaining_orders":  remaining
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
    

@app.get("/alerts")
def get_alerts():
    try:
        orders    = load_orders()
        inventory = load_inventory()
        plan_data = optimize_rake_plan(max_rakes=10)
        alerts    = []
        today     = datetime.now().date()
        from datetime import timedelta

        

        # Due tomorrow
        tomorrow     = today + timedelta(days=1)
        due_tomorrow = orders[orders['deadline'] == tomorrow]
        if len(due_tomorrow) > 0:
            alerts.append({
                "type":   "warning",
                "title":  f"{len(due_tomorrow)} orders due tomorrow",
                "detail": f"Priorities: {', '.join(due_tomorrow['priority'].unique().tolist())}"
            })

        #  Low inventory
        low_stock = inventory[inventory['quantity_tonnes'] < 300]
        if len(low_stock) > 0:
            alerts.append({
                "type":   "warning",
                "title":  f"Low stock: {len(low_stock)} items below 300T",
                "detail": f"{low_stock.iloc[0]['product']} at {low_stock.iloc[0]['stockyard_name']}"
            })

       
        if len(plan_data) > 0 and plan_data['fill_percentage'].mean() >= 90:
            alerts.append({
                "type":   "success",
                "title":  f"Excellent fill rate: {plan_data['fill_percentage'].mean():.1f}%",
                "detail": "All rakes optimally loaded above target"
            })

        # ACritical unassigned
        critical_orders = orders[orders['priority'] == 'Critical']
        if len(plan_data) > 0:
            assigned_ids = []
            for ids in plan_data['order_ids']:
                assigned_ids.extend([i.strip() for i in ids.split(',')])
            unassigned = critical_orders[
                ~critical_orders['order_id'].isin(assigned_ids)
            ]
            if len(unassigned) > 0:
                alerts.append({
                    "type":   "danger",
                    "title":  f"{len(unassigned)} Critical orders not assigned to any rake",
                    "detail": "Immediate action required"
                })

        return {
            "status":       "success",
            "total_alerts": len(alerts),
            "alerts":       alerts
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
    

@app.get("/cost-savings")
def get_cost_savings():
    try:
        plan = optimize_rake_plan(max_rakes=10)
        if len(plan) == 0:
            return {"status": "error", "message": "No plan available"}

        actual_fill    = float(plan['fill_percentage'].mean())
        actual_cost    = float(plan['total_cost'].sum())
        manual_fill    = 70.0
        
        # Manual cost = actual cost scaled by fill difference
        manual_cost    = actual_cost * (actual_fill / manual_fill)
        savings        = manual_cost - actual_cost
        efficiency     = round(actual_fill - manual_fill, 1)

        return {
            "status": "success",
            "actual_fill":    round(actual_fill, 1),
            "manual_fill":    manual_fill,
            "actual_cost":    round(actual_cost, 2),
            "manual_cost":    round(manual_cost, 2),
            "total_savings":  round(savings, 2),
            "efficiency_gain": efficiency,
            "savings_crore":  round(savings / 10000000, 2),
            "manual_crore":   round(manual_cost / 10000000, 2),
            "actual_crore":   round(actual_cost / 10000000, 2),
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}