# API Reference

Complete API documentation for the IVR Routing Data Layer REST API.

## Table of Contents

- [API Overview](#api-overview)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Routing Table API](#routing-table-api)
- [Segment Store API](#segment-store-api)
- [Message Store API](#message-store-api)
- [Dictionaries API](#dictionaries-api)
- [Audit API](#audit-api)
- [Health Check API](#health-check-api)

## API Overview

### Base URL

```
http://localhost:3001/api/v1
```

Production: `https://your-domain.com/api/v1`

### API Versioning

The API uses URI versioning:
- Current version: `v1`
- Base path: `/api/v1`
- Breaking changes will introduce `v2`, `v3`, etc.

### Content Type

All requests and responses use JSON:

```http
Content-Type: application/json
Accept: application/json
```

### Pagination

List endpoints support pagination with query parameters:

| Parameter | Type | Default | Min | Max | Description |
|-----------|------|---------|-----|-----|-------------|
| `page` | integer | 1 | 1 | - | Page number |
| `limit` | integer | 50 | 1 | 100 | Items per page |

**Response Format**:

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

### Search and Filtering

Search endpoints support:
- `search`: Text search (min 2 chars, max 100 chars)
- `filter[field]`: Field-specific filters
- `sort`: Sort order (e.g., `createdAt:desc`)

## Authentication

### JWT Bearer Token

All endpoints (except health checks) require authentication via JWT bearer token:

```http
Authorization: Bearer <your-jwt-token>
```

### Development Mode

For local development, mock authentication can be enabled:

```env
USE_MOCK_AUTH=true
```

Dev auth endpoint:

```http
POST /api/v1/auth/dev-login
Content-Type: application/json

{
  "email": "admin@example.com",
  "roles": ["GLOBAL_ADMIN"]
}
```

**Response**:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "email": "admin@example.com",
    "roles": ["GLOBAL_ADMIN"],
    "customerScopes": ["digipolis", "acme"]
  }
}
```

See [AUTHENTICATION_GUIDE.md](AUTHENTICATION_GUIDE.md) for role requirements.

## Error Handling

### Standard Error Response

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "sourceId",
      "message": "sourceId must be unique"
    }
  ]
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation errors, invalid input |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate key, constraint violation |
| 422 | Unprocessable Entity | Business logic validation failed |
| 500 | Internal Server Error | Server error |

## Routing Table API

### List Routing Entries

```http
GET /api/v1/routing?routingId=EEBL-ENERGYLINE-MAIN
GET /api/v1/routing?companyProjectId=5
GET /api/v1/routing
```

**Required Role**: `RT_VIEWER` or higher

**Query Parameters**:
- `routingId` (string, optional): Filter by specific routing identifier
- `companyProjectId` (integer, optional): Filter by company project ID
- If both omitted: Returns all entries for user's customer scope

**Response** (200 OK):

```json
[
  {
    "routingTableId": "550e8400-e29b-41d4-a716-446655440000",
    "sourceId": "1800SUPPORT",
    "routingId": "support_workflow_v3",
    "companyProjectId": 5,
    "messageStoreId": 12,
    "languageCode": "nl-BE",
    "schedulerId": 1,
    "initSegment": "init",
    "config": {
      "timeout": 30000,
      "maxRetries": 3
    },
    "featureFlags": {
      "enableAI": true,
      "enableRecording": false
    },
    "isActive": true,
    "dateCreated": "2026-01-15T10:30:00Z",
    "createdBy": "admin@example.com",
    "dateUpdated": "2026-01-18T14:22:00Z",
    "updatedBy": "editor@example.com"
  }
]
```

### Create Routing Entry

```http
POST /api/v1/routing/entries
Content-Type: application/json
```

**Required Role**: `RT_EDITOR` or `RT_ADMIN`

**Request Body**:

```json
{
  "sourceId": "1800NEWLINE",
  "routingId": "customer_service_main",
  "companyProjectId": 5,
  "messageStoreId": 12,
  "languageCode": "nl-BE",
  "initSegment": "welcome",
  "config": {
    "timeout": 30000,
    "maxRetries": 3
  },
  "featureFlags": {
    "enableAI": true
  }
}
```

**Response** (201 Created):

```json
{
  "routingTableId": "550e8400-e29b-41d4-a716-446655440001",
  "sourceId": "1800NEWLINE",
  "routingId": "customer_service_main",
  "companyProjectId": 5,
  "messageStoreId": 12,
  "languageCode": "nl-BE",
  "schedulerId": 1,
  "initSegment": "welcome",
  "config": {
    "timeout": 30000,
    "maxRetries": 3
  },
  "featureFlags": {
    "enableAI": true
  },
  "isActive": true,
  "dateCreated": "2026-01-20T09:15:00Z",
  "createdBy": "editor@example.com",
  "dateUpdated": "2026-01-20T09:15:00Z",
  "updatedBy": null
}
```

**Validation**:
- `sourceId`: Required, unique, max 150 chars
- `routingId`: Required, max 150 chars
- `companyProjectId`: Required, must exist
- `messageStoreId`: Optional, must exist if provided
- `languageCode`: Required, must be valid BCP47
- `initSegment`: Optional, max 150 chars

### Get Routing Entry by ID

```http
GET /api/v1/routing/entries/{id}
```

**Required Role**: `RT_VIEWER` or higher

**Response** (200 OK):

```json
{
  "routingTableId": "550e8400-e29b-41d4-a716-446655440000",
  "sourceId": "1800SUPPORT",
  "routingId": "support_workflow_v3",
  "companyProjectId": 5,
  "messageStoreId": 12,
  "languageCode": "nl-BE",
  "schedulerId": 1,
  "initSegment": "init",
  "config": { "timeout": 30000 },
  "featureFlags": { "enableAI": true },
  "isActive": true,
  "dateCreated": "2026-01-15T10:30:00Z",
  "createdBy": "admin@example.com",
  "dateUpdated": "2026-01-18T14:22:00Z",
  "updatedBy": "editor@example.com"
}
```

### Update Routing Entry

```http
PUT /api/v1/routing/entries/{id}
Content-Type: application/json
```

**Required Role**: `RT_EDITOR` or `RT_ADMIN`

**Request Body**:

```json
{
  "initSegment": "new_welcome",
  "config": {
    "timeout": 45000,
    "maxRetries": 5
  },
  "featureFlags": {
    "enableAI": true,
    "enableRecording": true
  }
}
```

**Response** (200 OK): Updated routing entry object

### Delete Routing Entry

```http
DELETE /api/v1/routing/entries/{id}
```

**Required Role**: `RT_ADMIN`

**Response** (204 No Content)

**Note**: This is a soft delete (`isActive = false`)

### Runtime Lookup

```http
GET /api/v1/routing/lookup?sourceId=+3212345678
```

**Required Role**: `RT_VIEWER` or higher

**Query Parameters**:
- `sourceId` (string, required): Source identifier (phone number or logical name)

**Response** (200 OK):

```json
{
  "routingTableId": "550e8400-e29b-41d4-a716-446655440000",
  "sourceId": "+3212345678",
  "routingId": "EEBL-ENERGYLINE-MAIN",
  "languageCode": "nl-BE",
  "messageStoreId": 5,
  "schedulerId": 1,
  "initSegment": "welcome",
  "featureFlags": { "enableRecording": true },
  "config": { "timeout": 30 }
}
```

### Export Routing Entries

```http
GET /api/v1/routing/export?routingIds=EEBL-ENERGYLINE-MAIN,EEBL-ENERGYLINE-DEV
GET /api/v1/routing/export?customerIds=digipolis&projectIds=energyline
GET /api/v1/routing/export
```

**Required Role**: `RT_VIEWER` or higher

**Query Parameters**:
- `customerIds` (string, optional): Comma-separated list of customer IDs
- `projectIds` (string, optional): Comma-separated list of project IDs
- `routingIds` (string, optional): Comma-separated list of routing IDs

**Response** (200 OK):

```json
{
  "exportVersion": "3.0.0",
  "exportedAt": "2026-01-20T10:00:00Z",
  "exportedBy": "admin@example.com",
  "entries": [
    {
      "sourceId": "1800SUPPORT",
      "routingId": "support_workflow_v3",
      "customerId": "digipolis",
      "projectId": "customer-service",
      "companyProjectId": 5,
      "name": "support_workflow_v3",
      "oktaGroup": "okta-digipolis-flow",
      "supportedLanguages": ["nl-BE", "fr-BE"],
      "defaultLanguage": "nl-BE",
      "schedulerId": 1,
      "featureFlags": { "enableRecording": true },
      "config": { "timeout": 30000 },
      "version": 1,
      "lastModified": "2026-01-18T14:22:00Z"
    }
  ],
  "filters": {
    "customerIds": ["digipolis"],
    "projectIds": ["energyline"],
    "routingIds": null
  },
  "summary": {
    "totalEntries": 1,
    "uniqueCustomers": 1,
    "uniqueProjects": 1
  }
}
```

### Preview Import

```http
POST /api/v1/routing/import/preview
Content-Type: application/json
```

**Required Role**: `RT_VIEWER` or higher

**Request Body**:

```json
{
  "exportData": {
    "exportVersion": "3.0.0",
    "entries": [...]
  }
}
```

**Response** (200 OK):

```json
{
  "isValid": true,
  "willCreate": 5,
  "willUpdate": 3,
  "willSkip": 2,
  "conflicts": [
    {
      "sourceId": "+3257351230",
      "routingId": "EEBL-ENERGYLINE-MAIN",
      "current": { "version": 1, "lastModified": "2026-01-01T00:00:00Z" },
      "imported": { "version": 2, "lastModified": "2026-01-02T00:00:00Z" },
      "action": "skip"
    }
  ],
  "errors": [],
  "warnings": []
}
```

### Import Routing Entries

```http
POST /api/v1/routing/import?overwrite=false&validateOnly=false
Content-Type: application/json
```

**Required Role**: `RT_EDITOR` or `RT_ADMIN`

**Query Parameters**:
- `overwrite` (boolean, optional): Overwrite existing entries (default: false)
- `validateOnly` (boolean, optional): Only validate without importing (default: false)

**Request Body**:

```json
{
  "exportData": {
    "exportVersion": "3.0.0",
    "entries": [...]
  },
  "overwrite": false,
  "importedBy": "admin@example.com"
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "imported": 5,
  "updated": 3,
  "skipped": 2,
  "errors": [],
  "warnings": [],
  "completedAt": "2026-01-20T10:30:00Z"
}
```

## Segment Store API

### Get Flow Graph

```http
GET /api/v1/segments/graph/{routingId}?changeSetId={uuid}
```

**Required Role**: `SEG_VIEWER` or higher

**Query Parameters**:
- `changeSetId` (UUID, optional): Get draft version, omit for published

**Response** (200 OK):

```json
{
  "routingId": "support_workflow_v3",
  "changeSetId": null,
  "segments": [
    {
      "segmentId": 1,
      "segmentName": "init",
      "segmentType": "entry_point",
      "segmentOrder": 1,
      "keys": [
        {
          "dicKeyId": 10,
          "keyName": "action",
          "value": "route"
        }
      ],
      "transitions": [
        {
          "resultName": "success",
          "nextSegmentName": "menu",
          "contextKey": null
        },
        {
          "resultName": "error",
          "nextSegmentName": "error_handler",
          "contextKey": null
        }
      ]
    },
    {
      "segmentId": 2,
      "segmentName": "menu",
      "segmentType": "interactive_voice",
      "segmentOrder": 2,
      "keys": [
        {
          "dicKeyId": 15,
          "keyName": "messageKey",
          "value": "MAIN_MENU_PROMPT"
        },
        {
          "dicKeyId": 16,
          "keyName": "options",
          "value": "1,2,3"
        }
      ],
      "transitions": [
        {
          "resultName": "option_1",
          "nextSegmentName": "billing",
          "contextKey": null
        },
        {
          "resultName": "option_2",
          "nextSegmentName": "support",
          "contextKey": null
        },
        {
          "resultName": "timeout",
          "nextSegmentName": "error_handler",
          "contextKey": null
        }
      ]
    }
  ]
}
```

### Create Segment (Batch)

```http
POST /api/v1/segments/batch
Content-Type: application/json
```

**Required Role**: `SEG_EDITOR` or `SEG_ADMIN`

**Request Body**:

```json
{
  "routingId": "support_workflow_v3",
  "changeSetId": "a7f8b2d1-4c3e-4d5f-8a9b-1c2d3e4f5a6b",
  "segments": [
    {
      "segmentName": "new_segment",
      "segmentType": "routing",
      "segmentOrder": 5,
      "keys": [
        {
          "dicKeyId": 20,
          "value": "value1"
        }
      ],
      "transitions": [
        {
          "resultName": "success",
          "nextSegmentName": "next_segment"
        }
      ]
    }
  ]
}
```

**Response** (201 Created):

```json
{
  "created": 1,
  "segments": [
    {
      "segmentId": 45,
      "segmentName": "new_segment",
      "routingId": "support_workflow_v3",
      "changeSetId": "a7f8b2d1-4c3e-4d5f-8a9b-1c2d3e4f5a6b"
    }
  ]
}
```

### Update Segment Configuration

```http
PUT /api/v1/segments/{segmentId}/config
Content-Type: application/json
```

**Required Role**: `SEG_EDITOR` or `SEG_ADMIN`

**Request Body**:

```json
{
  "keys": [
    {
      "dicKeyId": 15,
      "value": "UPDATED_MESSAGE_KEY"
    },
    {
      "dicKeyId": 16,
      "value": "1,2,3,4"
    }
  ]
}
```

**Response** (200 OK): Updated segment object

### Create/Update Transitions

```http
POST /api/v1/segments/{segmentId}/transitions
Content-Type: application/json
```

**Required Role**: `SEG_EDITOR` or `SEG_ADMIN`

**Request Body**:

```json
{
  "transitions": [
    {
      "resultName": "option_1",
      "nextSegmentName": "billing_dept",
      "contextKey": null
    },
    {
      "resultName": "option_2",
      "nextSegmentName": "support_dept",
      "contextKey": null
    }
  ]
}
```

**Response** (200 OK):

```json
{
  "updated": 2,
  "transitions": [...]
}
```

### Validate Flow Graph

```http
POST /api/v1/segments/flows/{routingId}/validate
Content-Type: application/json
```

**Required Role**: `SEG_VIEWER` or higher

**Request Body**:

```json
{
  "changeSetId": "a7f8b2d1-4c3e-4d5f-8a9b-1c2d3e4f5a6b"
}
```

**Response** (200 OK):

```json
{
  "valid": true,
  "errors": [],
  "warnings": [
    {
      "type": "unreachable_segment",
      "segmentName": "old_billing",
      "message": "Segment is not reachable from any transition"
    }
  ]
}
```

**Validation Errors** (when invalid):

```json
{
  "valid": false,
  "errors": [
    {
      "type": "missing_entry_point",
      "message": "Flow must have exactly one entry_point segment"
    },
    {
      "type": "missing_terminal",
      "message": "Flow must have at least one terminal segment"
    },
    {
      "type": "invalid_transition",
      "segmentName": "menu",
      "resultName": "option_1",
      "message": "Transition points to non-existent segment 'invalid_target'"
    }
  ],
  "warnings": []
}
```

### Publish ChangeSet

```http
POST /api/v1/segments/flows/{routingId}/drafts/{changeSetId}/publish
Content-Type: application/json
```

**Required Role**: `SEG_OPS` or `SEG_ADMIN`

**Request Body**:

```json
{
  "actionBy": "ops@example.com",
  "actionReason": "Production deployment Q1 2026"
}
```

**Response** (200 OK):

```json
{
  "routingId": "support_workflow_v3",
  "changeSetId": "a7f8b2d1-4c3e-4d5f-8a9b-1c2d3e4f5a6b",
  "status": "published",
  "publishedAt": "2026-01-20T11:00:00Z",
  "publishedBy": "ops@example.com"
}
```

## Message Store API

### List Message Stores

```http
GET /api/v1/messages/stores?search=Support&companyProjectId=5
GET /api/v1/messages/stores
```

**Required Role**: `MSG_VIEWER` or higher

**Query Parameters**:
- `search` (string, optional): Search by name, storeId, or companyProjectId
- `companyProjectId` (integer, optional): Filter by company project ID

**Response** (200 OK):

```json
[
  {
    "messageStoreId": 12,
    "name": "Support Messages",
    "companyProjectId": 5,
    "allowedLanguages": ["nl-BE", "fr-BE", "en-US"],
    "defaultLanguage": "nl-BE",
    "isActive": true,
    "dateCreated": "2026-01-10T08:00:00Z"
  }
]
```

**Note**: Results are automatically filtered by user's customer scope.

### Get Message Store by ID

```http
GET /api/v1/messages/stores/{storeId}
```

**Required Role**: `MSG_VIEWER` or higher

**Response** (200 OK):

```json
{
  "messageStoreId": 12,
  "name": "Support Messages",
  "companyProjectId": 5,
  "companyProject": {
    "customerId": "digipolis",
    "projectId": "customer-service",
    "displayName": "Digipolis Customer Service"
  },
  "allowedLanguages": ["nl-BE", "fr-BE", "en-US"],
  "defaultLanguage": "nl-BE",
  "voiceConfigs": [
    {
      "language": "nl-BE",
      "voiceId": 5,
      "voiceCode": "nl-BE-Wavenet-A",
      "isDefault": true
    },
    {
      "language": "fr-BE",
      "voiceId": 8,
      "voiceCode": "fr-BE-Wavenet-A",
      "isDefault": true
    }
  ],
  "isActive": true,
  "createdAt": "2026-01-10T08:00:00Z"
}
```

### List Message Keys

```http
GET /api/v1/messages/stores/{storeId}/message-keys
```

**Required Role**: `MSG_VIEWER` or higher

**Response** (200 OK):

```json
[
  {
    "messageKeyId": 150,
    "messageStoreId": 12,
    "messageKey": "WELCOME_PROMPT",
    "displayName": "Welcome Greeting",
    "messageTypeId": 1,
    "messageType": {
      "code": "tts",
      "displayName": "Text-to-Speech"
    },
    "categoryId": 1,
    "category": {
      "code": "welcome",
      "displayName": "Welcome Messages",
      "icon": "wave"
    },
    "publishedVersion": 2,
    "versionCount": 2,
    "isActive": true,
    "dateCreated": "2026-01-12T09:00:00Z",
    "dateUpdated": "2026-01-18T14:30:00Z"
  }
]
```

**Note**: Returns all messageKeys in the store (grouped, not per-language). Results are automatically filtered by user's customer scope.

### Get Message Key Details

```http
GET /api/v1/messages/stores/{storeId}/message-keys/{messageKey}
```

**Required Role**: `MSG_VIEWER` or higher

**Response** (200 OK):

```json
{
  "messageKeyId": 150,
  "messageStoreId": 12,
  "messageKey": "WELCOME_PROMPT",
  "displayName": "Welcome Greeting",
  "messageTypeId": 1,
  "categoryId": 1,
  "publishedVersion": 2,
  "versions": [
    {
      "messageKeyVersionId": "b8c9d0e1-5d4e-4f6g-9h0i-2j3k4l5m6n7o",
      "version": 1,
      "versionName": "Initial Version",
      "isActive": true,
      "languageCount": 3,
      "createdAt": "2026-01-12T09:00:00Z",
      "createdBy": "editor@example.com"
    },
    {
      "messageKeyVersionId": "c9d0e1f2-6e5f-5g7h-0i1j-3k4l5m6n7o8p",
      "version": 2,
      "versionName": "Updated Q1 2026",
      "isActive": true,
      "languageCount": 3,
      "createdAt": "2026-01-18T14:30:00Z",
      "createdBy": "editor@example.com"
    }
  ],
  "currentVersion": {
    "version": 2,
    "versionName": "Updated Q1 2026",
    "languages": [
      {
        "language": "nl-BE",
        "content": "Welkom bij onze klantenservice. Hoe kunnen wij u helpen?",
        "typeSettings": {
          "voice": "nl-BE-Wavenet-A",
          "speed": 1.0,
          "pitch": 0
        }
      },
      {
        "language": "fr-BE",
        "content": "Bienvenue à notre service client. Comment pouvons-nous vous aider?",
        "typeSettings": {
          "voice": "fr-BE-Wavenet-A",
          "speed": 1.0,
          "pitch": 0
        }
      },
      {
        "language": "en-US",
        "content": "Welcome to our customer service. How can we help you?",
        "typeSettings": {
          "voice": "en-US-Wavenet-D",
          "speed": 1.0,
          "pitch": 0
        }
      }
    ]
  }
}
```

### Create Message Key

```http
POST /api/v1/messages/stores/{storeId}/message-keys
Content-Type: application/json
```

**Required Role**: `MSG_EDITOR` or `MSG_ADMIN`

**Request Body**:

```json
{
  "messageKey": "NEW_ERROR_MESSAGE",
  "displayName": "Error Handling Message",
  "messageTypeId": 1,
  "categoryId": 6,
  "languages": [
    {
      "language": "nl-BE",
      "content": "Er is een fout opgetreden. Probeer het later opnieuw.",
      "typeSettings": {
        "voice": "nl-BE-Wavenet-A",
        "speed": 0.95,
        "pitch": 0
      }
    },
    {
      "language": "fr-BE",
      "content": "Une erreur s'est produite. Veuillez réessayer plus tard.",
      "typeSettings": {
        "voice": "fr-BE-Wavenet-A",
        "speed": 0.95,
        "pitch": 0
      }
    }
  ],
  "versionName": "Initial Version"
}
```

**Response** (201 Created):

```json
{
  "messageKeyId": 178,
  "messageStoreId": 12,
  "messageKey": "NEW_ERROR_MESSAGE",
  "displayName": "Error Handling Message",
  "publishedVersion": null,
  "version": 1,
  "versionName": "Initial Version",
  "createdAt": "2026-01-20T10:45:00Z",
  "createdBy": "editor@example.com"
}
```

**Validation**:
- `messageKey`: Required, UPPER_SNAKE_CASE, max 64 chars, unique in store
- All allowed languages must be provided
- Language content required
- typeSettings validated against message type schema

### Create New Version

```http
POST /api/v1/messages/stores/{storeId}/message-keys/{messageKey}/versions
Content-Type: application/json
```

**Required Role**: `MSG_EDITOR` or `MSG_ADMIN`

**Request Body**:

```json
{
  "languages": [
    {
      "language": "nl-BE",
      "content": "UPDATED: Er is een fout opgetreden. Neem contact op met support.",
      "typeSettings": {
        "voice": "nl-BE-Wavenet-A",
        "speed": 0.95,
        "pitch": 0
      }
    },
    {
      "language": "fr-BE",
      "content": "MIS À JOUR: Une erreur s'est produite. Contactez le support.",
      "typeSettings": {
        "voice": "fr-BE-Wavenet-A",
        "speed": 0.95,
        "pitch": 0
      }
    }
  ],
  "versionName": "Support Contact Added"
}
```

**Response** (201 Created):

```json
{
  "messageKeyVersionId": "d0e1f2g3-7f6g-6h8i-1j2k-4l5m6n7o8p9q",
  "version": 2,
  "versionName": "Support Contact Added",
  "languageCount": 2,
  "createdAt": "2026-01-20T11:00:00Z",
  "createdBy": "editor@example.com"
}
```

**Note**: Version is created in draft (not published). Use publish endpoint to make it active.

### Get Version by Number

```http
GET /api/v1/messages/stores/{storeId}/message-keys/{messageKey}/versions/{version}
```

**Required Role**: `MSG_VIEWER` or higher

**Path Parameters**:
- `storeId` (integer, required): Message store ID
- `messageKey` (string, required): Message key
- `version` (integer, required): Version number (1-10)

**Response** (200 OK):

```json
{
  "messageKeyVersionId": "d0e1f2g3-7f6g-6h8i-1j2k-4l5m6n7o8p9q",
  "version": 2,
  "versionName": "Support Contact Added",
  "isActive": true,
  "languages": [
    {
      "language": "nl-BE",
      "content": "UPDATED: Er is een fout opgetreden. Neem contact op met support.",
      "typeSettings": {
        "voice": "nl-BE-Wavenet-A",
        "speed": 0.95,
        "pitch": 0
      }
    },
    {
      "language": "fr-BE",
      "content": "MIS À JOUR: Une erreur s'est produite. Contactez le support.",
      "typeSettings": {
        "voice": "fr-BE-Wavenet-A",
        "speed": 0.95,
        "pitch": 0
      }
    }
  ],
  "createdAt": "2026-01-20T11:00:00Z",
  "createdBy": "editor@example.com"
}
```

### Update Message Key Metadata

```http
PUT /api/v1/messages/stores/{storeId}/message-keys/{messageKey}
Content-Type: application/json
```

**Required Role**: `MSG_EDITOR` or `MSG_ADMIN`

**Request Body**:

```json
{
  "displayName": "Updated Welcome Greeting",
  "description": "Updated description"
}
```

**Response** (200 OK): Updated messageKey object

**Note**: This updates metadata only. To change content, create a new version.

### Delete Message Key

```http
DELETE /api/v1/messages/stores/{storeId}/message-keys/{messageKey}
```

**Required Role**: `MSG_ADMIN`

**Response** (204 No Content)

**Note**: This is a soft delete. The messageKey is marked as inactive.

### Publish Version

```http
POST /api/v1/messages/stores/{storeId}/message-keys/{messageKey}/publish
Content-Type: application/json
```

**Required Role**: `MSG_OPS` or `MSG_ADMIN`

**Request Body**:

```json
{
  "version": 2,
  "actionBy": "ops@example.com",
  "actionReason": "Updated error message with support contact"
}
```

**Response** (200 OK):

```json
{
  "messageKeyId": 178,
  "messageKey": "NEW_ERROR_MESSAGE",
  "publishedVersion": 2,
  "publishedAt": "2026-01-20T11:15:00Z",
  "publishedBy": "ops@example.com"
}
```

### Rollback Version

```http
POST /api/v1/messages/stores/{storeId}/message-keys/{messageKey}/rollback
Content-Type: application/json
```

**Required Role**: `MSG_OPS` or `MSG_ADMIN`

**Request Body**:

```json
{
  "targetVersion": 1,
  "actionBy": "ops@example.com",
  "actionReason": "Reverting due to translation error"
}
```

**Response** (200 OK):

```json
{
  "messageKeyId": 178,
  "messageKey": "NEW_ERROR_MESSAGE",
  "publishedVersion": 1,
  "rolledBackAt": "2026-01-20T12:00:00Z",
  "rolledBackBy": "ops@example.com"
}
```

### Get Audit History

```http
GET /api/v1/messages/stores/{storeId}/message-keys/{messageKey}/audit?page=1&limit=50
```

**Required Role**: `MSG_VIEWER` or higher

**Query Parameters**:
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 50)
- `startDate` (string, optional): ISO 8601 date
- `endDate` (string, optional): ISO 8601 date
- `action` (string, optional): Filter by action type

**Response** (200 OK):

```json
{
  "data": [
    {
      "auditId": "e1f2g3h4-8g7h-7i9j-2k3l-5m6n7o8p9q0r",
      "messageKey": "WELCOME_PROMPT",
      "action": "published",
      "actionBy": "ops@example.com",
      "actionAt": "2026-01-20T11:15:00Z",
      "details": {
        "version": 2,
        "reason": "Updated error message"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 15
  }
}
```

### Runtime Fetch (Performance-Critical)

```http
GET /api/v1/messages/runtime/fetch?messageStoreId=12&messageKey=WELCOME_PROMPT&language=nl-BE
```

**Required Role**: Service account or API key

**Query Parameters**:
- `messageStoreId` (integer, required): Message store ID
- `messageKey` (string, required): Message key
- `language` (string, required): BCP47 language code

**Response** (200 OK):

```json
{
  "messageKey": "WELCOME_PROMPT",
  "language": "nl-BE",
  "content": "Welkom bij onze klantenservice. Hoe kunnen wij u helpen?",
  "messageType": "tts",
  "typeSettings": {
    "voice": "nl-BE-Wavenet-A",
    "speed": 1.0,
    "pitch": 0
  },
  "version": 2,
  "categoryCode": "welcome"
}
```

**Performance**:
- Target: <30ms response time
- Cached published versions
- Optimized indexes on lookup path

### Runtime Store Fetch (Bulk)

```http
GET /api/v1/messages/runtime/store/{storeId}?language=nl-BE
```

**Required Role**: Service account or API key

**Query Parameters**:
- `language` (string, required): BCP47 language code

**Response** (200 OK):

```json
{
  "WELCOME_PROMPT": {
    "content": "Welkom bij onze klantenservice. Hoe kunnen wij u helpen?",
    "typeSettings": {
      "voice": "nl-BE-Wavenet-A",
      "speed": 1.0,
      "pitch": 0
    },
    "version": 2,
    "categoryCode": "welcome"
  },
  "MENU_MAIN": {
    "content": "Druk op 1 voor facturen, 2 voor support...",
    "typeSettings": {
      "voice": "nl-BE-Wavenet-A",
      "speed": 1.0,
      "pitch": 0
    },
    "version": 1,
    "categoryCode": "menu"
  }
}
```

**Performance**:
- Target: <100ms response time
- Returns all published messages for a language in a single request
- Used by IVR platform for bulk prefetch/caching

## Dictionaries API

### Languages

```http
GET /api/v1/config/languages
```

**Response** (200 OK):

```json
{
  "data": [
    {
      "languageCode": "nl-BE",
      "displayName": "Dutch (Belgium)",
      "isActive": true
    },
    {
      "languageCode": "fr-BE",
      "displayName": "French (Belgium)",
      "isActive": true
    },
    {
      "languageCode": "en-US",
      "displayName": "English (United States)",
      "isActive": true
    }
  ]
}
```

### Voices

```http
GET /api/v1/config/voices?language=nl-BE
```

**Response** (200 OK):

```json
{
  "data": [
    {
      "voiceId": 5,
      "code": "nl-BE-Wavenet-A",
      "displayName": "Dutch (Belgium) - Female (Wavenet A)",
      "engine": "google",
      "language": "nl-BE",
      "gender": "female",
      "isActive": true
    }
  ]
}
```

### Segment Types

```http
GET /api/v1/config/segment-types
```

**Response** (200 OK):

```json
{
  "data": [
    {
      "dicSegmentTypeId": 1,
      "code": "entry_point",
      "displayName": "Entry Point",
      "category": "flow",
      "isTerminal": false,
      "allowedKeys": [
        {
          "dicKeyId": 1,
          "keyName": "action",
          "dicKeyTypeId": 1,
          "keyType": "string",
          "isRequired": true
        }
      ]
    }
  ]
}
```

### Message Types

```http
GET /api/v1/config/message-types
```

**Response** (200 OK):

```json
{
  "data": [
    {
      "messageTypeId": 1,
      "code": "tts",
      "displayName": "Text-to-Speech",
      "settingsSchema": {
        "type": "object",
        "properties": {
          "voice": { "type": "string" },
          "speed": { "type": "number", "minimum": 0.25, "maximum": 4.0 },
          "pitch": { "type": "number", "minimum": -20, "maximum": 20 }
        },
        "required": ["voice"]
      }
    }
  ]
}
```

## Audit API

### Query Audit Logs

```http
GET /api/v1/audit?page=1&limit=50&startDate=2026-01-01&endDate=2026-01-31
```

**Required Role**: `GLOBAL_ADMIN` or domain-specific `ADMIN`

**Query Parameters**:
- `page`, `limit`: Pagination
- `startDate`: ISO 8601 date
- `endDate`: ISO 8601 date
- `actionBy`: Filter by user email
- `action`: Filter by action type
- `module`: Filter by module (routing, segments, messages)

**Response** (200 OK):

```json
{
  "data": [
    {
      "auditId": "e1f2g3h4-8g7h-7i9j-2k3l-5m6n7o8p9q0r",
      "module": "messages",
      "action": "published",
      "actionBy": "ops@example.com",
      "actionAt": "2026-01-20T11:15:00Z",
      "auditData": {
        "messageKey": "WELCOME_PROMPT",
        "version": 2,
        "reason": "Updated error message"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 1247
  }
}
```

## Health Check API

### Health Check

```http
GET /health
```

**No authentication required**

**Response** (200 OK):

```json
{
  "status": "ok",
  "timestamp": "2026-01-20T12:00:00Z",
  "uptime": 86400,
  "database": {
    "status": "connected",
    "responseTime": 5
  }
}
```

### Readiness Check

```http
GET /health/ready
```

**Response** (200 OK):

```json
{
  "ready": true,
  "checks": {
    "database": "ok",
    "migrations": "ok"
  }
}
```

## Related Documentation

- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - Architecture and workflows
- [AUTHENTICATION_GUIDE.md](AUTHENTICATION_GUIDE.md) - Auth and roles
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Database schema
- [FRONTEND_GUIDE.md](FRONTEND_GUIDE.md) - Frontend integration
- [BACKEND_GUIDE.md](BACKEND_GUIDE.md) - Backend implementation
