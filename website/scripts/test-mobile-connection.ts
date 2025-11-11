/**
 * Test script to verify mobile app can connect to backend
 * Run: tsx scripts/test-mobile-connection.ts
 */

import { execSync } from 'child_process';
import * as os from 'os';

const BACKEND_PORT = 3004;
const BACKEND_URL = `http://192.168.1.15:${BACKEND_PORT}`;
const API_URL = `${BACKEND_URL}/api`;

console.log('🔍 Testing Mobile App Connection to Backend\n');
console.log('='.repeat(60));

// Get network interfaces
console.log('\n📡 Network Interfaces:');
const interfaces = os.networkInterfaces();
let foundIP = false;

for (const [name, addresses] of Object.entries(interfaces)) {
  if (!addresses) continue;
  for (const addr of addresses) {
    if (addr.family === 'IPv4' && !addr.internal) {
      console.log(`  ${name}: ${addr.address}`);
      if (addr.address === '192.168.1.15') {
        foundIP = true;
      }
    }
  }
}

if (!foundIP) {
  console.log('\n⚠️  WARNING: IP address 192.168.1.15 not found in network interfaces!');
  console.log('   Your computer\'s IP may have changed.');
  console.log('   Update mobile/app.json with the correct IP address.\n');
}

// Test backend connectivity
console.log('\n🌐 Testing Backend Connectivity:');
console.log(`   Backend URL: ${BACKEND_URL}`);
console.log(`   API URL: ${API_URL}`);

try {
  // Test if port is listening
  console.log('\n📊 Checking if port is listening...');
  const netstat = execSync(`netstat -an | findstr :${BACKEND_PORT}`, { encoding: 'utf-8' });
  
  if (netstat.includes(`0.0.0.0:${BACKEND_PORT}`)) {
    console.log('   ✅ Port is listening on 0.0.0.0 (all interfaces)');
  } else if (netstat.includes(`127.0.0.1:${BACKEND_PORT}`)) {
    console.log('   ⚠️  Port is ONLY listening on 127.0.0.1 (localhost)');
    console.log('   ❌ Mobile devices cannot connect!');
    console.log('   Fix: Run "npm run dev:mobile" with -H 0.0.0.0 flag');
  } else if (netstat.includes(`:${BACKEND_PORT}`)) {
    console.log('   ⚠️  Port is listening but interface is unclear');
    console.log(`   Output: ${netstat.trim()}`);
  } else {
    console.log('   ❌ Port is NOT listening!');
    console.log('   Fix: Start backend with "npm run dev:mobile"');
  }
} catch (error) {
  console.log('   ❌ Could not check port status');
  console.log('   (This is okay, continuing with HTTP test...)');
}

// Test HTTP endpoint
console.log('\n🔌 Testing HTTP Endpoint:');
try {
  const response = await fetch(`${API_URL}/auth/session`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  const data = await response.json();
  
  if (response.ok || response.status === 401) {
    console.log('   ✅ Backend is reachable!');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
  } else {
    console.log(`   ⚠️  Backend responded with status: ${response.status}`);
  }
} catch (error: any) {
  console.log('   ❌ Cannot reach backend!');
  console.log(`   Error: ${error.message}`);
  
  if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
    console.log('\n   Possible issues:');
    console.log('   1. Backend is not running');
    console.log('   2. Backend is only listening on localhost');
    console.log('   3. Windows Firewall is blocking the connection');
    console.log('   4. Wrong IP address in mobile/app.json');
  }
}

// Check Windows Firewall
console.log('\n🔥 Windows Firewall Check:');
console.log('   Run this command to check firewall rules:');
console.log('   netsh advfirewall firewall show rule name=all | findstr Node');

console.log('\n' + '='.repeat(60));
console.log('\n✅ Diagnostic complete!');
console.log('\nNext steps:');
console.log('1. Ensure backend is running: cd website && npm run dev:mobile');
console.log('2. Verify it shows: "Ready on http://0.0.0.0:3004"');
console.log('3. Test from phone browser: http://192.168.1.15:3004/api/auth/session');
console.log('4. If phone can\'t reach, check Windows Firewall settings\n');

