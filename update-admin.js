require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function updateAdmin() {
  console.log('🔧 Admin Account Update Tool');
  console.log('============================\n');

  try {
    const email = await question('Enter admin email: ');
    const password = await question('Enter admin password: ');

    if (!email || !password) {
      console.log('❌ Email and password are required');
      process.exit(1);
    }

    console.log('\n🔄 Updating admin account...');

    // Hash the password
    const hash = await bcrypt.hash(password, 12);

    // Check if user exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      // Update existing user
      const { error } = await supabase
        .from('users')
        .update({ password_hash: hash })
        .eq('email', email);

      if (error) {
        console.error('❌ Update error:', error.message);
        process.exit(1);
      }
      console.log('✅ Admin account updated successfully!');
    } else {
      // Create new user
      const { error } = await supabase
        .from('users')
        .insert({ 
          email: email, 
          password_hash: hash, 
          role: 'admin' 
        });

      if (error) {
        console.error('❌ Creation error:', error.message);
        process.exit(1);
      }
      console.log('✅ Admin account created successfully!');
    }

    console.log('\n🎉 You can now log in with:');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    rl.close();
    process.exit(0);
  }
}

updateAdmin();