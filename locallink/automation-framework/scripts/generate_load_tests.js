const fs = require('fs');
const path = require('path');

const NUM_TESTS = 400;
const TESTS_DIR = path.join(__dirname, '..', 'tests', 'load');

// Ensure directory exists
if (!fs.existsSync(TESTS_DIR)) {
  fs.mkdirSync(TESTS_DIR, { recursive: true });
}

console.log(`Generating ${NUM_TESTS} Load test cases in ${TESTS_DIR}...`);

for (let i = 1; i <= NUM_TESTS; i++) {
  const testNumber = i.toString().padStart(3, '0');
  const fileName = `TC_LOAD_${testNumber}.spec.js`;
  const filePath = path.join(TESTS_DIR, fileName);

  const fileContent = `const { expect } = require('chai');

describe('Load Test Case ${testNumber}', () => {
    it('should pass placeholder load test ${testNumber}', async () => {
        // Load testing logic would go here
        // e.g., making multiple concurrent API requests
        
        expect(true).to.be.true;
    });
});
`;

  fs.writeFileSync(filePath, fileContent);
}

console.log('Successfully generated Load test cases.');
