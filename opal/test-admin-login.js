/**
 * Test script to verify admin login functionality
 */
const bcrypt = require('bcrypt');
const db = require('./src/config/database');
const logger = require('./src/logger');
const authService = require('./src/services/authService');

async function testAdminLogin() {
  console.log('=== ADMIN LOGIN TEST ===');
  try {
    // 1. Check if admin user exists in the database
    console.log('Checking for admin user in database...');
    const adminUser = await db('users')
      .select(['id', 'username', 'email', 'password_hash', 'role'])
      .where({ username: 'admin' })
      .first();
    
    if (!adminUser) {
      console.log('Admin user not found in database!');
      return;
    }
    
    console.log(`Found admin user: ${adminUser.username}, role: ${adminUser.role}, id: ${adminUser.id}`);
    
    // 2. Attempt login with plaintext password (admin/password)
    console.log('\nTesting login with admin/password...');
    try {
      const result = await authService.login('admin', 'password');
      console.log('Login successful!', result.user);
      console.log('Access token:', result.accessToken.substring(0, 20) + '...');
    } catch (loginError) {
      console.error('Login failed:', loginError.message);
      
      // 3. Test password hash directly
      console.log('\nTesting password hash directly...');
      const passwordMatch = await bcrypt.compare('password', adminUser.password_hash);
      console.log('Password match result:', passwordMatch);
      
      if (!passwordMatch) {
        // If password doesn't match, reset the admin password
        console.log('\nResetting admin password to "password"...');
        const newPasswordHash = await bcrypt.hash('password', 10);
        
        // Update the admin user password
        await db('users')
          .where({ id: adminUser.id })
          .update({ 
            password_hash: newPasswordHash,
            updated_at: new Date().toISOString()
          });
        
        console.log('Admin password reset complete. Please try logging in again.');
      }
    }
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Close database connection
    db.destroy();
  }
}

// Run the test
testAdminLogin();
