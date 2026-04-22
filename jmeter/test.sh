rm -f jmeter/results/*.jtl
rm -rf jmeter/results/html_report
mkdir -p jmeter/results

# 6. Run JMeter with user.properties
jmeter -n \
  -t jmeter/hmis_stress_plan.jmx \
  -q jmeter/user.properties \
  -l jmeter/results/hmis_results.jtl \
  -e \
  -o jmeter/results/html_report

# 7. Open the HTML dashboard
xdg-open jmeter/results/html_report/index.html
