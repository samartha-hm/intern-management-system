const API_URL = 'https://experimindlabsimsbackend.vercel.app/api';

async function checkAccount(email, password) {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.status === 200) {
      console.log(`✅ ${data.user.role}: ${email} | ${password} -> LOGIN OK (${data.user.firstName} ${data.user.lastName})`);
    } else {
      console.log(`❌ ${email}: HTTP ${res.status} - ${data.message}`);
    }
  } catch (err) {
    console.error(`⚠️ Error checking ${email}:`, err.message);
  }
}

async function verifyAll() {
  console.log('--- VERIFYING LIVE PRODUCTION CREDENTIALS ---');
  await checkAccount('admin@experimindlabs.com', 'password123');
  await checkAccount('mentor@experimindlabs.com', 'password123');
  await checkAccount('hr@experimindlabs.com', 'password123');
  await checkAccount('intern@experimindlabs.com', 'password123');
  await checkAccount('kiosk@experimindlabs.com', 'EXP@123labs');
}

verifyAll();
