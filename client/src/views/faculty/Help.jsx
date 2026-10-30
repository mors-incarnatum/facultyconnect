import { PageHead } from "../../components/ui.jsx";

const STEPS = [
  ["Publish your availability", "Set weekly hours and date exceptions in the availability manager, or add a one-off 30-minute slot. Save changes publishes the next four weeks."],
  ["Review requests", "Open a pending request to read the student’s course, topic, and description. Accept or decline it from the overview or consultation details."],
  ["Manage consultations", "Mark consultations completed or cancelled. The shared appointment status appears in both workspaces during the demo."],
  ["Keep occupied slots protected", "Pending and confirmed slots cannot be edited or removed. Previous consultation records retain their original schedule."],
];
export default function Help() {
  return <><PageHead title="Help & support" subtitle="A quick guide to managing consultations in FacultyConnect." /><div className="stack faculty-help">{STEPS.map(([title, description], i) => <section className="card" key={title}><span className="badge">Step {i + 1}</span><h2 className="faculty-spaced">{title}</h2><p className="muted">{description}</p></section>)}<div className="notice">Need more help? Contact your program coordinator at coordinator@northbridge.edu.</div></div></>;
}
