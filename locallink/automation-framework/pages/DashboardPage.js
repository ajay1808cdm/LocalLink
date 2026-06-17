const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class DashboardPage extends BasePage {
  constructor(driver) {
    super(driver);
    
    // Locators
    this.locators = {
      headerLogo: By.xpath("//*[contains(text(), 'LocalLink') or @alt='LocalLink Logo']"),
      logoutButton: By.xpath("//button[contains(text(), 'Logout')]"),
      profileLink: By.xpath("//a[contains(@href, '/profile')]"),
      welcomeMessage: By.xpath("//*[contains(text(), 'Welcome')]")
    };
  }

  async isDashboardLoaded() {
    return await this.isElementVisible(this.locators.headerLogo);
  }

  async getWelcomeText() {
    return await this.getText(this.locators.welcomeMessage);
  }

  async logout() {
    await this.click(this.locators.logoutButton);
  }
}

module.exports = DashboardPage;
