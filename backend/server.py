from fastapi import FastAPI, APIRouter, Query, HTTPException, Cookie, Response, Depends
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
from datetime import datetime, timezone, timedelta
from emergentintegrations.llm.chat import LlmChat, UserMessage
import httpx


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

# Authentication Models
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime

class SessionDataResponse(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str]
    session_token: str


# ============ AUTHENTICATION HELPER FUNCTIONS ============

async def get_session_token_from_request(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = None
) -> Optional[str]:
    """Extract session token from cookie or Authorization header"""
    if session_token:
        return session_token
    
    if authorization and authorization.startswith("Bearer "):
        return authorization.replace("Bearer ", "")
    
    return None

async def get_current_user(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = None
) -> Optional[User]:
    """Get current authenticated user from session token"""
    token = await get_session_token_from_request(session_token, authorization)
    
    if not token:
        return None
    
    # Find session
    session = await db.user_sessions.find_one(
        {"session_token": token},
        {"_id": 0}
    )
    
    if not session:
        return None
    
    # Check if session is expired
    expires_at = session["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        # Session expired, delete it
        await db.user_sessions.delete_one({"session_token": token})
        return None
    
    # Get user
    user_doc = await db.users.find_one(
        {"user_id": session["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        return None
    
    return User(**user_doc)


# ============ AUTHENTICATION ROUTES ============

@api_router.post("/auth/session")
async def create_session(
    session_id: str,
    response: Response
):
    """Exchange session_id for session_token and user data"""
    try:
        # Call Emergent Auth API to get user data
        async with httpx.AsyncClient() as client:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id},
                timeout=10.0
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session ID")
            
            user_data = auth_response.json()
        
        # Generate custom user_id
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        
        # Check if user already exists
        existing_user = await db.users.find_one(
            {"email": user_data["email"]},
            {"_id": 0}
        )
        
        if existing_user:
            user_id = existing_user["user_id"]
        else:
            # Create new user
            new_user = {
                "user_id": user_id,
                "email": user_data["email"],
                "name": user_data["name"],
                "picture": user_data.get("picture"),
                "created_at": datetime.now(timezone.utc)
            }
            await db.users.insert_one(new_user)
        
        # Create session
        session_token = user_data["session_token"]
        session = {
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
            "created_at": datetime.now(timezone.utc)
        }
        await db.user_sessions.insert_one(session)
        
        # Set httpOnly cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7 * 24 * 60 * 60,  # 7 days
            path="/"
        )
        
        # Return user data with custom user_id
        return SessionDataResponse(
            id=user_id,
            email=user_data["email"],
            name=user_data["name"],
            picture=user_data.get("picture"),
            session_token=session_token
        )
        
    except Exception as e:
        logging.error(f"Error creating session: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create session: {str(e)}")

@api_router.get("/auth/me")
async def get_me(
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = None
):
    """Get current authenticated user"""
    user = await get_current_user(session_token, authorization)
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    return user

@api_router.post("/auth/logout")
async def logout(
    response: Response,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = None
):
    """Logout user"""
    token = await get_session_token_from_request(session_token, authorization)
    
    if token:
        # Delete session from database
        await db.user_sessions.delete_one({"session_token": token})
    
    # Clear cookie
    response.delete_cookie(key="session_token", path="/")
    
    return {"message": "Logged out successfully"}


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

# AI Itinerary Generator endpoint
@api_router.post("/itinerary/generate", response_model=ItineraryResponse)
async def generate_itinerary(request: ItineraryRequest):
    """Generate AI-powered personalized itinerary for Sarawak"""
    try:
        # Determine user identifier (user_id or IP for guests)
        user_identifier = request.user_id if request.user_id else "guest"
        
        # Check rate limit (5 itineraries per day)
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        today_count = await db.itineraries.count_documents({
            'user_id': user_identifier,
            'created_at': {'$gte': today_start}
        })
        
        if today_count >= 5:
            raise HTTPException(
                status_code=429,
                detail="Daily limit reached. You can generate up to 5 itineraries per day. Please try again tomorrow."
            )
        
        # Get attractions based on interests
        query = {}
        if request.interests and len(request.interests) > 0:
            query['categories'] = {'$in': request.interests}
        
        attractions = await db.attractions.find(query).limit(50).to_list(50)
        events = await db.events.find({}).limit(20).to_list(20)
        holidays = await db.public_holidays.find({}).to_list(20)
        
        # Prepare context for AI
        attractions_text = "\n".join([
            f"- {attr['name']} ({', '.join(attr.get('categories', []))}): {attr.get('location', 'Sarawak')} - {attr.get('description', '')[:100]}"
            for attr in attractions[:30]
        ])
        
        events_text = "\n".join([
            f"- {evt['title']}: {evt.get('start_date', 'TBD')} at {evt.get('location_name', 'Sarawak')}"
            for evt in events[:10]
        ])
        
        holidays_text = "\n".join([
            f"- {hol['name']}: {hol['date']}"
            for hol in holidays[:10]
        ])
        
        budget_info = {
            "low": "Budget-friendly options, local food, public transport, free/affordable attractions",
            "medium": "Mix of budget and mid-range, some guided tours, comfortable accommodation",
            "high": "Premium experiences, private tours, luxury dining, exclusive attractions"
        }
        
        # Create AI prompt
        prompt = f"""You are a professional travel planner for Sarawak, Malaysia. Create a detailed {request.duration}-day itinerary based on the following requirements:

**Tourist Interests:** {', '.join(request.interests)}
**Duration:** {request.duration} days
**Budget Level:** {request.budget.upper()} - {budget_info.get(request.budget, budget_info['medium'])}

**Available Attractions in Sarawak:**
{attractions_text}

**Upcoming Events:**
{events_text}

**Public Holidays to Consider:**
{holidays_text}

**Instructions:**
1. Create a day-by-day itinerary (Day 1, Day 2, etc.)
2. For each day, include:
   - Morning, afternoon, and evening activities
   - Specific attractions from the list above that match the interests
   - Estimated costs in Malaysian Ringgit (RM) based on budget level
   - Practical tips (transport, timing, what to bring)
3. Include a mix of activities that match the selected interests
4. Consider travel time between locations
5. Add cultural insights and local tips
6. Include food recommendations (where to eat local cuisine)
7. Provide a total estimated cost breakdown at the end

Format the itinerary in a clear, organized manner with proper headings and bullet points."""

        # Initialize AI chat
        emergent_key = os.getenv('EMERGENT_LLM_KEY')
        chat = LlmChat(
            api_key=emergent_key,
            session_id=f"itinerary_{uuid.uuid4()}",
            system_message="You are an expert travel planner specializing in Sarawak, Malaysia tourism."
        )
        
        # Use Gemini Flash for cost-effectiveness
        chat.with_model("gemini", "gemini-2.5-flash")
        
        # Generate itinerary
        user_message = UserMessage(text=prompt)
        ai_response = await chat.send_message(user_message)
        
        # Create itinerary response
        itinerary_obj = ItineraryResponse(
            user_id=user_identifier,
            itinerary=ai_response,
            interests=request.interests,
            duration=request.duration,
            budget=request.budget
        )
        
        # Save to database
        await db.itineraries.insert_one(itinerary_obj.dict(by_alias=True))
        
        # Add remaining count to response
        remaining_count = 5 - (today_count + 1)
        logging.info(f"Itinerary generated for {user_identifier}. Remaining today: {remaining_count}")
        
        return itinerary_obj
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error generating itinerary: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate itinerary: {str(e)}")

@api_router.get("/itinerary/limit/{user_id}")
async def check_itinerary_limit(user_id: str):
    """Check remaining itinerary generation limit for today"""
    try:
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        today_count = await db.itineraries.count_documents({
            'user_id': user_id,
            'created_at': {'$gte': today_start}
        })
        
        remaining = max(0, 5 - today_count)
        
        return {
            "daily_limit": 5,
            "used_today": today_count,
            "remaining_today": remaining,
            "reset_time": (today_start + timedelta(days=1)).isoformat()
        }
    except Exception as e:
        logging.error(f"Error checking limit: {e}")
        return {
            "daily_limit": 5,
            "used_today": 0,
            "remaining_today": 5,
            "error": str(e)
        }

@api_router.get("/itinerary/{user_id}", response_model=List[ItineraryResponse])
async def get_user_itineraries(user_id: str):
    """Get all itineraries for a user"""
    try:
        itineraries = await db.itineraries.find({'user_id': user_id}).sort('created_at', -1).to_list(100)
        return [ItineraryResponse(**itin) for itin in itineraries]
    except Exception as e:
        logging.error(f"Error fetching itineraries: {e}")
        return []

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
