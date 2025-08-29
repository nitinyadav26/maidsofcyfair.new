from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, date, time, timezone, timedelta
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Maids of Cyfair Booking System")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed" 
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"

class ServiceType(str, Enum):
    STANDARD = "standard"
    DEEP = "deep"
    MOVE_IN = "move_in"
    MOVE_OUT = "move_out"
    POST_CONSTRUCTION = "post_construction"

# Data Models
class Service(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: ServiceType
    description: str
    base_price: float
    duration_hours: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ServiceCreate(BaseModel):
    name: str
    type: ServiceType
    description: str
    base_price: float
    duration_hours: int

class TimeSlot(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str  # ISO date string YYYY-MM-DD
    start_time: str  # HH:MM format
    end_time: str  # HH:MM format
    is_available: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Customer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    first_name: str
    last_name: str
    phone: str
    address: str
    city: str
    state: str
    zip_code: str
    is_guest: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomerCreate(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    phone: str
    address: str
    city: str
    state: str
    zip_code: str
    is_guest: bool = False

class CartItem(BaseModel):
    service_id: str
    quantity: int = 1
    special_instructions: Optional[str] = None

class Booking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    services: List[CartItem]
    booking_date: str  # ISO date string
    time_slot: str  # start_time-end_time format
    total_amount: float
    status: BookingStatus = BookingStatus.PENDING
    payment_status: PaymentStatus = PaymentStatus.PENDING
    special_instructions: Optional[str] = None
    cleaner_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BookingCreate(BaseModel):
    customer: CustomerCreate
    services: List[CartItem]
    booking_date: str
    time_slot: str
    special_instructions: Optional[str] = None

class Cleaner(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    first_name: str
    last_name: str
    phone: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Helper functions for date/time handling
def prepare_for_mongo(data):
    """Convert Python datetime objects to ISO strings for MongoDB storage"""
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
            elif isinstance(value, (date, time)):
                data[key] = value.isoformat()
    return data

def generate_time_slots():
    """Generate available time slots for the next 30 days"""
    slots = []
    base_date = datetime.now(timezone.utc).date()
    
    for i in range(30):  # Next 30 days
        current_date = base_date + timedelta(days=i)
        date_str = current_date.isoformat()
        
        # Generate slots from 8 AM to 6 PM (2-hour slots)
        start_hours = [8, 10, 12, 14, 16]
        
        for start_hour in start_hours:
            start_time = f"{start_hour:02d}:00"
            end_time = f"{start_hour + 2:02d}:00"
            
            slot = TimeSlot(
                date=date_str,
                start_time=start_time,
                end_time=end_time,
                is_available=True
            )
            slots.append(slot)
    
    return slots

# Initialize mock data
@api_router.on_event("startup")
async def startup_event():
    # Check if services exist, if not create them
    services_count = await db.services.count_documents({})
    if services_count == 0:
        mock_services = [
            Service(
                name="Standard Cleaning",
                type=ServiceType.STANDARD,
                description="Regular house cleaning including dusting, vacuuming, mopping, and bathroom cleaning",
                base_price=120.00,
                duration_hours=2
            ),
            Service(
                name="Deep Cleaning",
                type=ServiceType.DEEP,
                description="Comprehensive cleaning including baseboards, light fixtures, inside appliances, and detailed scrubbing",
                base_price=250.00,
                duration_hours=4
            ),
            Service(
                name="Move-in Cleaning",
                type=ServiceType.MOVE_IN,
                description="Complete cleaning for new home occupancy including inside cabinets, drawers, and appliances",
                base_price=300.00,
                duration_hours=5
            ),
            Service(
                name="Move-out Cleaning",
                type=ServiceType.MOVE_OUT,
                description="Thorough cleaning to restore property to pristine condition for landlord/buyer inspection",
                base_price=280.00,
                duration_hours=4
            ),
            Service(
                name="Post-Construction Cleaning",
                type=ServiceType.POST_CONSTRUCTION,
                description="Specialized cleaning to remove construction dust, debris, and prepare space for occupancy",
                base_price=350.00,
                duration_hours=6
            )
        ]
        
        for service in mock_services:
            service_dict = prepare_for_mongo(service.dict())
            await db.services.insert_one(service_dict)
    
    # Generate time slots if they don't exist
    slots_count = await db.time_slots.count_documents({})
    if slots_count == 0:
        time_slots = generate_time_slots()
        for slot in time_slots:
            slot_dict = prepare_for_mongo(slot.dict())
            await db.time_slots.insert_one(slot_dict)

# Services endpoints
@api_router.get("/services", response_model=List[Service])
async def get_services():
    services = await db.services.find().to_list(1000)
    return [Service(**service) for service in services]

@api_router.post("/services", response_model=Service)
async def create_service(service_data: ServiceCreate):
    service = Service(**service_data.dict())
    service_dict = prepare_for_mongo(service.dict())
    await db.services.insert_one(service_dict)
    return service

@api_router.get("/services/{service_id}", response_model=Service)
async def get_service(service_id: str):
    service = await db.services.find_one({"id": service_id})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return Service(**service)

# Time slots endpoints
@api_router.get("/time-slots")
async def get_time_slots(date: str = Query(..., description="Date in YYYY-MM-DD format")):
    slots = await db.time_slots.find({"date": date, "is_available": True}).to_list(1000)
    return [TimeSlot(**slot) for slot in slots]

@api_router.get("/available-dates")
async def get_available_dates():
    """Get all dates that have available time slots"""
    pipeline = [
        {"$match": {"is_available": True}},
        {"$group": {"_id": "$date", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    
    result = await db.time_slots.aggregate(pipeline).to_list(1000)
    return [item["_id"] for item in result]

# Customer endpoints
@api_router.post("/customers", response_model=Customer)
async def create_customer(customer_data: CustomerCreate):
    # Check if customer already exists
    existing = await db.customers.find_one({"email": customer_data.email})
    if existing:
        return Customer(**existing)
    
    customer = Customer(**customer_data.dict())
    customer_dict = prepare_for_mongo(customer.dict())
    await db.customers.insert_one(customer_dict)
    return customer

@api_router.get("/customers/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str):
    customer = await db.customers.find_one({"id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return Customer(**customer)

# Booking endpoints
@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking_data: BookingCreate):
    # Create or get customer
    customer = Customer(**booking_data.customer.dict())
    existing_customer = await db.customers.find_one({"email": customer.email})
    
    if existing_customer:
        customer = Customer(**existing_customer)
    else:
        customer_dict = prepare_for_mongo(customer.dict())
        await db.customers.insert_one(customer_dict)
    
    # Calculate total amount
    total_amount = 0.0
    for cart_item in booking_data.services:
        service = await db.services.find_one({"id": cart_item.service_id})
        if service:
            total_amount += service["base_price"] * cart_item.quantity
    
    # Mark time slot as unavailable
    await db.time_slots.update_one(
        {"date": booking_data.booking_date, "start_time": booking_data.time_slot.split("-")[0]},
        {"$set": {"is_available": False}}
    )
    
    # Create booking
    booking = Booking(
        customer_id=customer.id,
        services=booking_data.services,
        booking_date=booking_data.booking_date,
        time_slot=booking_data.time_slot,
        total_amount=total_amount,
        special_instructions=booking_data.special_instructions
    )
    
    booking_dict = prepare_for_mongo(booking.dict())
    await db.bookings.insert_one(booking_dict)
    
    return booking

@api_router.get("/bookings", response_model=List[Booking])
async def get_bookings():
    bookings = await db.bookings.find().sort("created_at", -1).to_list(1000)
    return [Booking(**booking) for booking in bookings]

@api_router.get("/bookings/{booking_id}", response_model=Booking)
async def get_booking(booking_id: str):
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return Booking(**booking)

@api_router.patch("/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, status: BookingStatus):
    result = await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return {"message": "Booking status updated successfully"}

# Mock payment endpoint
@api_router.post("/process-payment/{booking_id}")
async def process_payment(booking_id: str, payment_data: Dict[str, Any]):
    """Mock payment processing endpoint"""
    # Simulate payment processing
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Mock payment success (90% success rate)
    import random
    payment_success = random.random() > 0.1
    
    payment_status = PaymentStatus.PAID if payment_success else PaymentStatus.FAILED
    booking_status = BookingStatus.CONFIRMED if payment_success else BookingStatus.CANCELLED
    
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {
            "payment_status": payment_status,
            "status": booking_status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "success": payment_success,
        "payment_status": payment_status,
        "booking_status": booking_status,
        "transaction_id": str(uuid.uuid4()) if payment_success else None
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()