require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { userDB } = require('./config/database'); // DB import for debug route
const authRoutes = require('./routes/authRoutes');
const storeRoutes = require('./routes/storeRoutes'); // 👈 Naya import
const uploadRoutes = require('./routes/uploadRoutes'); // 👈 Naya import

const app = express();

// Middleware
// shopify-backend/index.js mein update karein:


// 🚀 SECURE BYPASS: Standard CORS allows all local/live dynamic domains safely
app.use(cors({
    origin: '*',
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization,X-Requested-With,X-Internal-Token'
}));

app.use(express.json());

// 2. URL encoded ki limit bhi barhao (Safe side ke liye)
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/upload', require('./routes/uploadRoutes'));
// --- API ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/store', storeRoutes); // 👈 Ab ye 5000/api/store/publish par chalay ga

// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Empire Backend Running on http://localhost:${PORT}`);
});