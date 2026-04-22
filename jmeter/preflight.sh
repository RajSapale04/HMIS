#!/bin/bash
echo "=== HMIS JMeter Pre-flight Check ==="

PASS=0
FAIL=0

# 1. Backend running?
echo -n "[1] Backend on localhost:5000 ... "
if curl -s --max-time 3 http://localhost:5000/api/auth/login \
     -X POST -H "Content-Type: application/json" \
     -d '{"email":"admin@hmis.com","password":"Admin@1234"}' \
     | grep -q "token"; then
  echo "OK — login returned token"
  PASS=$((PASS+1))
else
  echo "FAIL — backend not responding or seed data missing"
  echo "  → Run: cd backend && npm run dev"
  echo "  → Run: node backend/seeders/seed.js"
  FAIL=$((FAIL+1))
fi

# 2. MongoDB running?
echo -n "[2] MongoDB reachable ... "
if mongosh --eval "db.runCommand({ping:1})" --quiet > /dev/null 2>&1; then
  echo "OK"
  PASS=$((PASS+1))
else
  echo "FAIL — MongoDB not running"
  echo "  → Run: mongod --dbpath /data/db"
  FAIL=$((FAIL+1))
fi

# 3. JMeter installed?
echo -n "[3] JMeter installed ... "
if command -v jmeter &> /dev/null; then
  echo "OK ($(jmeter --version 2>&1 | head -1))"
  PASS=$((PASS+1))
else
  echo "FAIL — jmeter not in PATH"
  echo "  → Download from https://jmeter.apache.org/download_jmeter.cgi"
  echo "  → Add bin/ to your PATH"
  FAIL=$((FAIL+1))
fi

# 4. Old results cleaned?
echo -n "[4] Stale .jtl files ... "
if ls jmeter/results/*.jtl 2>/dev/null | grep -q .; then
  echo "WARNING — found stale .jtl files, deleting..."
  rm -f jmeter/results/*.jtl
  rm -rf jmeter/results/html_report
  echo "  Cleaned."
else
  echo "OK — results dir is clean"
fi
PASS=$((PASS+1))

# 5. user.properties present?
echo -n "[5] user.properties present ... "
if [ -f "jmeter/user.properties" ]; then
  echo "OK"
  PASS=$((PASS+1))
else
  echo "FAIL — jmeter/user.properties missing"
  FAIL=$((FAIL+1))
fi

echo ""
echo "=== Result: $PASS passed, $FAIL failed ==="
if [ $FAIL -gt 0 ]; then
  echo "Fix the failures above before running JMeter."
  exit 1
else
  echo "All checks passed — safe to run JMeter."
  exit 0
fi