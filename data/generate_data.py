import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import os


np.random.seed(42)
random.seed(42)


PRODUCTS = [
    "HR Coil", "CR Coil", "TMT Bar", "Wire Rod",
    "Plate", "Structurals", "Semis"
]

STOCKYARDS = [
    {"id": "SY01", "name": "Bokaro Stockyard 1", "capacity": 5000, "location": "Bokaro"},
    {"id": "SY02", "name": "Bokaro Stockyard 2", "capacity": 4000, "location": "Bokaro"},
    {"id": "SY03", "name": "Bokaro Stockyard 3", "capacity": 6000, "location": "Bokaro"},
    {"id": "SY04", "name": "Bokaro Stockyard 4", "capacity": 3500, "location": "Bokaro"},
    {"id": "SY05", "name": "Bokaro Stockyard 5", "capacity": 4500, "location": "Bokaro"},
]

CMO_STOCKYARDS = [
    {"id": "CMO01", "name": "Delhi CMO",      "city": "Delhi",     "distance_km": 1200},
    {"id": "CMO02", "name": "Mumbai CMO",     "city": "Mumbai",    "distance_km": 1800},
    {"id": "CMO03", "name": "Chennai CMO",    "city": "Chennai",   "distance_km": 2100},
    {"id": "CMO04", "name": "Kolkata CMO",    "city": "Kolkata",   "distance_km": 350},
    {"id": "CMO05", "name": "Hyderabad CMO",  "city": "Hyderabad", "distance_km": 1600},
    {"id": "CMO06", "name": "Ahmedabad CMO",  "city": "Ahmedabad", "distance_km": 1900},
    {"id": "CMO07", "name": "Pune CMO",       "city": "Pune",      "distance_km": 1750},
]

WAGON_TYPES = [
    {"type": "BOXN",  "capacity_tonnes": 58,  "suitable_for": ["TMT Bar", "Wire Rod", "Structurals", "Semis"]},
    {"type": "BOBYN", "capacity_tonnes": 60,  "suitable_for": ["HR Coil", "CR Coil", "Plate"]},
    {"type": "BCN",   "capacity_tonnes": 55,  "suitable_for": ["TMT Bar", "Wire Rod", "Semis"]},
    {"type": "BLC",   "capacity_tonnes": 62,  "suitable_for": ["HR Coil", "CR Coil", "Plate"]},
    {"type": "BOST",  "capacity_tonnes": 50,  "suitable_for": ["Structurals", "Semis", "Plate"]},
]

LOADING_DOCKS = [
    {"id": "LD01", "name": "Dock 1", "capacity_per_hour": 120, "suitable_wagon_types": ["BOXN", "BCN", "BOST"]},
    {"id": "LD02", "name": "Dock 2", "capacity_per_hour": 150, "suitable_wagon_types": ["BOBYN", "BLC"]},
    {"id": "LD03", "name": "Dock 3", "capacity_per_hour": 130, "suitable_wagon_types": ["BOXN", "BCN", "BOBYN"]},
    {"id": "LD04", "name": "Dock 4", "capacity_per_hour": 100, "suitable_wagon_types": ["BLC", "BOST", "BCN"]},
]

MIN_RAKE_SIZE_WAGONS = 40
MAX_RAKE_SIZE_WAGONS = 58

FREIGHT_RATE_PER_KM_PER_TONNE = 1.2   
DEMURRAGE_RATE_PER_DAY = 15000         
STORAGE_COST_PER_TONNE_PER_DAY = 8    


def generate_stockyard_inventory():
    records = []
    for sy in STOCKYARDS:
        for product in PRODUCTS:
            quantity = round(random.uniform(200, sy["capacity"] / len(PRODUCTS)), 2)
            age_days  = random.randint(1, 45)
            records.append({
                "stockyard_id":   sy["id"],
                "stockyard_name": sy["name"],
                "product":        product,
                "quantity_tonnes": quantity,
                "age_days":       age_days,
                "storage_cost_per_day": round(quantity * STORAGE_COST_PER_TONNE_PER_DAY, 2),
            })
    df = pd.DataFrame(records)
    print(f" Stockyard Inventory: {len(df)} records")
    return df


def generate_customer_orders(n=300):
    priorities   = ["Critical", "High", "Medium", "Low"]
    order_types  = ["Rail", "Road"]
    records = []

    for i in range(n):
        product      = random.choice(PRODUCTS)
        destination  = random.choice(CMO_STOCKYARDS)
        order_date   = datetime(2024, 1, 1) + timedelta(days=random.randint(0, 180))
        deadline_days = random.randint(3, 15)
        deadline     = order_date + timedelta(days=deadline_days)
        quantity     = round(random.uniform(100, 1200), 2)
        priority     = random.choices(priorities, weights=[10, 25, 40, 25])[0]
        order_type   = random.choices(order_types, weights=[70, 30])[0]

        penalty_map  = {"Critical": 50000, "High": 30000, "Medium": 15000, "Low": 5000}
        freight_cost = round(quantity * destination["distance_km"] * FREIGHT_RATE_PER_KM_PER_TONNE, 2)

        records.append({
            "order_id":          f"ORD{1000 + i}",
            "product":           product,
            "quantity_tonnes":   quantity,
            "destination_id":    destination["id"],
            "destination_city":  destination["city"],
            "distance_km":       destination["distance_km"],
            "order_date":        order_date.date(),
            "deadline":          deadline.date(),
            "deadline_days":     deadline_days,
            "priority":          priority,
            "order_type":        order_type,
            "estimated_freight": freight_cost,
            "penalty_per_day":   penalty_map[priority],
            "status":            "Pending",
        })

    df = pd.DataFrame(records)
    print(f" Customer Orders: {len(df)} records")
    return df


def generate_rake_availability(n=60):
    statuses = ["Available", "In Transit", "Under Maintenance", "Loading"]
    records  = []

    for i in range(n):
        wagon_type  = random.choice(WAGON_TYPES)
        num_wagons  = random.randint(MIN_RAKE_SIZE_WAGONS, MAX_RAKE_SIZE_WAGONS)
        status      = random.choices(statuses, weights=[50, 25, 10, 15])[0]
        location    = random.choice(["Bokaro Yard", "En Route", "Destination"])
        eta_days    = random.randint(0, 5) if status == "In Transit" else 0

        records.append({
            "rake_id":            f"RK{100 + i}",
            "wagon_type":         wagon_type["type"],
            "num_wagons":         num_wagons,
            "capacity_per_wagon": wagon_type["capacity_tonnes"],
            "total_capacity":     round(num_wagons * wagon_type["capacity_tonnes"], 2),
            "suitable_products":  ", ".join(wagon_type["suitable_for"]),
            "status":             status,
            "current_location":   location,
            "eta_days":           eta_days,
        })

    df = pd.DataFrame(records)
    print(f" Rake Availability: {len(df)} records")
    return df


def generate_loading_dock_schedule(days=30):
    records = []
    base_date = datetime(2024, 1, 1)

    for day in range(days):
        current_date = base_date + timedelta(days=day)
        for dock in LOADING_DOCKS:
            slots_used   = random.randint(0, 3)
            is_available = slots_used < 3
            records.append({
                "date":              current_date.date(),
                "dock_id":           dock["id"],
                "dock_name":         dock["name"],
                "capacity_per_hour": dock["capacity_per_hour"],
                "slots_used":        slots_used,
                "is_available":      is_available,
                "suitable_wagons":   ", ".join(dock["suitable_wagon_types"]),
            })

    df = pd.DataFrame(records)
    print(f" Loading Dock Schedule: {len(df)} records")
    return df


def generate_product_wagon_matrix():
    records = []
    for product in PRODUCTS:
        for wagon in WAGON_TYPES:
            is_suitable = 1 if product in wagon["suitable_for"] else 0
            records.append({
                "product":        product,
                "wagon_type":     wagon["type"],
                "is_suitable":    is_suitable,
                "wagon_capacity": wagon["capacity_tonnes"],
            })
    df = pd.DataFrame(records)
    print(f" Product-Wagon Matrix: {len(df)} records")
    return df


def generate_historical_dispatch(n=500):
    records = []

    for i in range(n):
        product      = random.choice(PRODUCTS)
        destination  = random.choice(CMO_STOCKYARDS)
        wagon_type   = random.choice(WAGON_TYPES)
        num_wagons   = random.randint(MIN_RAKE_SIZE_WAGONS, MAX_RAKE_SIZE_WAGONS)
        quantity     = round(num_wagons * wagon_type["capacity_tonnes"] * random.uniform(0.7, 1.0), 2)
        fill_pct     = round((quantity / (num_wagons * wagon_type["capacity_tonnes"])) * 100, 2)

        planned_date = datetime(2023, 1, 1) + timedelta(days=random.randint(0, 364))
        delay_days   = random.choices([0, 1, 2, 3, 4, 5], weights=[45, 25, 15, 8, 4, 3])[0]
        actual_date  = planned_date + timedelta(days=delay_days)

        pending_orders_count = random.randint(5, 80)
        inventory_level      = random.uniform(0.2, 1.0)
        dock_utilization     = random.uniform(0.3, 1.0)
        is_month_end         = 1 if planned_date.day >= 25 else 0
        distance_km          = destination["distance_km"]

        demurrage_cost = round(delay_days * num_wagons * DEMURRAGE_RATE_PER_DAY, 2)
        freight_cost   = round(quantity * distance_km * FREIGHT_RATE_PER_KM_PER_TONNE, 2)
        total_cost     = round(freight_cost + demurrage_cost, 2)

        records.append({
            "dispatch_id":           f"DISP{2000 + i}",
            "product":               product,
            "wagon_type":            wagon_type["type"],
            "num_wagons":            num_wagons,
            "quantity_tonnes":       quantity,
            "fill_percentage":       fill_pct,
            "destination_id":        destination["id"],
            "destination_city":      destination["city"],
            "distance_km":           distance_km,
            "planned_dispatch_date": planned_date.date(),
            "actual_dispatch_date":  actual_date.date(),
            "delay_days":            delay_days,
            "is_delayed":            1 if delay_days > 0 else 0,
            "pending_orders_count":  pending_orders_count,
            "inventory_level":       round(inventory_level, 3),
            "dock_utilization":      round(dock_utilization, 3),
            "is_month_end":          is_month_end,
            "demurrage_cost":        demurrage_cost,
            "freight_cost":          freight_cost,
            "total_cost":            total_cost,
        })

    df = pd.DataFrame(records)
    print(f" Historical Dispatch Log: {len(df)} records")
    return df



if __name__ == "__main__":
    output_dir = os.path.join(os.path.dirname(__file__), "synthetic_data")
    os.makedirs(output_dir, exist_ok=True)

    print("\n Generating SAIL RakeAI Synthetic Data...\n")

    dfs = {
        "stockyard_inventory.csv":   generate_stockyard_inventory(),
        "customer_orders.csv":       generate_customer_orders(300),
        "rake_availability.csv":     generate_rake_availability(60),
        "loading_dock_schedule.csv": generate_loading_dock_schedule(30),
        "historical_dispatch.csv":   generate_historical_dispatch(500),
        "product_wagon_matrix.csv":  generate_product_wagon_matrix(),
    }

    for filename, df in dfs.items():
        path = os.path.join(output_dir, filename)
        df.to_csv(path, index=False)
        print(f"    Saved → {path}")

    print("\nAll data files generated successfully!")
    print(f" Location: {output_dir}")
    print("\nFiles created:")
    for filename in dfs:
        print(f"   • {filename}")
