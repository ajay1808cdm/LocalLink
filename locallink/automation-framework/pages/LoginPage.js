const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class LoginPage extends BasePage {
  constructor(driver) {
    super(driver);
    
    // Locators
    this.locators = {
      roleFarmerButton: By.xpath("//h2[text()='Farmer']/ancestor::div[contains(@class, 'role-card')]//button[contains(., 'Sign In')]"),
      roleCustomerButton: By.xpath("//h2[text()='Customer']/ancestor::div[contains(@class, 'role-card')]//button[contains(., 'Sign In')]"),
      roleVendorButton: By.xpath("//h2[text()='Vendor']/ancestor::div[contains(@class, 'role-card')]//button[contains(., 'Sign In')]"),
      emailInput: By.name('email'),
      passwordInput: By.name('password'),
      loginButton: By.xpath("//button[@type='submit' and contains(text(), 'Sign In')]"),
      errorMessage: By.css('.text-red-500, .error-message')
    };
  }

  async selectRole(role) {
    if (role.toLowerCase() === 'farmer') await this.click(this.locators.roleFarmerButton);
    else if (role.toLowerCase() === 'customer') await this.click(this.locators.roleCustomerButton);
    else if (role.toLowerCase() === 'vendor') await this.click(this.locators.roleVendorButton);
  }

  async login(email, password) {
    await this.typeText(this.locators.emailInput, email);
    await this.typeText(this.locators.passwordInput, password);
    await this.click(this.locators.loginButton);
  }

  async getErrorMessage() {
    return await this.getText(this.locators.errorMessage);
  }
}

module.exports = LoginPage;
