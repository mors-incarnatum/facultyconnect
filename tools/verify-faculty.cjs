const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({ timezoneId: 'Asia/Manila', viewport: { width: 1440, height: 1040 } });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.route('**/favicon.ico', (r) => r.fulfill({ status: 204 }));
  // Optional web fonts are isolated from offline application verification.
  await page.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ contentType: 'text/css', body: '' }));
  // Controlled browser time drives both seed generation and action-time guards.
  await page.clock.install({ time: new Date('2026-12-29T08:00:00+08:00') });
  // Intercept the built files by default, so verification also works offline.
  if (!process.env.FACULTY_PREVIEW_URL) {
    const root = path.resolve(__dirname, '../client/dist');
    await page.route('http://facultyconnect.test/**', async (route) => {
      const pathname = new URL(route.request().url()).pathname;
      const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!file.startsWith(root + path.sep)) return route.abort();
      if (pathname === '/favicon.ico') return route.fulfill({ status: 204 });
      const contentType = file.endsWith('.js') ? 'application/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.svg') ? 'image/svg+xml' : 'text/html';
      try { await route.fulfill({ body: fs.readFileSync(file), contentType }); }
      catch { await route.fulfill({ status: 404, body: '' }); }
    });
  }
  const base = (process.env.FACULTY_PREVIEW_URL || 'http://facultyconnect.test') + '/#';
  const heading = (name) => page.getByRole('heading', { name, exact: true }).waitFor();
  const button = (name) => page.getByRole('button', { name, exact: true });
  const link = (name) => page.getByRole('link', { name, exact: true });
  const settled = () => page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const go = async (route) => {
    await page.evaluate((hash) => { window.location.hash = hash; }, route);
    await page.waitForURL(base + route);
    await page.locator('h1').waitFor();
    await settled();
  };
  const menu = async () => { if (await button('Menu').isVisible()) await button('Menu').click(); };
  const logout = async () => { await menu(); await button('Log out →').click(); await link('Sign in').waitFor(); };
  const login = async (email, role) => {
    await link('Sign in').click();
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await button('Sign in').click();
    await page.waitForURL(base + '/' + role);
    await page.getByRole('heading', { name: /Welcome back,|Good morning,|Good afternoon,|Good evening,/ }).waitFor();
    await settled();
  };
  const shot = async (name) => { await settled(); await page.screenshot({ path: `docs/verification/${name}.png`, fullPage: !name.includes('dialog') }); };
  const geometry = async (name) => {
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Horizontal overflow: ${name}`);
    const clipped = await page.locator('input:visible, select:visible, textarea:visible, button:visible').evaluateAll((els) => els.filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && (r.left < -1 || r.right > innerWidth + 1);
    }).map((el) => el.outerHTML.slice(0, 160)));
    assert.deepEqual(clipped, [], `Clipped controls: ${name}`);
  };
  try {
    fs.mkdirSync('docs/verification', { recursive: true });
    await page.goto(base + '/');
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ['/', '/login', '/register']) { await go(route); await geometry(`${width} public ${route}`); }
    }
    await go('/');
    await link('Sign in').click();
    await button('Sign in').click();
    await page.getByRole('alert').filter({ hasText: 'Enter your email' }).waitFor();
    await page.getByLabel('Email address').fill('missing.account@dlsu.edu.ph');
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await button('Sign in').click();
    await page.getByRole('alert').filter({ hasText: 'No account found' }).waitFor();
    await go('/');
    // Account: validation, registration, sign-in, role routing, logout and protection.
    for (const role of ['student', 'faculty']) {
      await link('Register').click();
      await button(role === 'student' ? 'Student' : 'Faculty').click();
      await button('Create account').click();
      await page.getByRole('alert').filter({ hasText: 'complete every field' }).waitFor();
      await page.getByLabel('Full name').fill(`Demo ${role}`);
      await page.getByLabel('Email address').fill(`demo.${role}@dlsu.edu.ph`);
      await page.getByLabel('Password', { exact: true }).fill('password123');
      await page.getByLabel('Confirm password').fill('different');
      await button('Create account').click();
      await page.getByRole('alert').filter({ hasText: 'Passwords do not match' }).waitFor();
      await page.getByLabel('Confirm password').fill('password123');
      await button('Create account').click();
      await heading(`${role === 'student' ? 'Student' : 'Faculty'} account created`);
      await link('Sign in').click();
      await page.getByLabel('Password', { exact: true }).fill('password123');
      await button('Sign in').click();
      await page.waitForURL(base + '/' + role);
      await go(role === 'student' ? '/faculty' : '/student');
      await page.waitForURL(base + '/' + role);
      await logout();
      await go('/' + role);
      await heading('Welcome back');
      await go('/');
    }
    console.log('PASS account journeys for both roles');
    await login('sample.alex.delacruz@dlsu.edu.ph', 'student');
    await link('Find faculty').click();
    await page.getByLabel('Search faculty').fill('zzzz-no-faculty');
    await button('Search').click();
    await button('Clear search').waitFor();
    assert.equal(await page.locator('.row').count(), 0);
    await button('Clear search').click();
    await page.getByLabel('Search faculty').fill('Santos');
    await button('Search').click();
    await page.locator('.row').filter({ hasText: 'Dr. Sofia Santos' }).click();
    await link('View full profile →').click();
    await heading('Dr. Sofia Santos');
    await link('Request').first().click();
    const bookedSlot = new URL(await page.url()).hash.split('slot=')[1];
    await button('Submit request →').click();
    await page.locator('[aria-invalid="true"]').first().waitFor();
    await page.waitForFunction(() => document.querySelector('[aria-invalid="true"]') === document.activeElement);
    await page.getByLabel('Subject / course').fill('CCDSALG');
    await page.getByLabel('Consultation topic').fill('Graph traversal demo');
    await button('Submit request →').focus();
    await page.keyboard.press('Enter');
    await heading('Your request has been sent');
    const createdId = (await page.url()).split('/').pop();
    await shot('student-request-success');
    await link('View my appointment').click();
    await page.getByRole('complementary', { name: 'Appointment details' }).getByText('Graph traversal demo', { exact: false }).waitFor();
    await button('Edit Topic').click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    await page.getByLabel('Topic / Discussion Goal').fill('');
    await button('Save Changes').click();
    await page.getByRole('alert').filter({ hasText: 'required' }).waitFor();
    await page.getByLabel('Topic / Discussion Goal').fill('Updated graph traversal');
    // Native dialog contains keyboard focus and returns it to its opener.
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      assert.ok(await dialog.evaluate((el) => el.contains(document.activeElement)), await page.evaluate(() => document.activeElement.outerHTML.slice(0, 300)));
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await geometry('student topic dialog');
    await shot('student-mobile-dialog');
    await button('Save Changes').click();
    await link('Delete topic').click();
    await button('Delete topic').click();
    await page.getByText('No topic added.', { exact: true }).waitFor();
    await button('Cancel Appointment').click();
    await page.keyboard.press('Escape');
    assert.ok(await button('Cancel Appointment').evaluate((el) => el === document.activeElement));
    await button('Cancel Appointment').click();
    await button('Yes, Cancel Consultation').click();
    await page.getByRole('complementary', { name: 'Appointment details' }).getByText('Cancelled', { exact: true }).waitFor();
    await go(`/student/request?slot=${bookedSlot}`);
    assert.equal(await button('Submit request →').isEnabled(), true);
    await go('/student/request?slot=sl01');
    await page.getByRole('alert').filter({ hasText: 'no longer available' }).waitFor();
    await link('Choose another time').waitFor();
    for (const [route, title] of [['/student/faculty/missing', 'Faculty member not found'], ['/student/appointments/missing/edit-topic', 'Appointment not found'], ['/student/request?slot=missing', 'Request a consultation']]) {
      await go(route); await heading(title);
    }
    console.log('PASS student create/read/update/delete/cancel and recovery');
    const studentRoutes = ['/student', '/student/faculty', '/student/faculty/calendar', '/student/faculty/f1', '/student/request?slot=sl04', `/student/request/submitted/${createdId}`, '/student/appointments', '/student/appointments/a1/delete-topic', '/student/booking-conflict?slot=sl01', '/student/help'];
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of studentRoutes) { await go(route); await geometry(`${width} ${route}`); }
      await go('/student/faculty/calendar'); await shot(`student-calendar-${width}`);
      await button('Week grid').click(); await geometry(`calendar grid ${width}`);
      await menu();
      await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'My appointments', exact: true }).click();
      await heading('My appointments');
    }
    await logout();
    await login('sample.sofia.santos@dlsu.edu.ph', 'faculty');
    await shot('faculty-overview');
    await go('/faculty/consultations/a21');
    await button('Mark completed').click();
    await page.getByRole('status').filter({ hasText: 'now completed' }).waitFor();
    await link('Back to consultations').click();
    await link('Consultations').click();
    await page.getByLabel('Filter consultations by status').selectOption('pending');
    await page.locator('.appt-row').filter({ hasText: 'Maya Reyes' }).first().getByRole('link').click();
    await button('Accept request').click();
    await page.getByRole('status').filter({ hasText: 'now confirmed' }).waitFor();
    assert.equal(await button('Mark completed').count(), 0);
    await button('Cancel consultation').click(); await button('Keep request').click();
    await link('Back to consultations').click();
    await page.locator('.appt-row').filter({ hasText: 'Daniel Tan' }).getByRole('link').click();
    await button('Decline request').click(); await button('Confirm decline').click();
    await page.getByRole('status').filter({ hasText: 'now declined' }).waitFor();
    await go('/faculty/availability');
    await page.getByLabel('Monday start 1').fill('08:00');
    await link('Consultations').click();
    await page.getByRole('dialog', { name: 'Keep your availability changes?' }).waitFor();
    await button('Stay').click();
    assert.equal(await page.getByLabel('Monday start 1').inputValue(), '08:00');
    await page.getByLabel('Location', { exact: false }).fill('');
    await link('Consultations').click(); await button('Save').click();
    await page.getByRole('dialog').getByRole('alert').filter({ hasText: 'location' }).waitFor();
    await button('Stay').click();
    await link('Consultations').click(); await button('Discard').click();
    await heading('Consultations');
    await link('My availability').click();
    await page.getByLabel('Monday start 1').fill('08:00');
    await page.getByLabel('Location', { exact: false }).fill('Demo consultation room');
    await button('Save changes').click();
    await page.getByRole('status').filter({ hasText: 'Availability published' }).waitFor();
    await page.getByLabel('Monday start 1').fill('07:00');
    await button('Discard draft').click();
    assert.equal(await page.getByLabel('Monday start 1').inputValue(), '08:00');
    await link('Published slots').click();
    await link('+ Add availability').click();
    await heading('Create consultation availability');
    await page.getByLabel('Date (required)', { exact: true }).fill('2027-01-23');
    await page.getByLabel('Start time').fill('15:00'); await page.getByLabel('End time').fill('14:30');
    await button('Publish availability').click();
    await page.getByRole('alert').first().waitFor();
    await page.getByLabel('End time').fill('15:30');
    await button('Publish availability').click();
    await heading('My consultation availability');
    await page.getByLabel('Filter slots by date').fill('2027-01-23');
    await page.locator('.published-day summary').click();
    await page.locator('.appt-row').getByRole('link', { name: 'Edit', exact: true }).click();
    await heading('Edit availability');
    await page.getByLabel('Start time').fill('16:00'); await page.getByLabel('End time').fill('16:30');
    await button('Save changes').click();
    await page.getByLabel('Filter slots by date').fill('2027-01-23');
    await page.locator('.published-day summary').click();
    await page.locator('.appt-row').getByText('4:00–4:30 PM', { exact: true }).waitFor();
    await page.locator('.appt-row').getByRole('link', { name: 'Remove', exact: true }).click();
    await button('Remove time slot').click();
    await page.getByRole('status').filter({ hasText: 'removed' }).waitFor();
    await page.getByLabel('Filter slots by date').fill('2027-01-23');
    await heading('No matching slots');
    await button('Clear filters').click();
    await go('/faculty/availability/sl01/edit');
    await page.getByText('This slot is reserved.', { exact: false }).waitFor();
    const facultyRoutes = ['/faculty', '/faculty/consultations', '/faculty/consultations/a6', '/faculty/availability', '/faculty/availability/slots', '/faculty/availability/new', '/faculty/availability/sl04/edit', '/faculty/availability/sl04/remove', '/faculty/help', '/faculty/consultations/missing', '/faculty/availability/missing/edit'];
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of facultyRoutes) {
        await go(route); await geometry(`${width} ${route}`);
        if (route === '/faculty/availability') {
          assert.equal(await page.locator('.draft-controls').evaluate((el) => getComputedStyle(el).position), 'static');
          assert.ok(await page.evaluate(() => document.querySelector('.draft-controls').getBoundingClientRect().top >= document.querySelector('.faculty-manager').getBoundingClientRect().bottom));
          await button('Save changes').scrollIntoViewIfNeeded();
          await shot(width === 390 ? 'faculty-mobile' : `faculty-availability-${width}`);
        }
      }
      await menu(); await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Overview', exact: true }).click();
      await heading('Welcome back, Dr. Sofia Santos');
    }
    console.log('PASS faculty status, schedule, slot CRUD, draft recovery and responsive navigation');
    // Advance without reloading: existing appointments cross their real time boundaries.
    await page.clock.fastForward(4 * 86400000);
    assert.match(await page.locator('.topline').innerText(), /2027/);
    await go('/faculty/consultations/a1');
    await button('Mark completed').click();
    await page.getByRole('status').filter({ hasText: 'now completed' }).waitFor();
    await logout();
    await login('sample.alex.delacruz@dlsu.edu.ph', 'student');
    await go('/student/request?slot=sl05');
    await page.clock.fastForward(2 * 86400000);
    await page.getByRole('alert').filter({ hasText: '24 hours' }).waitFor();
    assert.equal(await button('Submit request →').isDisabled(), true);
    await go('/student/appointments/a1/edit-topic');
    await page.getByText('Topics can only be changed before a pending or confirmed consultation starts.').waitFor();
    await go('/student/appointments?id=a2');
    await page.getByRole('complementary', { name: 'Appointment details' }).getByText(/automatically declined/).waitFor();
    await logout(); await go('/student'); await heading('Welcome back');
    assert.deepEqual(errors, []);
    fs.writeFileSync('docs/verification/browser-results.json', JSON.stringify({ controlledStart: '2026-12-29T08:00:00+08:00', timezone: 'Asia/Manila', widths: [390, 768, 1440], journeys: ['account (both roles)', 'student', 'faculty', 'recovery', 'clock boundaries'], browserErrors: errors, result: 'passed' }, null, 2) + '\n');
    console.log('PASS all grading browser journeys; zero console/page errors');
  } catch (error) {
    console.error('Failed at', page.url(), (await page.locator('body').innerText()).slice(-2200));
    await page.screenshot({ path: 'docs/verification/browser-failure.png', fullPage: true });
    throw error;
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });

