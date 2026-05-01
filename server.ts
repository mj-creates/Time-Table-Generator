import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // ── DATA ──
  const SUBJECTS = [
    "Mathematics", "Physics", "Chemistry", "Computer Science", "English",
    "Electronics", "Data Structures", "Operating Systems", "Networking", "Artificial Intelligence"
  ];

  const SUBJECT_TEACHERS: Record<string, string[]> = {
    "Mathematics":        ["Dr. Arjun Mehta", "Prof. Sunita Rao", "Dr. Kavya Nair", "Prof. Rajesh Kumar"],
    "Physics":            ["Dr. Priya Sharma", "Prof. Vikram Patel", "Dr. Ananya Iyer", "Prof. Sanjay Gupta"],
    "Chemistry":          ["Dr. Meena Pillai", "Prof. Harish Reddy", "Dr. Rohit Joshi", "Prof. Deepa Singh"],
    "Computer Science":   ["Dr. Arun Nambiar", "Prof. Sneha Tiwari", "Dr. Kiran Bose", "Prof. Lata Verma", "Dr. Manoj Das"],
    "English":            ["Prof. Rekha Nair", "Dr. Suresh Babu", "Prof. Divya Menon", "Dr. Rahul Ghosh"],
    "Electronics":        ["Dr. Vinod Kumar", "Prof. Asha Pillai", "Dr. Nikhil Saxena", "Prof. Geeta Jain"],
    "Data Structures":    ["Dr. Anil Kapoor", "Prof. Pooja Mishra", "Dr. Sunil Yadav", "Prof. Nisha Bansal"],
    "Operating Systems":  ["Dr. Ritu Chauhan", "Prof. Amit Srivastava", "Dr. Rani Dubey", "Prof. Sonal Bhatt"],
    "Networking":         ["Dr. Tarun Malhotra", "Prof. Swati Kulkarni", "Dr. Dinesh Pandey", "Prof. Mala Tripathi"],
    "Artificial Intelligence": ["Dr. Aishwarya Rao", "Prof. Rohan Bhat", "Dr. Pallavi Negi", "Prof. Suresh Menon", "Dr. Leena Das"]
  };

  const ALL_TEACHERS: Record<string, string> = {};
  const TEACHER_NAMES: string[] = [];
  for (const [subject, teachers] of Object.entries(SUBJECT_TEACHERS)) {
    for (const teacher of teachers) {
      ALL_TEACHERS[teacher] = subject;
      TEACHER_NAMES.push(teacher);
    }
  }

  const TEACHER_LIST_SORTED = [...TEACHER_NAMES].sort();

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

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ── MASTER SCHEDULE GENERATOR ✨ ──
  let masterTimetable: any = null;
  let activeNotifications: any[] = [];

  function generateMasterTimetable() {
    console.log("Generating Master Timetable...");
    activeNotifications = []; // Clear notifications on reboot
    const timetable: any = {};
    
    // Track teacher availability per period
    // teacherBusy[period] = Set of busy teacher names
    const teacherBusy: Record<number, Set<string>> = {
      1: new Set(), 2: new Set(), 3: new Set(), 
      4: new Set(), 5: new Set(), 6: new Set(), 7: new Set()
    };

    // We have 6 floors, 20 rooms per floor = 120 rooms total
    // We have ~48 teachers. 48 teachers can occupy 48 rooms per period.
    // So roughly 40% of rooms will be busy, others will be "Self Study" or "Free"

    for (let p = 1; p <= 7; p++) {
      timetable[p] = {};
      
      // Shuffle classrooms to distribute teachers fairly across the building
      const classrooms = [];
      for (let f = 1; f <= 6; f++) {
        for (let r = 1; r <= 20; r++) {
          classrooms.push({ f, r });
        }
      }
      const shuffledRooms = shuffle(classrooms);
      
      // Assign teachers to some rooms until we run out of teachers or capacity
      // Let's say max 40 classrooms active per period to leave some teachers resting
      const activeRoomsCount = Math.min(shuffledRooms.length, TEACHER_NAMES.length - 5); 
      const activeRooms = shuffledRooms.slice(0, activeRoomsCount);
      
      const availableTeachers = shuffle(TEACHER_NAMES);
      let tIdx = 0;

      activeRooms.forEach(({ f, r }) => {
        if (!timetable[p][f]) timetable[p][f] = {};
        
        const teacher = availableTeachers[tIdx++];
        const subject = ALL_TEACHERS[teacher];
        
        timetable[p][f][r] = { subject, teacher };
        teacherBusy[p].add(teacher);
      });
    }

    masterTimetable = timetable;
    return timetable;
  }

  // Initial Generation
  generateMasterTimetable();

  function buildTimetableRows(floor: number, room: number) {
    const rows = [];
    for (const slot of PERIOD_SCHEDULE) {
      if (slot.slot === "break") {
        rows.push({ type: "break", label: "☕ Short Break", time: slot.time });
      } else if (slot.slot === "lunch") {
        rows.push({ type: "lunch", label: "🍽 Lunch Break", time: slot.time });
      } else {
        const p = slot.slot as number;
        const data = masterTimetable[p]?.[floor]?.[room] || { subject: "Self Study / Library", teacher: "—" };
        rows.push({ type: "period", label: slot.label, time: slot.time, ...data });
      }
    }
    return rows;
  }

  function getTeacherSchedule(teacherName: string) {
    const rows = [];
    const subject = ALL_TEACHERS[teacherName];

    for (const slot of PERIOD_SCHEDULE) {
      if (slot.slot === "break") {
        rows.push({ type: "break", label: "☕ Short Break", time: slot.time });
      } else if (slot.slot === "lunch") {
        rows.push({ type: "lunch", label: "🍽 Lunch Break", time: slot.time });
      } else {
        const p = slot.slot as number;
        // Search all floors/rooms for this teacher in this period
        let location = "Rest (Staff Room)";
        let isTeaching = false;

        for (let f = 1; f <= 6; f++) {
          for (let r = 1; r <= 20; r++) {
            if (masterTimetable[p]?.[f]?.[r]?.teacher === teacherName) {
              location = `Floor ${f}, Room ${r < 10 ? '0'+r : r}`;
              isTeaching = true;
              break;
            }
          }
          if (isTeaching) break;
        }

        rows.push({ 
          type: "period", 
          label: slot.label, 
          time: slot.time, 
          subject: isTeaching ? subject : "Rest (Staff Room)",
          location,
          isTeaching 
        });
      }
    }
    return rows;
  }

  // ── API ROUTES ──
  app.get("/api/teachers", (req, res) => {
    res.json({ teachers: TEACHER_LIST_SORTED });
  });

  app.post("/api/student-timetable", (req, res) => {
    const { floor, room } = req.body;
    if (!floor || !room) return res.status(400).json({ error: "Missing floor or room." });
    
    const timetable = buildTimetableRows(parseInt(floor), parseInt(room));
    res.json({ title: `Student Timetable – Floor ${floor}, Room ${room}`, floor, room, timetable });
  });

  app.post("/api/teacher-timetable", (req, res) => {
    const { teacher } = req.body;
    if (!ALL_TEACHERS[teacher]) return res.status(400).json({ error: "Unknown teacher." });

    const timetable = getTeacherSchedule(teacher);
    res.json({ title: `Teacher Timetable – ${teacher}`, teacher, subject: ALL_TEACHERS[teacher], timetable });
  });

  app.get("/api/campus-stats", (req, res) => {
    // Return occupancy stats
    let totalClasses = 0;
    for (let p = 1; p <= 7; p++) {
      for (let f = 1; f <= 6; f++) {
        totalClasses += Object.keys(masterTimetable[p]?.[f] || {}).length;
      }
    }
    res.json({
      totalRooms: 120,
      totalTeachers: TEACHER_NAMES.length,
      averageOccupancy: ((totalClasses / (120 * 7)) * 100).toFixed(1) + "%",
      activeClassesNow: totalClasses
    });
  });

  app.get("/api/notifications", (req, res) => {
    res.json({ notifications: activeNotifications });
  });

  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    if (password === "admin123") {
      res.json({ success: true, token: "admin_token_xyz" });
    } else {
      res.status(401).json({ success: false, error: "Invalid Access Code" });
    }
  });

  app.post("/api/admin/notify", (req, res) => {
    const { message, type } = req.body;
    const notification = {
      id: Date.now(),
      message,
      type: type || 'alert',
      timestamp: new Date().toISOString()
    };
    activeNotifications.unshift(notification);
    if (activeNotifications.length > 5) activeNotifications.pop();
    res.json({ success: true, notification });
  });

  app.post("/api/admin/clear-notifications", (req, res) => {
    activeNotifications = [];
    res.json({ success: true });
  });

  app.post("/api/admin/regenerate", (req, res) => {
    generateMasterTimetable();
    res.json({ success: true, message: "Master schedule recalculated." });
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const template = await vite.transformIndexHtml(url, `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ScheduleOS</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        if (e instanceof Error) vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🎓 ScheduleOS running at http://localhost:${PORT}\n`);
  });
}

startServer();

