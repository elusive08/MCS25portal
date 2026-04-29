const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Store io in app to access it in routes
app.set('socketio', io);

// Request Logger
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Import Routes
const authRoutes = require('./routes/auth');
const newsRoutes = require('./routes/news');
const resourceRoutes = require('./routes/resources');
const votingRoutes = require('./routes/voting');

// Middleware
const allowedOrigins = [
    'https://mcs29.onrender.com',
    'https://mcs-25.vercel.app',
    'http://localhost:5000',
    'http://localhost:3000',
    'http://127.0.0.1:5000'
];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        
        const isAllowed = allowedOrigins.includes(origin) || 
                         (origin.endsWith('.vercel.app') && origin.includes('mcs-25')) ||
                         (origin.endsWith('.onrender.com') && origin.includes('mcs29'));
        
        if (!isAllowed) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
const publicPath = path.resolve(__dirname, 'public');
const uploadsPath = path.resolve(__dirname, 'uploads');

if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}

app.use(express.static(publicPath));
app.use('/uploads', express.static(uploadsPath));

// Basic Routes for HTML pages
app.get('/', (req, res) => res.sendFile(path.join(publicPath, 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(publicPath, 'login.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(publicPath, 'signup.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(publicPath, 'dashboard.html')));
app.get('/rep-dashboard', (req, res) => res.sendFile(path.join(publicPath, 'rep-dashboard.html')));
app.get('/vote', (req, res) => res.sendFile(path.join(publicPath, 'vote.html')));
app.get('/results', (req, res) => res.sendFile(path.join(publicPath, 'results.html')));
app.get('/admin-voting', (req, res) => res.sendFile(path.join(publicPath, 'admin-voting.html')));

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/voting', votingRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ error: err.message || 'Internal Server Error' });
});

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

// Socket.io connection
io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
