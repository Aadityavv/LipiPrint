// Security testing utility for LipiPrint app
// This file contains test cases to verify security measures are working

import { SecurityValidator } from './security';

export class SecurityTester {
  // Test SQL injection prevention
  static testSQLInjection() {
    console.log('🔒 Testing SQL Injection Prevention...');
    
    const sqlInjectionTests = [
      "'; DROP TABLE users; --",
      "1' OR '1'='1",
      "1; INSERT INTO users VALUES ('hacker', 'password');",
      "admin'--",
      "1 UNION SELECT * FROM users",
      "1' AND 1=1--",
      "'; EXEC xp_cmdshell('dir'); --",
      "1' OR 1=1#",
      "1' UNION SELECT username,password FROM users--",
      "1' AND (SELECT COUNT(*) FROM users)>0--"
    ];

    let passed = 0;
    let failed = 0;

    sqlInjectionTests.forEach((test, index) => {
      const result = SecurityValidator.containsSQLInjection(test);
      if (result) {
        console.log(`✅ Test ${index + 1} PASSED: Blocked SQL injection: "${test}"`);
        passed++;
      } else {
        console.log(`❌ Test ${index + 1} FAILED: SQL injection not detected: "${test}"`);
        failed++;
      }
    });

    console.log(`SQL Injection Tests: ${passed} passed, ${failed} failed\n`);
    return { passed, failed, total: sqlInjectionTests.length };
  }

  // Test XSS prevention
  static testXSS() {
    console.log('🔒 Testing XSS Prevention...');
    
    const xssTests = [
      "<script>alert('XSS')</script>",
      "javascript:alert('XSS')",
      "<img src=x onerror=alert('XSS')>",
      "<iframe src=javascript:alert('XSS')></iframe>",
      "onload=alert('XSS')",
      "<svg onload=alert('XSS')>",
      "vbscript:alert('XSS')",
      "<object data=javascript:alert('XSS')></object>",
      "<link rel=stylesheet href=javascript:alert('XSS')>",
      "<meta http-equiv=refresh content=0;url=javascript:alert('XSS')>"
    ];

    let passed = 0;
    let failed = 0;

    xssTests.forEach((test, index) => {
      const result = SecurityValidator.containsXSS(test);
      if (result) {
        console.log(`✅ Test ${index + 1} PASSED: Blocked XSS: "${test}"`);
        passed++;
      } else {
        console.log(`❌ Test ${index + 1} FAILED: XSS not detected: "${test}"`);
        failed++;
      }
    });

    console.log(`XSS Tests: ${passed} passed, ${failed} failed\n`);
    return { passed, failed, total: xssTests.length };
  }

  // Test input validation
  static testInputValidation() {
    console.log('🔒 Testing Input Validation...');
    
    const validationTests = [
      {
        name: 'Phone Number Validation',
        tests: [
          { input: '9876543210', expected: true },
          { input: '1234567890', expected: false }, // Invalid starting digit
          { input: '987654321', expected: false }, // Too short
          { input: '98765432101', expected: false }, // Too long
          { input: 'abc123def', expected: false }, // Contains letters
          { input: '9876543210; DROP TABLE users;', expected: false }, // SQL injection
        ],
        validator: SecurityValidator.validatePhoneNumber
      },
      {
        name: 'Email Validation',
        tests: [
          { input: 'test@example.com', expected: true },
          { input: 'invalid-email', expected: false },
          { input: 'test@', expected: false },
          { input: '@example.com', expected: false },
          { input: 'test@example.com<script>alert("XSS")</script>', expected: false },
        ],
        validator: SecurityValidator.validateEmail
      },
      {
        name: 'Name Validation',
        tests: [
          { input: 'John Doe', expected: true },
          { input: 'John-Doe', expected: true },
          { input: 'John.Doe', expected: true },
          { input: 'John123Doe', expected: false }, // Contains numbers
          { input: 'John<script>alert("XSS")</script>Doe', expected: false },
          { input: 'A', expected: false }, // Too short
        ],
        validator: (input) => SecurityValidator.validateName(input, 'Name')
      },
      {
        name: 'Pincode Validation',
        tests: [
          { input: '123456', expected: true },
          { input: '12345', expected: false }, // Too short
          { input: '1234567', expected: false }, // Too long
          { input: '12345a', expected: false }, // Contains letters
          { input: '123456; DROP TABLE users;', expected: false },
        ],
        validator: SecurityValidator.validatePincode
      }
    ];

    let totalPassed = 0;
    let totalFailed = 0;

    validationTests.forEach((testSuite) => {
      console.log(`\n📋 ${testSuite.name}:`);
      let passed = 0;
      let failed = 0;

      testSuite.tests.forEach((test, index) => {
        const result = testSuite.validator(test.input);
        const isValid = result.isValid;
        
        if (isValid === test.expected) {
          console.log(`✅ Test ${index + 1} PASSED: "${test.input}" -> ${isValid}`);
          passed++;
        } else {
          console.log(`❌ Test ${index + 1} FAILED: "${test.input}" -> ${isValid} (expected ${test.expected})`);
          failed++;
        }
      });

      console.log(`${testSuite.name}: ${passed} passed, ${failed} failed`);
      totalPassed += passed;
      totalFailed += failed;
    });

    console.log(`\nTotal Input Validation Tests: ${totalPassed} passed, ${totalFailed} failed\n`);
    return { passed: totalPassed, failed: totalFailed, total: totalPassed + totalFailed };
  }

  // Test data sanitization
  static testDataSanitization() {
    console.log('🔒 Testing Data Sanitization...');
    
    const sanitizationTests = [
      {
        input: '<script>alert("XSS")</script>',
        expected: 'alert("XSS")'
      },
      {
        input: 'javascript:alert("XSS")',
        expected: 'alert("XSS")'
      },
      {
        input: 'onload=alert("XSS")',
        expected: 'alert("XSS")'
      },
      {
        input: 'Hello<script>World</script>',
        expected: 'HelloWorld'
      },
      {
        input: 'Normal text with < and > symbols',
        expected: 'Normal text with  and  symbols'
      }
    ];

    let passed = 0;
    let failed = 0;

    sanitizationTests.forEach((test, index) => {
      const result = SecurityValidator.sanitizeText(test.input);
      if (result === test.expected) {
        console.log(`✅ Test ${index + 1} PASSED: "${test.input}" -> "${result}"`);
        passed++;
      } else {
        console.log(`❌ Test ${index + 1} FAILED: "${test.input}" -> "${result}" (expected "${test.expected}")`);
        failed++;
      }
    });

    console.log(`Data Sanitization Tests: ${passed} passed, ${failed} failed\n`);
    return { passed, failed, total: sanitizationTests.length };
  }

  // Test rate limiting
  static testRateLimiting() {
    console.log('🔒 Testing Rate Limiting...');
    
    const rateLimiter = SecurityValidator.createRateLimiter(3, 5000); // 3 attempts per 5 seconds
    const identifier = 'test_user';
    
    let passed = 0;
    let failed = 0;

    // Test 1: First 3 attempts should be allowed
    for (let i = 1; i <= 3; i++) {
      const result = rateLimiter.checkLimit(identifier);
      if (result.allowed) {
        console.log(`✅ Attempt ${i} PASSED: Allowed (${result.remainingAttempts} remaining)`);
        passed++;
      } else {
        console.log(`❌ Attempt ${i} FAILED: Should be allowed`);
        failed++;
      }
    }

    // Test 2: 4th attempt should be blocked
    const result4 = rateLimiter.checkLimit(identifier);
    if (!result4.allowed) {
      console.log(`✅ Attempt 4 PASSED: Blocked (rate limit exceeded)`);
      passed++;
    } else {
      console.log(`❌ Attempt 4 FAILED: Should be blocked`);
      failed++;
    }

    // Test 3: Wait and test reset
    setTimeout(() => {
      const result5 = rateLimiter.checkLimit(identifier);
      if (result5.allowed) {
        console.log(`✅ Attempt 5 PASSED: Allowed after timeout`);
        passed++;
      } else {
        console.log(`❌ Attempt 5 FAILED: Should be allowed after timeout`);
        failed++;
      }
    }, 6000);

    console.log(`Rate Limiting Tests: ${passed} passed, ${failed} failed\n`);
    return { passed, failed, total: 5 };
  }

  // Run all security tests
  static runAllTests() {
    console.log('🚀 Starting Comprehensive Security Tests...\n');
    
    const results = {
      sqlInjection: this.testSQLInjection(),
      xss: this.testXSS(),
      inputValidation: this.testInputValidation(),
      dataSanitization: this.testDataSanitization(),
      rateLimiting: this.testRateLimiting()
    };

    // Calculate overall results
    const totalPassed = Object.values(results).reduce((sum, result) => sum + result.passed, 0);
    const totalFailed = Object.values(results).reduce((sum, result) => sum + result.failed, 0);
    const totalTests = totalPassed + totalFailed;

    console.log('📊 SECURITY TEST SUMMARY:');
    console.log('========================');
    console.log(`SQL Injection Prevention: ${results.sqlInjection.passed}/${results.sqlInjection.total}`);
    console.log(`XSS Prevention: ${results.xss.passed}/${results.xss.total}`);
    console.log(`Input Validation: ${results.inputValidation.passed}/${results.inputValidation.total}`);
    console.log(`Data Sanitization: ${results.dataSanitization.passed}/${results.dataSanitization.total}`);
    console.log(`Rate Limiting: ${results.rateLimiting.passed}/${results.rateLimiting.total}`);
    console.log('========================');
    console.log(`OVERALL: ${totalPassed}/${totalTests} tests passed`);
    
    if (totalFailed === 0) {
      console.log('🎉 ALL SECURITY TESTS PASSED! Your app is secure.');
    } else {
      console.log('⚠️  SOME SECURITY TESTS FAILED! Please review and fix the issues.');
    }

    return {
      totalPassed,
      totalFailed,
      totalTests,
      results
    };
  }

  // Test specific validation function
  static testValidationFunction(validator, testCases) {
    console.log(`🔒 Testing ${validator.name}...`);
    
    let passed = 0;
    let failed = 0;

    testCases.forEach((testCase, index) => {
      const result = validator(testCase.input);
      const isValid = result.isValid;
      
      if (isValid === testCase.expected) {
        console.log(`✅ Test ${index + 1} PASSED: "${testCase.input}" -> ${isValid}`);
        passed++;
      } else {
        console.log(`❌ Test ${index + 1} FAILED: "${testCase.input}" -> ${isValid} (expected ${testCase.expected})`);
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
        failed++;
      }
    });

    console.log(`${validator.name}: ${passed} passed, ${failed} failed\n`);
    return { passed, failed, total: testCases.length };
  }
}

// Export for use in development/testing
export default SecurityTester;

// Example usage in development:
// import SecurityTester from '../utils/securityTest';
// SecurityTester.runAllTests(); 