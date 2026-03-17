// Simple test endpoint for Vercel
module.exports = (req, res) => {
    res.json({
        message: 'SDMS API is working on Vercel!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        supabaseConfigured: !!process.env.SUPABASE_URL
    });
};