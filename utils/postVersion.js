const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'app.config.js');
const packagePath = path.join(__dirname, '..', 'package.json');

// Get the new version from package.json
const packageJson = require(packagePath);
const newVersion = packageJson.version;

// Read the original config file content as a string
let configContent = fs.readFileSync(configPath, 'utf-8');

// The original module.exports object is required for dynamic modification.
// Since we can't 'require' a file that uses `module.exports = { expo: {...} }`
// and then modify and save it back easily, we'll use string replacement for safety
// with the Expo config format.

try {
    // 1. Update expo.version
    // Regex to find and replace the current version string in expo.version:
    // version: "old.version.number" -> version: "new.version.number"
    configContent = configContent.replace(
        /version: "(\d+\.\d+\.\d+)"/,
        `version: "${newVersion}"`
    );

    // 2. Increment android.versionCode
    // Regex to find the current versionCode:
    configContent = configContent.replace(
        /(versionCode: )(\d+)/,
        (match, p1, p2) => {
            const currentCode = parseInt(p2, 10);
            const newCode = currentCode + 1;
            console.log(`✅ Android versionCode updated from ${currentCode} to ${newCode}`);
            return `${p1}${newCode}`;
        }
    );

    // 3. Increment ios.buildNumber
    // Regex to find the current buildNumber:
    configContent = configContent.replace(
        /(buildNumber: )"(\d+)"/,
        (match, p1, p2) => {
            const currentBuild = parseInt(p2, 10);
            const newBuild = currentBuild + 1;
            console.log(`✅ iOS buildNumber updated from ${currentBuild} to ${newBuild}`);
            return `${p1}"${newBuild}"`;
        }
    );

    // Write the updated content back to the file
    fs.writeFileSync(configPath, configContent, 'utf-8');
    console.log(`✨ Successfully updated expo.version to ${newVersion} and incremented build numbers in ${path.basename(configPath)}.`);

} catch (error) {
    console.error("❌ Error updating Expo config:", error);
    process.exit(1);
}