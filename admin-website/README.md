# LipiPrint Admin Website - React

A modern, responsive admin dashboard built with React for managing LipiPrint orders with real-time tracking and file management capabilities.

## Features

### 🔐 Authentication
- **Phone & Password login** - Uses existing backend authentication APIs
- **JWT token management** - Secure session handling
- **Auto-logout** - Session expires on token invalidation

### 📊 Dashboard
- **Real-time statistics** - Total orders, processing, completed, delivered
- **Order filtering** - Search by order ID, customer name, or phone
- **Status filtering** - Filter orders by status
- **Responsive design** - Works on desktop, tablet, and mobile

### 📋 Order Management
- **Order listing** - All orders with key information at a glance
- **Order details** - Complete order information including customer details
- **Status tracking** - See which admin performed which actions
- **File management** - View, download, and print files for each order

### 🖨️ File Operations
- **View files** - Open files in new tab for preview
- **Download files** - Download files directly to local machine
- **Print tracking** - Mark files as printed with admin tracking
- **Success confirmation** - Visual feedback for all actions

### ⚙️ Admin Tracking
- **Action logging** - Track which admin printed, processed, or completed orders
- **Timestamp tracking** - See when actions were performed
- **Admin identification** - Clear display of admin names for each action

## Setup Instructions

### 1. Prerequisites
- Node.js 16+ and npm
- Backend running on `http://localhost:8080`
- Admin user account in the system

### 2. Installation
```bash
cd admin-website
npm install
```

### 3. Configuration
Create a `.env` file in the root directory:
```env
REACT_APP_API_URL=http://localhost:8080/api
GENERATE_SOURCEMAP=false
```

### 4. Start Development Server
```bash
npm start
```

The application will open at `http://localhost:3000`

### 5. Build for Production
```bash
npm run build
```

## API Integration

The website integrates with your existing backend APIs:

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/user/profile` - Get user profile
- `GET /api/user/can-edit` - Check edit permissions

### Orders
- `GET /api/orders` - List all orders
- `GET /api/orders/{id}` - Get order details
- `PUT /api/orders/{id}/status` - Update order status
- `POST /api/orders/{id}/print` - Mark order as printed

## Project Structure

```
admin-website/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── Login.js
│   │   ├── Login.css
│   │   ├── Dashboard.js
│   │   ├── Dashboard.css
│   │   ├── OrderCard.js
│   │   ├── OrderCard.css
│   │   ├── OrderDetail.js
│   │   └── OrderDetail.css
│   ├── services/
│   │   └── api.js
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── package.json
└── README.md
```

## Components

### Login
- Phone number and password authentication
- Form validation and error handling
- Loading states and user feedback

### Dashboard
- Statistics overview with visual indicators
- Order listing with search and filter capabilities
- Responsive grid layout

### OrderCard
- Order summary with key information
- Admin tracking display
- Click-to-view functionality

### OrderDetail
- Complete order information
- File management with view/download/print actions
- Status update functionality
- Print confirmation modal

## Styling

- **Modern design** - Clean, professional interface
- **Responsive layout** - Mobile-first approach
- **Consistent theming** - Color scheme and typography
- **Smooth animations** - Hover effects and transitions
- **Accessibility** - Keyboard navigation and screen reader support

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Security Features

- **JWT token authentication** - Secure API communication
- **Token refresh** - Automatic session management
- **Input validation** - Client-side form validation
- **Error handling** - Graceful error management
- **CORS support** - Cross-origin request handling

## Development

### Available Scripts
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

### Code Style
- ES6+ JavaScript
- Functional components with hooks
- CSS modules for styling
- Consistent naming conventions

## Deployment

### Build Process
1. Run `npm run build`
2. Deploy the `build` folder to your web server
3. Configure your web server to serve the React app
4. Update API URL in production environment

### Environment Variables
- `REACT_APP_API_URL` - Backend API URL
- `GENERATE_SOURCEMAP` - Source map generation (set to false for production)

## Troubleshooting

### Common Issues
1. **API connection failed** - Check backend URL and CORS settings
2. **Login not working** - Verify admin credentials and backend authentication
3. **Orders not loading** - Check API endpoints and authentication token
4. **Build errors** - Ensure all dependencies are installed

### Debug Mode
Enable console logging by adding:
```javascript
console.log('Debug mode enabled');
```

## License
This project is part of the LipiPrint system and follows the same licensing terms.