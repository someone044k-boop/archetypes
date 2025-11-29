from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import swisseph as swe
from timezonefinder import TimezoneFinder
from geopy.geocoders import Nominatim
import pytz
import math
import jwt
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get('JWT_SECRET', 'astrology-secret-key-change-in-production')

# Set Swiss Ephemeris path - using default ephemeris
# swe.set_ephe_path('/app/backend/ephe')

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

tf = TimezoneFinder()
geolocator = Nominatim(user_agent="astrology_app")

# Models
class AdminLogin(BaseModel):
    username: str
    password: str

class AdminCreate(BaseModel):
    username: str
    password: str

class LocationSearch(BaseModel):
    query: str

class LocationResult(BaseModel):
    display_name: str
    lat: float
    lon: float

class NatalChartCreate(BaseModel):
    name: str
    birth_date: str  # YYYY-MM-DD
    birth_time: str  # HH:MM
    birth_location: str
    latitude: float
    longitude: float

class PlanetPosition(BaseModel):
    name: str
    longitude: float
    latitude: float
    speed: float
    sign: str
    degree: float
    house: Optional[int] = None

class House(BaseModel):
    number: int
    cusp: float
    sign: str

class Aspect(BaseModel):
    planet1: str
    planet2: str
    aspect_type: str
    angle: float
    orb: float

class NatalChart(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    birth_date: str
    birth_time: str
    birth_location: str
    latitude: float
    longitude: float
    planets: List[PlanetPosition]
    houses: List[House]
    aspects: List[Aspect]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Interpretation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: str  # planet_in_sign, planet_in_house, aspect
    key: str  # e.g., "sun_in_aries", "moon_in_1st_house", "sun_conjunct_moon"
    title: str
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InterpretationCreate(BaseModel):
    category: str
    key: str
    title: str
    content: str

class InterpretationUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

# Helper functions
def get_zodiac_sign(longitude: float) -> str:
    signs = ["Овен", "Телець", "Близнюки", "Рак", "Лев", "Діва", 
             "Терези", "Скорпіон", "Стрілець", "Козеріг", "Водолій", "Риби"]
    sign_index = int(longitude / 30)
    return signs[sign_index]

def get_degree_in_sign(longitude: float) -> float:
    return longitude % 30

def calculate_aspects(planets: List[Dict]) -> List[Aspect]:
    aspects = []
    aspect_types = {
        0: ("Кон'юнкція", 8),
        60: ("Секстиль", 6),
        90: ("Квадрат", 8),
        120: ("Тригон", 8),
        180: ("Опозиція", 8)
    }
    
    for i in range(len(planets)):
        for j in range(i + 1, len(planets)):
            p1 = planets[i]
            p2 = planets[j]
            angle = abs(p1['longitude'] - p2['longitude'])
            if angle > 180:
                angle = 360 - angle
            
            for asp_angle, (asp_name, orb) in aspect_types.items():
                diff = abs(angle - asp_angle)
                if diff <= orb:
                    aspects.append(Aspect(
                        planet1=p1['name'],
                        planet2=p2['name'],
                        aspect_type=asp_name,
                        angle=angle,
                        orb=diff
                    ))
                    break
    
    return aspects

def calculate_natal_chart(birth_date: str, birth_time: str, latitude: float, longitude: float) -> Dict:
    # Parse date and time
    dt_str = f"{birth_date} {birth_time}"
    dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M")
    
    # Get timezone
    tz_name = tf.timezone_at(lat=latitude, lng=longitude)
    if tz_name:
        tz = pytz.timezone(tz_name)
        local_dt = tz.localize(dt)
        utc_dt = local_dt.astimezone(pytz.UTC)
    else:
        utc_dt = dt.replace(tzinfo=pytz.UTC)
    
    # Convert to Julian Day
    jd = swe.julday(utc_dt.year, utc_dt.month, utc_dt.day, 
                    utc_dt.hour + utc_dt.minute/60.0 + utc_dt.second/3600.0)
    
    # Calculate planets
    planet_data = [
        (swe.SUN, "Сонце"),
        (swe.MOON, "Місяць"),
        (swe.MERCURY, "Меркурій"),
        (swe.VENUS, "Венера"),
        (swe.MARS, "Марс"),
        (swe.JUPITER, "Юпітер"),
        (swe.SATURN, "Сатурн"),
        (swe.URANUS, "Уран"),
        (swe.NEPTUNE, "Нептун"),
        (swe.PLUTO, "Плутон"),
        (swe.CHIRON, "Хірон"),
        (swe.MEAN_NODE, "Північний вузол"),
    ]
    
    planets = []
    planet_longs = []
    
    for planet_id, planet_name in planet_data:
        result = swe.calc_ut(jd, planet_id)
        lon, lat, dist, speed_lon, speed_lat, speed_dist = result[0]
        
        planet_info = {
            'name': planet_name,
            'longitude': lon,
            'latitude': lat,
            'speed': speed_lon,
            'sign': get_zodiac_sign(lon),
            'degree': get_degree_in_sign(lon)
        }
        planets.append(planet_info)
        planet_longs.append(lon)
    
    # Add South Node (opposite of North Node)
    north_node_lon = planet_longs[-1]
    south_node_lon = (north_node_lon + 180) % 360
    planets.append({
        'name': "Південний вузол",
        'longitude': south_node_lon,
        'latitude': 0,
        'speed': 0,
        'sign': get_zodiac_sign(south_node_lon),
        'degree': get_degree_in_sign(south_node_lon)
    })
    planet_longs.append(south_node_lon)
    
    # Calculate Lilith (Mean Apogee)
    result = swe.calc_ut(jd, swe.MEAN_APOG)
    lon, lat, dist, speed_lon, speed_lat, speed_dist = result[0]
    planets.append({
        'name': "Ліліт",
        'longitude': lon,
        'latitude': lat,
        'speed': speed_lon,
        'sign': get_zodiac_sign(lon),
        'degree': get_degree_in_sign(lon)
    })
    planet_longs.append(lon)
    
    # Calculate houses (Placidus system)
    houses_data = swe.houses(jd, latitude, longitude, b'P')
    house_cusps = houses_data[0]
    ascmc = houses_data[1]
    
    # Add Ascendant
    asc_lon = ascmc[0]
    planets.insert(0, {
        'name': "Асцендент",
        'longitude': asc_lon,
        'latitude': 0,
        'speed': 0,
        'sign': get_zodiac_sign(asc_lon),
        'degree': get_degree_in_sign(asc_lon)
    })
    
    # Add MC (Midheaven)
    mc_lon = ascmc[1]
    planets.insert(1, {
        'name': "Середина Неба (MC)",
        'longitude': mc_lon,
        'latitude': 0,
        'speed': 0,
        'sign': get_zodiac_sign(mc_lon),
        'degree': get_degree_in_sign(mc_lon)
    })
    
    # Process houses
    houses = []
    for i in range(12):
        cusp = house_cusps[i]
        houses.append(House(
            number=i + 1,
            cusp=cusp,
            sign=get_zodiac_sign(cusp)
        ))
    
    # Assign planets to houses
    for planet in planets:
        if planet['name'] not in ["Асцендент", "Середина Неба (MC)"]:
            planet_lon = planet['longitude']
            for i in range(12):
                next_i = (i + 1) % 12
                cusp_current = house_cusps[i]
                cusp_next = house_cusps[next_i] if next_i != 0 else house_cusps[0] + 360
                
                if cusp_next < cusp_current:
                    cusp_next += 360
                
                planet_lon_adjusted = planet_lon if planet_lon >= cusp_current else planet_lon + 360
                
                if cusp_current <= planet_lon_adjusted < cusp_next:
                    planet['house'] = i + 1
                    break
    
    # Calculate aspects (excluding Ascendant and MC from aspects)
    planets_for_aspects = [p for p in planets if p['name'] not in ["Асцендент", "Середина Неба (MC)"]]
    aspects = calculate_aspects(planets_for_aspects)
    
    return {
        'planets': [PlanetPosition(**p) for p in planets],
        'houses': houses,
        'aspects': aspects
    }

async def verify_admin_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        admin = await db.admins.find_one({"username": username})
        if not admin:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin not found")
        return username
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

# Routes
@api_router.get("/")
async def root():
    return {"message": "Астрологічний калькулятор API"}

# Location search
@api_router.post("/locations/search")
async def search_locations(location: LocationSearch):
    try:
        locations = geolocator.geocode(location.query, exactly_one=False, limit=10)
        if not locations:
            return []
        
        results = []
        for loc in locations:
            results.append(LocationResult(
                display_name=loc.address,
                lat=loc.latitude,
                lon=loc.longitude
            ))
        return results
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Natal Charts
@api_router.post("/natal-charts", response_model=NatalChart)
async def create_natal_chart(chart_data: NatalChartCreate):
    try:
        # Calculate chart
        chart_calc = calculate_natal_chart(
            chart_data.birth_date,
            chart_data.birth_time,
            chart_data.latitude,
            chart_data.longitude
        )
        
        # Create chart object
        chart = NatalChart(
            name=chart_data.name,
            birth_date=chart_data.birth_date,
            birth_time=chart_data.birth_time,
            birth_location=chart_data.birth_location,
            latitude=chart_data.latitude,
            longitude=chart_data.longitude,
            planets=chart_calc['planets'],
            houses=chart_calc['houses'],
            aspects=chart_calc['aspects']
        )
        
        # Save to database
        doc = chart.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['planets'] = [p.model_dump() for p in chart.planets]
        doc['houses'] = [h.model_dump() for h in chart.houses]
        doc['aspects'] = [a.model_dump() for a in chart.aspects]
        
        await db.natal_charts.insert_one(doc)
        return chart
    except Exception as e:
        logging.error(f"Error creating natal chart: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/natal-charts", response_model=List[NatalChart])
async def get_natal_charts():
    charts = await db.natal_charts.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for chart in charts:
        if isinstance(chart.get('created_at'), str):
            chart['created_at'] = datetime.fromisoformat(chart['created_at'])
    
    return charts

@api_router.get("/natal-charts/{chart_id}", response_model=NatalChart)
async def get_natal_chart(chart_id: str):
    chart = await db.natal_charts.find_one({"id": chart_id}, {"_id": 0})
    if not chart:
        raise HTTPException(status_code=404, detail="Chart not found")
    
    if isinstance(chart.get('created_at'), str):
        chart['created_at'] = datetime.fromisoformat(chart['created_at'])
    
    return chart

@api_router.delete("/natal-charts/{chart_id}")
async def delete_natal_chart(chart_id: str):
    result = await db.natal_charts.delete_one({"id": chart_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Chart not found")
    return {"message": "Chart deleted successfully"}

# Admin authentication
@api_router.post("/admin/login")
async def admin_login(admin: AdminLogin):
    db_admin = await db.admins.find_one({"username": admin.username})
    if not db_admin or not pwd_context.verify(admin.password, db_admin["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    token = jwt.encode({"sub": admin.username}, SECRET_KEY, algorithm="HS256")
    return {"token": token, "username": admin.username}

@api_router.post("/admin/register")
async def admin_register(admin: AdminCreate):
    # Check if admin exists
    existing = await db.admins.find_one({"username": admin.username})
    if existing:
        raise HTTPException(status_code=400, detail="Admin already exists")
    
    hashed_password = pwd_context.hash(admin.password)
    await db.admins.insert_one({
        "username": admin.username,
        "password": hashed_password,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    token = jwt.encode({"sub": admin.username}, SECRET_KEY, algorithm="HS256")
    return {"token": token, "username": admin.username}

# Interpretations
@api_router.post("/interpretations", response_model=Interpretation)
async def create_interpretation(interp: InterpretationCreate, admin: str = Depends(verify_admin_token)):
    interpretation = Interpretation(**interp.model_dump())
    doc = interpretation.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.interpretations.insert_one(doc)
    return interpretation

@api_router.get("/interpretations", response_model=List[Interpretation])
async def get_interpretations(category: Optional[str] = None):
    query = {"category": category} if category else {}
    interps = await db.interpretations.find(query, {"_id": 0}).to_list(1000)
    
    for interp in interps:
        if isinstance(interp.get('created_at'), str):
            interp['created_at'] = datetime.fromisoformat(interp['created_at'])
        if isinstance(interp.get('updated_at'), str):
            interp['updated_at'] = datetime.fromisoformat(interp['updated_at'])
    
    return interps

@api_router.get("/interpretations/{interp_id}", response_model=Interpretation)
async def get_interpretation(interp_id: str):
    interp = await db.interpretations.find_one({"id": interp_id}, {"_id": 0})
    if not interp:
        raise HTTPException(status_code=404, detail="Interpretation not found")
    
    if isinstance(interp.get('created_at'), str):
        interp['created_at'] = datetime.fromisoformat(interp['created_at'])
    if isinstance(interp.get('updated_at'), str):
        interp['updated_at'] = datetime.fromisoformat(interp['updated_at'])
    
    return interp

@api_router.put("/interpretations/{interp_id}", response_model=Interpretation)
async def update_interpretation(interp_id: str, update_data: InterpretationUpdate, admin: str = Depends(verify_admin_token)):
    existing = await db.interpretations.find_one({"id": interp_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Interpretation not found")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.interpretations.update_one({"id": interp_id}, {"$set": update_dict})
    
    updated = await db.interpretations.find_one({"id": interp_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    
    return updated

@api_router.delete("/interpretations/{interp_id}")
async def delete_interpretation(interp_id: str, admin: str = Depends(verify_admin_token)):
    result = await db.interpretations.delete_one({"id": interp_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Interpretation not found")
    return {"message": "Interpretation deleted successfully"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()