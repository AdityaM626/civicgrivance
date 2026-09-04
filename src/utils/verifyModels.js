/**
 * Model Verification Script
 * Validates that all 7 Mongoose schemas compile cleanly without circular dependencies or syntax errors.
 */

const User = require('../models/User');
const Department = require('../models/Department');
const Complaint = require('../models/Complaint');
const StatusHistory = require('../models/StatusHistory');
const ResolutionProof = require('../models/ResolutionProof');
const Feedback = require('../models/Feedback');
const Escalation = require('../models/Escalation');

const verifyModels = () => {
  const models = [
    { name: 'User', model: User },
    { name: 'Department', model: Department },
    { name: 'Complaint', model: Complaint },
    { name: 'StatusHistory', model: StatusHistory },
    { name: 'ResolutionProof', model: ResolutionProof },
    { name: 'Feedback', model: Feedback },
    { name: 'Escalation', model: Escalation }
  ];

  console.log('=== P20 Municipal Civic Grievance Model Verification ===');
  let allValid = true;

  models.forEach(({ name, model }) => {
    if (model && model.modelName === name) {
      console.log(`[PASS] Model registered successfully: ${name}`);
    } else {
      console.error(`[FAIL] Model verification failed for: ${name}`);
      allValid = false;
    }
  });

  // Verify key schema constraints
  console.log('\n--- Checking Schema Enums & Validations ---');
  
  // 1. Check User roles
  const userRoles = User.schema.path('role').enumValues;
  console.log(`User Roles Enum: [${userRoles.join(', ')}]`);
  
  // 2. Check Complaint priorities & statuses
  const priorities = Complaint.schema.path('priority').enumValues;
  const complaintStatuses = Complaint.schema.path('status').enumValues;
  console.log(`Complaint Priorities Enum: [${priorities.join(', ')}]`);
  console.log(`Complaint Statuses Enum: [${complaintStatuses.join(', ')}]`);

  // 3. Check Feedback rating range
  const ratingMin = Feedback.schema.path('rating').options.min[0];
  const ratingMax = Feedback.schema.path('rating').options.max[0];
  console.log(`Feedback Rating Range: ${ratingMin} to ${ratingMax}`);

  if (allValid) {
    console.log('\n[SUCCESS] All 7 Mongoose database models compiled cleanly and passed verification checks.');
  } else {
    console.error('\n[ERROR] Model verification encountered errors.');
    process.exit(1);
  }
};

if (require.main === module) {
  verifyModels();
}

module.exports = verifyModels;
