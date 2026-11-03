const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const API_BASE = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function run() {
  console.log('====================================================');
  console.log('🧪 TESTING BULK STUDENT ACTIVATION & PASSWORD FLOW');
  console.log('====================================================\n');

  // 1. Admin Login
  console.log('1. Admin Login...');
  const adminLogin = await request('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@institution.edu', password: 'admin123' }),
  });
  if (!adminLogin.ok) throw new Error(`Admin login failed: ${JSON.stringify(adminLogin.data)}`);
  const adminToken = adminLogin.data.token;
  console.log('✓ Admin login successful.\n');

  // 2. Test Bulk Activation for ALL students
  console.log('2. Running Bulk Activation for ALL students (target_type: "all")...');
  const bulkRes = await request('/admin/students/bulk-activate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      target_type: 'all',
      password_type: 'unique',
    }),
  });

  if (!bulkRes.ok) {
    throw new Error(`Bulk activation failed: ${JSON.stringify(bulkRes.data)}`);
  }

  console.log(`✓ Bulk Activation Success Message: "${bulkRes.data.message}"`);
  console.log(`✓ Total Students Processed: ${bulkRes.data.count}`);
  console.log('Sample Generated Credentials:');
  bulkRes.data.credentials.slice(0, 3).forEach((c, idx) => {
    console.log(`   [${idx + 1}] ${c.full_name} (${c.roll_number}) -> Temp Password: "${c.temp_password}"`);
  });
  console.log('\n');

  // 3. Verify that Mahi Sharma and other students can log in with their generated bulk passwords
  console.log('3. Verifying login for all generated credentials...');
  for (const cred of bulkRes.data.credentials) {
    const studentLogin = await request('/auth/student/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: cred.roll_number, password: cred.temp_password }),
    });
    if (!studentLogin.ok) {
      throw new Error(`Failed to log in as ${cred.full_name} (${cred.roll_number}) with temp password ${cred.temp_password}: ${JSON.stringify(studentLogin.data)}`);
    }
    if (!studentLogin.data.must_change_password) {
      throw new Error(`must_change_password is not true for ${cred.full_name}`);
    }
    console.log(`   ✓ Verified login for: ${cred.full_name} (${cred.roll_number}) - must_change_password: ${studentLogin.data.must_change_password}`);
  }
  console.log('✓ All students successfully logged in with generated temporary passwords!\n');

  // 4. Test target_type: 'selected'
  console.log('4. Testing Bulk Activation for specific SELECTED students...');
  const mahiCred = bulkRes.data.credentials.find(c => c.roll_number === 'A60205224158');
  const selectedRes = await request('/admin/students/bulk-activate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      target_type: 'selected',
      student_ids: [mahiCred.id],
      password_type: 'unique',
    }),
  });
  if (!selectedRes.ok) {
    throw new Error(`Selected bulk activation failed: ${JSON.stringify(selectedRes.data)}`);
  }
  console.log(`✓ Selected bulk activation successful for ${selectedRes.data.count} students: New password: ${selectedRes.data.credentials[0].temp_password}\n`);

  console.log('====================================================');
  console.log('🎉 ALL BULK ACTIVATION TESTS PASSED PERFECTLY!');
  console.log('====================================================');
}

run().catch(err => {
  console.error('❌ BULK TEST FAILED:', err);
  process.exit(1);
});

