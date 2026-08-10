const API_URL = 'https://experimindlabsimsbackend.vercel.app/api';

async function testDeleteAndLogin() {
  console.log('--- TESTING DELETED USER LOGIN REJECTION ON CLOUD BACKEND ---');
  
  // 1. Register a temporary user
  const tempEmail = `delete.test.${Date.now()}@experimindlabs.com`;
  const password = 'password123';

  console.log(`1. Registering temp user: ${tempEmail}...`);
  const regRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: tempEmail,
      password,
      firstName: 'Delete',
      lastName: 'TestUser',
    }),
  });
  const regData = await regRes.json();
  const userId = regData.user.id;
  console.log(`   ✅ User created. ID: ${userId}`);

  // 2. Log in as admin
  console.log('2. Logging in as Admin...');
  const adminRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@experimindlabs.com',
      password: 'password123',
    }),
  });
  const adminData = await adminRes.json();
  const adminToken = adminData.token;
  console.log('   ✅ Admin authenticated.');

  // 3. Delete the temp user
  console.log(`3. Deleting temp user ${userId} via DELETE /api/users/${userId}...`);
  const delRes = await fetch(`${API_URL}/users/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const delData = await delRes.json();
  console.log('   ✅ User delete response status:', delRes.status, delData.message);

  // 4. Attempt to log in with deleted credentials
  console.log('4. Attempting to log in with deleted credentials...');
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: tempEmail,
      password,
    }),
  });
  const loginData = await loginRes.json();

  if (loginRes.status === 401) {
    console.log(`   ✅ SUCCESS: Login correctly rejected with HTTP 401: "${loginData.message}"`);
  } else {
    console.error(`   ❌ FAIL: Login returned HTTP ${loginRes.status}:`, loginData);
  }
}

testDeleteAndLogin().catch(console.error);
