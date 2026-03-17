# Master Key Authentication Setup

## Vercel Environment Variable Setup

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add a new environment variable:
   - **Name**: `MASTER_KEY`
   - **Value**: `[Your secure master key]`
   - **Environment**: Production (and Preview if needed)

## How to Login

1. Go to your website's login page
2. Enter your master key
3. Click "Sign In"

## Security Notes

- Keep this master key secure and private
- Only share it with authorized administrators
- Consider regenerating it periodically for better security
- The key is stored in your environment variables, not in your database

## Local Development

Add the master key to your `.env` file:
```
MASTER_KEY=your_secure_master_key_here
```

## Regenerating the Master Key

If you need to generate a new master key, run:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then update both your `.env` file and Vercel environment variables.