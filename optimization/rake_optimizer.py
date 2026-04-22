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

if __name__ == "__main__":
    print("\n Testing Data Loading...\n")
    inventory = load_inventory()
    orders    = load_orders()
    rakes     = load_rakes()
    matrix    = load_product_wagon_matrix()
    print("\n All data loaded successfully!")