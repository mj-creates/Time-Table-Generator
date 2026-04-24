/**
 * =====================================================
 * COLLEGE TIMETABLE GENERATOR - Backend (index.js)
 * =====================================================
 * Tech: Node.js + Express
 * Routes:
 *   GET  /api/teachers             → List all teachers
 *   POST /api/student-timetable    → Timetable for a room
 *   POST /api/teacher-timetable    → Timetable for a teacher
 * =====================================================
 */

const express = require("express");
const path    = require("path");
const app     = express();
const PORT    = 3000;

// ── Middleware ──────────────────────────────────────
app.use(express.json());                            // Parse JSON request bodies
app.use(express.static(path.join(__dirname, "public"))); // Serve frontend files


// ══════════════════════════════════════════════════
//  DATA  –  Subjects & Teachers
//  Rules:
//    • Each subject has MULTIPLE teachers
//    • Teachers are NOT unique per subject
//    • A teacher can teach only 1 subject
// ══════════════════════════════════════════════════

const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Computer Science",
  "English",
  "Electronics",
  "Data Structures",
  "Operating Systems",
  "Networking",
  "Artificial Intelligence"
];

// Each subject maps to 4–6 teachers
const SUBJECT_TEACHERS = {
  "Mathematics":        ["Dr. Arjun Mehta",   "Prof. Sunita Rao",    "Dr. Kavya Nair",     "Prof. Rajesh Kumar"],
  "Physics":            ["Dr. Priya Sharma",  "Prof. Vikram Patel",  "Dr. Ananya Iyer",    "Prof. Sanjay Gupta"],
  "Chemistry":          ["Dr. Meena Pillai",  "Prof. Harish Reddy",  "Dr. Rohit Joshi",    "Prof. Deepa Singh"],
  "Computer Science":   ["Dr. Arun Nambiar",  "Prof. Sneha Tiwari",  "Dr. Kiran Bose",     "Prof. Lata Verma",   "Dr. Manoj Das"],
  "English":            ["Prof. Rekha Nair",  "Dr. Suresh Babu",     "Prof. Divya Menon",  "Dr. Rahul Ghosh"],
  "Electronics":        ["Dr. Vinod Kumar",   "Prof. Asha Pillai",   "Dr. Nikhil Saxena",  "Prof. Geeta Jain"],
  "Data Structures":    ["Dr. Anil Kapoor",   "Prof. Pooja Mishra",  "Dr. Sunil Yadav",    "Prof. Nisha Bansal"],
  "Operating Systems":  ["Dr. Ritu Chauhan",  "Prof. Amit Srivastava","Dr. Rani Dubey",    "Prof. Sonal Bhatt"],
  "Networking":         ["Dr. Tarun Malhotra","Prof. Swati Kulkarni","Dr. Dinesh Pandey",  "Prof. Mala Tripathi"],
  "Artificial Intelligence": ["Dr. Aishwarya Rao","Prof. Rohan Bhat","Dr. Pallavi Negi",  "Prof. Suresh Menon", "Dr. Leena Das"]
};

// Flatten all teachers into a lookup: teacherName → subject
const ALL_TEACHERS = {};
for (const [subject, teachers] of Object.entries(SUBJECT_TEACHERS)) {
  for (const teacher of teachers) {
    ALL_TEACHERS[teacher] = subject;
  }
}

// Full sorted list of teacher names
const TEACHER_LIST = Object.keys(ALL_TEACHERS).sort();

// ── Period structure ─────────────────────────────
// 7 teaching periods per day + 2 fixed breaks
const PERIOD_SCHEDULE = [
  { slot: 1, label: "Period 1",  time: "08:00 – 08:50" },
  { slot: 2, label: "Period 2",  time: "08:50 – 09:40" },
  { slot: "break",  label: "Short Break", time: "09:40 – 10:00" },
  { slot: 3, label: "Period 3",  time: "10:00 – 10:50" },
  { slot: 4, label: "Period 4",  time: "10:50 – 11:40" },
  { slot: 5, label: "Period 5",  time: "11:40 – 12:30" },
  { slot: "lunch", label: "Lunch Break", time: "12:30 – 13:15" },
  { slot: 6, label: "Period 6",  time: "13:15 – 14:05" },
  { slot: 7, label: "Period 7",  time: "14:05 – 14:55" },
];


// ══════════════════════════════════════════════════
//  HELPER – Shuffle an array (Fisher-Yates)
// ══════════════════════════════════════════════════
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ══════════════════════════════════════════════════
//  HELPER – Pick a random item from an array
// ══════════════════════════════════════════════════
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}


// ══════════════════════════════════════════════════
//  HELPER – Build 7 periods for a student room
//  Rules:
//    • No teacher appears twice in the same room's day
//    • Subjects are varied (no consecutive repeats)
// ══════════════════════════════════════════════════
function buildStudentPeriods(floor, room) {
  const usedTeachers = new Set();
  const periods      = [];
  const subjectPool  = shuffle(SUBJECTS); // Randomize subject order

  let subjectIndex = 0;

  for (let p = 1; p <= 7; p++) {
    // Cycle through subjects; avoid repeating the same subject back-to-back
    let subject = subjectPool[subjectIndex % subjectPool.length];
    subjectIndex++;

    // Find an available teacher for this subject
    const candidates = shuffle(SUBJECT_TEACHERS[subject]);
    let assigned = null;

    for (const teacher of candidates) {
      if (!usedTeachers.has(teacher)) {
        assigned = teacher;
        break;
      }
    }

    // Fallback: if all teachers for this subject are used, try another subject
    if (!assigned) {
      for (const altSubject of shuffle(SUBJECTS)) {
        const altCandidates = shuffle(SUBJECT_TEACHERS[altSubject]);
        for (const teacher of altCandidates) {
          if (!usedTeachers.has(teacher)) {
            subject  = altSubject;
            assigned = teacher;
            break;
          }
        }
        if (assigned) break;
      }
    }

    usedTeachers.add(assigned);
    periods.push({ period: p, subject, teacher: assigned });
  }

  return periods;
}


// ══════════════════════════════════════════════════
//  HELPER – Build a day's timetable rows with breaks
// ══════════════════════════════════════════════════
function buildTimetableRows(teachingPeriods) {
  // teachingPeriods: array of { period, subject, teacher } or { period, location }
  const rows = [];
  let periodIndex = 0;

  for (const slot of PERIOD_SCHEDULE) {
    if (slot.slot === "break") {
      rows.push({ type: "break",  label: "☕ Short Break", time: slot.time, content: "" });
    } else if (slot.slot === "lunch") {
      rows.push({ type: "lunch",  label: "🍽 Lunch Break", time: slot.time, content: "" });
    } else {
      const data = teachingPeriods[periodIndex++];
      rows.push({ type: "period", label: slot.label, time: slot.time, ...data });
    }
  }

  return rows;
}


// ══════════════════════════════════════════════════
//  ROUTE: GET /api/teachers
//  Returns the full list of teacher names
// ══════════════════════════════════════════════════
app.get("/api/teachers", (req, res) => {
  res.json({ teachers: TEACHER_LIST });
});


// ══════════════════════════════════════════════════
//  ROUTE: POST /api/student-timetable
//  Body: { floor: Number, room: Number }
//  Returns: timetable rows for that room
// ══════════════════════════════════════════════════
app.post("/api/student-timetable", (req, res) => {
  const { floor, room } = req.body;

  // Validate inputs
  if (!floor || !room || floor < 1 || floor > 6 || room < 1 || room > 20) {
    return res.status(400).json({ error: "Invalid floor (1–6) or room (1–20)." });
  }

  const teachingPeriods = buildStudentPeriods(floor, room);
  const timetable       = buildTimetableRows(teachingPeriods);

  res.json({
    title:     `Student Timetable – Floor ${floor}, Room ${room}`,
    floor,
    room,
    timetable,
  });
});


// ══════════════════════════════════════════════════
//  ROUTE: POST /api/teacher-timetable
//  Body: { teacher: String }
//  Returns: 7-slot timetable (max 5 teaching periods)
// ══════════════════════════════════════════════════
app.post("/api/teacher-timetable", (req, res) => {
  const { teacher } = req.body;

  if (!teacher || !ALL_TEACHERS[teacher]) {
    return res.status(400).json({ error: "Unknown teacher name." });
  }

  const subject   = ALL_TEACHERS[teacher];
  const MAX_TEACH = 5; // A teacher teaches at most 5 periods

  // Decide which period slots (1–7) the teacher is active in
  const allSlots     = [1, 2, 3, 4, 5, 6, 7];
  const shuffled     = shuffle(allSlots);
  const teachSlots   = new Set(shuffled.slice(0, MAX_TEACH)); // pick 5 at random

  // Build 7 period entries
  const teachingPeriods = allSlots.map(p => {
    if (teachSlots.has(p)) {
      // Assign a random floor & room
      const assignedFloor = Math.ceil(Math.random() * 6);
      const assignedRoom  = Math.ceil(Math.random() * 20);
      return {
        period:   p,
        subject,
        location: `Floor ${assignedFloor}, Room ${assignedRoom}`,
        isTeaching: true
      };
    } else {
      return {
        period:   p,
        subject:  "Rest (Staff Room)",
        location: "—",
        isTeaching: false
      };
    }
  });

  const timetable = buildTimetableRows(teachingPeriods);

  res.json({
    title:    `Teacher Timetable – ${teacher}`,
    teacher,
    subject,
    timetable,
  });
});


// ── Start the server ─────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎓 Timetable Generator running at http://localhost:${PORT}\n`);
});
