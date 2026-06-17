const fs = require('fs');
const path = require('path');
const logger = require('./Logger');

class Screenshot {
  /**
   * Captures a screenshot using selenium-webdriver
   * @param {WebDriver} driver - The selenium webdriver instance
   * @param {string} testName - Name of the test for the filename
   * @returns {Promise<string>} - The absolute path to the saved screenshot
   */
  static async capture(driver, testName) {
    try {
      const screenshotDir = path.join(__dirname, '../reports/screenshots');
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const safeTestName = testName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `${safeTestName}_${timestamp}.png`;
      const filepath = path.join(screenshotDir, filename);

      const image = await driver.takeScreenshot();
      fs.writeFileSync(filepath, image, 'base64');
      logger.info(`Screenshot saved to: ${filepath}`);
      return filepath;
    } catch (error) {
      logger.error(`Failed to capture screenshot: ${error.message}`);
      return null;
    }
  }
}

module.exports = Screenshot;
