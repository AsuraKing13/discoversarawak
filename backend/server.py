from fastapi import FastAPI, APIRouter, Query, HTTPException
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
from emergentintegrations.llm.chat import LlmChat, UserMessage


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Mount static files for images
static_dir = ROOT_DIR / "static"
static_dir.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ============ MODELS ============

class Attraction(BaseModel):
    id: str = Field(alias='_id')
    name: str
    location: Optional[str] = None
    description: Optional[str] = None
    categories: List[str] = []
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        populate_by_name = True

class Event(BaseModel):
    id: str = Field(alias='_id')
    title: str
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    organizer: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        populate_by_name = True

class VisitorAnalytics(BaseModel):
    year: int
    month: int
    country: str
    visitor_type: str
    count: int

class PublicHoliday(BaseModel):
    date: datetime
    name: str

class Favorite(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias='_id')
    user_id: str
    attraction_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

class FavoriteCreate(BaseModel):
    user_id: str
    attraction_id: str

class ItineraryRequest(BaseModel):
    interests: List[str] = Field(..., description="List of interests (Culture, Adventure, Nature, Foods, Festivals)")
    duration: int = Field(..., description="Duration in days (1, 3, 5, 7)")
    budget: str = Field(..., description="Budget level (low, medium, high)")
    user_id: Optional[str] = None

class ItineraryResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias='_id')
    user_id: Optional[str] = None
    itinerary: str
    interests: List[str]
    duration: int
    budget: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True


# ============ ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "Discover Sarawak API", "version": "1.0.0"}

# Attractions endpoints
@api_router.get("/attractions", response_model=List[Attraction])
async def get_attractions(
    category: Optional[str] = Query(None, description="Filter by category (Culture, Adventure, Nature, Foods, Festivals, Homestays)"),
    location: Optional[str] = Query(None, description="Filter by location"),
    limit: int = Query(1000, le=1000)
):
    """Get all attractions with optional filtering"""
    query = {}
    
    if category:
        query['categories'] = category
    
    if location:
        query['location'] = {'$regex': location, '$options': 'i'}
    
    attractions = await db.attractions.find(query).limit(limit).to_list(limit)
    return [Attraction(**attraction) for attraction in attractions]

@api_router.get("/attractions/{attraction_id}", response_model=Attraction)
async def get_attraction(attraction_id: str):
    """Get a single attraction by ID"""
    attraction = await db.attractions.find_one({"_id": attraction_id})
    if not attraction:
        raise HTTPException(status_code=404, detail="Attraction not found")
    return Attraction(**attraction)

# Events endpoints
@api_router.get("/events", response_model=List[Event])
async def get_events(
    category: Optional[str] = Query(None, description="Filter by category (Festival, Adventure)"),
    start_date: Optional[datetime] = Query(None, description="Filter events starting from this date"),
    end_date: Optional[datetime] = Query(None, description="Filter events ending before this date"),
    limit: int = Query(100, le=1000)
):
    """Get all events with optional filtering"""
    query = {}
    
    if category:
        query['category'] = category
    
    if start_date:
        query['start_date'] = {'$gte': start_date}
    
    if end_date:
        if 'start_date' in query:
            query['start_date']['$lte'] = end_date
        else:
            query['start_date'] = {'$lte': end_date}
    
    events = await db.events.find(query).sort('start_date', 1).limit(limit).to_list(limit)
    return [Event(**event) for event in events]

@api_router.get("/events/{event_id}", response_model=Event)
async def get_event(event_id: str):
    """Get a single event by ID"""
    event = await db.events.find_one({"_id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return Event(**event)

# Visitor analytics endpoints
@api_router.get("/analytics", response_model=List[VisitorAnalytics])
async def get_analytics(
    year: Optional[int] = Query(None, description="Filter by year"),
    month: Optional[int] = Query(None, description="Filter by month"),
    country: Optional[str] = Query(None, description="Filter by country"),
    visitor_type: Optional[str] = Query(None, description="Filter by visitor type (Domestic, International)")
):
    """Get visitor analytics data"""
    query = {}
    
    if year:
        query['year'] = year
    if month:
        query['month'] = month
    if country:
        query['country'] = country
    if visitor_type:
        query['visitor_type'] = visitor_type
    
    analytics = await db.visitor_analytics.find(query).to_list(10000)
    return [VisitorAnalytics(**record) for record in analytics]

# Public holidays endpoints
@api_router.get("/holidays", response_model=List[PublicHoliday])
async def get_holidays(
    year: Optional[int] = Query(None, description="Filter by year")
):
    """Get public holidays"""
    query = {}
    
    if year:
        query['date'] = {
            '$gte': datetime(year, 1, 1),
            '$lt': datetime(year + 1, 1, 1)
        }
    
    holidays = await db.public_holidays.find(query).sort('date', 1).to_list(100)
    return [PublicHoliday(**holiday) for holiday in holidays]

# Favorites endpoints
@api_router.post("/favorites", response_model=Favorite)
async def add_favorite(favorite: FavoriteCreate):
    """Add attraction to favorites"""
    # Check if already favorited
    existing = await db.favorites.find_one({
        'user_id': favorite.user_id,
        'attraction_id': favorite.attraction_id
    })
    
    if existing:
        return Favorite(**existing)
    
    favorite_obj = Favorite(
        user_id=favorite.user_id,
        attraction_id=favorite.attraction_id
    )
    
    await db.favorites.insert_one(favorite_obj.dict(by_alias=True))
    return favorite_obj

@api_router.get("/favorites/{user_id}", response_model=List[Attraction])
async def get_user_favorites(user_id: str):
    """Get user's favorite attractions"""
    favorites = await db.favorites.find({'user_id': user_id}).to_list(1000)
    attraction_ids = [fav['attraction_id'] for fav in favorites]
    
    attractions = await db.attractions.find({'_id': {'$in': attraction_ids}}).to_list(1000)
    return [Attraction(**attraction) for attraction in attractions]

@api_router.delete("/favorites/{user_id}/{attraction_id}")
async def remove_favorite(user_id: str, attraction_id: str):
    """Remove attraction from favorites"""
    result = await db.favorites.delete_one({
        'user_id': user_id,
        'attraction_id': attraction_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Favorite not found")
    
    return {"message": "Favorite removed successfully"}

# Health check endpoint
@api_router.get("/health")
async def health_check():
    """Check if the API and database are healthy"""
    try:
        # Test database connection
        await db.command('ping')
        
        # Get collection counts
        attractions_count = await db.attractions.count_documents({})
        events_count = await db.events.count_documents({})
        
        return {
            "status": "healthy",
            "database": "connected",
            "collections": {
                "attractions": attractions_count,
                "events": events_count
            }
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
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
