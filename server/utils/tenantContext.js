const { AsyncLocalStorage } = require("async_hooks");

/**
 * AsyncLocalStorage allows us to store the schoolId for the duration of an
 * asynchronous request lifecycle, ensuring that multi-tenancy filters are
 * applied correctly without mixing up data between concurrent requests.
 */
const tenantContext = new AsyncLocalStorage();

module.exports = {
  tenantContext,
  getSchoolId: () => tenantContext.getStore(),
  setSchoolId: (schoolId, callback) => tenantContext.run(schoolId, callback),
};
