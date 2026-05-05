/**
 * Audit Fix Tests
 * Covers every issue found in the May 2026 audit:
 *  - Broken Mongoose methods replaced with Sequelize equivalents
 *  - Tenant isolation (schoolId scoping) in user queries
 *  - Discussion role message
 *  - serviceCheck dead code removed
 *  - auth.js authorize guard
 */

const test = require("node:test");
const assert = require("node:assert");
const sinon = require("sinon");
const proxyquire = require("proxyquire").noCallThru();

// ─── Shared stubs ────────────────────────────────────────────────────────────

function makeRes() {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  return res;
}

function makeNext() {
  return sinon.stub();
}

// ─── 1. authController ───────────────────────────────────────────────────────

test("authController.register — role field stripped from body", async (t) => {
  const userStub = {
    create: sinon.stub().resolves({
      id: "u1",
      name: "Alice",
      email: "alice@test.com",
      role: "student",
      class: "s1",
      level: "o-level",
      combination: null,
      isConfirmed: true,
      generateAuthToken: () => "tok123",
    }),
    findByCredentials: sinon.stub(),
    findByPk: sinon.stub(),
    findOne: sinon.stub(),
  };

  const controller = proxyquire("../controllers/authController", {
    "../models/User": userStub,
    "../middleware/errorHandler": { ErrorResponse: class extends Error {} },
  });

  const req = {
    body: {
      name: "Alice",
      email: "alice@test.com",
      password: "pass123",
      role: "super_admin", // should be stripped
      schoolId: "school-1",
      class: "s1",
      level: "o-level",
    },
  };
  const res = makeRes();
  const next = makeNext();

  await controller.register(req, res, next);

  assert.ok(userStub.create.calledOnce, "User.create should be called");
  const callArgs = userStub.create.firstCall.args[0];
  // role must always be 'student' regardless of what was sent
  assert.strictEqual(
    callArgs.role,
    "student",
    "role must be forced to student",
  );
  assert.strictEqual(next.callCount, 0, "next should not be called on success");
});

test("authController.updatePassword — uses findByPk not findById", async (t) => {
  const mockUser = {
    comparePassword: sinon.stub().resolves(true),
    save: sinon.stub().resolves(),
    generateAuthToken: sinon.stub().returns("new-token"),
  };

  const userStub = {
    findByPk: sinon.stub().resolves(mockUser),
    findById: sinon.stub().throws(new Error("findById must not be called")),
  };

  const controller = proxyquire("../controllers/authController", {
    "../models/User": userStub,
    "../middleware/errorHandler": {
      ErrorResponse: class ErrorResponse extends Error {
        constructor(msg, code) {
          super(msg);
          this.statusCode = code;
        }
      },
    },
  });

  const req = {
    user: { id: "u1" },
    body: { currentPassword: "old", newPassword: "newpass123" },
  };
  const res = makeRes();
  const next = makeNext();

  await controller.updatePassword(req, res, next);

  assert.ok(userStub.findByPk.calledWith("u1"), "Must call findByPk");
  assert.ok(!userStub.findById.called, "findById must NOT be called");
  assert.ok(res.status.calledWith(200), "Should respond 200 on success");
  const body = res.json.firstCall.args[0];
  assert.ok(body.success, "Response should have success:true");
  assert.ok(body.data.token, "Response should contain a new token");
});

test("authController.updatePassword — 404 when user not found", async () => {
  const userStub = { findByPk: sinon.stub().resolves(null) };
  const ErrorResponse = class extends Error {
    constructor(msg, code) {
      super(msg);
      this.statusCode = code;
    }
  };

  const controller = proxyquire("../controllers/authController", {
    "../models/User": userStub,
    "../middleware/errorHandler": { ErrorResponse },
  });

  const req = {
    user: { id: "ghost" },
    body: { currentPassword: "x", newPassword: "y" },
  };
  const res = makeRes();
  const next = makeNext();

  await controller.updatePassword(req, res, next);

  assert.ok(next.calledOnce, "next() must be called with error");
  assert.ok(
    next.firstCall.args[0] instanceof Error,
    "Must pass an Error to next",
  );
  assert.strictEqual(next.firstCall.args[0].statusCode, 404);
});

test("authController.getResetRequests — scoped to admin school", async () => {
  const users = [{ id: "u1", name: "Bob" }];
  const findAllStub = sinon.stub().resolves(users);
  const userStub = { findAll: findAllStub };

  const controller = proxyquire("../controllers/authController", {
    "../models/User": userStub,
    "../middleware/errorHandler": { ErrorResponse: class extends Error {} },
  });

  const req = { user: { role: "school_admin", schoolId: "school-A" } };
  const res = makeRes();
  const next = makeNext();

  await controller.getResetRequests(req, res, next);

  assert.ok(findAllStub.calledOnce);
  const whereClause = findAllStub.firstCall.args[0].where;
  assert.strictEqual(whereClause.resetRequest, true);
  assert.strictEqual(
    whereClause.schoolId,
    "school-A",
    "Must scope to admin school",
  );
});

test("authController.getResetRequests — super_admin sees all schools", async () => {
  const findAllStub = sinon.stub().resolves([]);
  const userStub = { findAll: findAllStub };

  const controller = proxyquire("../controllers/authController", {
    "../models/User": userStub,
    "../middleware/errorHandler": { ErrorResponse: class extends Error {} },
  });

  const req = { user: { role: "super_admin", schoolId: null } };
  const res = makeRes();
  await controller.getResetRequests(req, res, makeNext());

  const whereClause = findAllStub.firstCall.args[0].where;
  assert.strictEqual(whereClause.resetRequest, true);
  assert.ok(
    !("schoolId" in whereClause),
    "super_admin must NOT have schoolId filter",
  );
});

// ─── 2. userController ───────────────────────────────────────────────────────

test("userController.rejectUser — uses findByPk not findById", async () => {
  const mockUser = { destroy: sinon.stub().resolves() };
  const userStub = {
    findByPk: sinon.stub().resolves(mockUser),
    findById: sinon.stub().throws(new Error("findById must not be called")),
  };
  const ErrorResponse = class extends Error {
    constructor(msg, code) {
      super(msg);
      this.statusCode = code;
    }
  };

  const controller = proxyquire("../controllers/userController", {
    "../models/User": userStub,
    "../middleware/errorHandler": { ErrorResponse },
    sequelize: { Op: {} },
  });

  const req = {
    params: { id: "u42" },
    user: { id: "admin1", schoolId: "s1", role: "school_admin" },
  };
  const res = makeRes();
  const next = makeNext();

  await controller.rejectUser(req, res, next);

  assert.ok(userStub.findByPk.calledWith("u42"), "Must call findByPk");
  assert.ok(!userStub.findById.called, "findById must NOT be called");
  assert.ok(mockUser.destroy.calledOnce, "User must be destroyed");
  assert.ok(res.status.calledWith(200));
});

test("userController.getAllUsers — scoped to current schoolId", async () => {
  const findAndCountAllStub = sinon.stub().resolves({ rows: [], count: 0 });
  const userStub = { findAndCountAll: findAndCountAllStub };
  const { Op } = require("sequelize");

  const controller = proxyquire("../controllers/userController", {
    "../models/User": userStub,
    "../middleware/errorHandler": { ErrorResponse: class extends Error {} },
  });

  const req = {
    query: {},
    user: { id: "admin1", role: "school_admin", schoolId: "school-X" },
  };
  const res = makeRes();
  await controller.getAllUsers(req, res, makeNext());

  assert.ok(findAndCountAllStub.calledOnce);
  const where = findAndCountAllStub.firstCall.args[0].where;
  assert.strictEqual(
    where.schoolId,
    "school-X",
    "Query must be scoped to admin's school",
  );
  assert.strictEqual(where.isActive, true);
});

test("userController.approveUser — no console.error after next(error)", async () => {
  // If console.error was called after next(), sinon would catch it
  const consoleSpy = sinon.spy(console, "error");

  const mockUser = { isConfirmed: false, save: sinon.stub().resolves() };
  const userStub = { findByPk: sinon.stub().resolves(mockUser) };

  const controller = proxyquire("../controllers/userController", {
    "../models/User": userStub,
    "../middleware/errorHandler": { ErrorResponse: class extends Error {} },
  });

  const req = {
    params: { id: "u1" },
    user: { id: "admin", schoolId: "s1", role: "school_admin" },
  };
  const res = makeRes();
  const next = makeNext();

  await controller.approveUser(req, res, next);

  // Success path: console.error should NOT have been called
  assert.ok(!consoleSpy.called, "console.error must not be called on success");
  assert.ok(mockUser.isConfirmed === true, "isConfirmed must be set to true");
  assert.ok(res.status.calledWith(200));

  consoleSpy.restore();
});

test("userController.getPendingUsers — scoped to admin school", async () => {
  const findAllStub = sinon.stub().resolves([]);
  const userStub = { findAll: findAllStub };

  const controller = proxyquire("../controllers/userController", {
    "../models/User": userStub,
    "../middleware/errorHandler": { ErrorResponse: class extends Error {} },
  });

  const req = { user: { role: "school_admin", schoolId: "school-B" } };
  const res = makeRes();
  await controller.getPendingUsers(req, res, makeNext());

  const where = findAllStub.firstCall.args[0].where;
  assert.strictEqual(where.isConfirmed, false);
  assert.strictEqual(where.schoolId, "school-B");
});

test("userController.getUserStats — scoped to admin school", async () => {
  const countStub = sinon.stub().resolves(5);
  const userStub = { count: countStub };

  const controller = proxyquire("../controllers/userController", {
    "../models/User": userStub,
    "../middleware/errorHandler": { ErrorResponse: class extends Error {} },
  });

  const req = { user: { role: "school_admin", schoolId: "school-C" } };
  const res = makeRes();
  await controller.getUserStats(req, res, makeNext());

  // Every count call should have included schoolId
  for (const call of countStub.getCalls()) {
    const where = call.args[0]?.where || {};
    assert.strictEqual(
      where.schoolId,
      "school-C",
      `All User.count calls must include schoolId. Got: ${JSON.stringify(where)}`,
    );
  }
  assert.ok(res.status.calledWith(200));
});

test("userController.getUserStats — super_admin has no schoolId filter", async () => {
  const countStub = sinon.stub().resolves(10);
  const userStub = { count: countStub };

  const controller = proxyquire("../controllers/userController", {
    "../models/User": userStub,
    "../middleware/errorHandler": { ErrorResponse: class extends Error {} },
  });

  const req = { user: { role: "super_admin", schoolId: null } };
  const res = makeRes();
  await controller.getUserStats(req, res, makeNext());

  for (const call of countStub.getCalls()) {
    const where = call.args[0]?.where || {};
    assert.ok(
      !("schoolId" in where),
      `super_admin stats must not filter by schoolId. Got: ${JSON.stringify(where)}`,
    );
  }
});

// ─── 3. discussionController ─────────────────────────────────────────────────

test("discussionController.createDiscussion — school_admin gets 'created' message", async () => {
  const mockDiscussion = { id: "d1", title: "Math Meeting" };
  const discussionStub = { create: sinon.stub().resolves(mockDiscussion) };
  const userStub = {};
  const subjectStub = {};

  const controller = proxyquire("../controllers/discussionController", {
    "../models/Discussion": discussionStub,
    "../models/User": userStub,
    "../models/Subject": subjectStub,
  });

  const req = {
    user: { id: "admin1", role: "school_admin", schoolId: "school-1" },
    body: {
      title: "Math Meeting",
      description: "Weekly sync",
      meetingLink: "https://meet.google.com/abc",
      class: "s3",
      level: "o-level",
      subjectId: "subject-1",
    },
  };
  const res = makeRes();
  await controller.createDiscussion(req, res, makeNext());

  const body = res.json.firstCall.args[0];
  assert.ok(body.success);
  assert.ok(
    body.message.includes("created successfully"),
    `school_admin should get 'created' message. Got: "${body.message}"`,
  );
});

test("discussionController.createDiscussion — teacher gets 'pending' message", async () => {
  const mockDiscussion = { id: "d2", title: "History Talk", status: "pending" };
  const discussionStub = { create: sinon.stub().resolves(mockDiscussion) };

  const controller = proxyquire("../controllers/discussionController", {
    "../models/Discussion": discussionStub,
    "../models/User": {},
    "../models/Subject": {},
  });

  const req = {
    user: { id: "t1", role: "teacher", schoolId: "school-1" },
    body: {
      title: "History Talk",
      subjectId: "sub-2",
      class: "s4",
      level: "o-level",
    },
  };
  const res = makeRes();
  await controller.createDiscussion(req, res, makeNext());

  const body = res.json.firstCall.args[0];
  assert.ok(
    body.message.includes("pending"),
    `teacher should get 'pending' message. Got: "${body.message}"`,
  );
});

// ─── 4. serviceCheck.js ──────────────────────────────────────────────────────

test("serviceCheck — isServiceActive always returns true", () => {
  const { serviceWindowMiddleware } = require("../middleware/serviceCheck");
  const req = {};
  const res = makeRes();
  const next = makeNext();

  serviceWindowMiddleware(req, res, next);

  assert.ok(next.calledOnce, "next() should be called when service is active");
  assert.ok(!res.status.called, "Should not send 503 response");
});

test("serviceCheck — no _sw obfuscated variable exposed", () => {
  // The module should not export or define _sw
  const mod = require("../middleware/serviceCheck");
  assert.ok(!("_sw" in mod), "_sw must not be exported from serviceCheck");

  // Also verify the module source doesn't silently define _sw globals
  // by checking the module only exports the two expected keys
  const keys = Object.keys(mod);
  assert.deepStrictEqual(
    keys,
    ["serviceWindowMiddleware"],
    `serviceCheck should only export serviceWindowMiddleware. Got: ${JSON.stringify(keys)}`,
  );
});

// ─── 5. auth middleware ───────────────────────────────────────────────────────

test("auth.authorize — allows super_admin through any guard", () => {
  const { authorize } = require("../middleware/auth");
  const guard = authorize("school_admin");

  const req = { user: { id: "sa", role: "super_admin" } };
  const res = makeRes();
  const next = makeNext();

  guard(req, res, next);

  assert.ok(next.calledOnce, "super_admin should always pass");
  assert.ok(!res.status.called);
});

test("auth.authorize — blocks wrong role and returns 403", () => {
  const { authorize } = require("../middleware/auth");
  const guard = authorize("school_admin");

  const req = { user: { id: "s1", role: "student" } };
  const res = makeRes();
  const next = makeNext();

  guard(req, res, next);

  assert.ok(!next.called, "student must not pass school_admin guard");
  assert.ok(res.status.calledWith(403));
  const body = res.json.firstCall.args[0];
  assert.strictEqual(body.success, false);
});

test("auth.authorize — no [AUTH] debug log to console", () => {
  const consoleSpy = sinon.spy(console, "log");
  const { authorize } = require("../middleware/auth");
  const guard = authorize("school_admin");

  const req = { user: { id: "s1", role: "student" } };
  const res = makeRes();
  guard(req, res, makeNext());

  const authLog = consoleSpy
    .getCalls()
    .find((c) => String(c.args[0]).includes("[AUTH]"));
  assert.ok(!authLog, "[AUTH] debug log must not appear in console");
  consoleSpy.restore();
});
