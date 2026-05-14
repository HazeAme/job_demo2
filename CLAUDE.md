# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a travel check-in application (旅行打卡小程序) - a full-stack web application for users to record travel experiences with location, photos, mood, and notes. It consists of:

- **Backend**: Spring Boot 2.7.x with Java 17
- **Frontend**: Vue 3 + TypeScript + Element Plus + Vite
- **WeChat Mini Program**: Alternative frontend (in `miniprogram/`)
- **Database**: MySQL 8.0
- **Cache**: Redis 6.x

## Common Commands

### Backend (Maven)

```bash
cd backend

# Compile and package
mvn clean package

# Run development server (port 8080)
mvn spring-boot:run

# Skip tests during build
mvn clean package -DskipTests
```

### Frontend (npm)

```bash
cd frontend

# Install dependencies
npm install

# Development server (port 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Database Setup

```bash
# MySQL - run the init script
mysql -u root -p < backend/sql/init.sql
```

## Architecture

### Backend Architecture

The backend follows a typical Spring Boot layered architecture:

```
Controller → Service → Mapper → Entity
                ↓
         MyBatis-Plus → MySQL
```

**Key Components:**

1. **JWT Authentication Flow**:
   - `AuthInterceptor` validates JWT tokens on protected routes
   - Tokens are stored in Redis for session management
   - User ID is extracted from token and set as request attribute
   - Controllers retrieve user ID via `request.getAttribute("userId")`

2. **Configuration Classes**:
   - `WebConfig`: Registers auth interceptor and static resource handlers for uploads
   - `MyBatisPlusConfig`: Enables pagination support
   - `CorsConfig`: CORS configuration for frontend access

3. **File Upload**:
   - Images stored in `./uploads/` directory (configurable via `upload.path`)
   - Served statically via `/uploads/**` URL pattern
   - Max file size: 10MB per file, 100MB per request

4. **Entity Relationships**:
   - `User` → `CheckIn` (one-to-many)
   - `CheckIn.images` stored as JSON array string in MySQL

### Frontend Architecture

Vue 3 SPA with the following structure:

```
Router → Views → API → Axios
  ↓        ↓
Pinia   Components
```

**Key Patterns:**

1. **API Request Flow**:
   - `utils/request.ts`: Axios instance with JWT interceptor
   - Automatically attaches `Authorization: Bearer {token}` header
   - Handles 401 responses by logging out and redirecting to login
   - `api/index.ts`: API endpoint definitions organized by module

2. **State Management**:
   - `stores/user.ts`: Pinia store for auth state
   - Token persisted to localStorage
   - Reactive computed property `isLoggedIn`

3. **Route Guards**:
   - Public routes marked with `meta: { public: true }`
   - Router checks token before navigation
   - Redirects to `/login` if unauthenticated

4. **Vite Proxy Configuration**:
   - `/api` and `/uploads` proxied to `http://localhost:8080`
   - Enables seamless development without CORS issues

### Database Schema

**user table**:
- `id`, `username` (unique), `password` (MD5 hashed), `avatar`, `created_at`, `updated_at`

**check_in table**:
- `id`, `user_id` (FK), `content`, `mood`, `location_name`, `latitude`, `longitude`
- `images` (JSON array), `check_in_time`, `created_at`
- Indexes on `user_id` and `check_in_time`

### Configuration

**Backend** (`backend/src/main/resources/application.yml`):
- MySQL connection: `jdbc:mysql://localhost:3306/job_demo2`
- Redis connection: `localhost:6379`
- JWT secret and expiration (24 hours)
- File upload path and access URL

**Frontend** (`frontend/vite.config.ts`):
- Dev server port: 5173
- Proxy rules for `/api` and `/uploads`
- Path alias `@/` mapped to `src/`

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/user/register` | POST | No | User registration |
| `/api/user/login` | POST | No | User login |
| `/api/check-in` | POST | Yes | Create check-in with multipart form data |
| `/api/check-in/list` | GET | Yes | Paginated list (page, size params) |
| `/api/check-in/{id}` | GET | Yes | Get single check-in detail |
| `/api/statistics` | GET | Yes | Get user statistics |
| `/uploads/**` | GET | No | Static file serving for images |

## Development Notes

- **Demo credentials**: username `test`, password `123456`
- **File uploads**: Stored in `uploads/` directory at project root, excluded from auth interceptor
- **Geolocation**: Frontend uses browser Geolocation API + Nominatim reverse geocoding
- **Charts**: ECharts for statistics visualization (trend line + mood pie chart)
- **Password hashing**: MD5 without salt (simplified for demo purposes)
