# Synthonia Dashboard API Documentation

## Overview

The Synthonia Dashboard API provides endpoints for managing customer requests, financial data, checklists, and WhatsApp integration.

**Base URL**: `http://localhost:3000`

## Authentication

All endpoints (except WhatsApp webhook verification) require a valid session obtained through NextAuth.js.

```
Authorization: Bearer <session_token>
```

## Request/Response Format

- Request/Response Content-Type: `application/json`
- All timestamps are in ISO 8601 format
- All phone numbers include country code (e.g., +39)

## Error Handling

```json
{
  "error": "Error message",
  "details": "Additional error details (only in development)"
}
```

Common error codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid session)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Endpoints

### Authentication

#### Login

**Endpoint**: `POST /api/auth/signin`

**Request**:
```json
{
  "email": "user@synthonia.com",
  "password": "password123",
  "callbackUrl": "/dashboard"
}
```

**Response**:
```json
{
  "url": "/dashboard",
  "ok": true,
  "error": null,
  "status": 200
}
```

#### Logout

**Endpoint**: `GET /api/auth/signout`

**Response**: Redirects to login page

---

### Requests

#### List Requests

**Endpoint**: `GET /api/requests?limit=50`

**Query Parameters**:
- `limit` (optional): Maximum number of requests (default: 50)

**Response**:
```json
[
  {
    "id": "cuid123",
    "whatsappMessageId": "msg_123",
    "clientPhone": "+393933334567",
    "clientName": "John Doe",
    "requestType": "QUOTE",
    "status": "RECEIVED",
    "content": "Mi serve un preventivo",
    "priority": "HIGH",
    "estimatedValue": 5000,
    "assignedUserId": "user123",
    "createdAt": "2026-07-20T10:30:00Z",
    "updatedAt": "2026-07-20T10:30:00Z",
    "completedAt": null,
    "archivedAt": null
  }
]
```

#### Create Request

**Endpoint**: `POST /api/requests`

**Request**:
```json
{
  "clientPhone": "+393933334567",
  "clientName": "John Doe",
  "content": "Mi serve un preventivo",
  "requestType": "QUOTE",
  "priority": "HIGH"
}
```

**Response**: Same as individual request object

#### Get Request Details

**Endpoint**: `GET /api/requests/[id]`

**Response**: Same as individual request object

#### Update Request Status

**Endpoint**: `PUT /api/requests/[id]`

**Request**:
```json
{
  "status": "PROCESSING",
  "assignedUserId": "user123",
  "priority": "URGENT"
}
```

**Response**: Updated request object

#### Get Request Statistics

**Endpoint**: `GET /api/requests/stats`

**Response**:
```json
{
  "total": 150,
  "byStatus": {
    "RECEIVED": 45,
    "PROCESSING": 60,
    "COMPLETED": 40,
    "ARCHIVED": 5
  },
  "byType": {
    "QUOTE": 80,
    "BOOKING": 50,
    "SUPPORT": 15,
    "OTHER": 5
  },
  "averageResolutionTime": "2.5 hours"
}
```

---

### Financial Data

#### Get Cash Metrics

**Endpoint**: `GET /api/financial/cash`

**Response**:
```json
{
  "totalCash": 5000,
  "previousWeekCash": 4500,
  "trend": "up",
  "percentageChange": 11
}
```

#### Get Budget Metrics

**Endpoint**: `GET /api/financial/budget`

**Response**:
```json
{
  "budgetAllocated": 10000,
  "budgetUsed": 3500,
  "budgetRemaining": 6500,
  "percentageUsed": 35,
  "projectedRevenue": 15000
}
```

#### Add Financial Data

**Endpoint**: `POST /api/financial`

**Request**:
```json
{
  "date": "2026-07-20",
  "totalCash": 5000,
  "budgetAllocated": 10000,
  "budgetUsed": 3500,
  "projectedRevenue": 15000,
  "notes": "Weekly financial summary"
}
```

**Response**: Created financial data object

---

### Checklists

#### Get Today's Checklist

**Endpoint**: `GET /api/checklists/today`

**Response**:
```json
{
  "id": "cuid123",
  "date": "2026-07-20",
  "createdById": "user123",
  "items": [
    {
      "id": "1",
      "text": "Controllare messaggi WhatsApp",
      "completed": true,
      "completedAt": "2026-07-20T09:00:00Z"
    },
    {
      "id": "2",
      "text": "Processare nuove richieste",
      "completed": false,
      "completedAt": null
    }
  ],
  "status": "IN_PROGRESS",
  "completedAt": null,
  "createdAt": "2026-07-20T08:00:00Z",
  "updatedAt": "2026-07-20T10:00:00Z"
}
```

#### Update Checklist

**Endpoint**: `PUT /api/checklists/[id]`

**Request**:
```json
{
  "items": [
    {
      "id": "1",
      "completed": true,
      "completedAt": "2026-07-20T09:00:00Z"
    },
    {
      "id": "2",
      "completed": true,
      "completedAt": "2026-07-20T10:00:00Z"
    }
  ],
  "status": "COMPLETED"
}
```

**Response**: Updated checklist object

#### Get Formula Checks

**Endpoint**: `GET /api/checklists/formula`

**Response**:
```json
[
  {
    "id": "cuid123",
    "name": "Pre-Quote Check",
    "description": "Checklist da completare prima di inviare un preventivo",
    "checkItems": [
      { "id": "1", "text": "Verificare dettagli cliente", "required": true },
      { "id": "2", "text": "Controllare prezzi attuali", "required": true }
    ],
    "frequency": "AS_NEEDED",
    "isActive": true,
    "createdAt": "2026-07-20T08:00:00Z",
    "updatedAt": "2026-07-20T08:00:00Z"
  }
]
```

#### Complete Formula Check

**Endpoint**: `POST /api/checklists/formula/[id]/complete`

**Request**:
```json
{
  "completedItems": [
    { "itemId": "1", "completed": true, "completedAt": "2026-07-20T10:00:00Z" },
    { "itemId": "2", "completed": true, "completedAt": "2026-07-20T10:00:00Z" }
  ],
  "notes": "All checks passed"
}
```

**Response**:
```json
{
  "id": "cuid123",
  "formulaCheckId": "formula_123",
  "completedById": "user123",
  "completedItems": [...],
  "notes": "All checks passed",
  "passedValidation": true,
  "completedAt": "2026-07-20T10:00:00Z",
  "createdAt": "2026-07-20T10:00:00Z"
}
```

---

### WhatsApp

#### Verify Webhook

**Endpoint**: `GET /api/whatsapp/webhook`

**Query Parameters**:
- `hub.mode` - Should be "subscribe"
- `hub.verify_token` - Webhook verify token
- `hub.challenge` - Challenge token to echo back

**Response**: Echo back the challenge token

#### Receive Messages

**Endpoint**: `POST /api/whatsapp/webhook`

**Request** (from WhatsApp):
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "123",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "+391234567890",
              "phone_number_id": "123456"
            },
            "contacts": [
              {
                "profile": { "name": "John Doe" },
                "wa_id": "393933334567"
              }
            ],
            "messages": [
              {
                "from": "393933334567",
                "id": "msg_123",
                "timestamp": "1234567890",
                "type": "text",
                "text": { "body": "Mi serve un preventivo" }
              }
            ]
          },
          "field": "messages"
        }
      ],
      "time": 1234567890
    }
  ]
}
```

**Response**:
```json
{
  "success": true
}
```

#### Send Message

**Endpoint**: `POST /api/whatsapp/send`

**Request**:
```json
{
  "to": "+393933334567",
  "text": "Grazie per la tua richiesta, ti contatteremo presto!",
  "requestId": "request_123"
}
```

**Response**:
```json
{
  "success": true,
  "messageId": "msg_456"
}
```

#### Sync Messages

**Endpoint**: `POST /api/whatsapp/sync`

**Request**:
```json
{
  "days": 7
}
```

**Response**:
```json
{
  "message": "Sync endpoint ready",
  "info": "Configure WhatsApp Business API credentials to enable syncing",
  "timestamp": "2026-07-20T10:30:00Z"
}
```

---

## Rate Limiting

API endpoints have the following rate limits (recommended for production):

- Authentication: 5 requests per minute per IP
- Standard endpoints: 60 requests per minute per user
- WhatsApp webhook: 100 requests per minute (higher to handle burst)

## CORS Policy

In production, configure CORS headers to allow requests only from your domain:

```
Access-Control-Allow-Origin: https://yourdomain.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
```

## API Versioning

Current API version: `v1.0`

Future versions will maintain backward compatibility with deprecation warnings.

---

## Examples

### Complete Request Flow

1. **Receive WhatsApp message**
```
POST /api/whatsapp/webhook
```

2. **List new requests**
```
GET /api/requests?status=RECEIVED
```

3. **Assign request to user**
```
PUT /api/requests/request-id
Body: { "assignedUserId": "user123", "status": "PROCESSING" }
```

4. **Send reply to customer**
```
POST /api/whatsapp/send
Body: { "to": "+39...", "text": "...", "requestId": "request-id" }
```

5. **Complete request**
```
PUT /api/requests/request-id
Body: { "status": "COMPLETED" }
```

---

## Support

For API issues or questions, please contact the development team.
