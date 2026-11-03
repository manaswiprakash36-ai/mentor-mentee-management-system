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

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING STUDENT ACCOUNT ACTIVATION & LOGIN TESTS');
  console.log('====================================================\n');

  // STEP 1: Admin Login
  console.log('Step 1: Admin Login...');
  const adminLogin = await request('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@institution.edu', password: 'admin123' }),
  });
  if (!adminLogin.ok) {
    throw new Error(`Admin login failed: ${JSON.stringify(adminLogin.data)}`);
  }
  const adminToken = adminLogin.data.token;
  console.log('✓ Admin login successful. Token acquired.\n');

  // STEP 2: Fetch Mahi Sharma before activation
  console.log('Step 2: Inspect Mahi Sharma via Admin Students API...');
  const mahiQuery = await request('/admin/students?search=A60205224158', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!mahiQuery.ok || !mahiQuery.data.students || mahiQuery.data.students.length === 0) {
    throw new Error(`Could not find Mahi Sharma in Admin Students API: ${JSON.stringify(mahiQuery.data)}`);
  }
  const mahiBefore = mahiQuery.data.students[0];
  console.log(`Found student: ${mahiBefore.full_name} (ID: ${mahiBefore.id}, Roll: ${mahiBefore.roll_number})`);
  console.log(`Account Status: ${mahiBefore.account_status}, Has Password: ${mahiBefore.has_password}`);
  if (mahiBefore.account_status !== 'not_activated' || mahiBefore.has_password) {
    console.log('Note: Mahi Sharma had existing password state. Resetting to NULL for clean test...');
    const { Pool } = require('pg');
    const pool = new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
    });
    await pool.query("UPDATE public.mentees SET password_hash = NULL, account_status = 'not_activated', must_change_password = false WHERE id = '8'");
    await pool.end();
    console.log('✓ Reset Mahi Sharma to not_activated.');
  }

  // STEP 3: Attempt login as Mahi Sharma before activation
  console.log('\nStep 3: Testing login before activation (should be rejected with 403)...');
  const loginBefore = await request('/auth/student/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'A60205224158', password: 'AnyPassword123!' }),
  });
  console.log(`Response status: ${loginBefore.status}`);
  console.log(`Response message: "${loginBefore.data.error}"`);
  if (loginBefore.status === 403) {
    console.log('✓ PASSED: Unactivated student cannot log in.\n');
  } else {
    throw new Error(`Expected 403 Forbidden, but received ${loginBefore.status}: ${JSON.stringify(loginBefore.data)}`);
  }

  // STEP 4: Admin activates Mahi Sharma's account with auto-generated temp password
  console.log('Step 4: Admin activates Mahi Sharma (POST /api/admin/students/8/activate)...');
  const activateRes = await request(`/admin/students/${mahiBefore.id}/activate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({}),
  });
  if (!activateRes.ok) {
    throw new Error(`Account activation failed: ${JSON.stringify(activateRes.data)}`);
  }
  const tempPassword = activateRes.data.temp_password;
  console.log(`✓ Activation successful! Message: ${activateRes.data.message}`);
  console.log(`✓ Generated Temporary Password: "${tempPassword}"`);
  console.log(`✓ Student record returned: Account Status: ${activateRes.data.student.account_status}, Must Change Password: ${activateRes.data.student.must_change_password}\n`);

  // STEP 5: Verify status in Admin directory
  console.log('Step 5: Verifying updated status in Admin directory...');
  const mahiAfter = await request('/admin/students?search=A60205224158', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const updatedMahi = mahiAfter.data.students[0];
  console.log(`Account Status in Directory: "${updatedMahi.account_status}"`);
  console.log(`Must Change Password: ${updatedMahi.must_change_password}`);
  console.log(`Has Password: ${updatedMahi.has_password}`);
  if (updatedMahi.account_status === 'active' && updatedMahi.must_change_password && updatedMahi.has_password) {
    console.log('✓ PASSED: Admin directory correctly reflects active state with change password requirement.\n');
  } else {
    throw new Error(`Invalid status in directory: ${JSON.stringify(updatedMahi)}`);
  }

  // STEP 6: Student logs in with Temporary Password
  console.log('Step 6: Student logging in with Temporary Password...');
  const studentLogin = await request('/auth/student/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'A60205224158', password: tempPassword }),
  });
  if (!studentLogin.ok) {
    throw new Error(`Student login failed with temporary password: ${JSON.stringify(studentLogin.data)}`);
  }
  const studentToken = studentLogin.data.token;
  console.log(`✓ Student login successful! Welcome, ${studentLogin.data.student.full_name}`);
  console.log(`✓ must_change_password flag: ${studentLogin.data.must_change_password}`);
  if (!studentLogin.data.must_change_password) {
    throw new Error('Expected must_change_password to be true on first login!');
  }
  console.log('✓ PASSED: First-login temporary password correctly flagged.\n');

  // STEP 7: Student calls /api/auth/me to verify session
  console.log('Step 7: Student calls /api/auth/me...');
  const meRes = await request('/auth/me', {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  if (!meRes.ok || meRes.data.role !== 'student') {
    throw new Error(`auth/me failed: ${JSON.stringify(meRes.data)}`);
  }
  console.log(`✓ Session verified for: ${meRes.data.student.full_name} (${meRes.data.student.roll_number})`);
  console.log(`✓ Session must_change_password: ${meRes.data.student.must_change_password}\n`);

  // STEP 8: Student updates temporary password to permanent password
  console.log('Step 8: Student sets permanent password via PUT /api/student/change-password...');
  const newPermanentPassword = 'MahiSecure#2026';
  const changeRes = await request('/student/change-password', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      currentPassword: tempPassword,
      newPassword: newPermanentPassword,
      confirmPassword: newPermanentPassword,
    }),
  });
  if (!changeRes.ok) {
    throw new Error(`Password change failed: ${JSON.stringify(changeRes.data)}`);
  }
  console.log(`✓ Password update response: "${changeRes.data.message}"`);
  console.log(`✓ Account Status: ${changeRes.data.account_status}, Must Change Password: ${changeRes.data.must_change_password}`);
  console.log('✓ PASSED: Temporary password successfully replaced by permanent password.\n');

  // STEP 9: Student logs in with NEW Permanent Password
  console.log('Step 9: Testing login with new Permanent Password...');
  const newLoginRes = await request('/auth/student/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'A60205224158', password: newPermanentPassword }),
  });
  if (!newLoginRes.ok) {
    throw new Error(`Login with permanent password failed: ${JSON.stringify(newLoginRes.data)}`);
  }
  console.log(`✓ Login with permanent password successful!`);
  console.log(`✓ must_change_password: ${newLoginRes.data.must_change_password}`);
  if (newLoginRes.data.must_change_password === true) {
    throw new Error('must_change_password should now be false!');
  }
  console.log('✓ PASSED: Permanent password active, must_change_password is false.\n');

  // STEP 10: Verify old temporary password is now invalid
  console.log('Step 10: Verifying old temporary password is rejected...');
  const oldLoginRes = await request('/auth/student/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'A60205224158', password: tempPassword }),
  });
  if (oldLoginRes.status === 401) {
    console.log('✓ PASSED: Old temporary password properly rejected.\n');
  } else {
    throw new Error(`Expected 401 Unauthorized for old temp password, got ${oldLoginRes.status}`);
  }

  // STEP 11: Admin Password Reset Test
  console.log('Step 11: Admin initiates Password Reset (POST /api/admin/students/8/reset-password)...');
  const resetRes = await request(`/admin/students/${mahiBefore.id}/reset-password`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({}),
  });
  if (!resetRes.ok) {
    throw new Error(`Admin password reset failed: ${JSON.stringify(resetRes.data)}`);
  }
  const resetTempPassword = resetRes.data.temp_password;
  console.log(`✓ Reset successful! Message: "${resetRes.data.message}"`);
  console.log(`✓ New Temporary Password: "${resetTempPassword}"`);
  console.log(`✓ Student Account Status: "${resetRes.data.student.account_status}"\n`);

  // STEP 12: Verify status is password_reset_required
  console.log('Step 12: Verifying password_reset_required in student directory...');
  const mahiResetDir = await request('/admin/students?search=A60205224158', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const resetMahi = mahiResetDir.data.students[0];
  console.log(`Directory Account Status: "${resetMahi.account_status}"`);
  console.log(`Directory Must Change Password: ${resetMahi.must_change_password}`);
  if (resetMahi.account_status === 'password_reset_required' && resetMahi.must_change_password) {
    console.log('✓ PASSED: Status is password_reset_required.\n');
  } else {
    throw new Error(`Expected password_reset_required, got: ${JSON.stringify(resetMahi)}`);
  }

  // STEP 13: Student logs in with the reset temporary password
  console.log('Step 13: Student logs in with reset temporary password...');
  const resetLoginRes = await request('/auth/student/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'A60205224158', password: resetTempPassword }),
  });
  if (!resetLoginRes.ok) {
    throw new Error(`Login after reset failed: ${JSON.stringify(resetLoginRes.data)}`);
  }
  console.log(`✓ Student logged in after admin reset! must_change_password: ${resetLoginRes.data.must_change_password}`);

  // Re-finalize permanent password so Mahi has a known permanent password
  await request('/student/change-password', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${resetLoginRes.data.token}` },
    body: JSON.stringify({
      currentPassword: resetTempPassword,
      newPassword: 'MahiSharma#2026',
      confirmPassword: 'MahiSharma#2026',
    }),
  });
  console.log('✓ Set final permanent password for Mahi Sharma: "MahiSharma#2026"\n');

  console.log('====================================================');
  console.log('🎉 ALL 13 VERIFICATION TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
