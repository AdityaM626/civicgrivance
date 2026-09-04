const Complaint = require('../models/Complaint');

/**
 * Generate a unique human-readable complaint reference code.
 * Format: CIV-YYYY-XXXXXX (e.g., CIV-2026-000001)
 * @returns {Promise<string>} Unique reference code
 */
const generateReferenceCode = async () => {
  const year = new Date().getFullYear();
  const prefix = `CIV-${year}-`;
  
  const maxRetries = 10;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Generate a random 6-digit number or calculate sequence
    const count = await Complaint.countDocuments();
    const randomOffset = Math.floor(Math.random() * 100);
    const sequenceNumber = (count + 1 + randomOffset).toString().padStart(6, '0');
    const referenceCode = `${prefix}${sequenceNumber}`;

    // Check collision
    const existing = await Complaint.findOne({ referenceCode });
    if (!existing) {
      return referenceCode;
    }
  }

  // Fallback timestamp-based code in extreme collision cases
  const fallback = `${prefix}${Date.now().toString().slice(-6)}`;
  return fallback;
};

module.exports = {
  generateReferenceCode
};
