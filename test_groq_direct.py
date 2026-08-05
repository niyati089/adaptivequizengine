#!/usr/bin/env python3

import os
from groq import Groq

def test_groq_api():
    """Test Groq API directly"""
    
    # Set SSL certificate paths (from run_server.bat)
    os.environ['SSL_CERT_FILE'] = r'C:\Users\MORE FAMILY\AppData\Roaming\Python\Python314\site-packages\certifi\cacert.pem'
    os.environ['REQUESTS_CA_BUNDLE'] = r'C:\Users\MORE FAMILY\AppData\Roaming\Python\Python314\site-packages\certifi\cacert.pem'
    
    try:
        print("Testing Groq API connection directly...")
        api_key = os.environ.get("GROQ_API_KEY", "your-api-key-here")
        
        print("Creating Groq client...")
        # Try with custom httpx client that disables SSL verification
        import httpx
        http_client = httpx.Client(verify=False, timeout=30.0)
        client = Groq(api_key=api_key, http_client=http_client)
        print("✓ Client created successfully")
        
        print("Making API call...")
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            max_tokens=100,
            messages=[{"role": "user", "content": "Say hello"}],
            temperature=0.3,
            timeout=10.0  # Add explicit timeout
        )
        print("✓ API call successful!")
        print("Response:", response.choices[0].message.content)
        
    except Exception as e:
        print(f"✗ Error: {type(e).__name__}: {e}")
        if hasattr(e, '__cause__') and e.__cause__:
            print(f"Caused by: {type(e.__cause__).__name__}: {e.__cause__}")
        
        # Try to get more specific error info
        import traceback
        print("\nFull traceback:")
        traceback.print_exc()

if __name__ == "__main__":
    test_groq_api()