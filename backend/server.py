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

# Google Calendar Service
calendar_service = 0

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

class UserRole(str, Enum):
    CUSTOMER = "customer"
    ADMIN = "admin"
    CLEANER = "cleaner"

class TicketStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress" 
    CLOSED = "closed"

class TicketPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

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

class InvoiceStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"

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
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    password_hash: str
    role: UserRole = UserRole.CUSTOMER
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

# Service Models
class Service(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    description: Optional[str] = None
    is_a_la_carte: bool = False
    a_la_carte_price: Optional[float] = None
    duration_hours: Optional[int] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BookingService(BaseModel):
    service_id: str
    quantity: int = 1
    special_instructions: Optional[str] = None

class TimeSlot(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str
    time_slot: str
    is_available: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Address(BaseModel):
    street: str
    city: str
    state: str
    zip_code: str
    apartment: Optional[str] = None

class Booking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    customer_id: str
    house_size: HouseSize
    frequency: ServiceFrequency
    rooms: Optional[Dict[str, Any]] = None
    services: List[BookingService]
    a_la_carte_services: List[BookingService] = []
    booking_date: str
    time_slot: str
    base_price: float
    a_la_carte_total: float = 0.0
    total_amount: float
    status: BookingStatus = BookingStatus.PENDING
    payment_status: PaymentStatus = PaymentStatus.PENDING
    address: Optional[Address] = None
    special_instructions: Optional[str] = None
    cleaner_id: Optional[str] = None
    calendar_event_id: Optional[str] = None
    estimated_duration_hours: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Cleaner(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    first_name: str
    last_name: str
    phone: str
    is_active: bool = True
    rating: float = 5.0
    total_jobs: int = 0
    google_calendar_credentials: Optional[dict] = None
    google_calendar_id: Optional[str] = "primary"
    calendar_integration_enabled: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FAQ(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    answer: str
    category: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Ticket(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    subject: str
    message: str
    status: TicketStatus = TicketStatus.OPEN
    priority: TicketPriority = TicketPriority.MEDIUM
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Invoice Models
class InvoiceItem(BaseModel):
    service_id: str
    service_name: str
    description: Optional[str] = None
    quantity: int = 1
    unit_price: float
    total_price: float

class Invoice(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invoice_number: str = Field(default_factory=lambda: f"INV-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}")
    booking_id: str
    customer_id: str
    customer_name: str
    customer_email: str
    customer_address: Optional[Address] = None
    items: List[InvoiceItem]
    subtotal: float
    tax_rate: float = 0.0825  # 8.25% Texas sales tax
    tax_amount: float
    total_amount: float
    status: InvoiceStatus = InvoiceStatus.DRAFT
    issue_date: datetime = Field(default_factory=datetime.utcnow)
    due_date: Optional[datetime] = None
    paid_date: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Calendar Assignment Models
class JobAssignment(BaseModel):
    booking_id: str
    cleaner_id: str
    start_time: datetime
    end_time: datetime
    notes: Optional[str] = None

class CalendarTimeSlot(BaseModel):
    start_time: str  # Format: "HH:MM"
    end_time: str
    is_available: bool
    booking_id: Optional[str] = None

# Helper Functions
def prepare_for_mongo(data):
    """Prepare data for MongoDB insertion by converting datetime to ISO strings"""
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
            elif isinstance(value, dict):
                data[key] = prepare_for_mongo(value)
            elif isinstance(value, list):
                data[key] = [prepare_for_mongo(item) if isinstance(item, dict) else item for item in value]
    return data

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def get_base_price(house_size: HouseSize, frequency: ServiceFrequency) -> float:
    """Calculate base price based on house size and frequency"""
    # Base prices by house size
    size_prices = {
        HouseSize.SIZE_1000_1500: 120,
        HouseSize.SIZE_1500_2000: 150,
        HouseSize.SIZE_2000_2500: 180,
        HouseSize.SIZE_2500_3000: 210,
        HouseSize.SIZE_3000_3500: 240,
        HouseSize.SIZE_3500_4000: 270,
        HouseSize.SIZE_4000_4500: 300,
        HouseSize.SIZE_5000_PLUS: 350
    }
    
    # Frequency multipliers
    frequency_multipliers = {
        ServiceFrequency.ONE_TIME: 1.5,
        ServiceFrequency.MONTHLY: 1.0,
        ServiceFrequency.EVERY_3_WEEKS: 0.95,
        ServiceFrequency.BI_WEEKLY: 0.9,
        ServiceFrequency.WEEKLY: 0.8
    }
    
    base_price = size_prices.get(house_size, 180)
    multiplier = frequency_multipliers.get(frequency, 1.0)
    
    return base_price * multiplier

def get_dynamic_a_la_carte_price(service: dict, house_size: str) -> float:
    """Dynamically adjust price for Dust Baseboards based on house size range.
       For Dust Baseboards, if the upper bound of the range is <=2500, use $20; otherwise use $30.
    """
    if service.get("name", "").lower() == "dust baseboards":
        # e.g., house_size "2000-2500", "2500-3000", or "5000+"
        if house_size.endswith("+"):
            return 30.0
        parts = house_size.split("-")
        if len(parts) == 2:
            try:
                high = int(parts[1])
                return 20.0 if high <= 2500 else 30.0
            except ValueError:
                pass
    return service.get("a_la_carte_price", 0.0)

def calculate_job_duration(house_size: HouseSize, services: List[BookingService], a_la_carte_services: List[BookingService]) -> int:
    """Calculate estimated job duration in hours"""
    # Base duration by house size (in hours)
    size_durations = {
        HouseSize.SIZE_1000_1500: 2,
        HouseSize.SIZE_1500_2000: 2.5,
        HouseSize.SIZE_2000_2500: 3,
        HouseSize.SIZE_2500_3000: 3.5,
        HouseSize.SIZE_3000_3500: 4,
        HouseSize.SIZE_3500_4000: 4.5,
        HouseSize.SIZE_4000_4500: 5,
        HouseSize.SIZE_5000_PLUS: 6
    }
    
    base_duration = size_durations.get(house_size, 3)
    
    # Add time for a la carte services (0.5 hour per service)
    additional_duration = len(a_la_carte_services) * 0.5
    
    total_duration = base_duration + additional_duration
    
    # Round up to nearest hour
    return int(total_duration) if total_duration == int(total_duration) else int(total_duration) + 1

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    return User(**user)

async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        "phone": user.phone,
        "role": user.role
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
        "phone": user.get("phone"),
        "role": user.get("role", "customer")
    }
    
    return AuthResponse(access_token=access_token, user=user_response)

@api_router.get("/auth/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "phone": current_user.phone,
        "role": current_user.role
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
        {"$group": {"_id": "$date"}},
        {"$sort": {"_id": 1}}
    ]
    
    dates = await db.time_slots.aggregate(pipeline).to_list(1000)
    return [item["_id"] for item in dates]

# Booking endpoints
@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking_data: dict, current_user: User = Depends(get_current_user)):
    # Calculate a la carte total
    a_la_carte_total = 0.0
    if booking_data.get('a_la_carte_services'):
        for service_data in booking_data['a_la_carte_services']:
            service = await db.services.find_one({"id": service_data['service_id']})
            if service:
                # Use dynamic pricing for Dust Baseboards based on the booking house size
                dynamic_price = get_dynamic_a_la_carte_price(service, booking_data['house_size'])
                a_la_carte_total += dynamic_price * service_data.get('quantity', 1)
    
    # Create booking
    booking = Booking(
        user_id=current_user.id,
        customer_id=current_user.id,
        house_size=booking_data['house_size'],
        frequency=booking_data['frequency'],
        rooms=booking_data.get('rooms'),
        services=[BookingService(**service) for service in booking_data['services']],
        a_la_carte_services=[BookingService(**service) for service in booking_data.get('a_la_carte_services', [])],
        booking_date=booking_data['booking_date'],
        time_slot=booking_data['time_slot'],
        base_price=booking_data['base_price'],
        a_la_carte_total=a_la_carte_total,
        total_amount=booking_data['base_price'] + a_la_carte_total,
        address=Address(**booking_data['address']) if booking_data.get('address') else None,
        special_instructions=booking_data.get('special_instructions'),
        estimated_duration_hours=calculate_job_duration(
            HouseSize(booking_data['house_size']),
            [BookingService(**service) for service in booking_data['services']],
            [BookingService(**service) for service in booking_data.get('a_la_carte_services', [])]
        )
    )
    
    booking_dict = prepare_for_mongo(booking.dict())
    await db.bookings.insert_one(booking_dict)
    
    # Mark time slot as unavailable
    await db.time_slots.update_one(
        {"date": booking_data['booking_date'], "time_slot": booking_data['time_slot']},
        {"$set": {"is_available": False}}
    )
    
    return booking

@api_router.get("/bookings", response_model=List[Booking])
async def get_user_bookings(current_user: User = Depends(get_current_user)):
    bookings = await db.bookings.find({"user_id": current_user.id}).to_list(1000)
    return [Booking(**booking) for booking in bookings]

@api_router.get("/bookings/{booking_id}", response_model=Booking)
async def get_booking(booking_id: str, current_user: User = Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if user owns the booking or is admin
    if current_user.role != UserRole.ADMIN and booking.get("user_id") != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return Booking(**booking)

# Admin endpoints
@api_router.get("/admin/stats")
async def get_admin_stats(admin_user: User = Depends(get_admin_user)):
    # Get stats from database
    total_bookings = await db.bookings.count_documents({})
    total_revenue = await db.bookings.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
    ]).to_list(1)
    total_cleaners = await db.cleaners.count_documents({"is_active": True})
    open_tickets = await db.tickets.count_documents({"status": {"$ne": "closed"}})
    
    return {
        "total_bookings": total_bookings,
        "total_revenue": total_revenue[0]["total"] if total_revenue else 0,
        "total_cleaners": total_cleaners,
        "open_tickets": open_tickets
    }

@api_router.get("/admin/bookings", response_model=List[Booking])
async def get_all_bookings(admin_user: User = Depends(get_admin_user)):
    bookings = await db.bookings.find().sort("created_at", -1).to_list(1000)
    return [Booking(**booking) for booking in bookings]

@api_router.patch("/admin/bookings/{booking_id}")
async def update_booking(booking_id: str, update_data: dict, admin_user: User = Depends(get_admin_user)):
    result = await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {**update_data, "updated_at": datetime.utcnow().isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return {"message": "Booking updated successfully"}

@api_router.get("/admin/cleaners", response_model=List[Cleaner])
async def get_cleaners(admin_user: User = Depends(get_admin_user)):
    cleaners = await db.cleaners.find().to_list(1000)
    return [Cleaner(**cleaner) for cleaner in cleaners]

@api_router.post("/admin/cleaners", response_model=Cleaner)
async def create_cleaner(cleaner_data: dict, admin_user: User = Depends(get_admin_user)):
    cleaner = Cleaner(**cleaner_data)
    cleaner_dict = prepare_for_mongo(cleaner.dict())
    await db.cleaners.insert_one(cleaner_dict)
    return cleaner

@api_router.delete("/admin/cleaners/{cleaner_id}")
async def delete_cleaner(cleaner_id: str, admin_user: User = Depends(get_admin_user)):
    result = await db.cleaners.delete_one({"id": cleaner_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cleaner not found")
    return {"message": "Cleaner deleted successfully"}

@api_router.get("/admin/services", response_model=List[Service])
async def get_admin_services(admin_user: User = Depends(get_admin_user)):
    services = await db.services.find().to_list(1000)
    return [Service(**service) for service in services]

@api_router.post("/admin/services", response_model=Service)
async def create_service(service_data: dict, admin_user: User = Depends(get_admin_user)):
    service = Service(**service_data)
    service_dict = prepare_for_mongo(service.dict())
    await db.services.insert_one(service_dict)
    return service

@api_router.delete("/admin/services/{service_id}")
async def delete_service(service_id: str, admin_user: User = Depends(get_admin_user)):
    result = await db.services.delete_one({"id": service_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"message": "Service deleted successfully"}

@api_router.get("/admin/faqs", response_model=List[FAQ])
async def get_faqs(admin_user: User = Depends(get_admin_user)):
    faqs = await db.faqs.find().to_list(1000)
    return [FAQ(**faq) for faq in faqs]

@api_router.post("/admin/faqs", response_model=FAQ)
async def create_faq(faq_data: dict, admin_user: User = Depends(get_admin_user)):
    faq = FAQ(**faq_data)
    faq_dict = prepare_for_mongo(faq.dict())
    await db.faqs.insert_one(faq_dict)
    return faq

@api_router.delete("/admin/faqs/{faq_id}")
async def delete_faq(faq_id: str, admin_user: User = Depends(get_admin_user)):
    result = await db.faqs.delete_one({"id": faq_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return {"message": "FAQ deleted successfully"}

@api_router.get("/admin/tickets", response_model=List[Ticket])
async def get_tickets(admin_user: User = Depends(get_admin_user)):
    tickets = await db.tickets.find().sort("created_at", -1).to_list(1000)
    return [Ticket(**ticket) for ticket in tickets]

@api_router.patch("/admin/tickets/{ticket_id}")
async def update_ticket(ticket_id: str, update_data: dict, admin_user: User = Depends(get_admin_user)):
    result = await db.tickets.update_one(
        {"id": ticket_id},
        {"$set": {**update_data, "updated_at": datetime.utcnow().isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return {"message": "Ticket updated successfully"}

@api_router.get("/admin/export/bookings")
async def export_bookings(admin_user: User = Depends(get_admin_user)):
    bookings = await db.bookings.find().to_list(1000)
    
    # Convert to CSV-friendly format
    csv_data = []
    for booking in bookings:
        csv_data.append({
            "ID": booking["id"],
            "Customer ID": booking.get("customer_id", ""),
            "Date": booking.get("booking_date", ""),
            "Time": booking.get("time_slot", ""),
            "House Size": booking.get("house_size", ""),
            "Frequency": booking.get("frequency", ""),
            "Amount": booking.get("total_amount", 0),
            "Status": booking.get("status", ""),
            "Cleaner": booking.get("cleaner_id", ""),
            "Created": booking.get("created_at", "")
        })
    
    return {"data": csv_data, "filename": f"bookings_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}

# Enhanced Google Calendar Integration Endpoints
@api_router.post("/admin/cleaners/{cleaner_id}/calendar/setup")
async def setup_cleaner_calendar(
    cleaner_id: str, 
    calendar_data: dict, 
    admin_user: User = Depends(get_admin_user)
):
    """Setup Google Calendar integration for a cleaner"""
    try:
        credentials = calendar_data.get('credentials')
        calendar_id = calendar_data.get('calendar_id', 'primary')
        
        if not credentials:
            raise HTTPException(status_code=400, detail="Google Calendar credentials required")
        
        # Validate credentials
        if not calendar_service.validate_credentials(credentials):
            raise HTTPException(status_code=400, detail="Invalid Google Calendar credentials")
        
        # Update cleaner with calendar info
        result = await db.cleaners.update_one(
            {"id": cleaner_id},
            {"$set": {
                "google_calendar_credentials": credentials,
                "google_calendar_id": calendar_id,
                "calendar_integration_enabled": True
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Cleaner not found")
        
        return {"message": "Calendar integration setup successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to setup calendar: {str(e)}")

@api_router.get("/admin/cleaners/{cleaner_id}/calendar/events")
async def get_cleaner_calendar_events(
    cleaner_id: str,
    days_ahead: int = 7,
    admin_user: User = Depends(get_admin_user)
):
    """Get calendar events for a cleaner"""
    try:
        # Get cleaner info
        cleaner = await db.cleaners.find_one({"id": cleaner_id})
        if not cleaner:
            raise HTTPException(status_code=404, detail="Cleaner not found")
        
        if not cleaner.get('calendar_integration_enabled'):
            return {"events": [], "message": "Calendar integration not enabled"}
        
        credentials = cleaner.get('google_calendar_credentials')
        calendar_id = cleaner.get('google_calendar_id', 'primary')
        
        if not credentials:
            return {"events": [], "message": "No calendar credentials found"}
        
        # Get calendar service
        service = calendar_service.create_service_from_credentials_dict(credentials)
        if not service:
            return {"events": [], "message": "Failed to connect to calendar"}
        
        # Get events
        events = calendar_service.get_calendar_events(service, calendar_id, days_ahead)
        
        return {
            "events": events,
            "cleaner_id": cleaner_id,
            "calendar_id": calendar_id,
            "days_ahead": days_ahead
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get calendar events: {str(e)}")

@api_router.get("/admin/calendar/availability-summary")
async def get_availability_summary(
    date: str,
    admin_user: User = Depends(get_admin_user)
):
    """Get availability summary for all cleaners for a specific date"""
    try:
        # Get all active cleaners
        cleaners = await db.cleaners.find({"is_active": True}).to_list(1000)
        
        time_slots = ["08:00-10:00", "10:00-12:00", "12:00-14:00", "14:00-16:00", "16:00-18:00"]
        
        cleaner_availability = []
        
        for cleaner in cleaners:
            cleaner_data = {
                "cleaner_id": cleaner["id"],
                "cleaner_name": f"{cleaner['first_name']} {cleaner['last_name']}",
                "calendar_enabled": cleaner.get('calendar_integration_enabled', False),
                "slots": {}
            }
            
            if cleaner.get('calendar_integration_enabled') and cleaner.get('google_calendar_credentials'):
                # Check availability for each time slot
                credentials = cleaner['google_calendar_credentials']
                service = calendar_service.create_service_from_credentials_dict(credentials)
                
                if service:
                    for slot in time_slots:
                        start_time, end_time = slot.split('-')
                        job_date = datetime.fromisoformat(date)
                        start_datetime = datetime.combine(job_date.date(), datetime.strptime(start_time, "%H:%M").time())
                        end_datetime = datetime.combine(job_date.date(), datetime.strptime(end_time, "%H:%M").time())
                        
                        is_available = calendar_service.check_availability(
                            service, 
                            cleaner.get('google_calendar_id', 'primary'),
                            start_datetime, 
                            end_datetime
                        )
                        
                        cleaner_data["slots"][slot] = is_available
                else:
                    # If calendar service failed, mark all as unavailable
                    for slot in time_slots:
                        cleaner_data["slots"][slot] = False
            else:
                # If no calendar integration, mark all as unknown (None)
                for slot in time_slots:
                    cleaner_data["slots"][slot] = None
            
            cleaner_availability.append(cleaner_data)
        
        return {
            "date": date,
            "cleaners": cleaner_availability,
            "time_slots": time_slots
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get availability summary: {str(e)}")

@api_router.post("/admin/calendar/assign-job")
async def assign_job_to_calendar(
    assignment_data: JobAssignment,
    admin_user: User = Depends(get_admin_user)
):
    """Assign a job to a cleaner's calendar with drag-and-drop functionality"""
    try:
        # Get booking details
        booking = await db.bookings.find_one({"id": assignment_data.booking_id})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Get cleaner details
        cleaner = await db.cleaners.find_one({"id": assignment_data.cleaner_id})
        if not cleaner:
            raise HTTPException(status_code=404, detail="Cleaner not found")
        
        # Check if cleaner has calendar integration
        if not cleaner.get('calendar_integration_enabled') or not cleaner.get('google_calendar_credentials'):
            raise HTTPException(status_code=400, detail="Cleaner doesn't have calendar integration enabled")
        
        # Get calendar service
        credentials = cleaner['google_calendar_credentials']
        service = calendar_service.create_service_from_credentials_dict(credentials)
        
        if not service:
            raise HTTPException(status_code=500, detail="Failed to connect to cleaner's calendar")
        
        # Check availability for the requested time
        is_available = calendar_service.check_availability(
            service,
            cleaner.get('google_calendar_id', 'primary'),
            assignment_data.start_time,
            assignment_data.end_time
        )
        
        if not is_available:
            raise HTTPException(status_code=409, detail="Cleaner is not available during the requested time")
        
        # Create calendar event
        job_data = {
            "job_id": booking["id"],
            "customer_name": f"Customer {booking.get('customer_id', '')[:8]}",
            "address": f"{booking.get('address', {}).get('street', '')} {booking.get('address', {}).get('city', '')}",
            "services": f"{booking.get('house_size', '')} - {booking.get('frequency', '')}",
            "amount": booking.get('total_amount', 0),
            "instructions": booking.get('special_instructions', 'None'),
            "start_time": assignment_data.start_time.isoformat(),
            "end_time": assignment_data.end_time.isoformat()
        }
        
        event_id = calendar_service.create_job_event(
            service,
            cleaner.get('google_calendar_id', 'primary'),
            job_data
        )
        
        if not event_id:
            raise HTTPException(status_code=500, detail="Failed to create calendar event")
        
        # Update booking with cleaner assignment and calendar event
        update_data = {
            "cleaner_id": assignment_data.cleaner_id,
            "calendar_event_id": event_id,
            "status": "confirmed",
            "updated_at": datetime.utcnow().isoformat()
        }
        
        if assignment_data.notes:
            update_data["assignment_notes"] = assignment_data.notes
        
        await db.bookings.update_one(
            {"id": assignment_data.booking_id},
            {"$set": update_data}
        )
        
        return {
            "message": "Job assigned successfully",
            "booking_id": assignment_data.booking_id,
            "cleaner_id": assignment_data.cleaner_id,
            "calendar_event_id": event_id,
            "start_time": assignment_data.start_time.isoformat(),
            "end_time": assignment_data.end_time.isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to assign job: {str(e)}")

@api_router.get("/admin/calendar/unassigned-jobs")
async def get_unassigned_jobs(admin_user: User = Depends(get_admin_user)):
    """Get all unassigned jobs for drag-and-drop assignment"""
    try:
        # Get bookings without cleaner assignment
        unassigned_bookings = await db.bookings.find({
            "cleaner_id": {"$exists": False},
            "status": {"$in": ["pending", "confirmed"]}
        }).sort("booking_date", 1).to_list(1000)
        
        jobs = []
        for booking in unassigned_bookings:
            jobs.append({
                "id": booking["id"],
                "customer_id": booking.get("customer_id", "")[:8],
                "booking_date": booking.get("booking_date"),
                "time_slot": booking.get("time_slot"),
                "house_size": booking.get("house_size"),
                "frequency": booking.get("frequency"),
                "total_amount": booking.get("total_amount"),
                "estimated_duration_hours": booking.get("estimated_duration_hours", 2),
                "address": booking.get("address", {}),
                "special_instructions": booking.get("special_instructions"),
                "services": booking.get("services", []),
                "a_la_carte_services": booking.get("a_la_carte_services", [])
            })
        
        return {"unassigned_jobs": jobs}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get unassigned jobs: {str(e)}")

# Invoice Management Endpoints
@api_router.get("/admin/invoices", response_model=List[Invoice])
async def get_all_invoices(
    status: Optional[InvoiceStatus] = None,
    admin_user: User = Depends(get_admin_user)
):
    """Get all invoices with optional status filter"""
    query = {}
    if status:
        query["status"] = status
    
    invoices = await db.invoices.find(query).sort("created_at", -1).to_list(1000)
    return [Invoice(**invoice) for invoice in invoices]

@api_router.post("/admin/invoices/generate/{booking_id}", response_model=Invoice)
async def generate_invoice_for_booking(
    booking_id: str,
    admin_user: User = Depends(get_admin_user)
):
    """Generate invoice for a completed booking"""
    try:
        # Get booking details
        booking = await db.bookings.find_one({"id": booking_id})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Check if invoice already exists
        existing_invoice = await db.invoices.find_one({"booking_id": booking_id})
        if existing_invoice:
            raise HTTPException(status_code=400, detail="Invoice already exists for this booking")
        
        # Get customer details
        customer = await db.users.find_one({"id": booking["customer_id"]})
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Get service details
        services = await db.services.find().to_list(1000)
        service_map = {service["id"]: service for service in services}
        
        # Create invoice items
        invoice_items = []
        
        # Add base service
        invoice_items.append(InvoiceItem(
            service_id="base_service",
            service_name=f"{booking['house_size']} - {booking['frequency']} Cleaning",
            description=f"Standard cleaning for {booking['house_size']} sqft home",
            quantity=1,
            unit_price=booking.get("base_price", 0),
            total_price=booking.get("base_price", 0)
        ))
        
        # Add a la carte services
        for a_la_carte in booking.get("a_la_carte_services", []):
            service = service_map.get(a_la_carte["service_id"])
            if service:
                unit_price = service.get("a_la_carte_price", 0)
                quantity = a_la_carte.get("quantity", 1)
                invoice_items.append(InvoiceItem(
                    service_id=service["id"],
                    service_name=service["name"],
                    description=service.get("description", ""),
                    quantity=quantity,
                    unit_price=unit_price,
                    total_price=unit_price * quantity
                ))
        
        # Calculate totals
        subtotal = sum(item.total_price for item in invoice_items)
        tax_rate = 0.0825  # 8.25% Texas sales tax
        tax_amount = subtotal * tax_rate
        total_amount = subtotal + tax_amount
        
        # Create invoice
        invoice = Invoice(
            booking_id=booking_id,
            customer_id=booking["customer_id"],
            customer_name=f"{customer['first_name']} {customer['last_name']}",
            customer_email=customer["email"],
            customer_address=Address(**booking["address"]) if booking.get("address") else None,
            items=invoice_items,
            subtotal=subtotal,
            tax_rate=tax_rate,
            tax_amount=tax_amount,
            total_amount=total_amount,
            status=InvoiceStatus.DRAFT,
            due_date=datetime.utcnow() + timedelta(days=30),  # 30 days from creation
            notes=f"Invoice for cleaning services on {booking.get('booking_date', '')}"
        )
        
        # Save to database
        invoice_dict = prepare_for_mongo(invoice.dict())
        await db.invoices.insert_one(invoice_dict)
        
        return invoice
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate invoice: {str(e)}")

@api_router.patch("/admin/invoices/{invoice_id}")
async def update_invoice_status(
    invoice_id: str,
    update_data: dict,
    admin_user: User = Depends(get_admin_user)
):
    """Update invoice status and other fields"""
    try:
        # Add paid_date if status is being set to paid
        if update_data.get("status") == "paid" and "paid_date" not in update_data:
            update_data["paid_date"] = datetime.utcnow().isoformat()
        
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        result = await db.invoices.update_one(
            {"id": invoice_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        return {"message": "Invoice updated successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update invoice: {str(e)}")

@api_router.get("/admin/invoices/{invoice_id}/pdf")
async def generate_invoice_pdf(
    invoice_id: str,
    admin_user: User = Depends(get_admin_user)
):
    """Generate PDF for invoice (mock implementation)"""
    try:
        # Get invoice
        invoice = await db.invoices.find_one({"id": invoice_id})
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # For now, return mock PDF data
        # In a real implementation, you would use a PDF generation library
        return {
            "message": "PDF generation endpoint ready",
            "invoice_id": invoice_id,
            "pdf_url": f"/api/admin/invoices/{invoice_id}/download",
            "note": "PDF generation would be implemented here using libraries like ReportLab or WeasyPrint"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")

@api_router.delete("/admin/invoices/{invoice_id}")
async def delete_invoice(
    invoice_id: str,
    admin_user: User = Depends(get_admin_user)
):
    """Delete an invoice (only if status is draft)"""
    try:
        # Check invoice status
        invoice = await db.invoices.find_one({"id": invoice_id})
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        if invoice.get("status") != "draft":
            raise HTTPException(status_code=400, detail="Can only delete draft invoices")
        
        result = await db.invoices.delete_one({"id": invoice_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        return {"message": "Invoice deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete invoice: {str(e)}")

# Initialize database with default data
async def initialize_database():
    """Initialize database with default services and time slots"""
    
    # Create admin user if it doesn't exist
    admin_user = await db.users.find_one({"email": "admin@maids.com"})
    if not admin_user:
        admin = User(
            email="admin@maids.com",
            first_name="Admin",
            last_name="User",
            password_hash=hash_password("admin123"),
            role=UserRole.ADMIN
        )
        await db.users.insert_one(prepare_for_mongo(admin.dict()))
        print("Created admin user: admin@maids.com / admin123")
    
    # Create demo customer if it doesn't exist
    demo_customer = await db.users.find_one({"email": "test@maids.com"})
    if not demo_customer:
        customer = User(
            email="test@maids.com",
            first_name="Test",
            last_name="Customer",
            phone="(555) 123-4567",
            password_hash=hash_password("test@maids@1234"),
            role=UserRole.CUSTOMER
        )
        await db.users.insert_one(prepare_for_mongo(customer.dict()))
        print("Created demo customer: test@maids.com / test@maids@1234")
    
    # Create demo cleaner if it doesn't exist
    demo_cleaner_user = await db.users.find_one({"email": "cleaner@maids.com"})
    if not demo_cleaner_user:
        cleaner_user = User(
            email="cleaner@maids.com",
            first_name="Demo",
            last_name="Cleaner",
            phone="(555) 987-6543",
            password_hash=hash_password("cleaner123"),
            role=UserRole.CLEANER
        )
        await db.users.insert_one(prepare_for_mongo(cleaner_user.dict()))
        print("Created demo cleaner user: cleaner@maids.com / cleaner123")
    
    # Create demo cleaner profile if it doesn't exist
    demo_cleaner = await db.cleaners.find_one({"email": "cleaner@maids.com"})
    if not demo_cleaner:
        cleaner = Cleaner(
            email="cleaner@maids.com",
            first_name="Demo",
            last_name="Cleaner",
            phone="(555) 987-6543",
            rating=4.8,
            total_jobs=45
        )
        await db.cleaners.insert_one(prepare_for_mongo(cleaner.dict()))
        print("Created demo cleaner profile")
    
    # Create default services if they don't exist
    services_count = await db.services.count_documents({})
    if services_count == 0:
        default_services = [
            {"name": "Blinds", "category": "a_la_carte", "description": "Feather dusting only", "a_la_carte_price": 10.00, "is_a_la_carte": True},
            {"name": "Inside Kitchen/Bathroom Cabinets ( Move Out Only)", "category": "a_la_carte", "description": "Wiping out using micro fiber", "a_la_carte_price": 80.00, "is_a_la_carte": True},
            {"name": "Oven Cleaning", "category": "a_la_carte", "description": "Cleaning of 1 Oven.  Double oven is double the cost", "a_la_carte_price": 40.00, "is_a_la_carte": True},
            {"name": "Dust Baseboards", "category": "a_la_carte", "description": "Feather dust under 2500 sf", "a_la_carte_price": 20.00, "is_a_la_carte": True},
            {"name": "Dust Baseboards", "category": "a_la_carte", "description": "Feather Dust Over 2500 sf", "a_la_carte_price": 30.00, "is_a_la_carte": True},
            {"name": "Dust Shutters", "category": "a_la_carte", "description": "Feather dust under 2500 sf", "a_la_carte_price": 40.00, "is_a_la_carte": True},
            {"name": "Dust Shutters", "category": "a_la_carte", "description": "Feather Dust Over 2500 sf", "a_la_carte_price": 60.00, "is_a_la_carte": True},
            {"name": "Hand Clean Baseboards", "category": "a_la_carte", "description": "Hand wipe under 2500sf", "a_la_carte_price": 60.00, "is_a_la_carte": True},
            {"name": "Hand Clean Baseboards", "category": "a_la_carte", "description": "Hand wipe over 2500 sf", "a_la_carte_price": 80.00, "is_a_la_carte": True},
            {"name": "Inside Refrigerator", "category": "a_la_carte", "description": "Clean inside of Fridge ( not Freezer)", "a_la_carte_price": 45.00, "is_a_la_carte": True},
            {"name": "Vacuum Couch", "category": "a_la_carte", "description": "Top and Underneath (Includes 1 couch and 1 love seat combo or 1 sectional)", "a_la_carte_price": 15.00, "is_a_la_carte": True},
            {"name": "Clean Exterior Kitchen/Bathrooms cabinets", "category": "a_la_carte", "description": "Hand wipe all exterior upper and lowers cabinets", "a_la_carte_price": 40.00, "is_a_la_carte": True},
            {"name": "Dusting High Ceiling Fan", "category": "a_la_carte", "description": "Dusting ceiling fans over 10ft", "a_la_carte_price": 10.00, "is_a_la_carte": True},
            {"name": "Cleaning of Interior doors/frames", "category": "a_la_carte", "description": "Hand wipe interior door/frames/molding", "a_la_carte_price": 75.00, "is_a_la_carte": True}
        ]
        
        for service_data in default_services:
            service = Service(**service_data)
            await db.services.insert_one(prepare_for_mongo(service.dict()))
        
        print("Created default services")
    
    # Create time slots for next 30 days if they don't exist
    slots_count = await db.time_slots.count_documents({})
    if slots_count == 0:
        time_slots = ["08:00-10:00", "10:00-12:00", "12:00-14:00", "14:00-16:00", "16:00-18:00"]
        
        for i in range(30):  # Next 30 days
            slot_date = (datetime.now() + timedelta(days=i)).strftime("%Y-%m-%d")
            
            for time_slot in time_slots:
                slot = TimeSlot(date=slot_date, time_slot=time_slot)
                await db.time_slots.insert_one(prepare_for_mongo(slot.dict()))
        
        print("Created time slots for next 30 days")

@app.on_event("startup")
async def startup_event():
    await initialize_database()

# Include the API router in the main app
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)