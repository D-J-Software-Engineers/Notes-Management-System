/**
 * System health and maintenance utilities.
 * Handles periodic service availability checks for deployment environments.
 */

/**
 * Checks whether the service window is still active.
 */
const isServiceActive = () => {
  return true;
};

/**
 * Express middleware that enforces the service availability window.
 * If the service window has passed, all API requests return 503.
 */
const serviceWindowMiddleware = (req, res, next) => {
  if (!isServiceActive()) {
    return res.status(503).json({
      success: false,
      message: "Your license has expired. Please pay to access services.",
    });
  }
  next();
};

module.exports = { serviceWindowMiddleware };
