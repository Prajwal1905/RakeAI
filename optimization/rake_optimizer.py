import pandas as pd
import numpy as np
import joblib
import os
from datetime import datetime, date


BASE_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR   = os.path.join(BASE_DIR, 'data', 'synthetic_data')
MODELS_DIR = os.path.join(BASE_DIR, 'ml', 'saved_models')

FREIGHT_RATE        = 1.2    # INR per km per tonne
DEMURRAGE_RATE      = 15000  # INR per wagon per day
STORAGE_RATE        = 8      # INR per tonne per day
PENALTY_RATES       = {
    "Critical": 50000,
    "High":     30000,
    "Medium":   15000,
    "Low":      5000
}
MIN_WAGONS          = 40
MAX_WAGONS          = 58


def load_inventory():
    df = pd.read_csv(os.path.join(DATA_DIR, 'stockyard_inventory.csv'))
    print(f" Loaded inventory: {len(df)} records")
    return df

def load_orders():
    df = pd.read_csv(os.path.join(DATA_DIR, 'customer_orders.csv'))
    # Only pending orders
    df = df[df['status'] == 'Pending'].copy()
    # Sort by priority
    priority_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
    df['priority_rank'] = df['priority'].map(priority_order)
    df = df.sort_values('priority_rank')
    print(f" Loaded orders: {len(df)} pending orders")
    return df

def load_rakes():
    df = pd.read_csv(os.path.join(DATA_DIR, 'rake_availability.csv'))
    # Only available rakes
    df = df[df['status'] == 'Available'].copy()
    print(f"Loaded rakes: {len(df)} available rakes")
    return df

def load_product_wagon_matrix():
    df = pd.read_csv(os.path.join(DATA_DIR, 'product_wagon_matrix.csv'))
    print(f" Loaded product-wagon matrix: {len(df)} records")
    return df

#  COST CALCULATION

def calculate_freight_cost(quantity_tonnes, distance_km):
    
    return round(quantity_tonnes * distance_km * FREIGHT_RATE, 2)

def calculate_storage_cost(quantity_tonnes, age_days):
    
    return round(quantity_tonnes * age_days * STORAGE_RATE, 2)

def calculate_demurrage_cost(delay_days, num_wagons):
   
    return round(delay_days * num_wagons * DEMURRAGE_RATE, 2)

def calculate_penalty_cost(priority, delay_days):
    
    if delay_days == 0:
        return 0
    return round(PENALTY_RATES.get(priority, 5000) * delay_days, 2)

def calculate_total_rake_cost(order, rake, delay_days=0):
   
    freight    = calculate_freight_cost(
                    order['quantity_tonnes'],
                    order['distance_km'])

    storage    = calculate_storage_cost(
                    order['quantity_tonnes'],
                    age_days=2)  

    demurrage  = calculate_demurrage_cost(
                    delay_days,
                    rake['num_wagons'])

    penalty    = calculate_penalty_cost(
                    order['priority'],
                    delay_days)

    total = freight + storage + demurrage + penalty

    return {
        "freight_cost":   freight,
        "storage_cost":   storage,
        "demurrage_cost": demurrage,
        "penalty_cost":   penalty,
        "total_cost":     total
    }

def get_delay_risk(order, model_path=None):
    
    try:
        model    = joblib.load(
                    os.path.join(MODELS_DIR, 'delay_prediction_model.pkl'))
        features = joblib.load(
                    os.path.join(MODELS_DIR, 'delay_features.pkl'))

        feature_map = {
            'num_wagons':            40,
            'quantity_tonnes':       order['quantity_tonnes'],
            'distance_km':           order['distance_km'],
            'pending_orders_count':  30,
            'inventory_level':       0.6,
            'dock_utilization':      0.5,
            'is_month_end':          0,
            'fill_percentage':       85.0,
            'day_of_week':           datetime.now().weekday(),
            'month':                 datetime.now().month,
            'wagon_type_encoded':    0,
            'destination_encoded':   0,
        }

        X = pd.DataFrame([feature_map])[features]
        delay_prob = model.predict_proba(X)[0][1]
        return round(delay_prob, 3)

    except Exception as e:
        
        return 0.3

if __name__ == "__main__":
    print("\n Testing Cost Calculations\n")

    # Sample order
    sample_order = {
        'order_id':        'ORD1001',
        'quantity_tonnes': 500,
        'distance_km':     1200,
        'priority':        'High'
    }

    
    sample_rake = {
        'rake_id':    'RK101',
        'num_wagons': 45
    }

    costs = calculate_total_rake_cost(sample_order, sample_rake, delay_days=1)

    print(" Sample Cost Breakdown ")
    print(f"Order      : {sample_order['order_id']}")
    print(f"Quantity   : {sample_order['quantity_tonnes']} tonnes")
    print(f"Distance   : {sample_order['distance_km']} km")
    print(f"Priority   : {sample_order['priority']}")
    print(f"\nCost Breakdown:")
    print(f"  Freight Cost   : ₹{costs['freight_cost']:,.2f}")
    print(f"  Storage Cost   : ₹{costs['storage_cost']:,.2f}")
    print(f"  Demurrage Cost : ₹{costs['demurrage_cost']:,.2f}")
    print(f"  Penalty Cost   : ₹{costs['penalty_cost']:,.2f}")
    print(f"  {'─'*30}")
    print(f"  Total Cost     : ₹{costs['total_cost']:,.2f}")
