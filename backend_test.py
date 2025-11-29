#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class AstrologyAPITester:
    def __init__(self, base_url="https://cosmic-calculator-7.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json()
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text[:200]}"
                self.log_test(name, False, error_msg)
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Request failed: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_location_search(self):
        """Test location search functionality"""
        test_data = {"query": "Київ"}
        success, response = self.run_test(
            "Location Search - Kyiv", 
            "POST", 
            "locations/search", 
            200, 
            data=test_data
        )
        
        if success and isinstance(response, list) and len(response) > 0:
            print(f"   Found {len(response)} locations")
            return True, response[0]  # Return first location for chart creation
        return False, {}

    def test_admin_register(self):
        """Test admin registration"""
        admin_data = {
            "username": f"testadmin_{datetime.now().strftime('%H%M%S')}",
            "password": "TestPassword123!"
        }
        
        success, response = self.run_test(
            "Admin Registration",
            "POST",
            "admin/register",
            200,
            data=admin_data
        )
        
        if success and 'token' in response:
            self.admin_token = response['token']
            print(f"   Admin token obtained: {self.admin_token[:20]}...")
            return True, admin_data
        return False, {}

    def test_admin_login(self, admin_data):
        """Test admin login with existing credentials"""
        success, response = self.run_test(
            "Admin Login",
            "POST", 
            "admin/login",
            200,
            data=admin_data
        )
        
        if success and 'token' in response:
            self.admin_token = response['token']
            return True
        return False

    def test_natal_chart_creation(self, location_data):
        """Test natal chart creation"""
        chart_data = {
            "name": "Test Person",
            "birth_date": "1990-05-15",
            "birth_time": "14:30",
            "birth_location": location_data.get('display_name', 'Київ, Україна'),
            "latitude": location_data.get('lat', 50.4501),
            "longitude": location_data.get('lon', 30.5234)
        }
        
        success, response = self.run_test(
            "Natal Chart Creation",
            "POST",
            "natal-charts",
            200,
            data=chart_data
        )
        
        if success and 'id' in response:
            print(f"   Chart created with ID: {response['id']}")
            print(f"   Planets count: {len(response.get('planets', []))}")
            print(f"   Houses count: {len(response.get('houses', []))}")
            print(f"   Aspects count: {len(response.get('aspects', []))}")
            return True, response['id']
        return False, None

    def test_get_natal_charts(self):
        """Test getting all natal charts"""
        success, response = self.run_test(
            "Get All Natal Charts",
            "GET",
            "natal-charts",
            200
        )
        
        if success:
            print(f"   Found {len(response)} charts")
            return True, response
        return False, []

    def test_get_natal_chart_by_id(self, chart_id):
        """Test getting specific natal chart"""
        success, response = self.run_test(
            "Get Natal Chart by ID",
            "GET",
            f"natal-charts/{chart_id}",
            200
        )
        
        if success:
            print(f"   Chart name: {response.get('name')}")
            return True
        return False

    def test_delete_natal_chart(self, chart_id):
        """Test deleting natal chart"""
        return self.run_test(
            "Delete Natal Chart",
            "DELETE",
            f"natal-charts/{chart_id}",
            200
        )[0]

    def test_create_interpretation(self):
        """Test creating interpretation (requires admin token)"""
        if not self.admin_token:
            self.log_test("Create Interpretation", False, "No admin token available")
            return False, None
            
        interp_data = {
            "category": "planet_in_sign",
            "key": "sun_in_gemini_test",
            "title": "Сонце в Близнюках (Тест)",
            "content": "Тестове тлумачення для Сонця в Близнюках."
        }
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        success, response = self.run_test(
            "Create Interpretation",
            "POST",
            "interpretations",
            200,
            data=interp_data,
            headers=headers
        )
        
        if success and 'id' in response:
            print(f"   Interpretation created with ID: {response['id']}")
            return True, response['id']
        return False, None

    def test_get_interpretations(self):
        """Test getting all interpretations"""
        success, response = self.run_test(
            "Get All Interpretations",
            "GET",
            "interpretations",
            200
        )
        
        if success:
            print(f"   Found {len(response)} interpretations")
            return True, response
        return False, []

    def test_get_interpretation_by_id(self, interp_id):
        """Test getting specific interpretation"""
        success, response = self.run_test(
            "Get Interpretation by ID",
            "GET",
            f"interpretations/{interp_id}",
            200
        )
        
        if success:
            print(f"   Interpretation title: {response.get('title')}")
            return True
        return False

    def test_update_interpretation(self, interp_id):
        """Test updating interpretation"""
        if not self.admin_token:
            self.log_test("Update Interpretation", False, "No admin token available")
            return False
            
        update_data = {
            "title": "Сонце в Близнюках (Оновлено)",
            "content": "Оновлене тестове тлумачення для Сонця в Близнюках."
        }
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        return self.run_test(
            "Update Interpretation",
            "PUT",
            f"interpretations/{interp_id}",
            200,
            data=update_data,
            headers=headers
        )[0]

    def test_delete_interpretation(self, interp_id):
        """Test deleting interpretation"""
        if not self.admin_token:
            self.log_test("Delete Interpretation", False, "No admin token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        return self.run_test(
            "Delete Interpretation",
            "DELETE",
            f"interpretations/{interp_id}",
            200,
            headers=headers
        )[0]

    def run_all_tests(self):
        """Run comprehensive API test suite"""
        print("🚀 Starting Astrology API Test Suite")
        print(f"   Base URL: {self.base_url}")
        print("=" * 60)

        # Test basic API
        self.test_root_endpoint()
        
        # Test location search
        location_success, location_data = self.test_location_search()
        
        # Test admin functionality
        admin_success, admin_data = self.test_admin_register()
        if admin_success:
            self.test_admin_login(admin_data)
        
        # Test natal chart functionality
        chart_id = None
        if location_success:
            chart_success, chart_id = self.test_natal_chart_creation(location_data)
            
        self.test_get_natal_charts()
        
        if chart_id:
            self.test_get_natal_chart_by_id(chart_id)
            self.test_delete_natal_chart(chart_id)
        
        # Test interpretation functionality
        interp_id = None
        if admin_success:
            interp_success, interp_id = self.test_create_interpretation()
            
        self.test_get_interpretations()
        
        if interp_id:
            self.test_get_interpretation_by_id(interp_id)
            self.test_update_interpretation(interp_id)
            self.test_delete_interpretation(interp_id)

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("❌ Some tests failed")
            print("\nFailed tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   - {result['name']}: {result['details']}")
            return 1

def main():
    tester = AstrologyAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())