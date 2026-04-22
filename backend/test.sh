# Run regression suite with mochawesome HTML report
cd backend
npm run test:regression

# Merge all JSON reports into one HTML report
npm run report:merge
npm run report:generate

# Open the report
open reports/html/combined.html   # macOS
xdg-open reports/html/combined.html  # Linux