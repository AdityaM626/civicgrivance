const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const Department = require('../models/Department');
const User = require('../models/User');

// Load environment variables
dotenv.config();

const sampleDepartments = [
  {
    name: 'Roads & Infrastructure',
    code: 'ROADS',
    description: 'Handles municipal road repairs, potholes, footpaths, and street infrastructure.',
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

const seedDatabase = async () => {
  // Safety Check: Require explicit development environment
  if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
    console.error('[Seed Error] Database seeding is restricted to development or test environments.');
    process.exit(1);
  }

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables.');
    }

    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('[Seed] Database connected successfully.');

    // 1. Seed Departments
    const createdDepts = {};
    for (const deptData of sampleDepartments) {
      let existingDept = await Department.findOne({ code: deptData.code });
      if (!existingDept) {
        existingDept = await Department.create(deptData);
        console.log(`[Seed] Department Created: ${deptData.name} (${deptData.code})`);
      } else {
        console.log(`[Seed] Department Already Exists: ${deptData.name} (${deptData.code})`);
      }
      createdDepts[deptData.code] = existingDept;
    }

    // 2. Seed Controlled Demo Accounts (Admin & Officer) for Testing
    const saltRounds = 10;
    
    // Seed Admin Account
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'seed_admin@example.com';
    const adminPass = process.env.SEED_ADMIN_PASSWORD || 'SeedAdmin123';
    let adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      const adminPasswordHash = await bcrypt.hash(adminPass, saltRounds);
      adminUser = await User.create({
        name: 'Demo System Administrator',
        email: adminEmail,
        passwordHash: adminPasswordHash,
        phone: '9999999999',
        role: 'ADMIN',
        departmentId: null,
        ward: 'CENTRAL-HQ',
        isActive: true
      });
      console.log(`[Seed] Demo ADMIN Account Created: ${adminEmail}`);
    } else {
      console.log(`[Seed] Demo ADMIN Account Already Exists: ${adminEmail}`);
    }

    // Seed Officer Account
    const officerEmail = process.env.SEED_OFFICER_EMAIL || 'seed_officer@example.com';
    const officerPass = process.env.SEED_OFFICER_PASSWORD || 'SeedOfficer123';
    let officerUser = await User.findOne({ email: officerEmail });
    if (!officerUser) {
      const officerPasswordHash = await bcrypt.hash(officerPass, saltRounds);
      const roadsDept = createdDepts['ROADS'];
      officerUser = await User.create({
        name: 'Demo Roads Officer',
        email: officerEmail,
        passwordHash: officerPasswordHash,
        phone: '8888888888',
        role: 'OFFICER',
        departmentId: roadsDept ? roadsDept._id : null,
        ward: 'WARD-01',
        isActive: true
      });
      console.log(`[Seed] Demo OFFICER Account Created: ${officerEmail}`);
    } else {
      console.log(`[Seed] Demo OFFICER Account Already Exists: ${officerEmail}`);
    }

    console.log('[Seed] Database seed completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error(`[Seed Error] Failed to seed database: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
