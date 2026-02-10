# 🌴 Discover Sarawak - Tourism Management Platform

A comprehensive hybrid tourism management platform for Sarawak, Malaysia, featuring an interactive mobile app and centralized data management system.

## 📱 **Project Overview**

**Discover Sarawak** is a tourism platform designed to:
- Provide tourists with an interactive map-based mobile app to explore Sarawak's attractions and events
- Centralize tourism data, analytics, and reporting for the Ministry of Tourism and Sarawak Tourism Board
- Enable AI-powered personalized itinerary generation
- Support real-time event filtering and cluster-based attraction categorization

---

## 🎯 **Features Implemented (Phase 1 - Mobile App MVP)**

### **✅ Backend (FastAPI + MongoDB)**
- **Data Management:**
  - Imported 100+ attractions with GPS coordinates, categories, images
  - Imported 74+ events with dates and locations
  - Imported 100+ visitor analytics records (2018-2024)
  - Imported 18 public holidays (2025)
  
- **REST API Endpoints:**
  - `/api/attractions` - Get attractions with filtering (category, location, limit)
  - `/api/events` - Get events with filtering (category, date range)
  - `/api/analytics` - Get visitor analytics data
  - `/api/holidays` - Get public holidays
  - `/api/favorites` - Add/remove favorite attractions
  - `/api/health` - API health check
  
- **Image Optimization:**
  - Base64 images converted to files and stored in `/backend/static/images/`
  - Served via static file server for faster loading

### **✅ Mobile App (Expo + React Native)**
- **Interactive Map Screen:**
  - React Native Maps integration showing all attractions and events
  - **Square markers** for attractions (color-coded by cluster type)
  - **Star markers** for events
  - Cluster filtering: Culture, Adventure, Nature, Foods, Festivals, Homestays
  - Toggle to show/hide events
  - Click markers to view full details in modal
  
- **Events Calendar Screen:**
  - List view of all events with images and dates
  - Filter by: All, Upcoming, Past
  - Event cards showing title, description, dates, location, category
  
- **Explore Screen:**
  - Grid view (2 columns) of attractions
  - Filter by cluster type
  - Attraction cards with images, location, categories
  
- **Favorites Screen:**
  - Placeholder for future implementation
  - Will save user's favorite attractions

### **✅ Data Structure**

**Clusters (CANFF Classification):**
- **C** - Culture
- **A** - Adventure  
- **N** - Nature
- **F** - Foods
- **F** - Festivals
- Plus: Homestays

**Color Coding:**
- Culture: Purple (#8B5CF6)
- Adventure: Red (#EF4444)
- Nature: Green (#10B981)
- Foods: Orange (#F59E0B)
- Festivals: Pink (#EC4899)
- Homestays: Blue (#3B82F6)

---

## 🛠️ **Tech Stack**

### **Backend**
- **Framework:** FastAPI (Python)
- **Database:** MongoDB (Motor async driver)
- **API:** RESTful with automatic OpenAPI docs
- **Static Files:** Served via FastAPI StaticFiles

### **Frontend**
- **Framework:** Expo (React Native)
- **Navigation:** Expo Router (file-based routing)
- **Maps:** React Native Maps
- **State Management:** React Hooks
- **HTTP Client:** Axios
- **UI Icons:** Expo Vector Icons

### **Deployment**
- **Environment:** Kubernetes containerized environment
- **Backend Port:** 8001
- **Frontend Port:** 3000
- **Database:** MongoDB (local)

---

## 📂 **Project Structure**

```
/app
├── backend/
│   ├── server.py                 # FastAPI server with all endpoints
│   ├── import_data.py            # Data import script from CSV files
│   ├── requirements.txt          # Python dependencies
│   ├── .env                      # Environment variables
│   └── static/images/            # Converted attraction/event images
│
├── frontend/
│   ├── app/
│   │   ├── index.tsx             # Root redirect
│   │   └── (tabs)/
│   │       ├── _layout.tsx       # Tab navigation layout
│   │       ├── map.tsx           # Interactive map screen (main)
│   │       ├── events.tsx        # Events calendar screen
│   │       ├── explore.tsx       # Browse attractions screen
│   │       └── favorites.tsx     # Favorites screen
│   │
│   ├── components/               # Reusable components
│   ├── services/
│   │   └── api.ts                # API service layer
│   ├── types/
│   │   └── index.ts              # TypeScript types
│   └── package.json              # Node dependencies
│
└── README.md                     # This file
```

---

## 🚀 **Getting Started**

### **Backend**

1. **Install dependencies:**
   ```bash
   cd /app/backend
   pip install -r requirements.txt
   ```

2. **Import data (first time only):**
   ```bash
   python import_data.py
   ```

3. **Start backend server:**
   ```bash
   uvicorn server:app --host 0.0.0.0 --port 8001 --reload
   ```

4. **API Documentation:**
   - Swagger UI: http://localhost:8001/docs
   - ReDoc: http://localhost:8001/redoc

### **Frontend**

1. **Install dependencies:**
   ```bash
   cd /app/frontend
   yarn install
   ```

2. **Start Expo development server:**
   ```bash
   yarn start
   ```

3. **Run on device/simulator:**
   - iOS: Press `i` (requires Mac with Xcode)
   - Android: Press `a` (requires Android Studio)
   - Web: Press `w` (opens in browser)
   - Expo Go: Scan QR code with Expo Go app

---

## 🔧 **API Endpoints**

### **Attractions**
```
GET /api/attractions
Query Params: 
  - category (optional): Culture|Adventure|Nature|Foods|Festivals|Homestays
  - location (optional): Location name to filter
  - limit (optional): Max results (default: 1000)

GET /api/attractions/{id}
Returns single attraction by ID
```

### **Events**
```
GET /api/events
Query Params:
  - category (optional): Festival|Adventure
  - start_date (optional): ISO date string
  - end_date (optional): ISO date string
  - limit (optional): Max results (default: 100)

GET /api/events/{id}
Returns single event by ID
```

### **Analytics**
```
GET /api/analytics
Query Params:
  - year (optional): Filter by year
  - month (optional): Filter by month (1-12)
  - country (optional): Filter by country name
  - visitor_type (optional): Domestic|International
```

### **Public Holidays**
```
GET /api/holidays
Query Params:
  - year (optional): Filter by year
```

### **Favorites**
```
POST /api/favorites
Body: { "user_id": "string", "attraction_id": "string" }

GET /api/favorites/{user_id}
Returns user's favorite attractions

DELETE /api/favorites/{user_id}/{attraction_id}
Remove favorite
```

### **Health Check**
```
GET /api/health
Returns API status and collection counts
```

---

## 📊 **Data Sources**

All data imported from CSV files provided:
- **clusters_rows.csv** - 494+ attractions with categories, locations, GPS coordinates
- **events_rows.csv** - 18+ events with dates, locations, organizers
- **visitor_analytics_rows.csv** - Time-series visitor data (2018-2024)
- **public_holidays_rows.csv** - Malaysia public holidays (2025)

---

## 🎨 **Mobile App Screenshots**

**Map Screen (Main):**
- Interactive map centered on Kuching, Sarawak
- Color-coded square markers for attractions by cluster type
- Star markers for events
- Filter bar to select cluster types
- Toggle to show/hide events
- Tap markers to view detailed modal

**Events Calendar:**
- Card-based list view of all events
- Filter: All, Upcoming, Past
- Event dates, locations, categories
- Images and descriptions

**Explore Screen:**
- 2-column grid layout
- Filter by cluster type
- Attraction cards with images and categories

**Favorites Screen:**
- Empty state placeholder (to be implemented)

---

## ⏭️ **Next Steps (Phase 2)**

### **High Priority:**
1. **AI Itinerary Generator:**
   - Integrate Gemini AI (Emergent LLM key)
   - User input: interests, duration, budget (low/medium/high)
   - Generate personalized travel plans with cost estimates
   - Link itinerary items to map markers

2. **Google Authentication:**
   - Emergent Google social login integration
   - User profiles and saved favorites
   - Sync favorites across devices

3. **Offline Mode:**
   - Download map data for offline viewing
   - Cache attraction/event data
   - Queue favorites to sync when online

### **Medium Priority:**
4. **Web Admin Panel:**
   - Dashboard with visitor analytics charts
   - Data visualization (trends, forecasts)
   - Manage attractions, events, trails
   - Generate reports
   - User management

5. **Enhanced Features:**
   - Attraction detail screen with full information
   - Reviews and ratings system
   - Photo gallery for attractions
   - Share attractions/itineraries
   - Push notifications for upcoming events
   - In-app messaging/support

6. **Payment Integration (Stripe):**
   - Paid event bookings
   - Premium feature access
   - Tour package purchases
   - Paid advertisements for businesses

---

## 🐛 **Known Issues**

1. **Image Conversion:**
   - Some base64 images had padding issues during conversion (~35/100 attractions)
   - These attractions will show placeholder or no image
   - Solution: Re-export images from source or use original Supabase URLs

2. **Package Version Warnings:**
   - Some Expo packages have version mismatches (non-critical)
   - App functions correctly despite warnings
   - Can be resolved by running: `npx expo install --fix`

---

## 📝 **Development Notes**

- **Backend URL:** `https://tourism-hub-12.preview.emergentagent.com/api`
- **Environment Variables:** Located in `.env` files (DO NOT commit)
- **MongoDB:** Local instance, data persists across restarts
- **Image Storage:** `/backend/static/images/` (served at `/static/images/`)

---

## 👥 **Target Users**

1. **Tourists/Visitors:**
   - Explore Sarawak attractions on mobile
   - Plan trips with AI-generated itineraries
   - Discover events during their visit
   - Save favorite places

2. **Ministry of Tourism, Creative Industry & Performing Arts Sarawak:**
   - Monitor tourism trends via web dashboard
   - Access real-time visitor analytics
   - Generate reports and forecasts
   - Make data-driven decisions

3. **Sarawak Tourism Board:**
   - Manage tourism data centrally
   - Update attraction information
   - Promote events and festivals
   - Track visitor engagement

4. **Divisional Tourism Task Groups:**
   - Regional data access
   - Divisional reporting
   - Local event management

5. **Tourism Businesses/Operators:**
   - List attractions/services
   - Promote events
   - Paid advertisement opportunities

---

## 📄 **License**

Proprietary - Developed for Sarawak Tourism Management

---

## 🤝 **Credits**

- **Development:** Built with Emergent Agent
- **Data Source:** Ministry of Tourism, Sarawak
- **Maps:** React Native Maps (uses Google Maps on Android, Apple Maps on iOS)
- **Icons:** Expo Vector Icons

---

## 📞 **Support**

For issues or questions, contact the development team or Sarawak Tourism Board.

---

**Built with ❤️ for Discover Sarawak** 🌴
