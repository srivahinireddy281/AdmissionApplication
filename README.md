# Smart Student Admission Portal 🚀

A modern, full-stack admission management system built with Node.js, Express, MySQL, and real-time features.

## ✨ Features

### 🎯 Core Features
- **Secure Authentication**: Role-based access for students and faculty
- **Real-time Updates**: Live notifications using Socket.io
- **Email Notifications**: Automated welcome and status update emails
- **File Upload**: Support for document uploads (images/PDFs)
- **Advanced Analytics**: Comprehensive dashboard with statistics
- **Caching**: Redis-backed caching for performance
- **API Documentation**: Swagger/OpenAPI documentation

### 🔒 Security Features
- **Rate Limiting**: Protection against brute force attacks
- **Helmet Security**: Security headers and XSS protection
- **Input Validation**: Comprehensive validation using express-validator
- **Session Management**: Secure session handling
- **CORS Protection**: Configurable cross-origin policies

### 📊 Analytics & Monitoring
- **Real-time Dashboard**: Live statistics and metrics
- **Performance Monitoring**: System health checks
- **Application Timeline**: Historical data visualization
- **Department Analytics**: Department-wise statistics
- **Automated Reports**: Weekly analytics emails

### 🎨 Frontend Features
- **Interactive UI**: Modern, responsive design with animations
- **Typing Effects**: Dynamic text animations
- **Particle Background**: Subtle animated background effects
- **Smooth Scrolling**: Enhanced navigation experience
- **Mobile Responsive**: Optimized for all devices

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database
- **Socket.io** - Real-time communication
- **Redis** - Caching (optional)
- **bcrypt** - Password hashing
- **JWT** - Session management

### Frontend
- **HTML5/CSS3** - Modern markup and styling
- **JavaScript (ES6+)** - Interactive functionality
- **Responsive Design** - Mobile-first approach

### DevOps & Tools
- **Nodemon** - Development server
- **Morgan** - HTTP request logging
- **Swagger** - API documentation
- **Cron Jobs** - Scheduled tasks

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- MySQL Server
- Redis (optional, falls back to memory cache)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AdmissionApplication
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   # Run the SQL script to create database and tables
   mysql -u root -p < database/admission.sql
   ```

5. **Start the server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5000
   - API Docs: http://localhost:5000/api-docs
   - Health Check: http://localhost:5000/health

## 📁 Project Structure

```
AdmissionApplication/
├── backend/
│   ├── config/
│   │   └── db.js                 # Database configuration
│   ├── routes/
│   │   ├── admissionRoutes.js    # Main API routes
│   │   └── analyticsRoutes.js    # Analytics endpoints
│   ├── services/
│   │   ├── cacheService.js       # Caching layer
│   │   └── notificationService.js # Email notifications
│   └── server.js                 # Main server file
├── database/
│   └── admission.sql             # Database schema
├── frontend/
│   ├── css/
│   │   └── style.css             # Stylesheets
│   ├── javascript/
│   │   ├── interactive.js        # Frontend interactions
│   │   └── script.js             # Form handlers
│   ├── index.html                # Landing page
│   ├── login.html                # Login page
│   ├── dashboard.html            # Faculty dashboard
│   ├── student-dashboard.html    # Student dashboard
│   └── *.html                    # Other pages
├── uploads/                      # File uploads directory
├── .env.example                  # Environment template
└── package.json                  # Dependencies
```

## 🔧 Configuration

### Environment Variables (.env)

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=admission_db

# Session
SESSION_SECRET=your-secret-key

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

## 📡 API Endpoints

### Authentication
- `POST /student/register` - Student registration
- `POST /student/login` - Student login
- `POST /faculty/register` - Faculty registration
- `POST /faculty/login` - Faculty login
- `POST /logout` - Logout

### Student Operations
- `GET /student/status` - Get application status
- `GET /courses` - Get available courses
- `GET /departments` - Get departments

### Faculty Operations
- `GET /students` - Get all student applications
- `PUT /students/:id` - Update student status

### Analytics
- `GET /api/analytics/stats` - System statistics
- `GET /api/analytics/dashboard` - Dashboard data
- `GET /api/analytics/applications/timeline` - Application timeline
- `GET /api/analytics/departments` - Department statistics
- `GET /api/analytics/performance` - Performance metrics

### Utilities
- `POST /upload` - File upload
- `GET /health` - Health check

## 🔐 Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Auth Rate Limiting**: 5 login attempts per 15 minutes
- **Input Sanitization**: All inputs validated and sanitized
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Helmet security headers
- **CSRF Protection**: Session-based authentication
- **File Upload Security**: Type and size restrictions

## 📊 Real-time Features

- **Live Notifications**: Instant updates for status changes
- **Dashboard Updates**: Real-time statistics
- **Application Alerts**: New application notifications
- **Status Updates**: Live status change notifications

## 📧 Email Notifications

- **Welcome Emails**: Sent upon registration
- **Status Updates**: Automatic status change notifications
- **Reminders**: Weekly pending application reminders
- **Reports**: Weekly analytics reports

## 📈 Performance Features

- **Caching**: Redis/memory cache for frequently accessed data
- **Compression**: Gzip compression for responses
- **Database Indexing**: Optimized queries
- **Connection Pooling**: Efficient database connections

## 🧪 Testing

```bash
# Run tests (if implemented)
npm test

# Development mode with auto-restart
npm run dev

# Production build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support, email support@university.edu or create an issue in the repository.

## 🎯 Future Enhancements

- [ ] Mobile app development
- [ ] Advanced reporting system
- [ ] Integration with learning management systems
- [ ] Multi-language support
- [ ] Advanced AI-powered recommendations
- [ ] Blockchain-based certificate verification

---

Built with ❤️ for modern education management
