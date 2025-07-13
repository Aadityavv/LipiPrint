# LipiPrint Backend

This is the backend for the LipiPrint project, built with Spring Boot and PostgreSQL.

## Features
- JWT authentication (user, admin, delivery roles)
- File upload/download
- Print jobs
- Orders
- Notifications
- Help center (articles, support tickets)
- Settings
- Analytics
- Admin & delivery endpoints

## Requirements
- Java 17+
- Maven
- PostgreSQL

## Setup
1. Clone the repository.
2. Configure your PostgreSQL database in `src/main/resources/application.properties`.
3. Build the project:
   ```sh
   mvn clean install
   ```
4. Run the application:
   ```sh
   mvn spring-boot:run
   ```

## Database
- The application will auto-create tables on startup if configured.
- Example configuration will be provided in `application.properties`.

### Manual Migration for GSTIN/Professional Support
If you are upgrading from a previous version, run the following SQL to add GSTIN and user type support:

```sql
ALTER TABLE users ADD COLUMN gstin VARCHAR(20);
ALTER TABLE users ADD COLUMN user_type VARCHAR(20);
```

## API Endpoints

### Authentication

- **POST /api/auth/signin**
  - Request: `{ "phone": "9876543210", "password": "yourpassword" }`
  - Response: `{ "token": "<JWT>", "type": "Bearer", "user": { ... } }`

- **POST /api/auth/signup**
  - Request: `{ "name": "John Doe", "phone": "9876543210", "email": "john@example.com", "password": "yourpassword" }`
  - Response: `{ "message": "User registered successfully!" }`

- **POST /api/auth/send-otp**
  - Request: `{ "phone": "9876543210" }`
  - Response: `{ "message": "OTP sent successfully!" }`

- **POST /api/auth/verify-otp**
  - Request: `{ "phone": "9876543210", "otp": "9999" }`
  - Response: `{ "token": "<JWT>", "type": "Bearer", "user": { ... } }`

---

### User

- **GET /api/user/profile**
  - Headers: `Authorization: Bearer <JWT>`
  - Response: `{ "id": 1, "name": "John Doe", "phone": "9876543210", ... }`

- **PUT /api/user/profile**
  - Headers: `Authorization: Bearer <JWT>`
  - Request: `{ "name": "John Doe", "email": "john@example.com" }`
  - Response: `{ "id": 1, "name": "John Doe", ... }`

- **GET /api/user/list** (admin only)
  - Headers: `Authorization: Bearer <JWT>`
  - Response: `[ { "id": 1, "name": "John Doe", ... }, ... ]`

- **POST /api/user/block/{id}?blocked=true** (admin only)
  - Headers: `Authorization: Bearer <JWT>`
  - Response: `{ "message": "User block status updated." }`

- **POST /api/user/role/{id}?role=ADMIN** (admin only)
  - Headers: `Authorization: Bearer <JWT>`
  - Response: `{ "message": "User role updated." }`

---

### File

- **POST /api/files/upload**
  - Headers: `Authorization: Bearer <JWT>`, `Content-Type: multipart/form-data`
  - Request: `file=<file>`
  - Response: `{ "id": 1, "filename": "abc.pdf", ... }`

- **GET /api/files**
  - Headers: `Authorization: Bearer <JWT>`
  - Response: `[ { "id": 1, "filename": "abc.pdf", ... }, ... ]`

- **GET /api/files/{id}**
  - Headers: `Authorization: Bearer <JWT>`
  - Response: File download

- **DELETE /api/files/{id}**
  - Headers: `Authorization: Bearer <JWT>`
  - Response: `204 No Content`

---

### Order

- **POST /api/orders**
  - Headers: `Authorization: Bearer <JWT>`
  - Request: `{ "deliveryType": "HOME", "deliveryAddress": "123 Main St", ... }`
  - Response: `{ "id": 1, "status": "PENDING", ... }`

- **GET /api/orders**
  - Headers: `Authorization: Bearer <JWT>`
  - Response: `[ { "id": 1, ... }, ... ]`

- **GET /api/orders/{id}**
  - Headers: `Authorization: Bearer <JWT>`
  - Response: `{ "id": 1, ... }`

- **PUT /api/orders/{id}/status?status=COMPLETED**
  - Headers: `Authorization: Bearer <JWT>`
  - Response: `{ "id": 1, "status": "COMPLETED", ... }`

---

### Print Job

- **POST /api/print-jobs**
  - Headers: `Authorization: Bearer <JWT>`
  - Request: `{ "fileId": 1, "options": { ... } }`
  - Response: `{ "id": 1, "status": "PENDING", ... }`

- **GET /api/print-jobs**
  - Headers: `Authorization: Bearer <JWT>`
  - Response: `[ { "id": 1, ... }, ... ]`

- **GET /api/print-jobs/{id}**
  - Headers: `Authorization: Bearer <JWT>`
  - Response: `{ "id": 1, ... }`

- **PUT /api/print-jobs/{id}/status?status=COMPLETED**
  - Headers: `Authorization: Bearer <JWT>`
  - Response: `{ "id": 1, "status": "COMPLETED", ... }`

---

### Notification

- **GET /api/notifications**
  - Headers: `Authorization: Bearer <JWT>`
  - Response: `[ { "id": 1, "message": "...", ... }, ... ]`

- **POST /api/notifications/read/{id}**
  - Headers: `Authorization: Bearer <JWT>`
  - Response: `204 No Content`

- **DELETE /api/notifications**
  - Headers: `Authorization: Bearer <JWT>`
  - Response: `204 No Content`

---

### Help Center

- **GET /api/helpcenter/articles**
  - Headers: `Authorization: Bearer <JWT>`
  - Response: `[ { "id": 1, "title": "...", ... }, ... ]`

- **GET /api/helpcenter/tickets**
  - Headers: `Authorization: Bearer <JWT>`
  - Response: `[ { "id": 1, "subject": "...", ... }, ... ]`

- **POST /api/helpcenter/tickets**
  - Headers: `Authorization: Bearer <JWT>`
  - Request: `{ "subject": "Issue", "description": "..." }`
  - Response: `{ "id": 1, "subject": "Issue", ... }`

---

### Settings

- **GET /api/settings**
  - Headers: `Authorization: Bearer <JWT>`
  - Response: `[ { "id": 1, "key": "...", "value": "..." }, ... ]`

- **POST /api/settings**
  - Headers: `Authorization: Bearer <JWT>`
  - Request: `{ "key": "site_name", "value": "LipiPrint" }`
  - Response: `{ "id": 1, "key": "site_name", "value": "LipiPrint" }`

---

## Sample Data

### User Registration
```json
{
  "name": "John Doe",
  "phone": "9876543210",
  "email": "john@example.com",
  "password": "yourpassword"
}
```

### OTP Verification
```json
{
  "phone": "9876543210",
  "otp": "9999"
}
```

### File Upload (multipart/form-data)
- `file`: (binary file)

### Create Order
```json
{
  "deliveryType": "HOME",
  "deliveryAddress": "123 Main St",
  "totalAmount": 100.0
}
```

### Create Print Job
```json
{
  "fileId": 1,
  "options": {
    "color": "black-and-white",
    "copies": 2
  }
}
``` 