/**
 * Windows Service Wrapper for Notes Management System Server
 * This runs the Node.js server as a Windows Service that persists independently
 * Install: npm run service:install
 * Start: npm run service:start
 * Stop: npm run service:stop
 * Uninstall: npm run service:uninstall
 */

const Service = require("node-windows").Service;
const path = require("path");

// Create a new service object
const svc = new Service({
  name: "NotesManagementServer",
  description:
    "Notes Management System - Server Service for Android/Web access",
  script: path.join(__dirname, "../server/server.js"),
  nodeOptions: "--max-old-space-size=4096",
  env: {
    name: "NODE_ENV",
    value: "production",
  },
});

// Listen for the install event
svc.on("install", function () {
  console.log("Service installed successfully");
  console.log("Starting service...");
  svc.start();
});

svc.on("start", function () {
  console.log("Service started");
});

svc.on("uninstall", function () {
  console.log("Service uninstalled");
});

svc.on("error", function (err) {
  console.error("Service error:", err);
});

module.exports = svc;
