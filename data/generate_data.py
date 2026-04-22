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
