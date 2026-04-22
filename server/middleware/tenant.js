const School = require("../models/School");
const { tenantContext } = require("../utils/tenantContext");

/**
 * Middleware to handle multi-tenancy and subscription checks (The "Kill Switch")
 */
const tenantMiddleware = async (req, res, next) => {
  try {
    // If we're not in SaaS mode, we don't need multi-tenancy logic
    if (process.env.APP_MODE !== "SaaS") {
      return next();
    }

    // req.user should be populated by the protect middleware before this
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required before tenant check",
      });
    }

    // Super Admins are not bound by school-level restrictions
    if (req.user.role === "super_admin") {
      return next();
    }

    const schoolId = req.user.schoolId;

    if (!schoolId) {
      return res.status(403).json({
        success: false,
        message: "User is not associated with any school",
      });
    }

    // 1. Fetch School with "Kill Switch" and Expiry data from cache or DB
    const school = await School.findByPk(schoolId);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    // 2. CHECK THE KILL SWITCH (Defaulting Money or Suspension)
    if (!school.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "System has been deactivated for this school. Please contact support.",
      });
    }

    // 3. CHECK SUBSCRIPTION EXPIRY
    const now = new Date();
    if (school.subscriptionExpiresAt && school.subscriptionExpiresAt < now) {
      return res.status(403).json({
        success: false,
        message:
          "School subscription has expired. Please renew to continue using the system.",
      });
    }

    // Attach schoolId to the request for use in controllers
    req.schoolId = schoolId;
    req.school = school;

    // 4. WRAP IN TENANT CONTEXT for Global Scoping Hooks
    // This makes schoolId available to any database query in this request
    tenantContext.run(schoolId, () => {
      next();
    });
  } catch (error) {
    console.error("Tenant Middleware Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error in Tenant Identification",
    });
  }
};

module.exports = tenantMiddleware;
