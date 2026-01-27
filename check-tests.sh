#!/bin/bash
# Test Status Check Script

echo "================================"
echo "UNITE-HUB TEST STATUS CHECK"
echo "================================"
echo ""

echo "Running unit tests..."
echo ""

npm run test:unit -- tests/unit 2>&1 | tee test-output.log

echo ""
echo "================================"
echo "SUMMARY"
echo "================================"
echo ""

# Extract summary from output
grep -E "Test Files|Tests " test-output.log | tail -2

echo ""
echo "Test output saved to: test-output.log"
echo ""
echo "To see detailed failures, run:"
echo "  cat test-output.log | grep -A 5 'FAIL'"
echo ""
