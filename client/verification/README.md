# Version 2 browser verification

Run from the repository root with Playwright available through Node resolution or `PLAYWRIGHT_MODULE`, and Chrome installed:

```powershell
npm test
npm run build
npm run preview --workspace client -- --port 3101 --host 127.0.0.1 --strictPort
# In a second terminal:
node client/verification/design-v2.cjs
```

`FACULTY_PREVIEW_URL` overrides the preview URL. If local server access is restricted, set `VERIFY_STATIC=1` before running the script. That mode serves the same production bundle through browser request interception. It does not change application code.

The suite freezes the browser clock and timezone for repeatable seeded appointments. It covers booking validation and progress, in-place topic/notes updates, cancellation, dialog focus and dismissal, faculty status confirmation, completion and booking time boundaries, multiple intervals, copying hours, exceptions, draft navigation, publication, protected slots, visible avatar geometry, 48px calendar targets, and 24 route/viewport combinations at 390, 768, and 1440 pixels.

Screenshots go to a temporary directory. Set `VERIFY_OUTPUT_DIR` to keep them in a chosen directory. Displayed names, dates, counts, and available actions use application data rather than Figma's example records. Frontend verification does not verify server persistence or security.
