// Hardcoded sample data for Phase 1
import { addMinutes } from "../utils/format.js";

export const TODAY = "2026-10-26"; 
export const UNIVERSITY = "Northbridge University";
export const SEMESTER = "Fall semester 2026";

export const departments = ["Computer Science", "Mathematics", "Physics", "Biology", "Communication"];

export const initialFaculty = [
  {
    id: "f1", name: "Dr. Sarah Chen", email: "sarah.chen@northbridge.edu", rank: "Associate Professor",
    department: "Computer Science", subjects: ["Algorithms", "Machine learning"], courses: ["CS 201", "CS 301"],
    office: "Science Building, Room 204", color: "#2d5a48",
    bio: "Dr. Chen researches efficient learning algorithms and teaches the core data structures sequence. She holds consultations for coursework questions, capstone feedback, and graduate school advice.",
  },
  {
    id: "f2", name: "Dr. James Wilson", email: "james.wilson@northbridge.edu", rank: "Assistant Professor",
    department: "Mathematics", subjects: ["Calculus", "Linear algebra"], courses: ["MATH 102", "MATH 210"],
    office: "Faculty Hall, Room 118", color: "#8a5a1f",
    bio: "Dr. Wilson teaches introductory calculus and linear algebra. He prefers short online check-ins before quizzes and midterms, and in-person sessions for longer proof work.",
  },
  {
    id: "f3", name: "Prof. Elena Martinez", email: "elena.martinez@northbridge.edu", rank: "Professor",
    department: "Physics", subjects: ["Mechanics", "Laboratory methods"], courses: ["PHYS 101", "PHYS 220"],
    office: "Science Building, Room 310", color: "#4a5f8a",
    bio: "Prof. Martinez coordinates the first-year physics laboratories. Students visit her for lab report feedback, problem set walkthroughs, and undergraduate research openings.",
  },
  {
    id: "f4", name: "Dr. David Park", email: "david.park@northbridge.edu", rank: "Lecturer",
    department: "Computer Science", subjects: ["Software engineering", "Databases"], courses: ["CS 210", "CS 330"],
    office: "Science Building, Room 218", color: "#7a4a6a",
    bio: "Dr. Park teaches software engineering and databases, with a focus on team projects. Consultations are best for project planning, code review, and sprint check-ins.",
  },
  {
    id: "f5", name: "Dr. Amara Okafor", email: "amara.okafor@northbridge.edu", rank: "Associate Professor",
    department: "Biology", subjects: ["Cell biology", "Genetics"], courses: ["BIO 110", "BIO 250"],
    office: "Life Sciences Building, Room 112", color: "#3f7a5a",
    bio: "Dr. Okafor studies gene regulation and leads the introductory cell biology course. Come by for lab report feedback, exam preparation, or advice on pre-medical pathways.",
  },
  {
    id: "f6", name: "Prof. Rafael Domingo", email: "rafael.domingo@northbridge.edu", rank: "Professor",
    department: "Communication", subjects: ["Academic writing", "Public speaking"], courses: ["COMM 120", "COMM 305"],
    office: "Humanities Hall, Room 305", color: "#9a5a3a",
    bio: "Prof. Domingo teaches academic writing and public speaking. He reviews essay drafts, presentation outlines, and scholarship statements during consultation hours.",
  },
];

export const initialStudents = [
  { id: "s1", name: "Alex Johnson", email: "alex.johnson@northbridge.edu", program: "BS Computer Science" },
  { id: "s2", name: "Maya Reyes", email: "maya.reyes@northbridge.edu", program: "BS Biology" },
  { id: "s3", name: "Daniel Tan", email: "daniel.tan@northbridge.edu", program: "BS Mathematics" },
  { id: "s4", name: "Priya Nair", email: "priya.nair@northbridge.edu", program: "BS Computer Science" },
  { id: "s5", name: "Jacob Lim", email: "jacob.lim@northbridge.edu", program: "BS Physics" },
];

const S = (id, facultyId, date, start, mode = "in-person", location) => ({
  id, facultyId, date, start, end: addMinutes(start, 30), mode, location,
});
const CHEN = "Science Building, Room 204";
const WILSON = "Faculty Hall, Room 118";
const MARTINEZ = "Science Building, Room 310";
const PARK = "Science Building, Room 218";
const OKAFOR = "Life Sciences Building, Room 112";
const DOMINGO = "Humanities Hall, Room 305";
const ONLINE = "Online consultation";

export const initialSlots = [
  S("sl01", "f1", "2026-10-30", "09:00", "in-person", CHEN),
  S("sl02", "f1", "2026-10-30", "09:30", "in-person", CHEN),
  S("sl03", "f1", "2026-10-30", "10:00", "in-person", CHEN),
  S("sl04", "f1", "2026-10-30", "10:30", "in-person", CHEN),
  S("sl05", "f1", "2026-11-02", "13:00", "in-person", CHEN),
  S("sl06", "f1", "2026-11-03", "10:00", "in-person", CHEN),
  S("sl07", "f1", "2026-10-28", "14:00", "in-person", CHEN),
  S("sl08", "f1", "2026-10-19", "09:00", "in-person", CHEN),
  S("sl09", "f1", "2026-10-20", "11:00", "in-person", CHEN),
  S("sl10", "f2", "2026-11-02", "14:00", "online", ONLINE),
  S("sl11", "f2", "2026-11-02", "14:30", "online", ONLINE),
  S("sl12", "f2", "2026-10-27", "14:00", "online", ONLINE),
  S("sl13", "f2", "2026-10-27", "14:30", "online", ONLINE),
  S("sl14", "f2", "2026-11-04", "15:00", "in-person", WILSON),
  S("sl15", "f3", "2026-10-28", "11:00", "in-person", MARTINEZ),
  S("sl16", "f3", "2026-10-30", "10:00", "in-person", MARTINEZ),
  S("sl17", "f3", "2026-11-05", "10:30", "in-person", MARTINEZ),
  S("sl18", "f3", "2026-10-21", "10:00", "in-person", MARTINEZ),
  S("sl19", "f3", "2026-11-04", "09:30", "in-person", MARTINEZ),
  S("sl20", "f4", "2026-11-02", "09:30", "in-person", PARK),
  S("sl21", "f4", "2026-10-27", "09:00", "in-person", PARK),
  S("sl22", "f4", "2026-10-29", "11:00", "in-person", PARK),
  S("sl23", "f4", "2026-10-22", "09:30", "in-person", PARK),
  S("sl24", "f4", "2026-11-03", "09:00", "in-person", PARK),
  S("sl25", "f5", "2026-10-28", "09:30", "in-person", OKAFOR),
  S("sl26", "f5", "2026-10-29", "13:30", "in-person", OKAFOR),
  S("sl27", "f5", "2026-10-27", "10:00", "in-person", OKAFOR),
  S("sl28", "f5", "2026-11-05", "14:00", "in-person", OKAFOR),
  S("sl29", "f5", "2026-10-14", "10:00", "in-person", OKAFOR),
  S("sl30", "f6", "2026-10-29", "10:30", "in-person", DOMINGO),
  S("sl31", "f6", "2026-10-30", "14:00", "in-person", DOMINGO),
  S("sl32", "f6", "2026-11-03", "15:30", "in-person", DOMINGO),
  S("sl33", "f6", "2026-11-06", "11:00", "online", ONLINE),
  S("sl34", "f6", "2026-10-27", "15:00", "in-person", DOMINGO),
];

const A = (id, studentId, slotId, status, subject, topic, description) => ({
  id, studentId, slotId, status, subject, topic, description,
});

export const initialAppointments = [
  // Alex Johnson  — one record per status, as in the approved design
  A("a1", "s1", "sl01", "confirmed", "CS 201", "Coursework discussion", "Review recursion and the practice problem set."),
  A("a2", "s1", "sl10", "pending", "MATH 102", "Exam preparation", "Go over the limits and derivatives practice problems before the midterm."),
  A("a3", "s1", "sl08", "completed", "CS 201", "Algorithm analysis", "Walk through Big-O analysis for the sorting assignment."),
  A("a4", "s1", "sl18", "declined", "PHYS 101", "Lab preparation", "Ask about the error analysis section of the pendulum lab."),
  A("a5", "s1", "sl23", "cancelled", "CS 210", "Project planning", "Discuss splitting tasks for the team project sprint."),
  // Other students (visible on the faculty side)
  A("a6", "s2", "sl02", "pending", "CS 201", "Binary tree traversal", "I keep mixing up preorder and postorder results and want to practice with examples."),
  A("a7", "s3", "sl06", "pending", "CS 301", "Dynamic programming review", "Need help identifying the subproblems for the knapsack variant in homework 4."),
  A("a8", "s4", "sl09", "completed", "CS 490", "Capstone proposal feedback", "Review the problem statement and evaluation plan for my capstone proposal."),
  A("a9", "s5", "sl20", "pending", "CS 210", "Sprint retrospective", "Our team wants advice on handling uneven workload before the next sprint."),
  A("a10", "s2", "sl25", "confirmed", "BIO 110", "Lab report feedback", "Check my results section for the enzyme activity lab before I submit."),
  A("a11", "s3", "sl12", "confirmed", "MATH 102", "Quiz 2 review", "Go over the chain rule problems I missed on quiz 2."),
  A("a12", "s4", "sl30", "pending", "COMM 120", "Essay thesis statement", "Discuss whether my thesis for the policy essay is specific enough."),
  A("a13", "s5", "sl15", "confirmed", "PHYS 101", "Kinematics problem set", "Walk through problems 5 and 7 on projectile motion."),
  A("a14", "s5", "sl29", "completed", "BIO 110", "Cell structure quiz", "Clarify the difference between rough and smooth ER before the quiz."),
];
