#!/usr/bin/env node

/**
 * Build verification script for AI News Aggregator
 * Checks that all components are properly configured for deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 AI News Aggregator - Build Verification\n');

const checks = [
  {
    name: 'Backend Package.json',
    path: path.join(__dirname, 'backend', 'package.json'),
    check: (content) => {
      const pkg = JSON.parse(content);
      return pkg.scripts && pkg.scripts.start && pkg.dependencies;
    }
  },
  {
    name: 'Frontend Package.json', 
    path: path.join(__dirname, 'frontend', 'package.json'),
    check: (content) => {
      const pkg = JSON.parse(content);
      return pkg.scripts && pkg.scripts.build;
    }
  },
  {
    name: 'Environment Variables',
    path: path.join(__dirname, 'backend', '.env'),
    check: (content) => {
      return content.includes('MONGODB_URI') && 
             content.includes('GEMINI_API_KEY') &&
             content.includes('JWT_SECRET');
    }
  },
  {
    name: 'Main Server File',
    path: path.join(__dirname, 'backend', 'test-server-simple.js'),
    check: (content) => {
      return content.includes('express') && 
             content.includes('mongoose') &&
             content.includes('cors');
    }
  },
  {
    name: 'Frontend Index',
    path: path.join(__dirname, 'frontend', 'index.html'),
    check: (content) => {
      return content.includes('AI News Aggregator') && 
             content.includes('bootstrap');
    }
  },
  {
    name: 'Vercel Config',
    path: path.join(__dirname, 'backend', 'vercel.json'),
    check: (content) => {
      const config = JSON.parse(content);
      return config.version === 2 && config.builds;
    }
  }
];

let allPassed = true;

checks.forEach(({ name, path: filePath, check }) => {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const passed = check(content);
      console.log(`${passed ? '✅' : '❌'} ${name}`);
      if (!passed) allPassed = false;
    } else {
      console.log(`❌ ${name} - File not found`);
      allPassed = false;
    }
  } catch (error) {
    console.log(`❌ ${name} - Error: ${error.message}`);
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('🎉 All checks passed! Ready for deployment.');
  console.log('\nNext steps:');
  console.log('1. Get Google OAuth credentials');
  console.log('2. Deploy with: vercel');
  console.log('3. Test your live app!');
} else {
  console.log('⚠️  Some issues found. Please fix them before deployment.');
}
console.log('='.repeat(50));

process.exit(allPassed ? 0 : 1);