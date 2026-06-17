require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const MobileConfig = {
  hostname: process.env.APPIUM_HOST || '127.0.0.1',
  port: parseInt(process.env.APPIUM_PORT || '4723', 10),
  path: '/', // Appium 2.x path
  capabilities: {
    'platformName': process.env.PLATFORM_NAME || 'Android',
    'appium:deviceName': process.env.DEVICE_NAME || 'emulator-5554',
    'appium:app': process.env.APP_PATH || '',
    'appium:automationName': 'UiAutomator2',
    'appium:autoGrantPermissions': true
  }
};

module.exports = MobileConfig;
