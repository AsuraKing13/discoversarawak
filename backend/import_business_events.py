"""
Import business events from ICS file to MongoDB
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
from pathlib import Path
from datetime import datetime
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Business events data from ICS file
BUSINESS_EVENTS = [
    {
        'title': 'Borneo Dermatology Update 2026',
        'start_date': '2026-04-10',
        'end_date': '2026-04-13',
        'location_name': 'Meritz Hotel, Miri, Sarawak',
        'category': 'State Convention',
        'url': 'https://businesseventssarawak.com/event/borneo-dermatology-update-2026/',
        'latitude': 4.3910,
        'longitude': 113.9910,
    },
    {
        'title': 'Sarawak Plastic Surgical Update 2026',
        'start_date': '2026-04-24',
        'end_date': '2026-04-26',
        'location_name': 'Borneo Cultures Museum, Kuching, Sarawak',
        'category': 'State Convention',
        'url': 'https://businesseventssarawak.com/event/sarawak-plastic-surgical-update-2026/',
        'latitude': 1.5593,
        'longitude': 110.3476,
    },
    {
        'title': '16th International UNIMAS Engineering Conference 2026 (EnCon2026)',
        'start_date': '2026-04-28',
        'end_date': '2026-05-01',
        'location_name': 'Raia Hotel & Convention Centre Kuching, Sarawak',
        'category': 'International Conference',
        'url': 'https://businesseventssarawak.com/event/16th-international-unimas-engineering-conference-2026-encon2026/',
        'latitude': 1.5304,
        'longitude': 110.3490,
    },
    {
        'title': 'Borneo Wound Summit 2026',
        'start_date': '2026-05-14',
        'end_date': '2026-05-17',
        'location_name': 'Imperial Hotel Kuching',
        'category': 'State Convention',
        'url': 'https://businesseventssarawak.com/event/borneo-wound-summit-2026/',
        'latitude': 1.5518,
        'longitude': 110.3435,
    },
    {
        'title': '51st IUPAC World Polymer Congress (MACRO 2026)',
        'start_date': '2026-07-28',
        'end_date': '2026-08-01',
        'location_name': 'Borneo Convention Centre Kuching (BCCK)',
        'category': 'International Conference',
        'url': 'https://businesseventssarawak.com/event/51st-world-polymer-congress-macro-2026/',
        'latitude': 1.5304,
        'longitude': 110.3614,
    },
    {
        'title': '24th Asian Congress on Occupational Health (ACOH 2026)',
        'start_date': '2026-08-05',
        'end_date': '2026-08-09',
        'location_name': 'Borneo Convention Centre Kuching (BCCK)',
        'category': 'International Convention',
        'url': 'https://businesseventssarawak.com/event/asian-congress-on-occupational-health-acoh-2026/',
        'latitude': 1.5304,
        'longitude': 110.3614,
    },
    {
        'title': '22nd ICOMOS General Assembly and Scientific Symposium 2026',
        'start_date': '2026-10-17',
        'end_date': '2026-10-25',
        'location_name': 'Borneo Convention Centre Kuching (BCCK)',
        'category': 'International Convention',
        'url': 'https://businesseventssarawak.com/event/international-council-on-monuments-and-sites-icomos-triennial-general-assembly-2026/',
        'latitude': 1.5304,
        'longitude': 110.3614,
    },
    {
        'title': 'IWA World Water Congress & Exhibition 2028',
        'start_date': '2028-09-12',
        'end_date': '2028-09-17',
        'location_name': 'Borneo Convention Centre Kuching (BCCK)',
        'category': 'International Convention',
        'url': 'https://businesseventssarawak.com/event/international-water-association-world-water-congress-and-exhibition-2028/',
        'latitude': 1.5304,
        'longitude': 110.3614,
    },
]

async def import_business_events():
    """Import business events"""
    print("Importing business events...")
    
    imported = 0
    for event_data in BUSINESS_EVENTS:
        try:
            event_id = str(uuid.uuid4())
            
            event = {
                '_id': event_id,
                'title': event_data['title'],
                'description': f"Category: {event_data['category']}. More info: {event_data['url']}",
                'start_date': datetime.fromisoformat(event_data['start_date']),
                'end_date': datetime.fromisoformat(event_data['end_date']),
                'location_name': event_data['location_name'],
                'latitude': event_data['latitude'],
                'longitude': event_data['longitude'],
                'category': 'Business Event',
                'organizer': 'Sarawak Convention Bureau',
                'image_url': None,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow(),
                'url': event_data['url']
            }
            
            await db.events.insert_one(event)
            imported += 1
            print(f"✓ Imported: {event_data['title']}")
            
        except Exception as e:
            print(f"✗ Error importing {event_data['title']}: {e}")
    
    print(f"\nImported {imported} business events")
    
    # Print total events
    total_events = await db.events.count_documents({})
    print(f"Total events in database: {total_events}")

async def main():
    try:
        await import_business_events()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())
