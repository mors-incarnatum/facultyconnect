const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const base = process.env.VERIFY_STATIC ? 'http://facultyconnect.test' : process.env.FACULTY_PREVIEW_URL || 'http://127.0.0.1:3101';
const output = process.env.VERIFY_OUTPUT_DIR || path.join(os.tmpdir(), 'facultyconnect-design-v2');

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1040 }, timezoneId: 'Asia/Manila' });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  if (process.env.VERIFY_STATIC) {
    const root = path.resolve(__dirname, '../dist');
    await page.route('http://facultyconnect.test/**', async (route) => {
      const pathname = new URL(route.request().url()).pathname;
      const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!file.startsWith(root + path.sep)) return route.abort();
      const contentType = file.endsWith('.js') ? 'application/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.svg') ? 'image/svg+xml' : 'text/html';
      try { await route.fulfill({ body: await fs.promises.readFile(file), contentType }); }
      catch { await route.fulfill({ status: 404, body: '' }); }
    });
  }
  await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204 }));
  await page.clock.install({ time: new Date('2026-10-29T08:00:00+08:00') });
  const go = async (route) => {
    await page.goto(`${base}/#${route}`);
    await page.locator('h1').waitFor();
  };
  const session = async (role, id) => {
    await page.evaluate((value) => sessionStorage.setItem('fc-session', JSON.stringify(value)), { role, id });
    await page.reload();
    await page.locator('h1').waitFor();
  };
  const screenshot = async (name) => page.screenshot({ path: path.join(output, `${name}.png`), fullPage: !/modal|guard/.test(name), animations: 'disabled' });
  const assertImages = async () => {
    await page.locator('.avatar img').evaluateAll((images) => Promise.all(images.map(async (image) => {
      if (!image.getClientRects().length) return;
      await image.decode();
      if (!image.naturalWidth || image.getBoundingClientRect().width < 24) throw new Error(`Empty avatar: ${image.src}`);
    })));
  };
  const assertNoOverflow = async (label) => {
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), label);
  };

  try {
    await go('/login');
    await session('student', 's1');
    await go('/student/appointments?id=a1');
    await assertImages();
    const edit = page.getByRole('button', { name: 'Edit Topic', exact: true });
    await edit.click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    assert.equal(await page.locator(':modal').count(), 1);
    assert.ok(await dialog.evaluate((element) => element.contains(document.activeElement)), 'Dialog receives focus');
    const originalUrl = page.url();
    await page.getByLabel('Topic / Discussion Goal').fill('Recursion review in place');
    await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
    assert.equal(page.url(), originalUrl, 'Saving retains list URL and selection');
    await page.getByRole('status').filter({ hasText: 'Topic updated in-place' }).waitFor();
    assert.match(await page.getByLabel('Appointment details').innerText(), /Recursion review in place/);
    assert.equal(await edit.evaluate((element) => element === document.activeElement), true, 'Focus returns to the opener');

    await edit.click();
    await page.getByLabel('Topic / Discussion Goal').fill('');
    await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'required' }).waitFor();
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    await edit.click();
    await page.getByText('Course and preparation notes', { exact: true }).click();
    await page.getByLabel('Preparation notes', { exact: true }).fill('Bring the recursive solution and test cases.');
    await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
    assert.match(await page.getByLabel('Appointment details').innerText(), /recursive solution and test cases/);
    await edit.click();
    await screenshot('student-edit-modal');
    await page.mouse.click(8, 8);
    await dialog.waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: 'Cancel Appointment', exact: true }).click();
    await screenshot('student-cancel-modal');
    await page.getByRole('button', { name: 'Keep Appointment', exact: true }).click();
    await page.getByRole('button', { name: 'Cancel Appointment', exact: true }).click();
    await page.getByRole('button', { name: 'Yes, Cancel Consultation', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Consultation cancelled' }).waitFor();
    assert.match(await page.getByLabel('Appointment details').innerText(), /Cancelled/);

    await go('/student/faculty/calendar?q=Santos');
    assert.equal(await page.locator('.calendar-day').count(), 5);
    await page.getByRole('button', { name: 'Week grid', exact: true }).click();
    for (const label of ['Previous week', 'Next week']) {
      const box = await page.getByRole('button', { name: label, exact: true }).boundingBox();
      assert.ok(box.width >= 48 && box.height >= 48, `${label} touch target`);
    }
    const slots = await page.locator('button.cal-item').all();
    assert.ok(slots.length);
    for (const slot of slots) assert.ok((await slot.boundingBox()).height >= 48, 'Slot touch target');
    await screenshot('student-calendar');
    await page.getByRole('button', { name: 'Include weekend', exact: true }).click();
    assert.equal(await page.locator('.calendar-day').count(), 7);
    await page.getByRole('button', { name: 'Show weekdays only', exact: true }).click();
    await page.getByRole('button', { name: 'Next available time', exact: true }).click();
    await page.getByRole('link', { name: 'Request consultation →', exact: true }).click();
    await page.getByRole('heading', { name: 'Request a consultation', exact: true }).waitFor();
    assert.equal(await page.locator('.booking-stepper li').count(), 4);
    assert.match(await page.locator('.booking-stepper [aria-current="step"]').innerText(), /Add Topic/);
    await page.getByRole('button', { name: 'Submit request →', exact: true }).click();
    assert.equal(await page.locator('[aria-invalid="true"]').count(), 2);
    await page.getByLabel('Subject / course').fill('CCDSALG');
    await page.getByLabel('Consultation topic').fill('Design v2 booking');
    await screenshot('student-request');
    await page.getByRole('button', { name: 'Submit request →', exact: true }).click();
    await page.getByRole('heading', { name: 'Your request has been sent' }).waitFor();
    assert.match(await page.locator('.booking-stepper [aria-current="step"]').innerText(), /Confirmation/);

    await session('faculty', 'f1');
    await go('/faculty');
    await assertImages();
    assert.equal(await page.locator('.faculty-stats .stat').count(), 5);
    await screenshot('faculty-overview');
    await page.getByRole('link', { name: /^Pending/ }).click();
    await page.getByRole('heading', { name: 'Consultations', exact: true }).waitFor();
    assert.ok(page.url().includes('status=pending'));
    const pending = page.locator('.appt-row').first();
    await pending.getByRole('link', { name: 'View details', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Mark completed', exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Decline request', exact: true }).click();
    await page.getByRole('button', { name: 'Keep request', exact: true }).click();
    await page.getByRole('button', { name: 'Accept request', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'now confirmed' }).waitFor();
    await screenshot('faculty-details');
    assert.equal(await page.getByRole('button', { name: 'Mark completed', exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Cancel consultation', exact: true }).click();
    await page.getByRole('button', { name: 'Confirm cancellation', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'now cancelled' }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Accept request', exact: true }).count(), 0);

    await go('/faculty/availability');
    await page.getByLabel('Monday start 1').fill('08:00');
    await page.getByLabel('Monday end 1').fill('09:00');
    await page.getByRole('button', { name: 'Add Monday interval', exact: true }).click();
    await page.getByLabel('Monday start 2').fill('13:00');
    await page.getByLabel('Monday end 2').fill('14:00');
    await page.getByRole('checkbox', { name: 'Tue', exact: true }).check();
    await page.getByRole('button', { name: 'Copy hours', exact: true }).click();
    assert.equal(await page.getByLabel('Tuesday start 1').inputValue(), '08:00');
    assert.equal(await page.getByLabel('Tuesday start 2').inputValue(), '13:00');
    await page.getByRole('link', { name: 'Published slots', exact: true }).click();
    await page.getByRole('link', { name: 'Weekly hours & exceptions', exact: true }).click();
    assert.equal(await page.getByLabel('Monday start 2').inputValue(), '13:00');
    await page.getByRole('link', { name: 'Consultations', exact: true }).click();
    await page.getByRole('dialog', { name: 'Keep your availability changes?' }).waitFor();
    await screenshot('faculty-draft-guard');
    await page.getByRole('button', { name: 'Stay', exact: true }).click();
    await page.getByLabel('Location (required)', { exact: true }).fill('');
    await page.getByRole('link', { name: 'Overview', exact: true }).click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'location' }).waitFor();
    await page.getByRole('button', { name: 'Stay', exact: true }).click();
    await page.getByLabel('Location (required)', { exact: true }).fill('CCS consultation room 1');
    await page.getByLabel('Exception start date').fill('2026-11-16');
    await page.getByLabel('Exception end date').fill('2026-11-20');
    await page.getByRole('button', { name: 'Add exception', exact: true }).click();
    await page.getByRole('button', { name: 'Save changes', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Availability published' }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Discard draft', exact: true }).isDisabled(), true);
    await screenshot('faculty-availability');
    await page.getByLabel('Monday start 1').fill('07:00');
    await page.getByRole('link', { name: 'Consultations', exact: true }).click();
    await page.getByRole('button', { name: 'Discard', exact: true }).click();
    await page.getByRole('heading', { name: 'Consultations', exact: true }).waitFor();
    await go('/faculty/availability');
    assert.equal(await page.getByLabel('Monday start 1').inputValue(), '08:00');
    await page.getByRole('link', { name: 'Published slots', exact: true }).click();
    await screenshot('faculty-published-slots');
    assert.equal(await page.locator('.appt-row').filter({ hasText: 'Pending' }).getByRole('link', { name: 'Edit', exact: true }).count(), 0);

    for (const [role, id, routes] of [
      ['faculty', 'f1', ['/faculty', '/faculty/availability', '/faculty/availability/slots', '/faculty/consultations', '/faculty/consultations/a1']],
      ['student', 's1', ['/student/appointments', '/student/faculty/calendar?q=Santos', '/student/request?slot=sl04']],
    ]) {
      await session(role, id);
      for (const width of [390, 768, 1440]) {
        await page.setViewportSize({ width, height: 1040 });
        for (const route of routes) {
          await go(route);
          await assertNoOverflow(`${width}: ${route}`);
          await assertImages();
        }
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await go('/student/appointments?id=a1');
    await page.getByRole('button', { name: 'Edit Topic', exact: true }).click();
    await assertNoOverflow('Mobile edit dialog');
    await screenshot('mobile-edit-modal');
    await page.keyboard.press('Tab');
    assert.ok(await page.getByRole('dialog').evaluate((element) => element.contains(document.activeElement)), 'Tab stays in the modal');
    await page.keyboard.press('Escape');
    await page.clock.setSystemTime(new Date('2026-10-30T09:29:59+08:00'));
    await session('faculty', 'f1');
    await go('/faculty/consultations/a1');
    assert.equal(await page.getByRole('button', { name: 'Mark completed', exact: true }).count(), 0);
    await page.clock.fastForward(1000);
    await page.getByRole('button', { name: 'Mark completed', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'now completed' }).waitFor();
    await page.clock.setSystemTime(new Date('2026-10-30T09:59:59+08:00'));
    await session('student', 's1');
    await go('/student/request?slot=sl03');
    assert.equal(await page.getByRole('button', { name: 'Submit request →', exact: true }).isEnabled(), true);
    await page.clock.fastForward(1000);
    await page.getByRole('alert').filter({ hasText: 'This time is no longer available' }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Submit request →', exact: true }).isDisabled(), true);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ result: 'passed', responsiveRoutes: 24, screenshots: output, checks: 'booking, edit/cancel dialogs, keyboard focus, validation, status transitions, intervals, draft guard, publication, filters, protected slots, assets, 48px targets' }));
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
