const { By, until } = require('selenium-webdriver');
const Screenshot = require('../utils/Screenshot');
const logger = require('../utils/Logger');

class BasePage {
  constructor(driver) {
    this.driver = driver;
  }

  async navigateTo(url) {
    logger.info(`Navigating to: ${url}`);
    await this.driver.get(url);
  }

  async findElement(locator, timeout = 10000) {
    try {
      return await this.driver.wait(until.elementLocated(locator), timeout);
    } catch (err) {
      logger.error(`Element not found: ${locator}`);
      throw err;
    }
  }

  async click(locator, timeout = 10000) {
    try {
      const element = await this.findElement(locator, timeout);
      await this.driver.wait(until.elementIsVisible(element), timeout);
      await element.click();
      logger.info(`Clicked on element: ${locator}`);
    } catch (err) {
      logger.error(`Failed to click on element: ${locator}`);
      throw err;
    }
  }

  async typeText(locator, text, timeout = 10000) {
    try {
      const element = await this.findElement(locator, timeout);
      await this.driver.wait(until.elementIsVisible(element), timeout);
      await element.clear();
      await element.sendKeys(text);
      logger.info(`Typed text into element: ${locator}`);
    } catch (err) {
      logger.error(`Failed to type text into element: ${locator}`);
      throw err;
    }
  }

  async getText(locator, timeout = 10000) {
    try {
      const element = await this.findElement(locator, timeout);
      await this.driver.wait(until.elementIsVisible(element), timeout);
      const text = await element.getText();
      return text;
    } catch (err) {
      logger.error(`Failed to get text from element: ${locator}`);
      throw err;
    }
  }

  async isElementVisible(locator, timeout = 5000) {
    try {
      const element = await this.findElement(locator, timeout);
      return await element.isDisplayed();
    } catch (err) {
      return false;
    }
  }

  async captureScreenshot(testName) {
    return await Screenshot.capture(this.driver, testName);
  }
}

module.exports = BasePage;
