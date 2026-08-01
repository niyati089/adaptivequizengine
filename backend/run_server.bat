@echo off
set SSL_CERT_FILE=C:\Users\MORE FAMILY\AppData\Roaming\Python\Python314\site-packages\certifi\cacert.pem
set REQUESTS_CA_BUNDLE=C:\Users\MORE FAMILY\AppData\Roaming\Python\Python314\site-packages\certifi\cacert.pem
echo SSL certificates configured
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
