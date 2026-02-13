# API Documentation

Base URL: `/api`

## Authentication

### `POST /auth/login`

Request:

```json
{
  "username": "EMS",
  "password": "7408574"
}
```

Response:

```json
{
  "success": true,
  "sessionToken": "...",
  "admin": {
    "id": 1,
    "username": "EMS"
  }
}
```

### `POST /auth/logout`

Response:

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Members

### `GET /members`

Response:

```json
{
  "success": true,
  "data": []
}
```

### `POST /members`

Creates a member.

### `PUT /members/:id`

Updates member by ID.

### `DELETE /members/:id`

Deletes member by ID.

## Admin

### `GET /admin`

Returns current admin public info.

### `PUT /admin`

Updates admin credentials.

Request:

```json
{
  "username": "new-admin",
  "password": "new-password"
}
```

## Data

### `GET /data/export`

Exports all data.

### `GET /data/export/members`

Exports members only.

### `POST /data/import`

Imports members payload:

```json
{
  "members": []
}
```

## Error Format

```json
{
  "success": false,
  "message": "Error details"
}
```
