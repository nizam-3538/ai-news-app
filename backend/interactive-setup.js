/**
 * Interactive script to help set up API keys
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🤖 Interactive API Key Setup');
console.log('==========================');
console.log('This script will help you set up your API keys.');
console.log('You\'ll need to have your real API keys ready.');
console.log('');

// Load current .env content
const envPath = path.join(__dirname, '.env');
let envContent = fs.readFileSync(envPath, 'utf8');

console.log('Current API keys in .env file:');
const grokMatch = envContent.match(/GROK_API_KEY=(.*)/);
const geminiMatch = envContent.match(/GEMINI_API_KEY=(.*)/);

if (grokMatch) {
  const grokKey = grokMatch[1].trim();
  console.log(`GROK_API_KEY: ${grokKey.substring(0, 15)}...${grokKey.substring(grokKey.length - 10)}`);
}

if (geminiMatch) {
  const geminiKey = geminiMatch[1].trim();
  console.log(`GEMINI_API_KEY: ${geminiKey.substring(0, 15)}...${geminiKey.substring(geminiKey.length - 5)}`);
}

console.log('');

function updateApiKey(serviceName, envVarName, placeholderPattern) {
  return new Promise((resolve) => {
    rl.question(`Enter your ${serviceName} API key (or press Enter to keep current): `, (apiKey) => {
      if (apiKey.trim()) {
        // Escape special regex characters
        const escapedPattern = placeholderPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`${envVarName}=.*`, 'g');
        envContent = envContent.replace(regex, `${envVarName}=${apiKey.trim()}`);
        console.log(`✅ Updated ${serviceName} API key`);
      } else {
        console.log(`⏭️  Keeping current ${serviceName} API key`);
      }
      resolve();
    });
  });
}

async function main() {
  console.log('\n📝 Enter your API keys below:');
  console.log('(Leave blank to keep current keys)');
  
  await updateApiKey('Grok', 'GROK_API_KEY', 'sk-or-v1-e0b1a07');
  await updateApiKey('Gemini', 'GEMINI_API_KEY', 'AIzaSyAvEr55');
  
  // Write updated content back to .env file
  fs.writeFileSync(envPath, envContent);
  console.log('\n💾 Changes saved to .env file');
  
  console.log('\n🔄 Restart your server to apply changes:');
  console.log('1. Press Ctrl+C to stop the current server');
  console.log('2. Run: npm run dev');
  
  console.log('\n🧪 After restarting, verify your keys with:');
  console.log('node verify-keys.js');
  
  rl.close();
}

main();