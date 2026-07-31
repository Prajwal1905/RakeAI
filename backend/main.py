from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.routes import plan, orders, inventory, forecast, analytics

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

app.include_router(plan.router)
app.include_router(orders.router)
app.include_router(inventory.router)
app.include_router(forecast.router)
app.include_router(analytics.router)


@app.get("/")
def root():
    return {
        "message": "RakeAI API is running!",
        "version": "1.0.0",
        "endpoints": ["/rake-plan", "/orders", "/inventory", "/rakes", "/forecast", "/summary"]
    }