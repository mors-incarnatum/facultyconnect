import { AUTO_DECLINED_MESSAGE, formatDeadline } from '../state/appointments.js';

export default function AppointmentGuidance({ status, autoDeclined = false, slot }) {
  const guidance = {
    pending: `Awaiting faculty approval. This time is reserved, but the meeting is not confirmed yet.${slot ? ` Faculty must accept by ${formatDeadline(slot)} (24 hours before the consultation), or the request is automatically declined.` : ""}`,
    confirmed: "Your consultation is confirmed. Review the topic and meeting details before attending.",
    completed: "This consultation is complete. The details remain available in your appointment history.",
    declined: autoDeclined ? AUTO_DECLINED_MESSAGE : "This request was declined. You can choose another available time or faculty member.",
    cancelled: "This appointment was cancelled. You can request a new consultation when you are ready.",
  };
  return guidance[status] ? <p className="notice appointment-guidance">{guidance[status]}</p> : null;
}