# QuickNotes API Design

Base URL: `https://api.quicknotes.example/v1` · Format: JSON · Auth: `Authorization: Bearer <token>`

## Endpoints

| # | Method | Path | Description | Success status |
|---|--------|------|-------------|----------------|
| 1 | GET | `/notes?limit=10&cursor=...&tag=work` | List the current user's notes (paginated, filterable by tag) | 200 OK |
| 2 | POST | `/notes` | Create a note | 201 Created |
| 3 | GET | `/notes/{id}` | Get one note | 200 OK |
| 4 | PUT | `/notes/{id}` | Replace a note (full update) | 200 OK |
| 5 | PATCH | `/notes/{id}` | Partially update a note | 200 OK |
| 6 | DELETE | `/notes/{id}` | Delete a note | 204 No Content |
| 7 | GET | `/tags` | List the user's tags | 200 OK |
| 8 | PUT | `/notes/{id}/tags/{tagId}` | Attach a tag to a note | 204 No Content |
| 9 | DELETE | `/notes/{id}/tags/{tagId}` | Remove a tag from a note | 204 No Content |
| 10 | POST | `/auth/login` | Exchange credentials for a token | 200 OK |

Design rules: nouns in paths, plural resources, HTTP verbs carry the action, user identity comes from the token (never from the URL), cursor pagination for large lists.

## Create a note

`POST /notes`

```json
{
  "title": "Buy milk",
  "body": "2 litres, semi-skimmed",
  "tags": ["errands"]
}
```

Response `201 Created` with header `Location: /v1/notes/9812`:

```json
{
  "id": 9812,
  "userId": 42,
  "title": "Buy milk",
  "body": "2 litres, semi-skimmed",
  "tags": ["errands"],
  "createdAt": "2026-11-02T09:30:00Z",
  "updatedAt": "2026-11-02T09:30:00Z"
}
```

## List notes

`GET /notes?limit=2`

Response `200 OK`:

```json
{
  "data": [
    { "id": 9812, "title": "Buy milk", "body": "2 litres", "tags": ["errands"], "createdAt": "2026-11-02T09:30:00Z" },
    { "id": 9811, "title": "Call Sam", "body": "", "tags": [], "createdAt": "2026-11-01T17:05:00Z" }
  ],
  "nextCursor": "eyJpZCI6OTgxMX0=",
  "count": 2
}
```

An empty list returns `200` with `"data": []` (not 404).

## Error codes

| Status | Meaning | When |
|--------|---------|------|
| 400 Bad Request | Invalid input | Missing title, title over 100 chars, malformed JSON |
| 401 Unauthorized | Not authenticated | Missing, expired or invalid token |
| 403 Forbidden | Authenticated but not allowed | Accessing another user's note |
| 404 Not Found | Resource does not exist | Unknown note id |
| 409 Conflict | State conflict | Duplicate tag name |
| 429 Too Many Requests | Rate limit hit | Over 100 requests/minute per user |
| 500 Internal Server Error | Unexpected server fault | Unhandled bug or outage |

Error body (same shape for every error):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required and must be 100 characters or fewer.",
    "status": 400,
    "details": [{ "field": "title", "issue": "required" }]
  }
}
```