import unittest
import sys
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

class LocalLinkE2ETests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        
        # Initialize Chrome webdriver
        cls.driver = webdriver.Chrome(options=chrome_options)
        cls.driver.implicitly_wait(10)

    def test_homepage_loads(self):
        """Test that the frontend React app loads and renders properly."""
        print("Loading frontend application...")
        self.driver.get("http://localhost:3000")
        
        # Verify the title from index.html
        self.assertIn("LocalLink", self.driver.title)
        
        # Wait for the React root element to be present
        root_element = WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.ID, "root"))
        )
        self.assertIsNotNone(root_element)
        
        # Wait briefly for React to mount the RoleSelectionPage
        time.sleep(2)
        
        # Verify there is actual text content on the page (app has rendered)
        body_text = self.driver.find_element(By.TAG_NAME, "body").text
        self.assertTrue(len(body_text.strip()) > 0, "React app rendered a blank page")
        print("Frontend loaded successfully!")

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()

if __name__ == "__main__":
    # Allows it to run directly
    unittest.main()
