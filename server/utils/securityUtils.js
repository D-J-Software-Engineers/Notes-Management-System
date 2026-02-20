/**
 * Independent security utility for tightening the login process.
 */
const { ErrorResponse } = require("../middleware/errorHandler");

/**
 * Validates login security parameters.
 * @param {Object} user - The user instance from the database
 * @param {string} password - The password provided in the request
 * @param {string} expectedRole - The role expected by the login page (optional)
 * @throws {ErrorResponse} - If any security check fails
 */
const validateLoginSecurity = async (user, password, expectedRole) => {
  // 1. Check if user exists
  if (!user) {
    throw new ErrorResponse("Invalid credentials", 401);
  }

  // 2. Check if account is active
  if (!user.isActive) {
    throw new ErrorResponse(
      "Account is deactivated. Please contact support.",
      403,
    );
  }

  // 3. Check if account is confirmed
  if (!user.isConfirmed) {
    throw new ErrorResponse(
      "Account pending approval. Please contact admin.",
      403,
    );
  }

  // 4. Role-based restriction (TIGHTENING)
  if (expectedRole && user.role !== expectedRole) {
    console.warn(
      `Security Alert: Cross-role login attempt. User ${user.email} (role: ${user.role}) tried logging in as ${expectedRole}`,
    );
    throw new ErrorResponse(
      "Access denied. You are using the wrong login page.",
      403,
    );
  }

  // 5. Verify password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ErrorResponse("Invalid credentials", 401);
  }

  return true;
};

module.exports = {
  validateLoginSecurity,
};
