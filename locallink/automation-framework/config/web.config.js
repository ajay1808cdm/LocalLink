require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

class WebConfig {
  static async getDriver() {
    const options = new chrome.Options();
    if (process.env.HEADLESS === 'true') {
      options.addArguments('--headless');
    }
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--window-size=1920,1080');

    const driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    // Set default implicit wait
    await driver.manage().setTimeouts({ implicit: 10000 });
    return driver;
  }
}

module.exports = WebConfig;
