(function (FC) {
  'use strict';

  const { fmtShort, toIso } = FC;

  const modeLabel = (slot) => (slot.mode === 'online' ? 'Online' : 'In person');
  const todayLabel = (now) =>
    `${fmtShort(toIso(now))}, ${now.getFullYear()} · ${now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · Local time`;
  const topicLine = (a) => (a.topic ? `${a.subject} · ${a.topic}` : 'No topic added');

  Object.assign(FC, {
    modeLabel,
    todayLabel,
    topicLine,
  });
})(globalThis.FC = globalThis.FC || {});
