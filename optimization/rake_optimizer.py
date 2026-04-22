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


#  WAGON COMPATIBILITY CHECK

def is_wagon_compatible(product, wagon_type, matrix_df):
    
    row = matrix_df[
        (matrix_df['product']     == product) &
        (matrix_df['wagon_type']  == wagon_type)
    ]
    if len(row) == 0:
        return False
    return bool(row.iloc[0]['is_suitable'])


# FIND BEST STOCKYARD FOR ORDER

def find_best_stockyard(order, inventory_df):
   
    available = inventory_df[
        (inventory_df['product']          == order['product']) &
        (inventory_df['quantity_tonnes']  >= order['quantity_tonnes'] * 0.5)
    ].copy()

    if len(available) == 0:
        return None

    # Prefer oldest stock (higher age = more storage cost saved)
    available = available.sort_values('age_days', ascending=False)
    return available.iloc[0]


#  CORE OPTIMIZATION ENGINE
def optimize_rake_plan(date_str=None, max_rakes=10):
    
    if date_str is None:
        date_str = datetime.now().strftime('%Y-%m-%d')

    
    print(f"   SAIL RakeAI - Optimization Engine")
    print(f"   Planning Date: {date_str}")
    

    # Load all data
    inventory = load_inventory()
    orders    = load_orders()
    rakes     = load_rakes()
    matrix    = load_product_wagon_matrix()

    print(f" Summary:")
    print(f"   Pending Orders  : {len(orders)}")
    print(f"   Available Rakes : {len(rakes)}")
    print(f"   Stockyard Items : {len(inventory)}\n")

    avail_rakes        = rakes.head(max_rakes).copy()
    assigned_order_ids = set()
    rake_plans         = []

    for _, rake in avail_rakes.iterrows():
        remaining_capacity = rake['total_capacity']
        rake_orders        = []
        rake_total_cost    = 0
        rake_quantity      = 0

        # Get compatible orders for this rake
        compatible_orders = []
        for _, order in orders.iterrows():
            if order['order_id'] in assigned_order_ids:
                continue
            if not is_wagon_compatible(
                order['product'], rake['wagon_type'], matrix
            ):
                continue
            if order['quantity_tonnes'] > rake['total_capacity']:
                continue
            compatible_orders.append(order)

        if not compatible_orders:
            continue

        # Sort by priority then quantity 
        compatible_orders = sorted(
            compatible_orders,
            key=lambda x: (x['priority_rank'], -x['quantity_tonnes'])
        )

        # Club orders until rake is 75%+ full or no more orders
        for order in compatible_orders:
            if remaining_capacity <= rake['total_capacity'] * 0.15:
                break  # rake is full enough

            if order['quantity_tonnes'] > remaining_capacity:
                continue  # order too big for remaining space

            stockyard = find_best_stockyard(order, inventory)
            if stockyard is None:
                continue

            delay_risk = get_delay_risk(order)
            expected_delay = round(delay_risk * 2)

            costs = calculate_total_rake_cost(
                order, rake, delay_days=expected_delay
            )

            rake_orders.append({
                'order_id':        order['order_id'],
                'product':         order['product'],
                'quantity_tonnes': order['quantity_tonnes'],
                'destination':     order['destination_city'],
                'distance_km':     order['distance_km'],
                'priority':        order['priority'],
                'stockyard':       stockyard['stockyard_name'],
                'delay_risk':      delay_risk,
                'costs':           costs
            })

            remaining_capacity -= order['quantity_tonnes']
            rake_quantity      += order['quantity_tonnes']
            rake_total_cost    += costs['total_cost']
            assigned_order_ids.add(order['order_id'])

        # Only plan rake if at least 50% full
        if rake_quantity >= rake['total_capacity'] * 0.5:
            fill_pct = round((rake_quantity / rake['total_capacity']) * 100, 1)

            # Get primary destination 
            destinations = [o['destination'] for o in rake_orders]
            primary_dest = max(set(destinations), key=destinations.count)

            rake_plans.append({
                'rake_id':         rake['rake_id'],
                'wagon_type':      rake['wagon_type'],
                'num_wagons':      rake['num_wagons'],
                'total_capacity':  rake['total_capacity'],
                'orders_clubbed':  len(rake_orders),
                'order_ids':       ', '.join([o['order_id'] for o in rake_orders]),
                'products':        ', '.join(set([o['product'] for o in rake_orders])),
                'primary_destination': primary_dest,
                'quantity_loaded': round(rake_quantity, 2),
                'fill_percentage': fill_pct,
                'avg_delay_risk':  round(
                    sum([o['delay_risk'] for o in rake_orders]) / len(rake_orders), 3
                ),
                'total_cost':      round(rake_total_cost, 2),
                'status':          'Planned'
            })

    return pd.DataFrame(rake_plans)


if __name__ == "__main__":
    plan = optimize_rake_plan(max_rakes=10)

    if len(plan) > 0:
        print(f" Optimization complete!")
        print(f"\n{'='*55}")
        print(f"   DAILY RAKE PLAN")
        print(f"{'='*55}")
        for _, row in plan.iterrows():
            print(f"\n {row['rake_id']} ({row['wagon_type']})")
            print(f"   Orders clubbed  : {row['orders_clubbed']}")
            print(f"   Products        : {row['products']}")
            print(f"   Destination     : {row['primary_destination']}")
            print(f"   Quantity loaded : {row['quantity_loaded']} tonnes")
            print(f"   Fill %          : {row['fill_percentage']}%")
            print(f"   Delay risk      : {row['avg_delay_risk']*100:.1f}%")
            print(f"   Total cost      : ₹{row['total_cost']:,.2f}")

      
        print(f"   PLAN SUMMARY")
        
        print(f"  Rakes planned   : {len(plan)}")
        print(f"  Orders assigned : {plan['orders_clubbed'].sum()}")
        print(f"  Avg fill %      : {plan['fill_percentage'].mean():.1f}%")
        print(f"  Total cost      : ₹{plan['total_cost'].sum():,.2f}")
    else:
        print(" No rakes could be planned with current data")
