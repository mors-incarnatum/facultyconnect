import { fmtShort } from './format.js';
import { TODAY } from '../data/initialData.js';

export const modeLabel = (slot) => (slot.mode === "online" ? "Online" : "In person");
export const todayLabel = () => `${fmtShort(TODAY)}, 2026 · Campus local time`;
export const topicLine = (a) => (a.topic ? `${a.subject} · ${a.topic}` : "No topic added");
