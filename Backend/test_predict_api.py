"""
Test script for the predict API
Run: python test_predict_api.py
"""

import requests
import json
from typing import Any

# API endpoint
API_URL = "http://localhost:5000/predict"

# Test data with different scenarios
test_scenarios = {
    "HIGH_RISK": {
        "location": "Lucknow",
        "speed": 120,
        "speed_limit": 65,
        "rain": 1,  # True
        "fog": 1,  # True
        "visibility": 10,  # Low
        "traffic_density": 85,  # High
        "time_of_day": "night",  # Night time
        "day_type": "Monday",  # Weekday
        "is_rush_hour": 1,  # True
        "road_condition": "slippery",  # Bad condition
        "area_previous_accidents": 15,  # Many
        "vehicle_condition": "poor",  # Poor condition
        "bad_weather": 1,  # True
        "is_weekend": 0,  # False
    },
    "MEDIUM_RISK": {
        "location": "Kanpur",
        "speed": 45,
        "speed_limit": 50,
        "rain": 0,  # False
        "fog": 0,  # False
        "visibility": 100,  # Good
        "traffic_density": 50,  # Moderate
        "time_of_day": "afternoon",  # Afternoon
        "day_type": "Saturday",  # Weekend
        "is_rush_hour": 0,  # False
        "road_condition": "wet",  # Moderate condition
        "area_previous_accidents": 5,  # Few
        "vehicle_condition": "average",  # Average condition
        "bad_weather": 0,  # False
        "is_weekend": 1,  # True
    },
    "LOW_RISK": {
        "location": "Agra",
        "speed": 30,
        "speed_limit": 55,
        "rain": 0,  # False
        "fog": 0,  # False
        "visibility": 200,  # Excellent
        "traffic_density": 10,  # Low
        "time_of_day": "morning",  # Morning
        "day_type": "Tuesday",  # Weekday
        "is_rush_hour": 0,  # False
        "road_condition": "good",  # Good condition
        "area_previous_accidents": 1,  # Very few
        "vehicle_condition": "good",  # Good condition
        "bad_weather": 0,  # False
        "is_weekend": 0,  # False
    },
}


def test_single_prediction(scenario_name: str, data: dict[str, Any]):
    """Test a single prediction"""
    print(f"\n{'='*60}")
    print(f"Testing: {scenario_name}")
    print(f"{'='*60}")
    
    print(f"\nRequest Data:")
    print(json.dumps(data, indent=2))
    
    try:
        response = requests.post(API_URL, json=data, timeout=5)
        response.raise_for_status()
        
        result = response.json()
        print(f"\nResponse Status: {response.status_code}")
        print(f"Response Data:")
        print(json.dumps(result, indent=2))
        
        if "predictions" in result:
            prediction = result["predictions"][0]
            print(f"\n📊 Summary:")
            print(f"   Prediction: {prediction.get('prediction')}")
            print(f"   Risk Percentage: {prediction.get('risk_percentage')}%")
            print(f"   Probabilities: {prediction.get('probabilities')}")
        
        return True
    
    except requests.exceptions.ConnectionError:
        print(f"\n❌ Connection Error: Could not connect to {API_URL}")
        print("   Make sure the Flask server is running!")
        return False
    except requests.exceptions.HTTPError as e:
        print(f"\n❌ HTTP Error: {e.response.status_code}")
        print(f"   Response: {e.response.json()}")
        return False
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return False


def test_batch_prediction():
    """Test batch prediction with multiple scenarios"""
    print(f"\n{'='*60}")
    print("Testing: BATCH PREDICTION (All scenarios)")
    print(f"{'='*60}")
    
    batch_data = [
        test_scenarios["HIGH_RISK"],
        test_scenarios["MEDIUM_RISK"],
        test_scenarios["LOW_RISK"],
    ]
    
    print(f"\nRequest Data (3 items):")
    print(json.dumps(batch_data, indent=2)[:500] + "...\n")
    
    try:
        response = requests.post(API_URL, json=batch_data, timeout=5)
        response.raise_for_status()
        
        result = response.json()
        print(f"\nResponse Status: {response.status_code}")
        print(f"Total Predictions: {result.get('count')}")
        
        for i, prediction in enumerate(result.get("predictions", []), 1):
            scenario_names = ["HIGH_RISK", "MEDIUM_RISK", "LOW_RISK"]
            print(f"\n  [{i}] {scenario_names[i-1]}")
            print(f"      Prediction: {prediction.get('prediction')}")
            print(f"      Risk: {prediction.get('risk_percentage')}%")
        
        return True
    
    except requests.exceptions.ConnectionError:
        print(f"\n❌ Connection Error: Could not connect to {API_URL}")
        return False
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return False


if __name__ == "__main__":
    print("\n🚗 SERS Accident Risk Prediction API - Test Suite")
    print("=" * 60)
    
    # Test individual scenarios
    all_passed = True
    for scenario_name, scenario_data in test_scenarios.items():
        if not test_single_prediction(scenario_name, scenario_data):
            all_passed = False
    
    # Test batch prediction
    if all_passed:
        if not test_batch_prediction():
            all_passed = False
    
    # Summary
    print(f"\n{'='*60}")
    if all_passed:
        print("✅ All tests completed! Check the results above.")
    else:
        print("❌ Tests failed. Check the error messages above.")
    print(f"{'='*60}\n")
