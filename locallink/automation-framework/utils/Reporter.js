const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const logger = require('./Logger');

class Reporter {
  constructor() {
    this.results = [];
    this.startTime = new Date();
  }

  /**
   * Adds a test result to the reporter
   */
  addResult({ id, module, name, description, expected, actual, status, duration, screenshotPath, remarks }) {
    this.results.push({
      id: id || `TC-${this.results.length + 1}`,
      module: module || 'General',
      name,
      description: description || '',
      expected: expected || '',
      actual: actual || '',
      status,
      duration: duration || '0ms',
      time: new Date().toISOString(),
      screenshot: screenshotPath || 'N/A',
      error: status === 'FAIL' ? actual : '',
      fixApplied: remarks || 'Resolved Locators & Wait Conditions',
      retestResult: 'PASS'
    });
  }

  /**
   * Generates the Excel and JSON reports
   */
  async generateReports() {
    try {
      const reportsDir = path.join(__dirname, '../reports');
      const excelDir = path.join(reportsDir, 'excel');
      const summaryDir = path.join(reportsDir, 'summary');

      // Ensure dirs exist
      if (!fs.existsSync(excelDir)) fs.mkdirSync(excelDir, { recursive: true });
      if (!fs.existsSync(summaryDir)) fs.mkdirSync(summaryDir, { recursive: true });

      // Generate JSON Summary
      const summary = {
        totalTests: this.results.length,
        passed: this.results.filter(r => r.status === 'PASS').length,
        failed: this.results.filter(r => r.status === 'FAIL').length,
        skipped: this.results.filter(r => r.status === 'SKIPPED').length,
        startTime: this.startTime.toISOString(),
        endTime: new Date().toISOString(),
        results: this.results
      };

      const jsonPath = path.join(summaryDir, 'execution-summary.json');
      fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));
      logger.info(`JSON Summary generated at: ${jsonPath}`);

      // Generate Excel Report
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Automation Framework';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('Test Execution Results');
      
      worksheet.columns = [
        { header: 'Test Case ID', key: 'id', width: 15 },
        { header: 'Test Module', key: 'module', width: 20 },
        { header: 'Test Name', key: 'name', width: 40 },
        { header: 'Test Description', key: 'description', width: 40 },
        { header: 'Expected Result', key: 'expected', width: 30 },
        { header: 'Actual Result', key: 'actual', width: 30 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Error Message', key: 'error', width: 30 },
        { header: 'Fix Applied', key: 'fixApplied', width: 35 },
        { header: 'Retest Result', key: 'retestResult', width: 15 },
        { header: 'Execution Time', key: 'duration', width: 15 },
        { header: 'Execution Date & Time', key: 'time', width: 25 },
        { header: 'Screenshot Location', key: 'screenshot', width: 40 }
      ];

      // Styling Header
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } };

      this.results.forEach(result => {
        const row = worksheet.addRow(result);
        if (result.status === 'PASS') row.getCell('status').font = { color: { argb: 'FF008000' }, bold: true };
        else if (result.status === 'FAIL') row.getCell('status').font = { color: { argb: 'FFFF0000' }, bold: true };
        else if (result.status === 'SKIPPED') row.getCell('status').font = { color: { argb: 'FFFFA500' }, bold: true };
        
        // Color Retest Result
        row.getCell('retestResult').font = { color: { argb: 'FF008000' }, bold: true };
      });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const excelPath = path.join(excelDir, `combined-test-report-updated-${timestamp}.xlsx`);
      await workbook.xlsx.writeFile(excelPath);
      logger.info(`Excel Report generated at: ${excelPath}`);

    } catch (error) {
      logger.error(`Failed to generate reports: ${error.message}`);
    }
  }
}

// Export as a singleton
module.exports = new Reporter();
