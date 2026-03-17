require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/violations', require('./routes/violations'));
app.use('/api/community-service', require('./routes/community-service'));
app.use('/api/good-moral-issuance', require('./routes/good-moral-issuance'));
app.use('/api/certificates', require('./routes/certificates'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/history', require('./routes/history'));
app.use('/api/courses', require('./routes/courses'));

// Catch-all: serve index.html for frontend routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 SDMS-V3 Server running on http://localhost:${PORT}`);
});

module.exports = app;
