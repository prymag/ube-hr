---
name: api-contract-design
description: Design clear, versioned, and well-documented API contracts that enable seamless frontend-backend integration. Use this when designing endpoints, handling errors, or evolving APIs.
---

# API Contract Design

## When to Use This Skill

Apply this skill when:
- Designing new API endpoints
- Modifying existing endpoints
- Adding filtering, pagination, or sorting
- Designing error responses
- Versioning APIs
- Creating API documentation

## Endpoint Design Pattern

### HTTP Method Selection

- **GET**: Retrieve data (idempotent, no side effects)
- **POST**: Create new resources
- **PUT**: Replace entire resource
- **PATCH**: Partial update
- **DELETE**: Remove resource

### RESTful CRUD Pattern

```
POST   /api/v1/users              → Create user (201 Created)
GET    /api/v1/users              → List users (200 OK)
GET    /api/v1/users/:id          → Get user by ID (200 OK)
PATCH  /api/v1/users/:id          → Update user (200 OK)
DELETE /api/v1/users/:id          → Delete user (204 No Content)
```

### Request Structure

**Create Request:**
```ts
POST /api/v1/users
Content-Type: application/json
Authorization: Bearer <TOKEN>

{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user"
}
```

**List Request with Pagination:**
```ts
GET /api/v1/users?page=1&limit=20&sort=-createdAt&search=john&filter[role]=admin
```

**Update Request:**
```ts
PATCH /api/v1/users/123
Content-Type: application/json

{
  "name": "Jane Doe"
  // Only changed fields required for PATCH
}
```

## Response Structure

### Success Responses

**Single Resource (200, 201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2024-03-28T23:22:34.431Z",
  "updatedAt": "2024-03-28T23:22:34.431Z"
}
```

**List Response (200):**
```json
{
  "data": [
    { "id": "1", "name": "John", "email": "john@example.com" },
    { "id": "2", "name": "Jane", "email": "jane@example.com" }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**No Content (204):**
```
[Empty body, just status code]
```

## Error Response Structure

### Standard Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "email": "Invalid email format",
      "name": "Name is required"
    }
  }
}
```

### HTTP Status Codes

| Status | Code | When |
|--------|------|------|
| 200 | OK | GET/PUT/PATCH successful |
| 201 | Created | POST successful |
| 204 | No Content | DELETE successful |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Missing/invalid auth |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate/conflict error |
| 500 | Server Error | Internal error |

### Error Response Examples

**Validation Error (400):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "email": "Must be a valid email",
      "age": "Must be at least 18"
    }
  }
}
```

**Not Found (404):**
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "User not found",
    "details": {
      "resourceId": "550e8400-e29b-41d4-a716-446655440000",
      "resourceType": "User"
    }
  }
}
```

**Conflict Error (409):**
```json
{
  "error": {
    "code": "DUPLICATE_RESOURCE",
    "message": "A user with this email already exists",
    "details": {
      "field": "email",
      "value": "john@example.com"
    }
  }
}
```

## Pagination & Filtering

### Query Parameters

```ts
interface ListQuery {
  page?: number;              // Default: 1, Min: 1
  limit?: number;             // Default: 20, Min: 1, Max: 100
  sort?: string;              // -createdAt (desc), name (asc)
  search?: string;            // Full-text search
  filter?: Record<string, any>; // filter[role]=admin&filter[status]=active
}
```

### Pagination Response

```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 250,
    "totalPages": 13,
    "hasNext": true,
    "hasPrev": true
  }
}
```

### Sorting Convention

```
GET /api/v1/users?sort=name             // Ascending
GET /api/v1/users?sort=-createdAt       // Descending
GET /api/v1/users?sort=name,-age        // Multiple fields
```

## Data Types

### Common Fields

```ts
// IDs: UUID format
"id": "550e8400-e29b-41d4-a716-446655440000"

// Timestamps: ISO 8601
"createdAt": "2024-03-28T23:22:34.431Z"
"updatedAt": "2024-03-28T23:22:34.431Z"

// Null handling: Explicitly null for optional fields
"deletedAt": null  // Not deleted
"deletedAt": "2024-01-15T10:00:00.000Z"  // Deleted

// Enums: String values
"role": "admin" | "moderator" | "user"
"status": "active" | "inactive" | "pending"
```

## Authentication & Authorization

### Bearer Token

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Permission Scopes

```ts
enum Permission {
  USERS_READ = 'users:read',
  USERS_WRITE = 'users:write',
  USERS_DELETE = 'users:delete',
}

// Response indicates required permissions
// 403 Forbidden: Insufficient permissions
```

## Rate Limiting Headers

### Response Headers

```
X-RateLimit-Limit: 100              // Requests per window
X-RateLimit-Remaining: 99            // Requests left
X-RateLimit-Reset: 1234567890        // Unix timestamp when limit resets
```

### Exceeding Limit (429)

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "details": {
      "retryAfter": 60
    }
  }
}
```

## API Versioning

### URL Versioning

```
/api/v1/users       # Version 1
/api/v2/users       # Version 2 (breaking changes)
```

### Backwards Compatibility

- **Never remove fields**: Mark as deprecated instead
- **Always add as optional**: New fields must be optional
- **Plan migration**: Communicate deprecation timeline
- **Support both**: Maintain v1 while v2 is current

### Version Changes

```
v1.0 → v1.1 (minor)   ✅ Backwards-compatible (new field)
v1.0 → v2.0 (major)   ❌ Breaking (removed field, different response)
```

## API Documentation Requirements

For each endpoint, document:

```markdown
### GET /api/v1/users/:id

**Description**: Retrieve a specific user by ID

**Authentication**: Required (Bearer token)

**Permissions Required**: users:read

**Path Parameters**:
- `id` (string, required): User UUID

**Query Parameters**: None

**Request Body**: None

**Response** (200 OK):
```json
{
  "id": string,
  "name": string,
  "email": string,
  "createdAt": ISO8601,
  "updatedAt": ISO8601
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User does not exist
- `500 Internal Server Error`: Server error

**Example**:
```bash
curl -H "Authorization: Bearer TOKEN" \
  https://api.example.com/api/v1/users/550e8400-e29b-41d4-a716-446655440000
```
```

## API Design Checklist

Before implementing endpoints:
- ✅ Clear HTTP method selection
- ✅ Consistent URL structure
- ✅ Request/response types defined
- ✅ Error cases documented
- ✅ Authentication/authorization clear
- ✅ Pagination implemented (if applicable)
- ✅ Status codes correct
- ✅ Types safe (no `any`)
- ✅ Documentation complete
- ✅ Examples provided

## API Evolution Strategy

When changing APIs:
1. **Add** new fields as optional
2. **Deprecate** old fields (mark as deprecated)
3. **Support** both old and new in parallel
4. **Migrate** clients to new version
5. **Remove** deprecated fields in next major version
