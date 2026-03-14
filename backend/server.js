require('dotenv').config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require("express-session");
const path = require("path");
const { createServer } = require("http");
const { Server } = require("socket.io");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const multer = require("multer");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const admissionRoutes = require("./routes/admissionRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const notificationService = require("./services/notificationService");
const cacheService = require("./services/cacheService");

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5000",
        methods: ["GET", "POST"]
    }
});

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 auth attempts per windowMs
    message: "Too many authentication attempts, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);
app.use("/student/login", authLimiter);
app.use("/faculty/login", authLimiter);

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5000",
    credentials: true
}));

// Body parsing middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-super-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// File upload configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only images and PDF files are allowed!'), false);
        }
    }
});

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger documentation
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Smart Student Admission Portal API',
            version: '1.0.0',
            description: 'API documentation for the admission management system',
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 5000}`,
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                sessionAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'connect.sid'
                }
            }
        },
        security: [{
            sessionAuth: []
        }]
    },
    apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use("/", admissionRoutes);
app.use("/api/analytics", analyticsRoutes);

// File upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({
        message: 'File uploaded successfully',
        filename: req.file.filename,
        path: `/uploads/${req.file.filename}`
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);

    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
        }
    }

    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Scheduled tasks
cron.schedule('0 9 * * *', () => {
    // Daily reminder for pending applications
    console.log('Running daily reminder task...');
    notificationService.sendPendingApplicationReminders();
});

cron.schedule('0 0 * * 1', () => {
    // Weekly analytics report
    console.log('Generating weekly analytics report...');
    notificationService.sendWeeklyAnalyticsReport();
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});

const DEFAULT_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

function startServer(port) {
    server.listen(port, () => {
        console.log(`🚀 Server running on port ${port}`);
        console.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
        console.log(`🌐 Frontend: http://localhost:${port}`);
        console.log(`💾 Health Check: http://localhost:${port}/health`);

        // Socket.io real-time features
        io.on('connection', (socket) => {
            console.log('User connected:', socket.id);

            socket.on('join-dashboard', (userId) => {
                socket.join(`dashboard-${userId}`);
            });

            socket.on('application-update', (data) => {
                // Broadcast to faculty dashboards
                io.to('faculty-room').emit('new-application', data);
            });

            socket.on('status-change', (data) => {
                // Notify specific student
                io.to(`dashboard-${data.studentId}`).emit('status-updated', data);
            });

            socket.on('disconnect', () => {
                console.log('User disconnected:', socket.id);
            });
        });

        // Auto-open browser in development
        if (process.env.NODE_ENV !== 'production') {
            const { exec } = require('child_process');
            exec(`start http://localhost:${port}`);
        }
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is already in use. Trying port ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Server failed to start:', err);
            process.exit(1);
        }
    });
}

startServer(DEFAULT_PORT);

module.exports = { app, server, io };