const mongoose = require('mongoose');

const autoSeedAccounts = async () => {
  try {
    const User = require('../models/User');
    const Department = require('../models/Department');
    const bcrypt = require('bcryptjs');

    // 1. Seed Departments if missing
    const departmentsData = [
      {
        name: 'Roads & Infrastructure',
        code: 'ROADS',
        description: 'Handles municipal road repairs, potholes, and street infrastructure.',
        categories: [
          { name: 'Pothole Repair', slaHours: 48, isActive: true },
          { name: 'Road Surface Damage', slaHours: 72, isActive: true },
          { name: 'Broken Footpath / Pavement', slaHours: 96, isActive: true }
        ],
        isActive: true
      },
      {
        name: 'Water Supply',
        code: 'WATER',
        description: 'Manages municipal drinking water distribution, pipe leaks, and supply schedules.',
        categories: [
          { name: 'Water Leakage', slaHours: 24, isActive: true },
          { name: 'Pipeline Leakage', slaHours: 24, isActive: true },
          { name: 'No Water Supply', slaHours: 24, isActive: true },
          { name: 'Contaminated Water', slaHours: 36, isActive: true }
        ],
        isActive: true
      },
      {
        name: 'Waste Management',
        code: 'WASTE',
        description: 'Oversees garbage collection, waste disposal, and municipal bin maintenance.',
        categories: [
          { name: 'Uncollected Garbage', slaHours: 24, isActive: true },
          { name: 'Overflowing Community Bin', slaHours: 24, isActive: true },
          { name: 'Illegal Dumping', slaHours: 48, isActive: true }
        ],
        isActive: true
      },
      {
        name: 'Sanitation & Sewage',
        code: 'SANITATION',
        description: 'Manages public sanitation, storm drains, and sewage line clearings.',
        categories: [
          { name: 'Drainage Overflow / Blockage', slaHours: 24, isActive: true },
          { name: 'Open Manhole', slaHours: 12, isActive: true },
          { name: 'Public Toilet Maintenance', slaHours: 48, isActive: true }
        ],
        isActive: true
      },
      {
        name: 'Electrical & Street Lighting',
        code: 'ELECTRICAL',
        description: 'Maintains streetlights, electrical poles, and municipal lighting grids.',
        categories: [
          { name: 'Streetlight Not Working', slaHours: 36, isActive: true },
          { name: 'Damaged Electrical Pole', slaHours: 24, isActive: true },
          { name: 'Hanging Live Wire', slaHours: 6, isActive: true }
        ],
        isActive: true
      }
    ];

    let roadsDept = null;
    for (const d of departmentsData) {
      let dept = await Department.findOne({ code: d.code });
      if (!dept) {
        dept = await Department.create(d);
        console.log(`[Seed] Created department: ${d.name} (${d.code})`);
      }
      if (d.code === 'ROADS') roadsDept = dept;
    }

    const saltRounds = 10;

    // 2. Seed Test Citizen
    if (!(await User.findOne({ email: 'citizen@example.com' }))) {
      await User.create({
        name: 'John Citizen',
        email: 'citizen@example.com',
        passwordHash: await bcrypt.hash('Citizen123!', saltRounds),
        phone: '9876543210',
        role: 'CITIZEN',
        ward: 'WARD-1',
        isActive: true
      });
      console.log('[Seed] Auto-seeded CITIZEN account: citizen@example.com / Citizen123!');
    }

    // 3. Seed Test Officer
    if (!(await User.findOne({ email: 'officer@example.com' }))) {
      await User.create({
        name: 'Jane Officer',
        email: 'officer@example.com',
        passwordHash: await bcrypt.hash('Officer123!', saltRounds),
        phone: '8888888888',
        role: 'OFFICER',
        departmentId: roadsDept._id,
        ward: 'WARD-1',
        isActive: true
      });
      console.log('[Seed] Auto-seeded OFFICER account: officer@example.com / Officer123!');
    }

    // 4. Seed Test Admin
    if (!(await User.findOne({ email: 'admin@example.com' }))) {
      await User.create({
        name: 'System Administrator',
        email: 'admin@example.com',
        passwordHash: await bcrypt.hash('Admin123!', saltRounds),
        phone: '9999999999',
        role: 'ADMIN',
        ward: 'CENTRAL-HQ',
        isActive: true
      });
      console.log('[Seed] Auto-seeded ADMIN account: admin@example.com / Admin123!');
    }
  } catch (err) {
    console.error('[Seed Error] Failed to auto-seed test accounts:', err.message);
  }
};

/**
 * Connect to MongoDB database using Mongoose with MongoMemoryServer fallback
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/municipal_civic_db';
    
    // Attempt standard connection with 2s timeout
    const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    await autoSeedAccounts();
    return conn;
  } catch (error) {
    console.warn(`[Database Warning] Native MongoDB connection failed (${error.message}). Starting In-Memory MongoDB Server...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      const conn = await mongoose.connect(memoryUri);
      console.log(`[Database] In-Memory MongoDB Connected: ${memoryUri}`);
      await autoSeedAccounts();
      return conn;
    } catch (memError) {
      console.error(`[Database Error] In-Memory MongoDB failed: ${memError.message}`);
      throw memError;
    }
  }
};

module.exports = connectDB;
