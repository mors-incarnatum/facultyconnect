import { AUTO_DECLINED_MESSAGE, formatDeadline } from '../utils/presentation.js';

export default function AppointmentGuidance({ status, autoDeclined = false, slot }) {
    const deadlineText = slot
        ? ` Faculty must accept by ${formatDeadline(slot)} (24 hours before the consultation), or the request is automatically declined.`
        : '';

    const guidance = {
        pending: `Awaiting faculty approval. This time is reserved, but the meeting is not confirmed yet.${deadlineText}`,
        confirmed: 'Your consultation is confirmed. Review the topic and meeting details before attending.',
        completed: 'This consultation is complete. The details remain available in your appointment history.',
        declined: autoDeclined
            ? AUTO_DECLINED_MESSAGE
            : 'This request was declined. You can choose another available time or faculty member.',
        cancelled: 'This appointment was cancelled. You can request a new consultation when you are ready.',
    };

    if (!guidance[status]) {
        return null;
    }

    return <p className="notice appointment-guidance">{guidance[status]}</p>;
}
