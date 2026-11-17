import PageHead from '../../components/PageHead.jsx';

const STEPS = [
    ['Find faculty', 'Search by name, department, or subject, then compare open consultation times.'],
    ['Request a time', 'Pick a slot and say what you want to discuss. The slot is held for you while the faculty member reviews it.'],
    ['Track the status', 'Pending, confirmed, declined, completed, or cancelled: every status is shown in My appointments.'],
    ['Update or cancel', 'Edit or delete your topic, or cancel if you can no longer attend.'],
];

export default function StudentHelpPage() {
    return (
        <>
            <PageHead title="Help & support" subtitle="A quick guide to how consultations work in FacultyConnect." />
            <div className="stack" style={{ maxWidth: 760 }}>
                {STEPS.map(function ([title, description], index) {
                    return (
                        <div className="card" key={title}>
                            <span className="badge">Step {index + 1}</span>
                            <h3 style={{ fontSize: 22, margin: '10px 0 6px' }}>{title}</h3>
                            <p className="muted">{description}</p>
                        </div>
                    );
                })}
                <div className="notice">Need more help? Contact your CCS program coordinator.</div>
            </div>
        </>
    );
}
