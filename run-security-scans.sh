#!/bin/bash
echo "Running local security scans for LocalLink..."

mkdir -p "Security Reports"

echo "1. Running npm audit (Frontend)..."
cd locallink/frontend
npm audit --json > "../../Security Reports/npm-audit-frontend.json" || echo "Frontend npm audit found issues (see report)."
cd ../..

echo "2. Running npm audit (Backend)..."
cd locallink/backend-node
npm audit --json > "../../Security Reports/npm-audit-backend.json" || echo "Backend npm audit found issues (see report)."
cd ../..

echo "3. Running pip-audit (Python Backend)..."
cd locallink/backend
pip install pip-audit
pip-audit -r requirements.txt -f json -o "../../Security Reports/pip-audit-report.json" || echo "pip-audit found issues (see report)."
cd ../..

echo "4. Running Bandit (Python Backend)..."
cd locallink/backend
pip install bandit
bandit -r . -f json -o "../../Security Reports/bandit-report.json" || echo "Bandit found issues (see report)."
cd ../..

echo "5. Running ESLint Security Rules..."
cd locallink/backend-node
npm run lint:security > "../../Security Reports/eslint-backend.txt" || echo "ESLint backend found issues."
cd ../frontend
npm run lint:security > "../../Security Reports/eslint-frontend.txt" || echo "ESLint frontend found issues."
cd ../..

echo "Local security scans completed! Check the 'Security Reports' directory."
