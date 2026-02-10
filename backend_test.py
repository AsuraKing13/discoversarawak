#!/usr/bin/env python3
"""
Backend API Testing for Sarawak Tourism Platform
Tests all API endpoints to verify functionality and data integrity
"""

import requests
import json
from datetime import datetime
import sys

# Get backend URL from frontend .env
BACKEND_URL = "https://tourism-hub-12.preview.emergentagent.com/api"

class SarawakAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name, success, message, response_data=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        if response_data:
            result["response_sample"] = response_data
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
    def test_health_endpoint(self):
        """Test GET /api/health endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_test("Health Check", True, 
                                f"API healthy, attractions: {data.get('collections', {}).get('attractions', 'N/A')}, events: {data.get('collections', {}).get('events', 'N/A')}", 
                                data)
                else:
                    self.log_test("Health Check", False, f"API unhealthy: {data.get('error', 'Unknown error')}", data)
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Health Check", False, f"Connection error: {str(e)}")
    
    def test_attractions_endpoint(self):
        """Test GET /api/attractions endpoint with various filters"""
        
        # Test 1: Get all attractions
        try:
            response = self.session.get(f"{self.base_url}/attractions", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    # Check structure of first attraction
                    first_attraction = data[0]
                    required_fields = ['_id', 'name', 'location', 'categories', 'latitude', 'longitude', 'image_url']
                    missing_fields = [field for field in required_fields if field not in first_attraction]
                    
                    if not missing_fields:
                        self.log_test("Attractions - All", True, 
                                    f"Retrieved {len(data)} attractions with proper structure", 
                                    first_attraction)
                    else:
                        self.log_test("Attractions - All", False, 
                                    f"Missing fields in attraction: {missing_fields}", 
                                    first_attraction)
                else:
                    self.log_test("Attractions - All", False, "No attractions returned or invalid format", data)
            else:
                self.log_test("Attractions - All", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Attractions - All", False, f"Connection error: {str(e)}")
        
        # Test 2: Filter by Culture category
        try:
            response = self.session.get(f"{self.base_url}/attractions?category=Culture", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    culture_count = len(data)
                    # Verify all returned attractions have Culture in categories
                    valid_culture = all('Culture' in attr.get('categories', []) for attr in data)
                    
                    if valid_culture:
                        self.log_test("Attractions - Culture Filter", True, 
                                    f"Retrieved {culture_count} culture attractions, all properly filtered")
                    else:
                        self.log_test("Attractions - Culture Filter", False, 
                                    "Some attractions don't have Culture category")
                else:
                    self.log_test("Attractions - Culture Filter", False, "Invalid response format")
            else:
                self.log_test("Attractions - Culture Filter", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Attractions - Culture Filter", False, f"Connection error: {str(e)}")
        
        # Test 3: Filter by Nature category
        try:
            response = self.session.get(f"{self.base_url}/attractions?category=Nature", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    nature_count = len(data)
                    self.log_test("Attractions - Nature Filter", True, 
                                f"Retrieved {nature_count} nature attractions")
                else:
                    self.log_test("Attractions - Nature Filter", False, "Invalid response format")
            else:
                self.log_test("Attractions - Nature Filter", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Attractions - Nature Filter", False, f"Connection error: {str(e)}")
        
        # Test 4: Limit parameter
        try:
            response = self.session.get(f"{self.base_url}/attractions?limit=5", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    if len(data) <= 5:
                        self.log_test("Attractions - Limit Filter", True, 
                                    f"Limit working correctly, returned {len(data)} attractions")
                    else:
                        self.log_test("Attractions - Limit Filter", False, 
                                    f"Limit not working, returned {len(data)} attractions instead of max 5")
                else:
                    self.log_test("Attractions - Limit Filter", False, "Invalid response format")
            else:
                self.log_test("Attractions - Limit Filter", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Attractions - Limit Filter", False, f"Connection error: {str(e)}")
    
    def test_events_endpoint(self):
        """Test GET /api/events endpoint"""
        
        # Test 1: Get all events
        try:
            response = self.session.get(f"{self.base_url}/events", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    # Check structure of first event
                    first_event = data[0]
                    required_fields = ['_id', 'title', 'start_date', 'end_date']
                    missing_fields = [field for field in required_fields if field not in first_event]
                    
                    if not missing_fields:
                        self.log_test("Events - All", True, 
                                    f"Retrieved {len(data)} events with proper structure", 
                                    first_event)
                    else:
                        self.log_test("Events - All", False, 
                                    f"Missing fields in event: {missing_fields}", 
                                    first_event)
                else:
                    self.log_test("Events - All", False, "No events returned or invalid format", data)
            else:
                self.log_test("Events - All", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Events - All", False, f"Connection error: {str(e)}")
        
        # Test 2: Filter by category if events have categories
        try:
            response = self.session.get(f"{self.base_url}/events?category=Festival", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    festival_count = len(data)
                    self.log_test("Events - Category Filter", True, 
                                f"Retrieved {festival_count} festival events")
                else:
                    self.log_test("Events - Category Filter", False, "Invalid response format")
            else:
                self.log_test("Events - Category Filter", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Events - Category Filter", False, f"Connection error: {str(e)}")
    
    def test_analytics_endpoint(self):
        """Test GET /api/analytics endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/analytics", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    # Check structure of first analytics record
                    first_record = data[0]
                    required_fields = ['year', 'month', 'country', 'visitor_type', 'count']
                    missing_fields = [field for field in required_fields if field not in first_record]
                    
                    if not missing_fields:
                        self.log_test("Analytics", True, 
                                    f"Retrieved {len(data)} analytics records with proper structure", 
                                    first_record)
                    else:
                        self.log_test("Analytics", False, 
                                    f"Missing fields in analytics: {missing_fields}", 
                                    first_record)
                else:
                    self.log_test("Analytics", False, "No analytics data returned or invalid format", data)
            else:
                self.log_test("Analytics", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Analytics", False, f"Connection error: {str(e)}")
    
    def test_holidays_endpoint(self):
        """Test GET /api/holidays endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/holidays", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    # Check structure of first holiday
                    first_holiday = data[0]
                    required_fields = ['date', 'name']
                    missing_fields = [field for field in required_fields if field not in first_holiday]
                    
                    if not missing_fields:
                        self.log_test("Holidays", True, 
                                    f"Retrieved {len(data)} holidays with proper structure", 
                                    first_holiday)
                    else:
                        self.log_test("Holidays", False, 
                                    f"Missing fields in holiday: {missing_fields}", 
                                    first_holiday)
                else:
                    self.log_test("Holidays", False, "No holidays returned or invalid format", data)
            else:
                self.log_test("Holidays", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Holidays", False, f"Connection error: {str(e)}")
    
    def run_all_tests(self):
        """Run all API tests"""
        print(f"🚀 Starting Sarawak Tourism Platform API Tests")
        print(f"📍 Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Run all tests
        self.test_health_endpoint()
        self.test_attractions_endpoint()
        self.test_events_endpoint()
        self.test_analytics_endpoint()
        self.test_holidays_endpoint()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  • {result['test']}: {result['message']}")
        
        return passed_tests, failed_tests

if __name__ == "__main__":
    tester = SarawakAPITester()
    passed, failed = tester.run_all_tests()
    
    # Exit with error code if any tests failed
    sys.exit(0 if failed == 0 else 1)