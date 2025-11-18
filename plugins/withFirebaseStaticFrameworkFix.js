const { withDangerousMod, withPlugins } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Fix for React Native Firebase with static frameworks
 * Adds CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES to Podfile
 */
const withFirebaseStaticFrameworkFix = (config) => {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile"
      );

      let podfileContent = fs.readFileSync(podfilePath, "utf-8");

      // Check if the fix is already applied
      if (podfileContent.includes("CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES")) {
        return config;
      }

      // Find the post_install block and add the fix
      const postInstallRegex = /(post_install do \|installer\|)/;
      
      if (postInstallRegex.test(podfileContent)) {
        podfileContent = podfileContent.replace(
          postInstallRegex,
          `$1
    # Fix for React Native Firebase with static frameworks
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      end
    end
`
        );
      } else {
        // If no post_install block exists, add one before the 'end' of the target
        const targetEndRegex = /(^end$)/m;
        podfileContent = podfileContent.replace(
          targetEndRegex,
          `  post_install do |installer|
    # Fix for React Native Firebase with static frameworks
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      end
    end
  end
$1`
        );
      }

      fs.writeFileSync(podfilePath, podfileContent);

      return config;
    },
  ]);
};

module.exports = withFirebaseStaticFrameworkFix;
