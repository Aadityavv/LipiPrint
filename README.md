# LipiPrint App

A modern, full-stack print management platform for users and admins. Built with React Native (frontend) and Java Spring Boot (backend).

---

## 🚀 Project Overview
LipiPrint is a smart, easy, and fast printing solution for users and admins. Users can upload documents, customize print jobs, track orders, and manage their profiles. Admins can manage orders, users, analytics, payments, and more via a beautiful dashboard.

---

## ✨ Features

### User App
- Upload and manage files (PDF, DOC, images, etc.)
- Place print orders with custom options
- Track order status in real-time
- View invoices and payment history
- Manage addresses and profile
- Access help center and support

### Admin Dashboard
- View and manage all orders (status, files, payments)
- Bulk and individual file management
- User management (block/unblock, view details)
- Analytics dashboard (orders, revenue, users, trends)
- Reconciliation for failed payments
- Service and settings management
- Modern UI with quick actions, filters, and activity feed

---

## 🛠️ Tech Stack
- **Frontend:** React Native (Android & iOS), React Navigation, Vector Icons, Animatable, LinearGradient, RNFS, RNPrint
- **Backend:** Java Spring Boot, JPA/Hibernate, PostgreSQL, Firebase Storage
- **Other:** Expo (for dev), REST API, JWT Auth, Google Cloud Service Account

---

## 📁 Folder Structure
```
New folder/
  backend/         # Java Spring Boot backend
    src/main/java/com/lipiprint/backend/...
    src/main/resources/
    pom.xml
  frontend/        # React Native app
    src/
      components/
      screens/
      services/
      navigation/
      theme/
      utils/
    App.tsx
    package.json
```

---

## ⚡ Setup Instructions

### Backend (Spring Boot)
1. `cd backend`
2. Configure your database in `src/main/resources/application.properties`.
3. Place your Firebase `serviceAccountKey.json` in `src/main/resources/`.
4. Run migrations: `psql -U <user> -d <db> -f src/main/resources/setup-database.sql`
5. Start server: `./mvnw spring-boot:run` or use your IDE.

### Frontend (React Native)
1. `cd frontend`
2. Install dependencies: `npm install` or `yarn`
3. For Android: `npx react-native run-android`
4. For iOS: `cd ios && pod install && cd .. && npx react-native run-ios`
5. Configure API endpoints in `src/config/production.js` if needed.

---

## 📱 Usage Guide

### User App
- **Home:** Quick actions for upload, orders, print options, profile.
- **Upload:** Select and upload files from device/cloud.
- **Orders:** View, track, and manage your print orders.
- **Profile:** Edit info, addresses, settings, help center.

### Admin Dashboard
- **Dashboard:** Stats, quick actions, recent activity.
- **Manage Orders:** Filter, update, and view order details. Download/print files, mark as completed/delivered.
- **Users:** Block/unblock, view user details.
- **Analytics:** Visualize trends and key metrics.
- **Reconciliation:** Handle failed payments and unmatched payments.
- **File Manager:** View and delete delivered files.

---

## 🖼️ Screenshots

### User App
| Home | Upload | Orders | Profile |
|------|--------|--------|---------|
| ![Home](screenshots/user_home.png) | ![Upload](screenshots/user_upload.png) | ![Orders](screenshots/user_orders.png) | ![Profile](screenshots/user_profile.png) |

### Admin Dashboard
| Dashboard | Orders | Order Details | Analytics |
|-----------|--------|--------------|-----------|
| ![Dashboard](screenshots/admin_dashboard.png) | ![Orders](screenshots/admin_orders.png) | ![Order Details](screenshots/admin_order_detail.png) | ![Analytics](screenshots/admin_analytics.png) |

> **Note:** Replace the image paths above with your actual screenshots in a `screenshots/` folder at the root.

---

## 🗄️ API & Database Notes
- RESTful API endpoints for all resources (orders, users, files, payments, etc.)
- JWT-based authentication for users and admins
- PostgreSQL schema with foreign key constraints
- File uploads stored in Firebase Storage
- Cascade deletes for orders, print jobs, and payments

---

## 🤝 Contributing
1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push and open a Pull Request

---

## 📄 License
This project is licensed under the MIT License. 