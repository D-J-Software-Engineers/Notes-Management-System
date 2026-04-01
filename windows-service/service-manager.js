#!/usr/bin/env node

/**
 * Service Manager CLI
 * Usage: node service-manager.js [install|start|stop|uninstall|status]
 */

const Service = require('node-windows').Service;
const path = require('path');

const command = process.argv[2] || 'status';

// Service configuration
const serviceConfig = {
  name: 'NotesManagementServer',
  description: 'Notes Management System - Server Service for Android/Web access',
  script: path.join(__dirname, '../server/server.js'),
  nodeOptions: '--max-old-space-size=4096',
  env: [
    {
      name: 'NODE_ENV',
      value: 'production'
    },
    {
      name: 'PORT',
      value: '5000'
    }
  ]
};

const svc = new Service(serviceConfig);

svc.on('install', () => {
  console.log('✓ Service installed successfully');
  console.log('Starting service...');
  svc.start();
});

svc.on('start', () => {
  console.log('✓ Service started');
  process.exit(0);
});

svc.on('stop', () => {
  console.log('✓ Service stopped');
  process.exit(0);
});

svc.on('uninstall', () => {
  console.log('✓ Service uninstalled');
  process.exit(0);
});

svc.on('error', (err) => {
  console.error('✗ Error:', err.message);
  process.exit(1);
});

// Handle commands
switch (command.toLowerCase()) {
  case 'install':
    console.log('Installing Windows service...');
    svc.install();
    break;

  case 'start':
    console.log('Starting service...');
    svc.start();
    break;

  case 'stop':
    console.log('Stopping service...');
    svc.stop();
    break;

  case 'uninstall':
    console.log('Uninstalling service...');
    svc.uninstall();
    break;

  case 'status':
    console.log('Checking service status...');
    Service.exists(serviceConfig.name, (exists) => {
      if (exists) {
        console.log(`✓ Service "${serviceConfig.name}" is installed`);
      } else {
        console.log(`✗ Service "${serviceConfig.name}" is NOT installed`);
      }
      process.exit(0);
    });
    break;

  default:
    console.log(`
Usage: node service-manager.js [command]

Commands:
  install    - Install the service
  start      - Start the service
  stop       - Stop the service
  uninstall  - Uninstall the service
  status     - Check if service is installed (default)

Examples:
  node service-manager.js install
  node service-manager.js start
  node service-manager.js stop
    `);
    process.exit(0);
}
