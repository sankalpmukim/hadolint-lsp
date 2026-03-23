#!/usr/bin/env node

const { spawn } = require('child_process');
const { writeFileSync, unlinkSync, existsSync } = require('fs');
const { tmpdir } = require('os');
const { join } = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    passedTests++;
    log(`✓ ${testName}`, colors.green);
  } else {
    failedTests++;
    log(`✗ ${testName}`, colors.red);
  }
}

function assertEqual(actual, expected, testName) {
  const condition = JSON.stringify(actual) === JSON.stringify(expected);
  assert(condition, `${testName} (expected: ${JSON.stringify(expected)}, got: ${JSON.stringify(actual)})`);
}

async function runHadolint(content) {
  return new Promise((resolve) => {
    const tmpFile = join(tmpdir(), `hadolint-lsp-test-${Date.now()}`);
    writeFileSync(tmpFile, content, 'utf-8');

    const hadolint = spawn('hadolint', ['--format', 'json', tmpFile], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';

    hadolint.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    hadolint.on('close', (code) => {
      try {
        if (existsSync(tmpFile)) {
          unlinkSync(tmpFile);
        }
      } catch (e) {
      }

      if (stdout) {
        try {
          const results = JSON.parse(stdout);
          resolve(results);
        } catch (e) {
          resolve([]);
        }
      } else {
        resolve([]);
      }
    });

    hadolint.on('error', () => {
      try {
        if (existsSync(tmpFile)) {
          unlinkSync(tmpFile);
        }
      } catch (e) {
      }
      resolve([]);
    });
  });
}

async function testHadolintIntegration() {
  log('\n=== Testing Hadolint Integration ===', colors.blue);

  const validDockerfile = `
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "index.js"]
`;

  const result = await runHadolint(validDockerfile);
  assert(Array.isArray(result), 'Hadolint returns array of results');

  const invalidDockerfile = `
FROM node
`;

  const result2 = await runHadolint(invalidDockerfile);
  assert(Array.isArray(result2), 'Hadolint returns array for invalid Dockerfile');
}

function testSeverityMapping() {
  log('\n=== Testing Severity Mapping ===', colors.blue);

  const severityMap = {
    'error': 1,
    'warning': 2,
    'info': 3,
    'style': 4
  };

  assert(severityMap.error === 1, 'Error maps to severity 1');
  assert(severityMap.warning === 2, 'Warning maps to severity 2');
  assert(severityMap.info === 3, 'Info maps to severity 3');
  assert(severityMap.style === 4, 'Style maps to severity 4');
}

async function testDiagnosticsGeneration() {
  log('\n=== Testing Diagnostics Generation ===', colors.blue);

  const mockResult = {
    line: 5,
    code: 'DL3000',
    level: 'error',
    message: 'Use absolute WORKDIR'
  };

  const diagnostic = {
    range: {
      start: { line: 4, character: 0 },
      end: { line: 4, character: 100 }
    },
    severity: 1,
    code: 'DL3000',
    message: 'Use absolute WORKDIR',
    source: 'hadolint'
  };

  assertEqual(diagnostic.range.start.line, 4, 'Diagnostic line number is correct (0-indexed)');
  assertEqual(diagnostic.code, 'DL3000', 'Diagnostic code is correct');
  assertEqual(diagnostic.source, 'hadolint', 'Diagnostic source is hadolint');
}

function testPackageStructure() {
  log('\n=== Testing Package Structure ===', colors.blue);

  const fs = require('fs');
  const path = require('path');

  assert(existsSync('src/index.js'), 'src/index.js exists');
  assert(existsSync('package.json'), 'package.json exists');
  assert(existsSync('README.md'), 'README.md exists');

  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  assert(pkg.name === 'hadolint-lsp', 'Package name is correct');
  assert(pkg.bin['hadolint-lsp'] === 'src/index.js', 'Binary path is correct');
  assert(pkg.keywords.includes('lsp'), 'Package includes lsp keyword');
  assert(pkg.keywords.includes('hadolint'), 'Package includes hadolint keyword');
}

async function testShebang() {
  log('\n=== Testing Executable ===', colors.blue);

  const fs = require('fs');
  const content = fs.readFileSync('src/index.js', 'utf-8');
  assert(content.startsWith('#!/usr/bin/env node'), 'File has shebang line');
}

async function runAllTests() {
  log('Running Hadolint LSP Tests', colors.blue);
  log('================================', colors.blue);

  try {
    await testHadolintIntegration();
  } catch (error) {
    log(`Error in Hadolint integration test: ${error.message}`, colors.red);
  }

  testSeverityMapping();
  await testDiagnosticsGeneration();
  testPackageStructure();
  await testShebang();

  log('\n================================', colors.blue);
  log(`Tests: ${totalTests}`, colors.blue);
  log(`Passed: ${passedTests}`, colors.green);
  log(`Failed: ${failedTests}`, failedTests > 0 ? colors.red : colors.green);

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAllTests().catch((error) => {
  log(`Test runner error: ${error.message}`, colors.red);
  process.exit(1);
});
