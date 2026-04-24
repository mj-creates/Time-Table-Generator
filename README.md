# ScheduleOS
### Campus Timetable Intelligence System
> One master schedule. 120 classrooms. Zero conflicts.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| PDF Export | jsPDF + AutoTable |
| Data | In-Memory (JavaScript Object) |

---

## Project Structure

```
scheduleos/
├── index.js          ← backend server + schedule algorithm
├── package.json      ← dependencies
└── public/
    ├── index.html    ← frontend (4 screens)
    ├── style.css     ← sci-fi glassmorphism UI
    └── script.js     ← all frontend logic
```

---

## Prerequisites

- Node.js installed on your machine
- Download from https://nodejs.org (LTS version)
- Verify by running `node -v` in terminal

---

## How to Run

**Step 1 — Install dependencies**
```bash
npm install
```

**Step 2 — Start the server**
```bash
node index.js
```

**Step 3 — Open the app**
```
http://localhost:3000
```

---

## What You'll See in Terminal

```
╔══════════════════════════════════════╗
║         ScheduleOS v5.0             ║
╚══════════════════════════════════════╝

⚙  Building master schedule…
   Faculty  : 300
   Rooms    : 120
   Surplus  : 180 teachers/slot
✅ Done — 120 rooms scheduled
   Free periods per room: min=1  max=2  avg=1.5

✅ ScheduleOS running → http://localhost:3000
```

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/schedule-status` | Server health + schedule info |
| GET | `/api/teachers` | All 300 teachers |
| POST | `/api/student-timetable` | Timetable for a room |
| POST | `/api/teacher-timetable` | Timetable for a teacher |
| POST | `/api/regenerate` | Rebuild entire schedule |

---

## How the Schedule is Generated

The algorithm runs in two phases when the server starts:

**Phase 1 — Free Period Pre-Assignment**
Every room is randomly assigned 1 or 2 free periods.
Free periods can only fall in periods 3 to 7.
Periods 1 and 2 are always taught — mornings are never free.

**Phase 2 — Teacher Assignment**
Goes period by period from slot 1 to 7.
For each slot, a `busyTeachers` Set tracks assigned teachers.
Once a teacher is assigned to one room, they are locked for that slot.
The same teacher can never appear in two rooms at the same time.
With 300 teachers for 120 rooms, there is always a surplus of 180 per slot.

---

## Period Schedule

| Period | Time |
|--------|------|
| Period 1 | 08:00 – 08:50 |
| Period 2 | 08:50 – 09:40 |
| Short Break | 09:40 – 10:00 |
| Period 3 | 10:00 – 10:50 |
| Period 4 | 10:50 – 11:40 |
| Period 5 | 11:40 – 12:30 |
| Lunch Break | 12:30 – 13:15 |
| Period 6 | 13:15 – 14:05 |
| Period 7 | 14:05 – 14:55 |

---

## Stats

- 6 floors × 20 rooms = **120 classrooms**
- 20 subjects × 15 teachers = **300 faculty**
- 7 teaching periods per day
- 1 to 2 free periods per room per day
- 0 teacher conflicts — guaranteed

---

## Common Errors

**Port 3000 already in use**
```bash
# Kill the process using port 3000
npx kill-port 3000
# Then run again
node index.js
```

**node: command not found**
→ Node.js is not installed. Download from https://nodejs.org

**Cannot find module 'express'**
→ Run `npm install` first before starting the server

---

*ScheduleOS — Built with Node.js + Express*
