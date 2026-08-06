import requests
import json

def test_quiz_generate_endpoint():
    """Test the quiz generation endpoint that was failing"""
    
    print("Testing /api/quiz/generate endpoint...")
    
    # Test data similar to what caused the error
    test_data = {
        "topic": "Computer Science",
        "subtopic": "Programming",
        "difficulty": 0.0,
        "bloom_level": "understand",
        "previous_questions": []
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/api/quiz/generate", 
            json=test_data,
            timeout=30
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✓ Quiz generation successful!")
            data = response.json()
            print(f"Generated question: {data.get('question', 'No question')[:100]}...")
            
        elif response.status_code == 500:
            print("✗ Internal Server Error:")
            print(response.text)
            
        else:
            print(f"✗ Unexpected status code: {response.status_code}")
            print(response.text)
            
    except requests.exceptions.Timeout:
        print("✗ Request timed out")
    except requests.exceptions.ConnectionError as e:
        print(f"✗ Connection error: {e}")
    except Exception as e:
        print(f"✗ Unexpected error: {e}")

if __name__ == "__main__":
    test_quiz_generate_endpoint()