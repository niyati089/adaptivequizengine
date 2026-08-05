import requests
import json

def test_dag_endpoint():
    """Test the DAG generation endpoint"""
    
    # Test the basic test endpoint first
    try:
        print("Testing /api/dag/test endpoint...")
        response = requests.get("http://localhost:8000/api/dag/test", timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✓ DAG module is working correctly")
        else:
            print(f"✗ Test failed: {response.text}")
    except Exception as e:
        print(f"✗ Error testing /api/dag/test: {e}")
        return False
    
    print("\n" + "="*50 + "\n")
    
    # Test the actual DAG generation endpoint with a simple topic
    try:
        print("Testing /api/dag/generate endpoint with simple topic...")
        response = requests.get("http://localhost:8000/api/dag/generate?topic=Addition", timeout=30)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✓ DAG generation successful!")
            data = response.json()
            print(f"Generated {len(data.get('subtopics', []))} subtopics")
        else:
            print(f"✗ Error Response: {response.text}")
            
            # Try to get more details about the error
            if "Connection error" in response.text:
                print("\n🔍 Connection error detected. This might be:")
                print("  - SSL certificate issues")
                print("  - Network connectivity problems") 
                print("  - Groq API service issues")
                print("  - Firewall blocking the connection")
                
    except requests.exceptions.Timeout:
        print("✗ Request timed out - the API call is taking too long")
    except requests.exceptions.ConnectionError as e:
        print(f"✗ Connection error: {e}")
    except Exception as e:
        print(f"✗ Unexpected error: {e}")

if __name__ == "__main__":
    test_dag_endpoint()