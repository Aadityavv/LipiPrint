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
<div style="display: flex; flex-wrap: wrap; gap: 24px; justify-content: flex-start;">
  <figure style="text-align: center; margin: 0;">
    <img src="screenshots/User_HomeScreen.jpeg" alt="Home" style="max-height: 180px; border-radius: 8px;" />
    <figcaption>Home</figcaption>
  </figure>
  <figure style="text-align: center; margin: 0;">
    <img src="screenshots/User_FilesUploadedinApp.jpeg" alt="Files Uploaded" style="max-height: 320px; border-radius: 8px;" />
    <figcaption>Files Uploaded</figcaption>
  </figure>
  <figure style="text-align: center; margin: 0;">
    <img src="screenshots/User_Orders.jpeg" alt="Orders" style="max-height: 320px; border-radius: 8px;" />
    <figcaption>Orders</figcaption>
  </figure>
  <figure style="text-align: center; margin: 0;">
    <img src="screenshots/User_OrderConfirmation.jpeg" alt="Order Confirmation" style="max-height: 320px; border-radius: 8px;" />
    <figcaption>Order Confirmation</figcaption>
  </figure>
  <figure style="text-align: center; margin: 0;">
    <img src="screenshots/User_AppInvoice.jpeg" alt="Invoice" style="max-height: 320px; border-radius: 8px;" />
    <figcaption>Invoice</figcaption>
  </figure>
  <figure style="text-align: center; margin: 0;">
    <img src="screenshots/User_Payment.jpeg" alt="Payment" style="max-height: 320px; border-radius: 8px;" />
    <figcaption>Payment</figcaption>
  </figure>
  <figure style="text-align: center; margin: 0;">
    <img src="screenshots/User_Razorpay.jpeg" alt="Razorpay" style="max-height: 320px; border-radius: 8px;" />
    <figcaption>Razorpay</figcaption>
  </figure>
  <figure style="text-align: center; margin: 0;">
    <img src="screenshots/User_DeliveryOption.jpeg" alt="Delivery Option" style="max-height: 320px; border-radius: 8px;" />
    <figcaption>Delivery Option</figcaption>
  </figure>
  <figure style="text-align: center; margin: 0;">
    <img src="screenshots/User_PrintOption.jpeg" alt="Print Option" style="max-height: 320px; border-radius: 8px;" />
    <figcaption>Print Option</figcaption>
  </figure>
  <figure style="text-align: center; margin: 0;">
    <img src="screenshots/User_SelectedPrintOption.jpeg" alt="Selected Print Option" style="max-height: 320px; border-radius: 8px;" />
    <figcaption>Selected Print Option</figcaption>
  </figure>
  <figure style="text-align: center; margin: 0;">
    <img src="screenshots/User_TrackOrder.jpeg" alt="Track Order" style="max-height: 320px; border-radius: 8px;" />
    <figcaption>Track Order</figcaption>
  </figure>
  <figure style="text-align: center; margin: 0;">
    <img src="screenshots/User_Tutorial.jpeg" alt="Tutorial" style="max-height: 320px; border-radius: 8px;" />
    <figcaption>Tutorial</figcaption>
  </figure>
  <figure style="text-align: center; margin: 0;">
    <img src="screenshots/User_HelpCenter.jpeg" alt="Help Center" style="max-height: 320px; border-radius: 8px;" />
    <figcaption>Help Center</figcaption>
  </figure>
  <figure style="text-align: center; margin: 0;">
    <img src="screenshots/User_CustomerSupport.jpeg" alt="Customer Support" style="max-height: 320px; border-radius: 8px;" />
    <figcaption>Customer Support</figcaption>
  </figure>
  <figure style="text-align: center; margin: 0;">
    <img src="screenshots/User_Settings.jpeg" alt="Settings" style="max-height: 320px; border-radius: 8px;" />
    <figcaption>Settings</figcaption>
  </figure>
  <figure style="text-align: center; margin: 0;">
    <img src="screenshots/User_PersonalInformation.jpeg" alt="Personal Information" style="max-height: 320px; border-radius: 8px;" />
    <figcaption>Personal Information</figcaption>
  </figure>
  <figure style="text-align: center; margin: 0;">
    <img src="screenshots/User_profile.jpeg" alt="Profile" style="max-height: 320px; border-radius: 8px;" />
    <figcaption>Profile</figcaption>
  </figure>
  <figure style="text-align: center; margin: 0;">
    <img src="screenshots/User_UploadFile.jpeg" alt="Upload File" style="max-height: 320px; border-radius: 8px;" />
    <figcaption>Upload File</figcaption>
  </figure>
</div>

### Admin Dashboard
<div style="display: flex; flex-wrap: wrap; gap: 24px; justify-content: flex-start;">
  <figure style="text-align: center; margin: 0;">
    <img src="screenshots/Admin_HomeScreen.jpeg" alt="Admin Home" style="max-height: 320px; border-radius: 8px;" />
    <figcaption>Home</figcaption>
  </figure>
  <figure style="text-align: center; margin: 0;">
    <img src="screenshots/Admin_ManageOrders.jpeg" alt="Manage Orders" style="max-height: 320px; border-radius: 8px;" />
    <figcaption>Manage Orders</figcaption>
  </figure>
  <figure style="text-align: center; margin: 0;">
    <img src="screenshots/Admin_OrderDetails.jpeg" alt="Order Details" style="max-height: 320px; border-radius: 8px;" />
    <figcaption>Order Details</figcaption>
  </figure>
  <figure style="text-align: center; margin: 0;">
    <img src="screenshots/Admin_Analytics.jpeg" alt="Analytics" style="max-height: 320px; border-radius: 8px;" />
    <figcaption>Analytics</figcaption>
  </figure>
  <figure style="text-align: center; margin: 0;">
    <img src="screenshots/Admin_ManageUsers.jpeg" alt="Manage Users" style="max-height: 320px; border-radius: 8px;" />
    <figcaption>Manage Users</figcaption>
  </figure>
  <figure style="text-align: center; margin: 0;">
    <img src="screenshots/Admin_AvailableServices.jpeg" alt="Available Services" style="max-height: 320px; border-radius: 8px;" />
    <figcaption>Available Services</figcaption>
  </figure>
  <figure style="text-align: center; margin: 0;">
    <img src="screenshots/Admin_Settings.jpeg" alt="Settings" style="max-height: 320px; border-radius: 8px;" />
    <figcaption>Settings</figcaption>
  </figure>
</div>

### Common Screens
<div style="display: flex; flex-wrap: wrap; gap: 24px; justify-content: flex-start;">
  <figure style="text-align: center; margin: 0;">
    <img src="screenshots/Common_SplashScreen.jpeg" alt="Splash" style="max-height: 320px; border-radius: 8px;" />
    <figcaption>Splash</figcaption>
  </figure>
  <figure style="text-align: center; margin: 0;">
    <img src="screenshots/Common_SignIn.jpeg" alt="Sign In" style="max-height: 320px; border-radius: 8px;" />
    <figcaption>Sign In</figcaption>
  </figure>
  <figure style="text-align: center; margin: 0;">
    <img src="screenshots/Common_SignUp.jpeg" alt="Sign Up" style="max-height: 320px; border-radius: 8px;" />
    <figcaption>Sign Up</figcaption>
  </figure>
</div>

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