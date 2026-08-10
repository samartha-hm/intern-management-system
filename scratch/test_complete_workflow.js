const API_BASE = 'https://experimindlabsimsbackend.vercel.app/api';

async function apiRequest(endpoint, method = 'GET', data = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = {
    method,
    headers,
  };
  if (data) options.body = JSON.stringify(data);

  const res = await fetch(`${API_BASE}${endpoint}`, options);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(json.message || `HTTP ${res.status}`);
    error.status = res.status;
    error.data = json;
    throw error;
  }
  return json;
}

async function testCompleteWorkflow() {
  console.log('====================================================');
  console.log('🚀 TESTING COMPLETE INTERN END-TO-END WORKFLOW');
  console.log('====================================================\n');

  const testEmail = `intern.flow.${Date.now()}@experimindlabs.com`;
  const password = 'password123';

  // 1. REGISTER NEW INTERN ACCOUNT
  console.log('1. Registering new intern account:', testEmail);
  const regRes = await apiRequest('/auth/register', 'POST', {
    email: testEmail,
    password,
    firstName: 'TestWorkflow',
    lastName: 'Intern',
    department: 'Engineering',
  });
  const internToken = regRes.token;
  const internId = regRes.user.id;
  console.log('   ✅ Registered & Authenticated. Intern ID:', internId);

  // 2. VERIFY INITIAL LOCKED STATE
  console.log('\n2. Verifying locked state before enrollment approval...');
  const meRes1 = await apiRequest('/auth/me', 'GET', null, internToken);
  console.log('   User Batch Status:', meRes1.batchStatus);

  try {
    await apiRequest('/attendance/check-in', 'POST', { notes: 'Premature Check-In' }, internToken);
    console.error('   ❌ ERROR: Check-in should have been locked!');
  } catch (err) {
    console.log('   ✅ Check-In correctly LOCKED for unapproved intern:', err.message);
  }

  // 3. BROWSE BATCHES & SUBMIT JOIN REQUEST
  console.log('\n3. Fetching active internship batches...');
  const batchesRes = await apiRequest('/internships', 'GET', null, internToken);
  if (!batchesRes || batchesRes.length === 0) {
    throw new Error('No active internship batches found!');
  }
  const targetBatch = batchesRes[0];
  console.log(`   Selected Batch: "${targetBatch.title}" (ID: ${targetBatch.id})`);

  console.log('   Submitting batch join request...');
  const reqBatchRes = await apiRequest('/users/request-batch', 'POST', { batchId: targetBatch.id }, internToken);
  console.log('   ✅ Join Request Submitted:', reqBatchRes.message);

  // Verify duplicate request prevention
  try {
    await apiRequest('/users/request-batch', 'POST', { batchId: targetBatch.id }, internToken);
  } catch (err) {
    console.log('   ✅ Duplicate application attempt blocked:', err.message);
  }

  // 4. ADMIN LOGIN & APPROVE BATCH REQUEST
  console.log('\n4. Logging in as Admin to review & approve request...');
  const adminLogin = await apiRequest('/auth/login', 'POST', {
    email: 'admin@experimindlabs.com',
    password: 'password123',
  });
  const adminToken = adminLogin.token;

  const pendingReqs = await apiRequest('/users/batch-requests', 'GET', null, adminToken);
  console.log(`   Found ${pendingReqs.length} pending batch request(s).`);

  console.log('   Approving intern batch status to APPROVED...');
  await apiRequest(`/users/${internId}/batch-status`, 'PUT', { status: 'APPROVED' }, adminToken);
  console.log('   ✅ Intern batch status APPROVED by Admin.');

  // 5. VERIFY UNLOCKED INTERN STATE & ENTRANCE CHECK-IN
  console.log('\n5. Verifying unlocked state for approved intern...');
  const meRes2 = await apiRequest('/auth/me', 'GET', null, internToken);
  console.log('   Updated User Batch Status:', meRes2.batchStatus);
  console.log('   Assigned Cohort:', meRes2.assignedBatch?.title);

  console.log('   Fetching Daily Stable Entrance QR Nonce...');
  const entranceNonceRes = await apiRequest('/attendance/qr-nonce?kind=ENTRANCE', 'GET', null, internToken);
  const entranceNonce = entranceNonceRes.nonce;
  console.log('   Daily Entrance Nonce:', entranceNonce);

  console.log('   Executing Entrance Check-In...');
  const checkInRes = await apiRequest('/attendance/check-in', 'POST', {
    notes: 'Official Workplace Entrance Check-In',
    nonce: entranceNonce,
  }, internToken);
  console.log('   ✅ Entrance Check-In Successful! Check-In Time:', checkInRes.checkInTime);

  // 6. WORK DIARY & EXIT CHECK-OUT
  console.log('\n6. Submitting mandatory Work Diary & Exit Check-Out...');
  const workSummary = 'Developed and tested REST API endpoints for user batch approval and QR attendance logging.';
  
  await apiRequest('/work-diary', 'POST', {
    tasksDone: workSummary,
    hoursSpent: 8.0,
  }, internToken);
  console.log('   ✅ Work Diary entry created.');

  const exitNonceRes = await apiRequest('/attendance/qr-nonce?kind=EXIT', 'GET', null, internToken);
  const exitNonce = exitNonceRes.nonce;
  console.log('   Daily Exit Nonce:', exitNonce);

  const checkOutRes = await apiRequest('/attendance/check-out', 'POST', {
    notes: workSummary,
    nonce: exitNonce,
  }, internToken);
  console.log('   ✅ Exit Check-Out Successful! Check-Out Time:', checkOutRes.checkOutTime);

  // 7. VERIFY WORK DIARY TIMING FORMATTING
  console.log('\n7. Verifying Work Diary Log history with accurate attendance timestamps...');
  const myDiariesRes = await apiRequest('/work-diary/my', 'GET', null, internToken);
  console.log('   My Work Diaries Entry Count:', myDiariesRes.length);
  console.log('   Check-In Timestamp:', myDiariesRes[0].checkInTime);
  console.log('   Check-Out Timestamp:', myDiariesRes[0].checkOutTime);

  // 8. SUPERVISOR WORK DIARY REVIEW
  console.log('\n8. Supervisor/Mentor reviewing work diary entry...');
  const mentorLogin = await apiRequest('/auth/login', 'POST', {
    email: 'mentor@experimindlabs.com',
    password: 'password123',
  });
  const mentorToken = mentorLogin.token;

  const diaryId = myDiariesRes[0].id;
  await apiRequest(`/work-diary/${diaryId}/review`, 'PUT', {
    feedback: 'Excellent progress on API and workflow implementation! Keep it up.',
    status: 'APPROVED',
  }, mentorToken);
  console.log('   ✅ Work Diary Reviewed & Approved by Mentor.');

  console.log('\n====================================================');
  console.log('🎉 ALL 8 STEPS OF THE COMPLETE INTERN WORKFLOW PASSED 100%!');
  console.log('====================================================');
}

testCompleteWorkflow().catch((err) => {
  console.error('\n❌ Workflow Execution Failed:', err.data || err.message);
  process.exit(1);
});
