from fastapi import FastAPI, APIRouter, HTTPException, Query, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
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
import jwt
import bcrypt

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

# JWT Configuration
JWT_SECRET = "maids_secret_key_2024"
JWT_ALGORITHM = "HS256"
security = HTTPBearer()

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

class ServiceFrequency(str, Enum):
    ONE_TIME = "one_time"
    MONTHLY = "monthly"
    EVERY_3_WEEKS = "every_3_weeks"
    BI_WEEKLY = "bi_weekly"
    WEEKLY = "weekly"

class HouseSize(str, Enum):
    SIZE_1000_1500 = "1000-1500"
    SIZE_1500_2000 = "1500-2000"
    SIZE_2000_2500 = "2000-2500"
    SIZE_2500_3000 = "2500-3000"
    SIZE_3000_3500 = "3000-3500"
    SIZE_3500_4000 = "3500-4000"
    SIZE_4000_4500 = "4000-4500"
    SIZE_5000_PLUS = "5000+"

# Auth Models
class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: Optional[str] = None

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None
    password_hash: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

# Data Models
class PricingTier(BaseModel):
    house_size: HouseSize
    one_time_price: float
    monthly_price: float
    every_3_weeks_price: float
    bi_weekly_price: float
    weekly_price: float

class Service(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str  # "standard_cleaning", "a_la_carte"
    description: str
    is_a_la_carte: bool = False
    a_la_carte_price: Optional[float] = None
    duration_hours: Optional[int] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ServiceCreate(BaseModel):
    name: str
    category: str
    description: str
    is_a_la_carte: bool = False
    a_la_carte_price: Optional[float] = None
    duration_hours: Optional[int] = None

class TimeSlot(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str  # ISO date string YYYY-MM-DD
    start_time: str  # HH:MM format
    end_time: str  # HH:MM format
    is_available: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Customer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
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
    user_id: Optional[str] = None
    customer_id: str
    house_size: HouseSize
    frequency: ServiceFrequency
    services: List[CartItem]
    a_la_carte_services: List[CartItem] = []
    booking_date: str  # ISO date string
    time_slot: str  # start_time-end_time format
    base_price: float
    a_la_carte_total: float = 0.0
    total_amount: float
    status: BookingStatus = BookingStatus.PENDING
    payment_status: PaymentStatus = PaymentStatus.PENDING
    special_instructions: Optional[str] = None
    cleaner_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BookingCreate(BaseModel):
    customer: CustomerCreate
    house_size: HouseSize
    frequency: ServiceFrequency
    services: List[CartItem]
    a_la_carte_services: List[CartItem] = []
    booking_date: str
    time_slot: str
    special_instructions: Optional[str] = None

# Auth Helper Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user)

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

def get_base_price(house_size: HouseSize, frequency: ServiceFrequency) -> float:
    """Get base price based on house size and frequency"""
    pricing_matrix = {
        HouseSize.SIZE_1000_1500: {
            ServiceFrequency.ONE_TIME: 200.0,
            ServiceFrequency.MONTHLY: 125.0,
            ServiceFrequency.EVERY_3_WEEKS: 125.0,
            ServiceFrequency.BI_WEEKLY: 125.0,
            ServiceFrequency.WEEKLY: 125.0
        },
        HouseSize.SIZE_1500_2000: {
            ServiceFrequency.ONE_TIME: 200.0,
            ServiceFrequency.MONTHLY: 125.0,
            ServiceFrequency.EVERY_3_WEEKS: 125.0,
            ServiceFrequency.BI_WEEKLY: 125.0,
            ServiceFrequency.WEEKLY: 125.0
        },
        HouseSize.SIZE_2000_2500: {
            ServiceFrequency.ONE_TIME: 230.0,
            ServiceFrequency.MONTHLY: 155.0,
            ServiceFrequency.EVERY_3_WEEKS: 150.0,
            ServiceFrequency.BI_WEEKLY: 145.0,
            ServiceFrequency.WEEKLY: 135.0
        },
        HouseSize.SIZE_2500_3000: {
            ServiceFrequency.ONE_TIME: 240.0,
            ServiceFrequency.MONTHLY: 165.0,
            ServiceFrequency.EVERY_3_WEEKS: 160.0,
            ServiceFrequency.BI_WEEKLY: 155.0,
            ServiceFrequency.WEEKLY: 145.0
        },
        HouseSize.SIZE_3000_3500: {
            ServiceFrequency.ONE_TIME: 250.0,
            ServiceFrequency.MONTHLY: 175.0,
            ServiceFrequency.EVERY_3_WEEKS: 170.0,
            ServiceFrequency.BI_WEEKLY: 165.0,
            ServiceFrequency.WEEKLY: 155.0
        },
        HouseSize.SIZE_3500_4000: {
            ServiceFrequency.ONE_TIME: 260.0,
            ServiceFrequency.MONTHLY: 185.0,
            ServiceFrequency.EVERY_3_WEEKS: 180.0,
            ServiceFrequency.BI_WEEKLY: 175.0,
            ServiceFrequency.WEEKLY: 165.0
        },
        HouseSize.SIZE_4000_4500: {
            ServiceFrequency.ONE_TIME: 275.0,
            ServiceFrequency.MONTHLY: 195.0,
            ServiceFrequency.EVERY_3_WEEKS: 190.0,
            ServiceFrequency.BI_WEEKLY: 185.0,
            ServiceFrequency.WEEKLY: 175.0
        },
        HouseSize.SIZE_5000_PLUS: {
            ServiceFrequency.ONE_TIME: 280.0,
            ServiceFrequency.MONTHLY: 205.0,
            ServiceFrequency.EVERY_3_WEEKS: 200.0,
            ServiceFrequency.BI_WEEKLY: 195.0,
            ServiceFrequency.WEEKLY: 185.0
        }
    }
    
    return pricing_matrix.get(house_size, {}).get(frequency, 125.0)

# Initialize mock data
@app.on_event("startup")
async def startup_event():
    # Create test user if not exists
    test_user = await db.users.find_one({"email": "test@maids.com"})
    if not test_user:
        test_user = User(
            email="test@maids.com",
            first_name="Test",
            last_name="User",
            password_hash=hash_password("test@maids@1234")
        )
        await db.users.insert_one(prepare_for_mongo(test_user.dict()))
    
    # Check if services exist, if not create them
    services_count = await db.services.count_documents({})
    if services_count == 0:
        # Standard cleaning services
        standard_services = [
            Service(
                name="Standard Cleaning",
                category="standard_cleaning",
                description="Regular house cleaning including dusting, vacuuming, mopping, and bathroom cleaning",
                is_a_la_carte=False,
                duration_hours=2
            ),
            Service(
                name="Deep Cleaning / Move Out Cleaning",
                category="standard_cleaning", 
                description="Comprehensive deep cleaning perfect for move-outs or one-time deep cleans",
                is_a_la_carte=False,
                duration_hours=4
            )
        ]
        
        # A la carte services
        a_la_carte_services = [
            Service(name="Blinds", category="a_la_carte", description="Feather dusting only", is_a_la_carte=True, a_la_carte_price=10.0),
            Service(name="Inside Kitchen/Bathroom Cabinets (Move Out Only)", category="a_la_carte", description="Wiping out using micro fiber", is_a_la_carte=True, a_la_carte_price=80.0),
            Service(name="Oven Cleaning", category="a_la_carte", description="Cleaning of 1 Oven. Double oven is double the cost", is_a_la_carte=True, a_la_carte_price=40.0),
            Service(name="Dust Baseboards (under 2500 sf)", category="a_la_carte", description="Feather dust under 2500 sf", is_a_la_carte=True, a_la_carte_price=20.0),
            Service(name="Dust Baseboards (over 2500 sf)", category="a_la_carte", description="Feather Dust Over 2500 sf", is_a_la_carte=True, a_la_carte_price=30.0),
            Service(name="Dust Shutters (under 2500 sf)", category="a_la_carte", description="Feather dust under 2500 sf", is_a_la_carte=True, a_la_carte_price=40.0),
            Service(name="Dust Shutters (over 2500 sf)", category="a_la_carte", description="Feather Dust Over 2500 sf", is_a_la_carte=True, a_la_carte_price=60.0),
            Service(name="Hand Clean Baseboards (under 2500sf)", category="a_la_carte", description="Hand wipe under 2500sf", is_a_la_carte=True, a_la_carte_price=60.0),
            Service(name="Hand Clean Baseboards (over 2500 sf)", category="a_la_carte", description="Hand wipe over 2500 sf", is_a_la_carte=True, a_la_carte_price=80.0),
            Service(name="Inside Refrigerator", category="a_la_carte", description="Clean inside of Fridge (not Freezer)", is_a_la_carte=True, a_la_carte_price=45.0),
            Service(name="Vacuum Couch", category="a_la_carte", description="Top and Underneath (Includes 1 couch and 1 love seat combo or 1 sectional)", is_a_la_carte=True, a_la_carte_price=15.0),
            Service(name="Clean Exterior Kitchen/Bathrooms cabinets", category="a_la_carte", description="Hand wipe all exterior upper and lowers cabinets", is_a_la_carte=True, a_la_carte_price=40.0),
            Service(name="Dusting High Ceiling Fan", category="a_la_carte", description="Dusting ceiling fans over 10ft", is_a_la_carte=True, a_la_carte_price=10.0),
            Service(name="Cleaning of Interior doors/frames", category="a_la_carte", description="Hand wipe interior door/frames/molding", is_a_la_carte=True, a_la_carte_price=75.0)
        ]
        
        all_services = standard_services + a_la_carte_services
        
        for service in all_services:
            service_dict = prepare_for_mongo(service.dict())
            await db.services.insert_one(service_dict)
    
    # Generate time slots if they don't exist
    slots_count = await db.time_slots.count_documents({})
    if slots_count == 0:
        time_slots = generate_time_slots()
        for slot in time_slots:
            slot_dict = prepare_for_mongo(slot.dict())
            await db.time_slots.insert_one(slot_dict)

# Auth endpoints
@api_router.post("/auth/register", response_model=AuthResponse)
async def register(user_data: UserRegister):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user = User(
        email=user_data.email,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=user_data.phone,
        password_hash=hash_password(user_data.password)
    )
    
    user_dict = prepare_for_mongo(user.dict())
    await db.users.insert_one(user_dict)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    # Return user data without password
    user_response = {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone": user.phone
    }
    
    return AuthResponse(access_token=access_token, user=user_response)

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(user_data: UserLogin):
    # Find user by email
    user = await db.users.find_one({"email": user_data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create access token
    access_token = create_access_token(data={"sub": user["id"]})
    
    # Return user data without password
    user_response = {
        "id": user["id"],
        "email": user["email"],
        "first_name": user["first_name"],
        "last_name": user["last_name"],
        "phone": user.get("phone")
    }
    
    return AuthResponse(access_token=access_token, user=user_response)

@api_router.get("/auth/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "phone": current_user.phone
    }

# Services endpoints
@api_router.get("/services", response_model=List[Service])
async def get_services():
    services = await db.services.find().to_list(1000)
    return [Service(**service) for service in services]

@api_router.get("/services/standard", response_model=List[Service])
async def get_standard_services():
    services = await db.services.find({"is_a_la_carte": False}).to_list(1000)
    return [Service(**service) for service in services]

@api_router.get("/services/a-la-carte", response_model=List[Service])
async def get_a_la_carte_services():
    services = await db.services.find({"is_a_la_carte": True}).to_list(1000)
    return [Service(**service) for service in services]

@api_router.get("/pricing/{house_size}/{frequency}")
async def get_pricing(house_size: HouseSize, frequency: ServiceFrequency):
    base_price = get_base_price(house_size, frequency)
    return {"house_size": house_size, "frequency": frequency, "base_price": base_price}

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
async def create_customer(customer_data: CustomerCreate, current_user: User = Depends(get_current_user)):
    # Check if customer already exists for this user
    existing = await db.customers.find_one({"email": customer_data.email, "user_id": current_user.id})
    if existing:
        return Customer(**existing)
    
    customer = Customer(**customer_data.dict(), user_id=current_user.id)
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
async def create_booking(booking_data: BookingCreate, current_user: User = Depends(get_current_user)):
    # Create or get customer
    customer = Customer(**booking_data.customer.dict(), user_id=current_user.id)
    existing_customer = await db.customers.find_one({"email": customer.email, "user_id": current_user.id})
    
    if existing_customer:
        customer = Customer(**existing_customer)
    else:
        customer_dict = prepare_for_mongo(customer.dict())
        await db.customers.insert_one(customer_dict)
    
    # Calculate base price
    base_price = get_base_price(booking_data.house_size, booking_data.frequency)
    
    # Calculate a la carte total
    a_la_carte_total = 0.0
    for cart_item in booking_data.a_la_carte_services:
        service = await db.services.find_one({"id": cart_item.service_id, "is_a_la_carte": True})
        if service and service.get('a_la_carte_price'):
            a_la_carte_total += service['a_la_carte_price'] * cart_item.quantity
    
    total_amount = base_price + a_la_carte_total
    
    # Mark time slot as unavailable
    await db.time_slots.update_one(
        {"date": booking_data.booking_date, "start_time": booking_data.time_slot.split("-")[0]},
        {"$set": {"is_available": False}}
    )
    
    # Create booking
    booking = Booking(
        user_id=current_user.id,
        customer_id=customer.id,
        house_size=booking_data.house_size,
        frequency=booking_data.frequency,
        services=booking_data.services,
        a_la_carte_services=booking_data.a_la_carte_services,
        booking_date=booking_data.booking_date,
        time_slot=booking_data.time_slot,
        base_price=base_price,
        a_la_carte_total=a_la_carte_total,
        total_amount=total_amount,
        special_instructions=booking_data.special_instructions
    )
    
    booking_dict = prepare_for_mongo(booking.dict())
    await db.bookings.insert_one(booking_dict)
    
    return booking

@api_router.get("/bookings", response_model=List[Booking])
async def get_bookings(current_user: User = Depends(get_current_user)):
    bookings = await db.bookings.find({"user_id": current_user.id}).sort("created_at", -1).to_list(1000)
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