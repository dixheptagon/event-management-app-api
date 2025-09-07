# Event App Management API

A RESTful API for managing events, users, and promotions. Built with Express.js, TypeScript, and Prisma.

## Features

- **User Authentication:** Register, login, and verify user accounts.
- **Role-Based Access Control:** Supports `CUSTOMER`, `EVENT_ORGANIZER`, and `ADMIN` roles.
- **Event Management:** Create, read, update, and delete events.
- **Event Exploration:** Search and filter events by category, location, and other criteria.
- **Referral System:** Users can refer others and earn points.
- **Dashboard:** Event organizers can view statistics about their events.

## Technologies Used

- **Backend:** Node.js, Express.js, TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Authentication:** JSON Web Tokens (JWT)
- **File Storage:** Cloudinary
- **Email:** Nodemailer
- **Validation:** Yup
- **Logging:** Winston

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm
- PostgreSQL

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up your environment variables by creating a `.env.development` file. You can use `.env.example` as a template.
4.  Run database migrations:
    ```bash
    npm run migrate:dev
    ```

### Running the App

```bash
npm run dev
```

The application will be available at `http://localhost:8000`.

## API Documentation

The API follows REST principles and uses JSON for all requests and responses. All endpoints are prefixed with `/api` and the base URL is `http://localhost:8000/api`.

### Authentication

Most endpoints require authentication via JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Response Format

All responses follow this consistent format:

```json
{
  "success": true/false,
  "message": "Description of the result",
  "data": { /* Response data */ }
}
```

---

## Authentication Endpoints

### 1. Register User

**POST** `/api/auth/register`

Register a new user account with optional referral code support.

**Request Body:**

```json
{
  "fullname": "John Doe",
  "email": "john@example.com",
  "password": "Password123",
  "role": "CUSTOMER", // CUSTOMER | EVENT_ORGANIZER | ADMIN
  "usedReferralCode": "AB12CD34" // Optional 8-character referral code
}
```

**Validation Rules:**

- Password: Minimum 8 characters with at least one letter and one number
- Referral code: Exactly 8 uppercase alphanumeric characters (if provided)
- Email must be unique

**Response (201):**

```json
{
  "success": true,
  "message": "User John Doe has been created with referral bonus",
  "data": {
    "id": "uuid",
    "fullname": "John Doe",
    "email": "john@example.com",
    "role": "CUSTOMER",
    "referralCode": "XY34AB78",
    "referralPoints": 0,
    "isVerified": false,
    "welcomeBonus": {
      "discountType": "PERCENTAGE",
      "discountValue": 10,
      "message": "You received 10% welcome discount!"
    }
  }
}
```

**Flow:**

1. User submits registration form
2. System validates referral code (if provided)
3. Creates user account with unique referral code
4. Processes referral rewards (10,000 points to referrer, 10% discount coupon to new user)
5. Sends email verification link
6. Returns user data with welcome bonus info

### 2. Verify Email

**GET** `/api/auth/verify-email?token=<verification-token>`

Verify user email address using the token sent via email.

**Query Parameters:**

- `token`: Verification token from email

**Response (200):**

```json
{
  "success": true,
  "message": "Email verified successfully! You can now login to your account.",
  "data": {
    "user": {
      "id": "uuid",
      "fullname": "John Doe",
      "email": "john@example.com",
      "role": "CUSTOMER",
      "isVerified": true,
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "verifiedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 3. Resend Verification Email

**POST** `/api/auth/resend-verification`

Resend verification email for unverified accounts.

**Request Body:**

```json
{
  "email": "john@example.com"
}
```

### 4. Login User

**POST** `/api/auth/login`

Authenticate user and receive JWT token.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "User John Doe logged in successfully",
  "data": {
    "token": "jwt-token-here",
    "user": {
      "fullname": "John Doe",
      "role": "CUSTOMER"
    }
  }
}
```

### 5. Session Login (Token Refresh)

**GET** `/api/auth/session-login`

🔒 **Requires Authentication**

Refresh JWT token for authenticated sessions.

**Headers:**

```
Authorization: Bearer <existing-jwt-token>
```

---

## Event Management Endpoints

### 1. Create Event

**POST** `/api/create-event`

🔒 **Requires Authentication** | **Roles:** ADMIN, EVENT_ORGANIZER

Create a new event with complete details including tickets, promotions, and media.

**Headers:**

```
Content-Type: multipart/form-data
Authorization: Bearer <jwt-token>
```

**Request Body (Form Data):**

```javascript
{
  // Basic Event Information
  "name": "Amazing Concert 2024",
  "description": "An unforgettable musical experience",
  "category": "Music",
  "location": "Jakarta",
  "venue": "Gelora Bung Karno Stadium",
  "capacity": 5000,

  // Date & Time
  "startDate": "2024-06-15",
  "endDate": "2024-06-15",
  "startTime": "19:00",
  "endTime": "23:00",

  // Optional Fields
  "isDraft": false, // true to save as draft
  "eventImage": File, // Image file upload

  // JSON Arrays (as strings in form data)
  "ticketTypes": JSON.stringify([
    {
      "name": "VIP",
      "price": 500000,
      "quantity": 100,
      "description": "VIP access with premium seating",
      "ticketType": "PAID"
    },
    {
      "name": "Regular",
      "price": 250000,
      "quantity": 900,
      "description": "General admission",
      "ticketType": "PAID"
    }
  ]),

  "tags": JSON.stringify(["music", "concert", "live"]),

  "promotions": JSON.stringify([
    {
      "promoType": "EARLY_BIRD",
      "discountType": "PERCENTAGE",
      "discountValue": 20,
      "code": "EARLY20",
      "minPurchaseAmount": 100000,
      "maxDiscountAmount": 100000,
      "quota": 50,
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-02-01T23:59:59Z"
    }
  ])
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Event created and published successfully 🎉✨",
  "data": {
    "event": {
      "organizer": {
        "id": "uuid",
        "fullname": "Event Organizer",
        "email": "organizer@example.com"
      },
      "title": "Amazing Concert 2024",
      "description": "An unforgettable musical experience",
      "category": "Music",
      "startDate": "2024-06-15T19:00:00Z",
      "endDate": "2024-06-15T23:00:00Z",
      "location": "Jakarta",
      "venue": "Gelora Bung Karno Stadium",
      "totalSeats": 5000,
      "availableSeats": 5000,
      "status": "PUBLISHED",
      "eventMedia": [
        {
          "url": "https://cloudinary.com/image-url"
        }
      ],
      "tags": [{ "tag": "music" }, { "tag": "concert" }, { "tag": "live" }],
      "ticketTypes": [
        {
          "name": "VIP",
          "price": 500000,
          "quantity": 100,
          "description": "VIP access with premium seating",
          "ticketType": "PAID"
        }
      ],
      "promotions": [
        {
          "promoType": "EARLY_BIRD",
          "discountType": "PERCENTAGE",
          "discountValue": 20,
          "code": "EARLY20",
          "quota": 50
        }
      ]
    },
    "summary": {
      "totalSeats": 5000,
      "availableSeats": 5000,
      "hasImage": true,
      "tagsCount": 3,
      "ticketTypesCount": 2,
      "promotionsCount": 1
    }
  }
}
```

### 2. Explore Events (Public)

**GET** `/api/explore-events`

Public endpoint to search and filter events with pagination.

**Query Parameters:**

```
?keyword=concert&location=jakarta&category=Music&skip=0&limit=8
```

- `keyword` (optional): Search in event titles
- `location` (optional): Filter by location
- `category` (optional): Filter by category
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Number of records to return (default: 8, max: 100)

**Response (200):**

```json
{
  "success": true,
  "message": "Get list events successfully",
  "data": {
    "events": [
      {
        "id": 1,
        "title": "Amazing Concert 2024",
        "startDate": "2024-06-15T19:00:00Z",
        "endDate": "2024-06-15T23:00:00Z",
        "eventMedia": [
          {
            "url": "https://cloudinary.com/image-url"
          }
        ],
        "ticketTypes": [{ "price": 250000, "ticketType": "PAID" }],
        "organizer": {
          "fullname": "Event Organizer"
        }
      }
    ],
    "totalItems": 25,
    "totalPages": 4
  }
}
```

---

## Referral System Endpoints

### 1. Validate Referral Code

**GET** `/api/referral/validate/{referralCode}`

Validate if a referral code exists and get referrer information.

**Path Parameters:**

- `referralCode`: 8-character referral code (e.g., "AB12CD34")

**Response (200) - Valid Code:**

```json
{
  "success": true,
  "message": "Valid referral code",
  "data": {
    "referrerName": "John Doe",
    "referralCode": "AB12CD34",
    "totalReferrals": 15
  }
}
```

**Response (404) - Invalid Code:**

```json
{
  "success": false,
  "message": "Referral code not found",
  "data": null
}
```

### 2. Get Referral Statistics

**GET** `/api/referral/stats`

🔒 **Requires Authentication**

Get comprehensive referral statistics for the authenticated user.

**Response (200):**

```json
{
  "success": true,
  "message": "Referral stats retrieved successfully",
  "data": {
    "myReferralCode": "AB12CD34",
    "totalReferralPoints": 50000,
    "totalReferrals": 5,
    "totalEarnings": 50000,
    "referralHistory": [
      {
        "referredUser": "Jane Smith",
        "pointsEarned": 10000,
        "discountGiven": 10,
        "date": "2024-01-15T10:30:00Z"
      }
    ],
    "referredBy": "Alice Johnson",
    "availableCoupons": [
      {
        "discountType": "PERCENTAGE",
        "discountValue": 10,
        "expiresAt": "2024-12-31T23:59:59Z",
        "type": "REFERRAL_BASED"
      }
    ]
  }
}
```

### 3. Redeem Points for Discount

**POST** `/api/referral/redeem`

🔒 **Requires Authentication**

Convert referral points to discount coupons (100 points = 1% discount, max 50%).

**Request Body:**

```json
{
  "pointsToRedeem": 1000 // Will create 10% discount coupon
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Points redeemed successfully",
  "data": {
    "discountType": "PERCENTAGE",
    "discountValue": 10,
    "expiryDate": "2024-12-31T23:59:59Z",
    "pointsUsed": 1000,
    "remainingPoints": 49000
  }
}
```

---

## Dashboard Endpoints

### 1. Get User Account Information

**GET** `/api/dashboard/my-account`

🔒 **Requires Authentication**

Retrieve authenticated user's personal account information.

**Response (200):**

```json
{
  "success": true,
  "message": "Get user info successfully",
  "data": {
    "fullname": "John Doe",
    "email": "john@example.com",
    "referralCode": "AB12CD34",
    "referralPoints": 50000
  }
}
```

---

## Error Responses

All error responses follow this format:

**400 Bad Request:**

```json
{
  "success": false,
  "message": "Validation failed",
  "details": "Password must be at least 8 characters long"
}
```

**401 Unauthorized:**

```json
{
  "success": false,
  "message": "Unauthorized access",
  "details": "User is not verified"
}
```

**404 Not Found:**

```json
{
  "success": false,
  "message": "Resource not found",
  "details": "User not found"
}
```

**409 Conflict:**

```json
{
  "success": false,
  "message": "Resource conflict",
  "details": "Email already exists"
}
```

---

## API Usage Flow Examples

### Complete User Registration & Event Creation Flow:

1. **Register with referral code:**

   ```bash
   POST /api/auth/register
   # User receives email verification
   ```

2. **Verify email:**

   ```bash
   GET /api/auth/verify-email?token=abc123
   # Account becomes active
   ```

3. **Login:**

   ```bash
   POST /api/auth/login
   # Receive JWT token
   ```

4. **Check referral stats:**

   ```bash
   GET /api/referral/stats
   # View welcome bonus and referral code
   ```

5. **Create event (if EVENT_ORGANIZER):**

   ```bash
   POST /api/create-event
   # Include JWT token in Authorization header
   ```

6. **Explore events:**
   ```bash
   GET /api/explore-events?category=Music&limit=10
   # Browse available events
   ```

### Referral System Flow:

1. **Existing user shares referral code:** `AB12CD34`
2. **New user validates code:**
   ```bash
   GET /api/referral/validate/AB12CD34
   # Confirms code is valid
   ```
3. **New user registers with code:**
   ```bash
   POST /api/auth/register
   { "usedReferralCode": "AB12CD34", ... }
   ```
4. **System automatically:**
   - Awards 10,000 points to referrer
   - Gives 10% discount coupon to new user
   - Creates referral transaction record

5. **Referrer can redeem points:**
   ```bash
   POST /api/referral/redeem
   { "pointsToRedeem": 1000 }
   ```

---

## Database Schema

The database schema is defined in `prisma/schema.prisma` and includes the following models:

- `User`: Stores user information, including roles and referral data.
- `Event`: Stores event details, including location, time, and available seats.
- `TicketTypes`: Defines different types of tickets for an event.
- `Promotion`: Stores promotional information, such as discounts and coupon codes.
- `Transaction`: Records user transactions for purchasing tickets.
- `Review`: Stores user reviews and ratings for events.
- `Dashboard`: Stores aggregated data for event organizer dashboards.

## Project Structure

The project is structured as follows:

- `prisma/`: Contains the database schema and migration files.
- `src/`: Contains the application source code.
  - `lib/`: Contains core application logic, such as middleware, utilities, and configuration.
  - `routers/`: Contains the application's API routes and controllers.
- `package.json`: Defines project dependencies and scripts.
- `tsconfig.json`: TypeScript configuration file.
