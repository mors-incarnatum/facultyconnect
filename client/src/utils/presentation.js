import { fmtShort } from './format.js';
import { toIso } from './format.js';

export const modeLabel = (slot) => (slot.mode === "online" ? "Online" : "In person");
export const todayLabel = (now) => `${fmtShort(toIso(now))}, ${now.getFullYear()} · ${now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · Local time`;
export const topicLine = (a) => (a.topic ? `${a.subject} · ${a.topic}` : "No topic added");
