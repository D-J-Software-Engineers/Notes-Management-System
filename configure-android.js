#!/usr/bin/env node

/**
 * Android App Configuration Helper
 * Automatically finds Windows server and updates Android config
 *
 * Usage: node configure-android.js [--ip 192.168.1.100]
 */

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

class AndroidConfigurator {
  constructor() {
    this.serverIp = process.argv
      .find((arg) => arg.startsWith("--ip"))
      ?.split("=")[1];

    this.configFiles = {
      capacitor: path.join(__dirname, "../capacitor.config.json"),
      serverConfig: path.join(
        __dirname,
        "../client/public/assets/js/server-config.js",
      ),
      buildGradle: path.join(__dirname, "../android/app/build.gradle"),
    };
  }

  async findWindowsServer() {
    console.log("\n🔍 Scanning for Windows server on local network...\n");

    const commonRanges = [
      { range: "192.168.1", name: "Standard Private" },
      { range: "192.168.0", name: "Standard Private Alt" },
      { range: "10.0.0", name: "Class A Private" },
      { range: "172.16", name: "Class B Private" },
    ];

    for (const { range, name } of commonRanges) {
      console.log(`Scanning ${name} (${range}.x)...`);

      for (let i = 1; i <= 254; i++) {
        const ip = `${range}.${i}`;
        try {
          const { stdout } = await execAsync(
            `curl -s --connect-timeout 1 http://${ip}:5000/health`,
            { timeout: 2000 },
          );

          if (stdout.includes("ok")) {
            console.log(`\n✅ Found server at ${ip}!\n`);
            return ip;
          }
        } catch (error) {
          // Continue scanning
        }
      }
    }

    return null;
  }

  getLocalIp() {
    console.log("\n📱 Detecting your local network IP...\n");

    try {
      const { stdout } = require("child_process").execSync("ipconfig", {
        encoding: "utf-8",
      });

      const ipMatch = stdout.match(/IPv4 Address[.\s]+: (\d+\.\d+\.\d+\.\d+)/);
      if (ipMatch) {
        const ip = ipMatch[1];
        console.log(`Local IP: ${ip}\n`);
        return ip;
      }
    } catch (error) {
      console.error("Could not detect local IP");
    }

    return null;
  }

  updateCapacitorConfig(ip) {
    console.log(`📝 Updating capacitor.config.json...`);

    try {
      const config = JSON.parse(
        fs.readFileSync(this.configFiles.capacitor, "utf-8"),
      );
      config.server = config.server || {};
      config.server.hostname = ip;

      fs.writeFileSync(
        this.configFiles.capacitor,
        JSON.stringify(config, null, 2),
      );

      console.log(`✅ Updated with server IP: ${ip}\n`);
    } catch (error) {
      console.error(`❌ Error updating capacitor config: ${error.message}`);
    }
  }

  updateServerConfig(ip) {
    console.log(`📝 Updating server-config.js...`);

    try {
      let config = fs.readFileSync(this.configFiles.serverConfig, "utf-8");

      // Replace the IP address
      config = config.replace(
        /BASE_URL: 'http:\/\/[^']+:5000'/,
        `BASE_URL: 'http://${ip}:5000'`,
      );

      fs.writeFileSync(this.configFiles.serverConfig, config);
      console.log(`✅ Updated with server IP: ${ip}\n`);
    } catch (error) {
      console.error(`❌ Error updating server config: ${error.message}`);
    }
  }

  createServerBuildFile(ip) {
    console.log(`📝 Creating build configuration...`);

    const buildDir = path.join(__dirname, "../android/app/src/main/assets");
    const configFile = path.join(buildDir, "server-config.json");

    try {
      if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir, { recursive: true });
      }

      const config = {
        serverIp: ip,
        serverPort: 5000,
        serverUrl: `http://${ip}:5000`,
      };

      fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
      console.log(`✅ Created server config: ${configFile}\n`);
    } catch (error) {
      console.error(`❌ Error creating build config: ${error.message}`);
    }
  }

  async run() {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║   Android App Configuration for Local Network Server     ║
╚═══════════════════════════════════════════════════════════╝
    `);

    // Get server IP
    let serverIp = this.serverIp;

    if (!serverIp) {
      // Try to find server automatically
      serverIp = await this.findWindowsServer();

      if (!serverIp) {
        console.log("\n⚠️  Could not find server automatically.\n");
        console.log("Please provide the Windows server IP manually:");
        console.log("Usage: node configure-android.js --ip=192.168.1.100\n");

        // Get local IP for reference
        this.getLocalIp();
        process.exit(1);
      }
    }

    console.log(
      `\n🔧 Configuring Android app to connect to: http://${serverIp}:5000\n`,
    );

    // Update all configuration files
    this.updateCapacitorConfig(serverIp);
    this.updateServerConfig(serverIp);
    this.createServerBuildFile(serverIp);

    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                Configuration Complete!                    ║
╚═══════════════════════════════════════════════════════════╝

✅ Your Android app is configured to access:
   📍 Server IP: ${serverIp}
   🔌 Port: 5000
   🌐 URL: http://${serverIp}:5000

📚 Next steps:
   1. npm install
   2. npx cap sync android
   3. npx cap build android

🚀 Or run the quick build:
   npm run android:build

    `);
  }
}

// Run the configurator
const configurator = new AndroidConfigurator();
configurator.run().catch(console.error);
