@echo off
echo 🔍 Checking Agent Hub Services Status...
echo.

echo 📊 Backend API Health Check:
curl -s http://localhost:3002/health
echo.
echo.

echo 🧪 Testing NLP Templates Endpoint:
curl -s http://localhost:3002/api/v1/nlp/templates | findstr "success"
echo.
echo.

echo 🔒 Testing Security Policies Endpoint:
curl -s http://localhost:3002/api/v1/security/policies | findstr "success"
echo.
echo.

echo ✅ Service Status Check Complete!
echo.
echo If you see "success":true in the responses above, your services are running correctly.
echo.
pause