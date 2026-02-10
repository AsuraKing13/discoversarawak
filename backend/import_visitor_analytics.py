#!/usr/bin/env python3
"""Import visitor analytics data from CSV files into MongoDB"""

import csv
import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import asyncio

# Load environment variables
load_dotenv()

async def import_visitor_analytics():
    """Import visitor analytics from all years"""
    
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Clear existing data
    await db.visitor_analytics.delete_many({})
    print("Cleared existing visitor analytics data")
    
    # CSV files to import
    csv_files = [
        '/tmp/visitor_analytics_2021.csv',
        '/tmp/visitor_analytics_2022.csv',
        '/tmp/visitor_analytics_2023.csv',
        '/tmp/visitor_analytics_2024.csv',
        '/tmp/visitor_analytics_2025.csv',
    ]
    
    total_records = 0
    
    for csv_file in csv_files:
        if not os.path.exists(csv_file):
            print(f"Warning: {csv_file} not found, skipping...")
            continue
            
        records = []
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Normalize country names
                country = row['country'].strip().strip('"')
                
                # Normalize visitor type
                visitor_type = row['visitor_type'].strip().strip('"')
                
                # Handle count (might be empty)
                try:
                    count = int(row['count'])
                except (ValueError, KeyError):
                    count = 0
                
                record = {
                    'year': int(row['year']),
                    'month': int(row['month']),
                    'country': country,
                    'visitor_type': visitor_type,
                    'count': count
                }
                records.append(record)
        
        if records:
            await db.visitor_analytics.insert_many(records)
            print(f"Imported {len(records)} records from {csv_file}")
            total_records += len(records)
    
    print(f"\nTotal records imported: {total_records}")
    
    # Create indexes for efficient querying
    await db.visitor_analytics.create_index('year')
    await db.visitor_analytics.create_index('month')
    await db.visitor_analytics.create_index('country')
    await db.visitor_analytics.create_index('visitor_type')
    await db.visitor_analytics.create_index([('year', 1), ('month', 1)])
    print("Created indexes for visitor_analytics collection")
    
    # Show summary by year
    pipeline = [
        {'$group': {'_id': '$year', 'total': {'$sum': '$count'}, 'records': {'$sum': 1}}},
        {'$sort': {'_id': 1}}
    ]
    summary = await db.visitor_analytics.aggregate(pipeline).to_list(20)
    print("\nSummary by year:")
    for item in summary:
        print(f"  Year {item['_id']}: {item['records']} records, {item['total']:,} total visitors")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(import_visitor_analytics())
