const crypto = require("crypto");

/**
 * Utility to generate secure, readable license keys for offline installations.
 * Format: NSOMA-XXXX-XXXX-XXXX
 */
const generateLicenseKey = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous chars like 1, I, 0, O
  const segment = () => {
    let s = "";
    for (let i = 0; i < 4; i++) {
      s += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return s;
  };

  return `NSOMA-${segment()}-${segment()}-${segment()}`;
};

module.exports = { generateLicenseKey };
