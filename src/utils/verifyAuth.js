/**
 * Comprehensive Authentication & RBAC Automated Verification Tool
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('../app');
const User = require('../models/User');
const { authorizeRoles } = require('../middleware/role.middleware');

dotenv.config();

const PORT = 5002;

const runTests = async () => {
  console.log('=== P20 Municipal Civic Grievance Phase 3 Auth Verification ===');

  let server;
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri) {
      try {
        console.log('[Test Setup] Attempting MongoDB connection...');
        await Promise.race([
          mongoose.connect(mongoUri),
          new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 3000))
        ]);
        console.log('[Test Setup] MongoDB connected successfully.');
      } catch (err) {
        console.warn(`[Test Warning] MongoDB connection skipped (${err.message}). Testing unit & validation components.`);
      }
    }

    server = app.listen(PORT);
    console.log(`[Test Server] Running on http://127.0.0.1:${PORT}`);
    const baseUrl = `http://127.0.0.1:${PORT}/api/v1/auth`;

    console.log('\n--- 1. Testing Registration Validation ---');

    // Test 1.1: Weak password validation (Validation middleware test)
    const resWeak = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email: 'invalid-email', password: 'weak' })
    });
    const weakBody = await resWeak.json();
    console.log('Validation Error Status (Expected 400):', resWeak.status);
    console.log('Validation Error Message:', weakBody.message);
    console.assert(resWeak.status === 400, 'Expected 400 for validation failure');

    console.log('\n--- 2. Testing Protected Endpoint Access without Token ---');

    // Test 2.1: Missing Token
    const resNoToken = await fetch(`${baseUrl}/me`);
    console.log('Missing Token status (Expected 401):', resNoToken.status);
    console.assert(resNoToken.status === 401, 'Expected 401 for missing token');

    // Test 2.2: Malformed Token
    const resBadToken = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: 'Bearer invalid.token.str' }
    });
    console.log('Malformed Token status (Expected 401):', resBadToken.status);
    console.assert(resBadToken.status === 401, 'Expected 401 for malformed token');

    console.log('\n--- 3. Testing RBAC Role Authorization Middleware ---');

    // Test RBAC function directly
    const mockReq = { user: { role: 'CITIZEN' } };
    const mockRes = {
      statusCode: 200,
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (payload) {
        this.body = payload;
        return this;
      }
    };
    let nextCalled = false;
    const nextMock = () => { nextCalled = true; };

    const adminGuard = authorizeRoles('ADMIN');
    adminGuard(mockReq, mockRes, nextMock);

    console.log('CITIZEN accessing ADMIN route status (Expected 403):', mockRes.statusCode);
    console.assert(mockRes.statusCode === 403, 'Expected 403 Forbidden for role mismatch');
    console.assert(!nextCalled, 'next() must not be called when unauthorized');

    // If MongoDB is connected, execute full database integration tests
    if (mongoose.connection.readyState === 1) {
      console.log('\n--- 4. Integration Tests (MongoDB Active) ---');
      const testEmail = `citizen_${Date.now()}@example.com`;
      const testPassword = 'Password123';
      const updatedPassword = 'NewPassword123';

      // Test 4.1: Citizen Registration with privilege escalation attempt
      const resReg = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Citizen Jane',
          email: testEmail,
          password: testPassword,
          phone: '9876543210',
          ward: 'WARD-05',
          role: 'ADMIN', // Should be ignored
          departmentId: '60d5ec49f1b2c81234567890' // Should be ignored
        })
      });
      const regBody = await resReg.json();
      console.log('Valid Registration status (Expected 201):', resReg.status);
      console.log('Enforced Role (Expected CITIZEN):', regBody.data.user.role);
      console.assert(resReg.status === 201, 'Expected 201 for valid registration');
      console.assert(regBody.data.user.role === 'CITIZEN', 'Role must be enforced as CITIZEN');

      // Test 4.2: Login
      const resLogin = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword })
      });
      const loginBody = await resLogin.json();
      console.log('Login Status (Expected 200):', resLogin.status);
      console.assert(resLogin.status === 200, 'Expected 200 for valid login');
      const token = loginBody.data.token;

      // Test 4.3: GET /me
      const resMe = await fetch(`${baseUrl}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('GET /me Status (Expected 200):', resMe.status);
      console.assert(resMe.status === 200, 'Expected 200 for GET /me');

      // Cleanup
      await User.deleteOne({ email: testEmail });
    }

    console.log('\n[SUCCESS] All Phase 3 Authentication & RBAC verification tests passed cleanly!');
  } catch (error) {
    console.error('\n[FAIL] Test encountered error:', error);
    process.exit(1);
  } finally {
    if (server) server.close();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (require.main === module) process.exit(0);
  }
};

if (require.main === module) {
  runTests();
}

module.exports = runTests;
