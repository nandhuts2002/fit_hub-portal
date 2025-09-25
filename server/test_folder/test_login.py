import time
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

# Change this if using Firefox or Edge
@pytest.fixture
def driver():
    options = webdriver.ChromeOptions()
    options.add_argument("--start-maximized")
    driver = webdriver.Chrome(options=options)
    yield driver
    driver.quit()

def test_login_page_load(driver):
    driver.get("http://localhost:3000/login")
    assert "Welcome Back" in driver.page_source  # Title in your JSX
    assert driver.find_element(By.ID, "email")
    assert driver.find_element(By.ID, "password")

def test_login_validation(driver):
    driver.get("http://localhost:3000/login")
    email_input = driver.find_element(By.ID, "email")
    password_input = driver.find_element(By.ID, "password")
    submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")

    # Case 1: Empty form
    submit_btn.click()
    time.sleep(1)
    assert "Email address is required" in driver.page_source
    assert "Password is required" in driver.page_source

    # Case 2: Invalid email
    email_input.send_keys("notanemail")
    password_input.send_keys("123")
    submit_btn.click()
    time.sleep(1)
    assert "Please enter a valid email address" in driver.page_source
    assert "Password must be at least 6 characters" in driver.page_source

def test_successful_login(driver):
    driver.get("http://localhost:3000/login")
    email_input = driver.find_element(By.ID, "email")
    password_input = driver.find_element(By.ID, "password")
    submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")

    # Replace with valid test credentials in your backend DB
    email_input.send_keys("amymaria123@gmail.com")
    password_input.send_keys("Allmight@123")
    submit_btn.click()

    time.sleep(2)
    assert "user-home" in driver.current_url or "admin-home" in driver.current_url

def test_google_button_present(driver):
    driver.get("http://localhost:3000/login")
    google_btn = driver.find_element(By.XPATH, "//button[contains(., 'Continue with Google')]")
    assert google_btn.is_displayed()
