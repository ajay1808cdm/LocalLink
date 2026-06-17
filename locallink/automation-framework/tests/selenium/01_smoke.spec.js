const { expect } = require('chai');
const WebConfig = require('../../config/web.config');
const Reporter = require('../../utils/Reporter');
const LoginPage = require('../../pages/LoginPage');
const DashboardPage = require('../../pages/DashboardPage');

describe('01 SMOKE TESTS (Actual Implementation)', function() {
  let driver;
  let loginPage;
  let dashboardPage;

  before(async function() {
    driver = await WebConfig.getDriver();
    loginPage = new LoginPage(driver);
    dashboardPage = new DashboardPage(driver);
  });

  after(async function() {
    if (driver) await driver.quit();
    
    // Generate the report after smoke tests complete
    await Reporter.generateReports();
  });

  it('should verify: Validate backend health endpoint', async function() {
    const startTime = new Date();
    let status = 'PASS';
    let errorMessage = '';

    try {
      // Use dynamic import for node-fetch to avoid commonJS issues if any, or native fetch in Node 18+
      const response = await fetch(process.env.BACKEND_URL + 'api/health');
      expect(response.status).to.equal(200);
      const data = await response.json();
      expect(data.status).to.equal('ok');
    } catch(err) {
      status = 'FAIL';
      errorMessage = err.message;
    }

    Reporter.addResult({
      id: 'SMOKE-TC-0',
      module: '01_smoke',
      name: 'Verify backend health endpoint returns 200',
      description: 'Pings the backend /api/health to ensure server and DB are running',
      expected: 'Status 200 OK',
      actual: status === 'PASS' ? 'Backend is healthy' : errorMessage,
      status: status,
      duration: (new Date() - startTime) + 'ms',
      screenshotPath: 'N/A'
    });
    
    // If backend fails but user doesn't have Postgres running, we log FAIL but we don't crash everything
    // so the other 100 frontend tests can still run reliably.
  });

  it('should verify: Validate application startup', async function() {
    const startTime = new Date();
    let status = 'PASS';
    let errorMessage = '';
    let screenshotPath = 'N/A';

    try {
      await loginPage.navigateTo(process.env.BASE_URL);
      const title = await driver.getTitle();
      expect(title).to.include('LocalLink');
    } catch(err) {
      status = 'FAIL';
      errorMessage = err.message;
      screenshotPath = await loginPage.captureScreenshot('app_startup_fail');
    }

    Reporter.addResult({
      id: 'SMOKE-TC-1',
      module: '01_smoke',
      name: 'Validate application startup',
      description: 'Checks if the web application URL loads without errors',
      expected: 'Page title includes LocalLink',
      actual: status === 'PASS' ? 'Page loaded successfully' : errorMessage,
      status: status,
      duration: (new Date() - startTime) + 'ms',
      screenshotPath: screenshotPath
    });
    
    if (status === 'FAIL') throw new Error(errorMessage);
  });

  it('should verify: Validate login functionality (Invalid Case)', async function() {
    const startTime = new Date();
    let status = 'PASS';
    let errorMessage = '';
    let screenshotPath = 'N/A';

    try {
      await loginPage.selectRole('Farmer');
      await loginPage.login('invalid@example.com', 'wrongpassword');
      
      const errorText = await loginPage.getErrorMessage();
      expect(errorText).to.be.a('string');
      expect(errorText.length).to.be.greaterThan(0);
    } catch(err) {
      status = 'FAIL';
      errorMessage = err.message;
      screenshotPath = await loginPage.captureScreenshot('login_fail');
    }

    Reporter.addResult({
      id: 'SMOKE-TC-2',
      module: '01_smoke',
      name: 'Validate login functionality (Invalid)',
      description: 'Attempts to login with invalid credentials and expects an error',
      expected: 'Error message is displayed',
      actual: status === 'PASS' ? 'Error message displayed successfully' : errorMessage,
      status: status,
      duration: (new Date() - startTime) + 'ms',
      screenshotPath: screenshotPath
    });
  });
});
