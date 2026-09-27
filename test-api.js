// Automated Comprehensive Test Suite for College Event Presenter Management System

const http = require('http');
const { app, startServer } = require('./backend/server');
const mongoose = require('mongoose');

let server;
const PORT = 5055;

let adminToken = '';
let presenterToken = '';
let studentToken = '';

let createdEventId = '';
let createdPresenterId = '';
let createdRegistrationId = '';
let createdScheduleId = '';
let createdResultId = '';
let studentProfileId = '';

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json'
    };
    if (dataString) {
      headers['Content-Length'] = Buffer.byteLength(dataString);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: `/api${path}`,
        method,
        headers
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', () => {
          try {
            const parsed = responseBody ? JSON.parse(responseBody) : {};
            resolve({ status: res.statusCode, headers: res.headers, data: parsed, raw: responseBody });
          } catch {
            resolve({ status: res.statusCode, headers: res.headers, data: null, raw: responseBody });
          }
        });
      }
    );

    req.on('error', (e) => reject(e));
    if (dataString) req.write(dataString);
    req.end();
  });
};

const runTests = async () => {
  console.log('===========================================================');
  console.log(' STARTING AUTOMATED TEST SUITE FOR COLLEGE EVENT SYSTEM');
  console.log('===========================================================');

  try {
    server = await startServer(PORT);
    console.log(`[Test Server] Running on http://127.0.0.1:${PORT}`);

    let passedCount = 0;
    let failedCount = 0;

    const assert = (condition, testName, details = '') => {
      if (condition) {
        console.log(`  ✓ PASS: ${testName}`);
        passedCount++;
      } else {
        console.error(`  ✗ FAIL: ${testName} ${details ? '(' + details + ')' : ''}`);
        failedCount++;
      }
    };

    // 1. Health Check
    console.log('\n--- 1. System Health ---');
    const health = await request('GET', '/health');
    assert(health.status === 200 && health.data.status === 'online', 'API Health Check returns 200 online');

    // 2. Authentication: Login Pre-seeded Admin
    console.log('\n--- 2. Authentication & JWT ---');
    const adminLogin = await request('POST', '/auth/login', {
      email: 'admin@college.edu',
      password: 'adminpassword123'
    });
    assert(adminLogin.status === 200 && adminLogin.data.token, 'Admin Login successful with JWT token');
    adminToken = adminLogin.data.token;

    // Login Pre-seeded Presenter
    const presenterLogin = await request('POST', '/auth/login', {
      email: 'dr.sarah@college.edu',
      password: 'presenter123'
    });
    assert(presenterLogin.status === 200 && presenterLogin.data.token, 'Presenter Login successful with JWT token');
    presenterToken = presenterLogin.data.token;

    // Register New Student
    const newStudentEmail = `test.student.${Date.now()}@college.edu`;
    const studentRegister = await request('POST', '/auth/register', {
      name: 'Test Student Automated',
      email: newStudentEmail,
      password: 'studentPassword123',
      role: 'student',
      studentId: `STU-${Date.now().toString().slice(-4)}`,
      department: 'Computer Science',
      year: '3rd Year',
      phone: '555-0100'
    });
    assert(studentRegister.status === 201 && studentRegister.data.token, 'New Student Registration creates user + student profile');
    studentToken = studentRegister.data.token;
    studentProfileId = studentRegister.data.user.profile?._id;

    // Duplicate Email Prevention
    const dupRegister = await request('POST', '/auth/register', {
      name: 'Duplicate Test',
      email: newStudentEmail,
      password: 'studentPassword123'
    });
    assert(dupRegister.status === 400, 'Duplicate user registration prevented with 400 error');

    // Profile Retrieval
    const profile = await request('GET', '/auth/profile', null, studentToken);
    assert(profile.status === 200 && profile.data.user.email === newStudentEmail, 'Get User Profile returns authenticated data');

    // 3. Events Module
    console.log('\n--- 3. Events Management & Capacity ---');
    const allEvents = await request('GET', '/events');
    assert(allEvents.status === 200 && Array.isArray(allEvents.data.events), 'Get Events returns list of events');

    // Create New Event as Admin
    const createEventRes = await request('POST', '/events', {
      title: 'Automated Test Hackathon 2026',
      description: 'Testing event creation, capacity limits and automated registration.',
      category: 'Hackathon',
      venue: 'Innovation Hall 101',
      eventDate: new Date(Date.now() + 86400000 * 3),
      startTime: '09:00 AM',
      endTime: '05:00 PM',
      capacity: 2 // Low capacity to test full seat limit!
    }, adminToken);
    assert(createEventRes.status === 201 && createEventRes.data.event._id, 'Admin can create new event');
    createdEventId = createEventRes.data.event._id;

    // Get Event by ID
    const singleEvent = await request('GET', `/events/${createdEventId}`);
    assert(singleEvent.status === 200 && singleEvent.data.event.capacity === 2, 'Get Event by ID returns details and capacity');

    // 4. Schedules Module
    console.log('\n--- 4. Event Schedules ---');
    const createScheduleRes = await request('POST', '/schedules', {
      event: createdEventId,
      activityName: 'Opening Keynote & Team Formation',
      scheduleDate: new Date(Date.now() + 86400000 * 3),
      startTime: '09:00 AM',
      endTime: '10:30 AM',
      venue: 'Innovation Hall 101',
      speakerOrLead: 'Guest Mentor'
    }, adminToken);
    assert(createScheduleRes.status === 201 && createScheduleRes.data.schedule._id, 'Add Schedule activity to event');
    createdScheduleId = createScheduleRes.data.schedule._id;

    const eventSchedules = await request('GET', `/schedules/${createdEventId}`);
    assert(eventSchedules.status === 200 && eventSchedules.data.schedules.length >= 1, 'Get Schedules by Event ID returns session timeline');

    // 5. Registrations Module & Capacity Limits
    console.log('\n--- 5. Student Registrations & Duplicate Prevention ---');
    // Student 1 registers for created event
    const regRes1 = await request('POST', '/registrations', { eventId: createdEventId }, studentToken);
    assert(regRes1.status === 201 && regRes1.data.registration.qrCodeToken, 'Student registers for event & receives ticket pass');
    createdRegistrationId = regRes1.data.registration._id;

    // Duplicate Registration check
    const dupRegRes = await request('POST', '/registrations', { eventId: createdEventId }, studentToken);
    assert(dupRegRes.status === 400, 'Duplicate registration for same event rejected with 400');

    // Student 2 registers (fills capacity to 2/2)
    const student2Login = await request('POST', '/auth/login', {
      email: 'alex.morgan@college.edu',
      password: 'student123'
    });
    const regRes2 = await request('POST', '/registrations', { eventId: createdEventId }, student2Login.data.token);
    assert(regRes2.status === 201, 'Student 2 registers successfully (capacity now 2/2 full)');

    // Student 3 attempts to register (should be blocked due to capacity limit!)
    const student3Login = await request('POST', '/auth/login', {
      email: 'riya.patel@college.edu',
      password: 'student123'
    });
    const regRes3 = await request('POST', '/registrations', { eventId: createdEventId }, student3Login.data.token);
    assert(regRes3.status === 400 && regRes3.data.message.includes('capacity'), 'Registration blocked when event capacity is reached');

    // Get My Registrations
    const myRegs = await request('GET', '/registrations/my', null, studentToken);
    assert(myRegs.status === 200 && myRegs.data.registrations.length >= 1, 'Student can fetch personal registrations list');

    // Mark Attendance
    const attendRes = await request('PUT', `/registrations/${createdRegistrationId}/status`, {
      registrationStatus: 'attended',
      attended: true
    }, adminToken);
    assert(attendRes.status === 200 && attendRes.data.registration.attended === true, 'Admin/Presenter can verify and mark attendance');

    // 6. Results & Rankings Module
    console.log('\n--- 6. Event Results & Leaderboard ---');
    const resultRes = await request('POST', '/results', {
      event: createdEventId,
      student: studentProfileId,
      position: '1st Place (Grand Prize Winner)',
      score: 98,
      remarks: 'Flawless execution and architecture!',
      certificateIssued: true
    }, adminToken);
    assert(resultRes.status === 201 && resultRes.data.result.score === 98, 'Admin/Presenter publishes ranking & award result');
    createdResultId = resultRes.data.result._id;

    const eventResults = await request('GET', `/results/${createdEventId}`);
    assert(eventResults.status === 200 && eventResults.data.results.length >= 1, 'Get Event Results returns rankings leaderboard');

    const myResults = await request('GET', '/results/my', null, studentToken);
    assert(myResults.status === 200 && myResults.data.results.length >= 1, 'Student can fetch their awards and certificates');

    // 7. Notifications Module
    console.log('\n--- 7. Notifications ---');
    const notifs = await request('GET', '/notifications', null, studentToken);
    assert(notifs.status === 200 && Array.isArray(notifs.data.notifications), 'Fetch user notifications list');

    const readAllNotifs = await request('PUT', '/notifications/read-all', {}, studentToken);
    assert(readAllNotifs.status === 200, 'Mark all notifications as read');

    // 8. Reports & CSV Exports Module
    console.log('\n--- 8. Reports & Analytics ---');
    const eventReports = await request('GET', '/reports/events', null, adminToken);
    assert(eventReports.status === 200 && eventReports.data.summary.totalEvents > 0, 'Fetch Events Summary Analytics Report');

    const regReports = await request('GET', '/reports/registrations', null, adminToken);
    assert(regReports.status === 200 && regReports.data.totalCount > 0, 'Fetch Student Registration Audit Report');

    const presenterReports = await request('GET', '/reports/presenters', null, adminToken);
    assert(presenterReports.status === 200 && presenterReports.data.presenters.length > 0, 'Fetch Presenter Engagement Report');

    const csvExport = await request('GET', '/reports/export/csv?type=events', null, adminToken);
    assert(csvExport.status === 200 && csvExport.raw.includes('Event Title'), 'Export dynamic CSV reports with proper headers');

    // 9. Unauthorized Access Tests
    console.log('\n--- 9. Security & Role Permissions ---');
    // Student attempting to create an event (Forbidden 403)
    const unauthorizedEvent = await request('POST', '/events', {
      title: 'Hacked Event'
    }, studentToken);
    assert(unauthorizedEvent.status === 403, 'Student cannot perform admin actions (403 Forbidden)');

    // Unauthenticated request to protected route (Unauthorized 401)
    const unauthenticated = await request('GET', '/auth/profile');
    assert(unauthenticated.status === 401, 'Unauthenticated request rejected with 401');

    console.log('\n===========================================================');
    console.log(` TEST RUN COMPLETED! Passed: ${passedCount}, Failed: ${failedCount}`);
    console.log('===========================================================');

    if (failedCount > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal Test Suite Error:', err);
    process.exit(1);
  } finally {
    if (server) server.close();
    await mongoose.connection.close();
  }
};

runTests();
