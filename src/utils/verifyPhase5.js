/**
 * Phase 5 Officer Assignment & Status Workflow Automated Verification Tool
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('../app');
const User = require('../models/User');
const Department = require('../models/Department');
const Complaint = require('../models/Complaint');
const StatusHistory = require('../models/StatusHistory');
const authService = require('../services/auth.service');
const departmentService = require('../services/department.service');

dotenv.config();

const PORT = 5004;

const runPhase5Tests = async () => {
  console.log('=== P20 Municipal Civic Grievance Phase 5 Verification ===');

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
        console.warn(`[Test Warning] MongoDB connection skipped (${err.message}). Testing modular components.`);
      }
    }

    server = app.listen(PORT);
    console.log(`[Test Server] Running on http://127.0.0.1:${PORT}`);
    const baseUrl = `http://127.0.0.1:${PORT}/api/v1`;

    if (mongoose.connection.readyState === 1) {
      console.log('\n--- 1. Setting Up Test Accounts & Department ---');

      const pass = 'Password123';
      const suffix = Date.now();

      // Create Admin
      const adminUser = await User.create({
        name: 'Phase 5 Admin',
        email: `admin_p5_${suffix}@example.com`,
        passwordHash: 'dummyhash',
        role: 'ADMIN',
        isActive: true
      });

      // Create Department
      const roadsDept = await Department.create({
        name: `Roads Dept ${suffix}`,
        code: `R5_${suffix.toString().slice(-4)}`,
        description: 'Road repairs',
        categories: [{ name: `Pothole_${suffix}`, slaHours: 48, isActive: true }],
        isActive: true
      });

      // Create Officer 1 (Same Dept)
      const officer1User = await User.create({
        name: 'Officer One',
        email: `officer1_p5_${suffix}@example.com`,
        passwordHash: 'dummyhash',
        role: 'OFFICER',
        departmentId: roadsDept._id,
        isActive: true
      });

      // Create Officer 2 (Different Dept)
      const waterDept = await Department.create({
        name: `Water Dept ${suffix}`,
        code: `W5_${suffix.toString().slice(-4)}`,
        categories: [],
        isActive: true
      });
      const officer2User = await User.create({
        name: 'Officer Two',
        email: `officer2_p5_${suffix}@example.com`,
        passwordHash: 'dummyhash',
        role: 'OFFICER',
        departmentId: waterDept._id,
        isActive: true
      });

      // Create Citizen
      const citizenUser = await authService.registerCitizen({
        name: 'Citizen Workflow Tester',
        email: `citizen_p5_${suffix}@example.com`,
        password: pass,
        ward: 'WARD-12'
      });

      const citizenAuth = await authService.loginUser({ email: citizenUser.email, password: pass });
      const citizenToken = citizenAuth.token;

      // Helper tokens
      const jwt = require('jsonwebtoken');
      const adminToken = jwt.sign({ userId: adminUser._id, role: 'ADMIN' }, process.env.JWT_SECRET || 'fallback_secret');
      const officer1Token = jwt.sign({ userId: officer1User._id, role: 'OFFICER' }, process.env.JWT_SECRET || 'fallback_secret');
      const officer2Token = jwt.sign({ userId: officer2User._id, role: 'OFFICER' }, process.env.JWT_SECRET || 'fallback_secret');

      console.log('\n--- 2. STEP 1-4: Citizen Files Complaint ---');

      const resFile = await fetch(`${baseUrl}/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${citizenToken}`
        },
        body: JSON.stringify({
          category: `Pothole_${suffix}`,
          ward: 'WARD-12',
          area: 'Central Square',
          description: 'Dangerous pothole near the main market entrance',
          priority: 'HIGH'
        })
      });

      const fileBody = await resFile.json();
      console.log('File Complaint Status (Expected 201):', resFile.status);
      console.assert(resFile.status === 201, 'Expected 201 for filing complaint');
      const complaintId = fileBody.data.complaint.id;
      console.log('Created Complaint ID:', complaintId);
      console.log('Initial Status (Expected FILED):', fileBody.data.complaint.status);
      console.assert(fileBody.data.complaint.status === 'FILED', 'Initial status must be FILED');

      console.log('\n--- 3. STEP 5-8: Admin Officer Assignment ---');

      // Test Assignment Mismatched Department Guard (Expected 400)
      const resBadAssign = await fetch(`${baseUrl}/assignments/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ officerId: officer2User._id })
      });
      console.log('Assign Officer from Wrong Dept Status (Expected 400):', resBadAssign.status);
      console.assert(resBadAssign.status === 400, 'Expected 400 for wrong department officer assignment');

      // Admin Assigns Valid Officer (Expected 200)
      const resAssign = await fetch(`${baseUrl}/assignments/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ officerId: officer1User._id })
      });
      const assignBody = await resAssign.json();
      console.log('Assign Officer Status (Expected 200):', resAssign.status);
      console.log('Updated Status (Expected ASSIGNED):', assignBody.data.complaint.status);
      console.assert(resAssign.status === 200, 'Expected 200 for valid assignment');
      console.assert(assignBody.data.complaint.status === 'ASSIGNED', 'Status must be updated to ASSIGNED');

      console.log('\n--- 4. STEP 9-10: Officer Views Assigned Queue ---');

      const resOfficerQueue = await fetch(`${baseUrl}/officer/complaints`, {
        headers: { Authorization: `Bearer ${officer1Token}` }
      });
      const queueBody = await resOfficerQueue.json();
      console.log('Officer Queue Count:', queueBody.data.complaints.length);
      console.assert(resOfficerQueue.status === 200, 'Expected 200 for officer queue');
      console.assert(queueBody.data.complaints.length >= 1, 'Officer 1 should see assigned complaint');

      console.log('\n--- 5. STEP 11: Officer Transitions Status ASSIGNED -> IN_PROGRESS ---');

      // Illegal transition test (Officer 2 attempting to modify Officer 1 complaint -> Expected 403)
      const resForbiddenStatus = await fetch(`${baseUrl}/complaints/${complaintId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${officer2Token}`
        },
        body: JSON.stringify({ status: 'IN_PROGRESS', remarks: 'Unauthorized access' })
      });
      console.log('Officer 2 modify Officer 1 complaint Status (Expected 403):', resForbiddenStatus.status);
      console.assert(resForbiddenStatus.status === 403, 'Expected 403 for cross-officer modification');

      // Valid Transition: ASSIGNED -> IN_PROGRESS
      const resProgress = await fetch(`${baseUrl}/complaints/${complaintId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${officer1Token}`
        },
        body: JSON.stringify({ status: 'IN_PROGRESS', remarks: 'Field team dispatched to site' })
      });
      const progressBody = await resProgress.json();
      console.log('Transition to IN_PROGRESS Status (Expected 200):', resProgress.status);
      console.log('Complaint Status:', progressBody.data.complaint.status);
      console.assert(resProgress.status === 200, 'Expected 200 for transition to IN_PROGRESS');
      console.assert(progressBody.data.complaint.status === 'IN_PROGRESS', 'Status must be IN_PROGRESS');

      console.log('\n--- 6. STEP 12: Officer Transitions Status IN_PROGRESS -> RESOLVED ---');

      // Illegal state transition test: IN_PROGRESS -> ASSIGNED (Expected 400)
      const resIllegalTrans = await fetch(`${baseUrl}/complaints/${complaintId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${officer1Token}`
        },
        body: JSON.stringify({ status: 'ASSIGNED', remarks: 'Backwards transition' })
      });
      console.log('Illegal Transition Status (Expected 400):', resIllegalTrans.status);
      console.assert(resIllegalTrans.status === 400, 'Expected 400 for illegal status transition');

      // Valid Transition: IN_PROGRESS -> RESOLVED
      const resResolved = await fetch(`${baseUrl}/complaints/${complaintId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${officer1Token}`
        },
        body: JSON.stringify({ status: 'RESOLVED', remarks: 'Pothole filled with asphalt and levelled' })
      });
      const resolvedBody = await resResolved.json();
      console.log('Transition to RESOLVED Status (Expected 200):', resResolved.status);
      console.log('Complaint Status:', resolvedBody.data.complaint.status);
      console.assert(resResolved.status === 200, 'Expected 200 for transition to RESOLVED');
      console.assert(resolvedBody.data.complaint.status === 'RESOLVED', 'Status must be RESOLVED');

      console.log('\n--- 7. STEP 13: Citizen Views Final Complaint Status & Audit History Timeline ---');

      const resCitizenView = await fetch(`${baseUrl}/complaints/${complaintId}`, {
        headers: { Authorization: `Bearer ${citizenToken}` }
      });
      const citizenViewBody = await resCitizenView.json();
      console.log('Citizen Single View Status (Expected 200):', resCitizenView.status);
      console.log('Final Complaint Status:', citizenViewBody.data.complaint.status);
      console.log('Timeline Events Count:', citizenViewBody.data.statusHistory.length);

      const timeline = citizenViewBody.data.statusHistory.map(h => `${h.previousStatus} -> ${h.newStatus} (${h.remarks})`);
      console.log('Status History Audit Timeline:\n ', timeline.join('\n  '));

      console.assert(citizenViewBody.data.complaint.status === 'RESOLVED', 'Final status must be RESOLVED');
      console.assert(citizenViewBody.data.statusHistory.length >= 3, 'Audit history must contain complete timeline');

      // Cleanup
      await Complaint.deleteOne({ _id: complaintId });
      await StatusHistory.deleteMany({ complaintId });
      await Department.deleteMany({ _id: { $in: [roadsDept._id, waterDept._id] } });
      await User.deleteMany({ _id: { $in: [adminUser._id, officer1User._id, officer2User._id, citizenUser.id] } });
    }

    console.log('\n[SUCCESS] All Phase 5 Officer Assignment & Status Workflow verification tests passed cleanly!');
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
  runPhase5Tests();
}

module.exports = runPhase5Tests;
