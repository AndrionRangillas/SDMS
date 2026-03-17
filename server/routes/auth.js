const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// POST /api/auth/login - Master Key Authentication
router.post('/login', async (req, res) => {
    const { masterKey } = req.body;
    
    if (!masterKey) {
        return res.status(400).json({ error: 'Master key is required' });
    }

    try {
        // Check if the provided master key matches the environment variable
        if (masterKey !== process.env.MASTER_KEY) {
            return res.status(401).json({ error: 'Invalid master key' });
        }

        // Generate JWT token for authenticated session
        const token = jwt.sign(
            { 
                id: 'admin', 
                email: 'admin@sdms.edu', 
                role: 'admin',
                authenticated: true 
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            token,
            user: { 
                id: 'admin', 
                email: 'admin@sdms.edu', 
                role: 'admin' 
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;