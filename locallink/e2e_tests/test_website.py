import unittest
import sys
import os
import datetime
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import openpyxl

class LocalLinkE2ETests(unittest.TestCase):
    results = []

    @classmethod
    def setUpClass(cls):
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        
        # Initialize Chrome webdriver
        cls.driver = webdriver.Chrome(options=chrome_options)
        cls.driver.implicitly_wait(10)

    def log_result(self, step_name, status, message):
        """Helper to log the result of each step"""
        print(f"[{status}] {step_name}: {message}")
        self.__class__.results.append({
            "Timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "Step Name": step_name,
            "Status": status,
            "Message": message
        })

    def test_homepage_loads(self):
        """Test that the frontend React app loads and renders properly."""
        print("Loading frontend application...")
        try:
            self.driver.get("http://localhost:3000")
            
            # Verify the title from index.html
            self.assertIn("LocalLink", self.driver.title)
            self.log_result("Check Title", "PASS", "Title contained 'LocalLink'")
            
            # Wait for the React root element to be present
            root_element = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.ID, "root"))
            )
            self.assertIsNotNone(root_element)
            self.log_result("Check Root Element", "PASS", "React root element found")
            
            # Wait briefly for React to mount the RoleSelectionPage
            time.sleep(2)
            
            # Verify there is actual text content on the page (app has rendered)
            body_text = self.driver.find_element(By.TAG_NAME, "body").text
            self.assertTrue(len(body_text.strip()) > 0, "React app rendered a blank page")
            self.log_result("Check Body Content", "PASS", "Body contains text content")
            
            print("Frontend loaded successfully!")
        except Exception as e:
            self.log_result("E2E Test Failure", "FAIL", str(e))
            raise e

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()
        cls.save_results_to_excel()

    @classmethod
    def save_results_to_excel(cls):
        # Create results directory inside the project folder
        results_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "results")
        os.makedirs(results_dir, exist_ok=True)
        
        # Create a new Workbook using openpyxl
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "E2E Test Results"
        
        # Write Headers
        headers = ["Timestamp", "Step Name", "Status", "Message"]
        ws.append(headers)
        
        # Write Data
        for row in cls.results:
            ws.append([row["Timestamp"], row["Step Name"], row["Status"], row["Message"]])
            
        file_path = os.path.join(results_dir, "test_results.xlsx")
        wb.save(file_path)
        print(f"\n✅ Test results successfully saved to: {file_path}")

if __name__ == "__main__":
    unittest.main()
