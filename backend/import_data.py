"""
Data import script for Sarawak Tourism Platform
This script imports all CSV data into MongoDB
"""
import asyncio
import csv
import os
import base64
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import logging
from datetime import datetime
import requests
import hashlib

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create static images directory
IMAGES_DIR = ROOT_DIR / 'static' / 'images'
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

async def download_csv(url: str) -> list:
    """Download and parse CSV from URL"""
    try:
        response = requests.get(url)
        response.raise_for_status()
        decoded_content = response.content.decode('utf-8')
        csv_reader = csv.DictReader(decoded_content.splitlines())
        return list(csv_reader)
    except Exception as e:
        logger.error(f"Error downloading CSV from {url}: {e}")
        return []

def save_base64_image(base64_str: str, filename: str) -> str:
    """Save base64 image to file and return URL"""
    try:
        if not base64_str or base64_str == 'null' or not base64_str.startswith('data:image'):
            return None
        
        # Extract image data
        image_data = base64_str.split(',')[1] if ',' in base64_str else base64_str
        
        # Generate unique filename
        file_hash = hashlib.md5(image_data.encode()).hexdigest()[:8]
        ext = 'jpg'  # Default extension
        if 'png' in base64_str:
            ext = 'png'
        elif 'jpeg' in base64_str or 'jpg' in base64_str:
            ext = 'jpg'
        
        filename = f"{filename}_{file_hash}.{ext}"
        filepath = IMAGES_DIR / filename
        
        # Save image
        with open(filepath, 'wb') as f:
            f.write(base64.b64decode(image_data))
        
        # Return URL path
        return f"/static/images/{filename}"
    except Exception as e:
        logger.error(f"Error saving image {filename}: {e}")
        return None

async def import_attractions():
    """Import clusters/attractions data"""
    logger.info("Importing attractions data...")
    
    # Download CSV
    url = "https://customer-assets.emergentagent.com/job_discover-sarawak/artifacts/z0wct5ev_clusters_rows.csv"
    rows = download_csv(url)
    
    if not rows:
        logger.error("No data to import for attractions")
        return
    
    # Clear existing collection
    await db.attractions.delete_many({})
    
    imported_count = 0
    for row in rows:
        try:
            # Process image
            image_url = row.get('image')
            if image_url and image_url.startswith('data:image'):
                # Convert base64 to file
                image_url = save_base64_image(image_url, f"attraction_{row.get('id', 'unknown')}")
            
            # Parse categories
            category = row.get('category', '[]')
            try:
                import json
                categories = json.loads(category.replace("'", '"'))
            except:
                categories = [category] if category else []
            
            # Create attraction document
            attraction = {
                '_id': row.get('id'),
                'name': row.get('name'),
                'location': row.get('location'),
                'description': row.get('description'),
                'categories': categories,
                'latitude': float(row.get('latitude', 0)) if row.get('latitude') else None,
                'longitude': float(row.get('longitude', 0)) if row.get('longitude') else None,
                'image_url': image_url,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            await db.attractions.insert_one(attraction)
            imported_count += 1
            
        except Exception as e:
            logger.error(f"Error importing attraction {row.get('id')}: {e}")
            continue
    
    # Create indexes
    await db.attractions.create_index([("categories", 1)])
    await db.attractions.create_index([("location", 1)])
    
    logger.info(f"Imported {imported_count} attractions")

async def import_events():
    """Import events data"""
    logger.info("Importing events data...")
    
    # Download CSV
    url = "https://customer-assets.emergentagent.com/job_discover-sarawak/artifacts/qxxync66_events_rows.csv"
    rows = download_csv(url)
    
    if not rows:
        logger.error("No data to import for events")
        return
    
    # Clear existing collection
    await db.events.delete_many({})
    
    imported_count = 0
    for row in rows:
        try:
            # Process image
            image_url = row.get('image_url')
            if image_url and image_url.startswith('data:image'):
                image_url = save_base64_image(image_url, f"event_{row.get('id', 'unknown')}")
            
            # Create event document
            event = {
                '_id': row.get('id'),
                'title': row.get('title'),
                'description': row.get('description'),
                'start_date': datetime.fromisoformat(row.get('start_date').replace('+00', '')) if row.get('start_date') else None,
                'end_date': datetime.fromisoformat(row.get('end_date').replace('+00', '')) if row.get('end_date') else None,
                'location_name': row.get('location_name'),
                'latitude': float(row.get('latitude', 0)) if row.get('latitude') else None,
                'longitude': float(row.get('longitude', 0)) if row.get('longitude') else None,
                'category': row.get('category'),
                'image_url': image_url,
                'organizer': row.get('organizer'),
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            await db.events.insert_one(event)
            imported_count += 1
            
        except Exception as e:
            logger.error(f"Error importing event {row.get('id')}: {e}")
            continue
    
    # Create indexes
    await db.events.create_index([("start_date", 1)])
    await db.events.create_index([("category", 1)])
    
    logger.info(f"Imported {imported_count} events")

async def import_analytics():
    """Import visitor analytics data"""
    logger.info("Importing visitor analytics data...")
    
    # Download CSV
    url = "https://customer-assets.emergentagent.com/job_discover-sarawak/artifacts/kov15g3r_visitor_analytics_rows.csv"
    rows = download_csv(url)
    
    if not rows:
        logger.error("No data to import for analytics")
        return
    
    # Clear existing collection
    await db.visitor_analytics.delete_many({})
    
    imported_count = 0
    for row in rows:
        try:
            analytics = {
                'year': int(row.get('year')),
                'month': int(row.get('month')),
                'country': row.get('country'),
                'visitor_type': row.get('visitor_type'),
                'count': int(row.get('count', 0))
            }
            
            await db.visitor_analytics.insert_one(analytics)
            imported_count += 1
            
        except Exception as e:
            logger.error(f"Error importing analytics: {e}")
            continue
    
    # Create indexes
    await db.visitor_analytics.create_index([("year", 1), ("month", 1)])
    await db.visitor_analytics.create_index([("country", 1)])
    
    logger.info(f"Imported {imported_count} analytics records")

async def import_holidays():
    """Import public holidays data"""
    logger.info("Importing public holidays data...")
    
    # Download CSV
    url = "https://customer-assets.emergentagent.com/job_discover-sarawak/artifacts/luc2irri_public_holidays_rows.csv"
    rows = download_csv(url)
    
    if not rows:
        logger.error("No data to import for holidays")
        return
    
    # Clear existing collection
    await db.public_holidays.delete_many({})
    
    imported_count = 0
    for row in rows:
        try:
            holiday = {
                'date': datetime.fromisoformat(row.get('date')),
                'name': row.get('name')
            }
            
            await db.public_holidays.insert_one(holiday)
            imported_count += 1
            
        except Exception as e:
            logger.error(f"Error importing holiday: {e}")
            continue
    
    # Create index
    await db.public_holidays.create_index([("date", 1)])
    
    logger.info(f"Imported {imported_count} holidays")

async def main():
    """Main import function"""
    logger.info("Starting data import...")
    
    try:
        # Import all data
        await import_attractions()
        await import_events()
        await import_analytics()
        await import_holidays()
        
        logger.info("Data import completed successfully!")
        
        # Print statistics
        attractions_count = await db.attractions.count_documents({})
        events_count = await db.events.count_documents({})
        analytics_count = await db.visitor_analytics.count_documents({})
        holidays_count = await db.public_holidays.count_documents({})
        
        logger.info(f"""
        Import Statistics:
        - Attractions: {attractions_count}
        - Events: {events_count}
        - Analytics Records: {analytics_count}
        - Public Holidays: {holidays_count}
        """)
        
    except Exception as e:
        logger.error(f"Error during import: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())
