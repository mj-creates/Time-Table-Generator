/**
 * =====================================================================
 * SCHEDULEOS — script.js v3
 * =====================================================================
 * New in v3:
 *  • Particle canvas field (WebGL-style effect in Canvas 2D)
 *  • Custom neon cursor glow that follows mouse
 *  • 3D card tilt effect on role cards (mouse tracking)
 *  • Cinematic boot sequence with staggered terminal lines
 *  • Live clock in status bar
 *  • Natural typewriter with per-character jitter
 *  • Holographic card hover with scan line sweep
 *  • Button particle burst on click
 *  • Status bar text updates per screen
 *  • All API logic identical to v2 (no backend changes)
 * =====================================================================
 */
 
 
// ═══════════════════════════════════════════════
//  LIVE CLOCK — updates every second in status bar
// ═══════════════════════════════════════════════
function startClock() {
  const el = document.getElementById("clock-display");
  if (!el) return;
 
  function tick() {
    const now = new Date();
    const hh  = String(now.getHours()).padStart(2, "0");
    const mm  = String(now.getMinutes()).padStart(2, "0");
    const ss  = String(now.getSeconds()).padStart(2, "0");
    el.textContent = `${hh}:${mm}:${ss}`;
  }
 
  tick();
  setInterval(tick, 1000);
}
 
startClock();
 
 
// ═══════════════════════════════════════════════
//  PARTICLE CANVAS
//  Creates a field of floating, connected dots on a
//  full-screen canvas element behind everything.
// ═══════════════════════════════════════════════
(function initParticles() {
  const canvas = document.getElementById("particle-canvas");
  const ctx    = canvas.getContext("2d");
  let W, H, particles;
 
  const COUNT      = 80;       // number of particles
  const MAX_DIST   = 130;      // max distance to draw connecting lines
  const SPEED      = 0.3;
  const COLOR_MAIN = "0,200,255";
  const COLOR_SEC  = "176,96,255";
 
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
 
  function createParticle() {
    return {
      x:   Math.random() * W,
      y:   Math.random() * H,
      vx:  (Math.random() - 0.5) * SPEED,
      vy:  (Math.random() - 0.5) * SPEED,
      r:   Math.random() * 1.8 + 0.4,
      // alternate between two colors
      color: Math.random() > 0.5 ? COLOR_MAIN : COLOR_SEC,
    };
  }
 
  function init() {
    resize();
    particles = Array.from({ length: COUNT }, createParticle);
  }
 
  function draw() {
    ctx.clearRect(0, 0, W, H);
 
    // Update & draw dots
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
 
      // Bounce off edges
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
 
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},0.7)`;
      ctx.fill();
    }
 
    // Draw lines between nearby particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
 
        if (dist < MAX_DIST) {
          const alpha = (1 - dist / MAX_DIST) * 0.25;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(${a.color},${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
 
    requestAnimationFrame(draw);
  }
 
  window.addEventListener("resize", resize);
  init();
  draw();
})();
 
 
// ═══════════════════════════════════════════════
//  CUSTOM CURSOR GLOW — follows mouse smoothly
// ═══════════════════════════════════════════════
(function initCursor() {
  const el = document.getElementById("cursor-glow");
  if (!el) return;
 
  let mx = -100, my = -100;       // current target
  let cx = -100, cy = -100;       // current rendered position (lerped)
 
  document.addEventListener("mousemove", e => {
    mx = e.clientX;
    my = e.clientY;
  });
 
  // Expand cursor on clickable elements
  document.addEventListener("mouseover", e => {
    const target = e.target.closest("button, a, .role-card, select, [role=button]");
    if (target) {
      el.style.width  = "44px";
      el.style.height = "44px";
      el.style.opacity = "0.6";
    } else {
      el.style.width  = "20px";
      el.style.height = "20px";
      el.style.opacity = "1";
    }
  });
 
  function animateCursor() {
    // Lerp for smooth trailing
    cx += (mx - cx) * 0.12;
    cy += (my - cy) * 0.12;
    el.style.left = cx + "px";
    el.style.top  = cy + "px";
    requestAnimationFrame(animateCursor);
  }
 
  animateCursor();
})();
 
 
// ═══════════════════════════════════════════════
//  3D CARD TILT — role cards tilt on mouse move
// ═══════════════════════════════════════════════
function init3DTilt(card) {
  card.addEventListener("mousemove", e => {
    const rect   = card.getBoundingClientRect();
    const cx     = rect.left + rect.width  / 2;
    const cy     = rect.top  + rect.height / 2;
    const dx     = (e.clientX - cx) / (rect.width  / 2);   // -1 to 1
    const dy     = (e.clientY - cy) / (rect.height / 2);
 
    const rotateY = dx * 10;   // max 10 deg
    const rotateX = -dy * 8;
 
    card.style.transform =
      `translateY(-6px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });
 
  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
    card.style.transition = "transform 0.5s ease";
    setTimeout(() => { card.style.transition = ""; }, 500);
  });
}
 
document.querySelectorAll(".role-card").forEach(init3DTilt);
 
 
// ═══════════════════════════════════════════════
//  STATUS BAR TEXT
// ═══════════════════════════════════════════════
function setStatus(text) {
  const el = document.getElementById("status-text");
  if (el) el.textContent = text;
}
 
 
// ═══════════════════════════════════════════════
//  SCREEN TRANSITIONS
// ═══════════════════════════════════════════════
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => {
    s.classList.remove("active", "screen-enter");
  });
 
  const next = document.getElementById(id);
  next.classList.add("active");
  void next.offsetWidth;   // force reflow
  next.classList.add("screen-enter");
 
  window.scrollTo({ top: 0, behavior: "smooth" });
}
 
function goBack(id) {
  showScreen(id);
  if (id === "screen-role") setStatus("ROLE_SELECT");
}
 
 
// ═══════════════════════════════════════════════
//  TYPEWRITER ENGINE
//  Natural jitter, punctuation pauses, cancel fn
// ═══════════════════════════════════════════════
function typeWriter(el, text, speed = 65, done) {
  el.textContent = "";
  let i = 0, timer = null;
 
  function next() {
    if (i >= text.length) {
      if (done) setTimeout(done, 500);
      return;
    }
    el.textContent += text[i++];
    const ch = text[i - 1];
    let d = speed + (Math.random() * 24 - 12);
    if (",;:".includes(ch)) d += 110;
    if (".!?".includes(ch)) d += 200;
    timer = setTimeout(next, d);
  }
 
  next();
  return () => clearTimeout(timer);
}
 
function eraseText(el, speed, done) {
  let timer = null;
  function step() {
    if (!el.textContent.length) { if (done) setTimeout(done, 180); return; }
    el.textContent = el.textContent.slice(0, -1);
    timer = setTimeout(step, speed * 0.4);
  }
  step();
  return () => clearTimeout(timer);
}
 
 
// ═══════════════════════════════════════════════
//  SCREEN 1 — CINEMATIC BOOT SEQUENCE
//  1. Show terminal boot lines (staggered)
//  2. Reveal hero block
//  3. Type main headline
//  4. Fade in subtitle + CTA
// ═══════════════════════════════════════════════
const BOOT_MESSAGES = [
  { id: "boot-1", msg: "Initialising campus network…" },
  { id: "boot-2", msg: "Connecting to schedule database…" },
  { id: "boot-3", msg: "Loading faculty and room data…" },
  { id: "boot-4", msg: "All systems nominal. Ready." },
];
 
function runBootSequence() {
  setStatus("SYSTEM BOOT");
  const seq   = document.getElementById("boot-sequence");
  const hero  = document.getElementById("hero-block");
  const sub   = document.getElementById("hero-sub");
  const acts  = document.getElementById("hero-actions");
  const titleEl = document.getElementById("hero-title");
 
  // Show boot panel
  seq.classList.add("visible");
 
  let delay = 300;
 
  BOOT_MESSAGES.forEach(({ id, msg }) => {
    setTimeout(() => {
      const line    = document.getElementById(id);
      const msgSpan = line.querySelector(".boot-msg");
      line.classList.add("show");
      // type the message into the span
      typeWriter(msgSpan, msg, 28);
    }, delay);
    delay += 600;
  });
 
  // After all boot lines, show hero
  setTimeout(() => {
    setStatus("STANDBY");
    hero.classList.add("visible");
 
    // Type main headline
    setTimeout(() => {
      const cancelType = typeWriter(titleEl, "SCHEDULE OS", 90, () => {
        // Fade in sub + actions
        sub.classList.add("visible");
        setTimeout(() => {
          acts.classList.add("visible");
          setStatus("AWAITING INPUT");
        }, 300);
      });
    }, 400);
  }, delay + 200);
}
 
runBootSequence();
 
 
// ═══════════════════════════════════════════════
//  ENTER BUTTON → Role Screen
// ═══════════════════════════════════════════════
document.getElementById("btn-enter").addEventListener("click", () => {
  triggerButtonParticles(document.getElementById("btn-enter"));
  showScreen("screen-role");
  initRoleScreen();
});
 
 
// ═══════════════════════════════════════════════
//  SCREEN 2 — ROLE SCREEN INIT
// ═══════════════════════════════════════════════
function initRoleScreen() {
  setStatus("ROLE_SELECT");
  const heading = document.getElementById("role-heading");
  const cursor  = document.getElementById("role-cursor");
  const cards   = document.getElementById("role-cards");
 
  heading.textContent = "";
  cards.classList.remove("visible");
  cursor.style.opacity = "1";
 
  typeWriter(heading, "Choose Your Role", 65, () => {
    cursor.style.opacity = "0";
    setTimeout(() => cards.classList.add("visible"), 100);
  });
}
 
// Role card click + keyboard
function activateCard(el, fn) {
  el.addEventListener("click", fn);
  el.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); }
  });
}
 
activateCard(document.getElementById("btn-student"), () => {
  setStatus("STUDENT_QUERY");
  showScreen("screen-student");
});
 
activateCard(document.getElementById("btn-teacher"), async () => {
  setStatus("FACULTY_QUERY");
  showScreen("screen-teacher");
  await loadTeachers();
});
 
 
// ═══════════════════════════════════════════════
//  LOAD TEACHERS — GET /api/teachers
// ═══════════════════════════════════════════════
async function loadTeachers() {
  const sel    = document.getElementById("select-teacher");
  const status = document.getElementById("teacher-status");
  const btn    = document.getElementById("btn-gen-teacher");
 
  sel.innerHTML       = "<option value=''>⟳ Loading faculty list…</option>";
  status.textContent  = "Fetching from server…";
  setButtonLoading("btn-gen-teacher", true);
 
  try {
    const res  = await fetch("/api/teachers");
    const data = await res.json();
 
    sel.innerHTML = "<option value=''>Select faculty member…</option>";
    data.teachers.forEach(name => {
      const o = document.createElement("option");
      o.value = name; o.textContent = name;
      sel.appendChild(o);
    });
 
    status.textContent = `✓ ${data.teachers.length} faculty members loaded`;
    setTimeout(() => { status.textContent = ""; }, 3000);
  } catch (err) {
    sel.innerHTML = "<option value=''>⚠ Connection failed</option>";
    status.textContent = "⚠ Could not reach server";
    console.error(err);
  } finally {
    setButtonLoading("btn-gen-teacher", false);
  }
}
 
 
// ═══════════════════════════════════════════════
//  STUDENT FORM SUBMIT
// ═══════════════════════════════════════════════
document.getElementById("btn-gen-student").addEventListener("click", async () => {
  const floor = parseInt(document.getElementById("select-floor").value);
  const room  = parseInt(document.getElementById("select-room").value);
 
  if (!floor || !room) {
    shakePanel(document.querySelector("#screen-student .form-panel"));
    return;
  }
 
  triggerButtonParticles(document.getElementById("btn-gen-student"));
  setButtonLoading("btn-gen-student", true);
 
  showScreen("screen-result");
  setStatus("GENERATING");
  document.getElementById("result-back-btn").onclick = () => {
    goBack("screen-student");
    setButtonLoading("btn-gen-student", false);
  };
 
  showLoading("Generating student timetable…");
 
  const [data] = await Promise.all([
    fetchStudentTimetable(floor, room),
    delay(900)
  ]);
 
  if (data.error) { hideLoading(); showErrorBanner(data.error); return; }
  renderTimetable(data, "student");
});
 
 
// ═══════════════════════════════════════════════
//  TEACHER FORM SUBMIT
// ═══════════════════════════════════════════════
document.getElementById("btn-gen-teacher").addEventListener("click", async () => {
  const teacher = document.getElementById("select-teacher").value;
 
  if (!teacher) {
    shakePanel(document.querySelector("#screen-teacher .form-panel"));
    return;
  }
 
  triggerButtonParticles(document.getElementById("btn-gen-teacher"));
  setButtonLoading("btn-gen-teacher", true);
 
  showScreen("screen-result");
  setStatus("GENERATING");
  document.getElementById("result-back-btn").onclick = () => {
    goBack("screen-teacher");
    setButtonLoading("btn-gen-teacher", false);
  };
 
  showLoading("Loading faculty timetable…");
 
  const [data] = await Promise.all([
    fetchTeacherTimetable(teacher),
    delay(900)
  ]);
 
  if (data.error) { hideLoading(); showErrorBanner(data.error); return; }
  renderTimetable(data, "teacher");
});
 
 
// ═══════════════════════════════════════════════
//  API HELPERS
// ═══════════════════════════════════════════════
async function fetchStudentTimetable(floor, room) {
  try {
    const res = await fetch("/api/student-timetable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ floor, room }),
    });
    return res.json();
  } catch (e) { return { error: e.message }; }
}
 
async function fetchTeacherTimetable(teacher) {
  try {
    const res = await fetch("/api/teacher-timetable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacher }),
    });
    return res.json();
  } catch (e) { return { error: e.message }; }
}
 
 
// ═══════════════════════════════════════════════
//  LOADING HUD
// ═══════════════════════════════════════════════
let _cancelLoad = null;
 
function showLoading(msg) {
  const hud   = document.getElementById("loading-msg");
  const textEl = document.getElementById("loading-text");
  const tt    = document.getElementById("timetable-block");
 
  tt.style.display  = "none";
  hud.style.display = "flex";
 
  ["step-1","step-2","step-3"].forEach(id => {
    const s = document.getElementById(id);
    s.classList.remove("active", "done");
  });
 
  if (_cancelLoad) _cancelLoad();
  _cancelLoad = typeWriter(textEl, msg, 50);
 
  // Progressive step activation
  stepProgress("step-1",  250);
  stepProgress("step-2",  700);
  stepProgress("step-3", 1200);
}
 
function stepProgress(id, after) {
  setTimeout(() => {
    const el = document.getElementById(id);
    el.classList.add("active");
    setTimeout(() => {
      el.classList.remove("active");
      el.classList.add("done");
    }, 380);
  }, after);
}
 
function hideLoading() {
  document.getElementById("loading-msg").style.display = "none";
}
 
 
// ═══════════════════════════════════════════════
//  RENDER TIMETABLE
// ═══════════════════════════════════════════════
function renderTimetable(data, mode) {
  hideLoading();
  setStatus("SCHEDULE_READY");
 
  const block = document.getElementById("timetable-block");
  block.style.display = "flex";
  block.style.flexDirection = "column";
  block.style.gap = "20px";
 
  document.getElementById("result-title").textContent = data.title;
  document.getElementById("result-date").textContent  =
    "Generated on " + new Date().toLocaleDateString("en-IN", {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
 
  document.getElementById("col-subject").textContent = "SUBJECT";
  document.getElementById("col-teacher").textContent =
    mode === "student" ? "ASSIGNED TO" : "LOCATION";
 
  const tbody = document.getElementById("timetable-body");
  tbody.innerHTML = "";
 
  data.timetable.forEach((row, idx) => {
    const tr = document.createElement("tr");
    const d  = `${idx * 45}ms`;   // stagger delay per row
 
    if (row.type === "break") {
      tr.className = "row-break";
      tr.innerHTML = `
        <td class="cell-slot" style="animation-delay:${d}">☕ BREAK</td>
        <td class="cell-time" style="animation-delay:${d}">${row.time}</td>
        <td colspan="2"       style="animation-delay:${d}">— SHORT BREAK —</td>
      `;
    } else if (row.type === "lunch") {
      tr.className = "row-lunch";
      tr.innerHTML = `
        <td class="cell-slot" style="animation-delay:${d}">🍽 LUNCH</td>
        <td class="cell-time" style="animation-delay:${d}">${row.time}</td>
        <td colspan="2"       style="animation-delay:${d}">— LUNCH BREAK —</td>
      `;
    } else {
      const isRest = row.subject === "Rest (Staff Room)";
      tr.className = isRest ? "row-period row-rest" : "row-period";
 
      let col4 = "";
      if (mode === "student") {
        col4 = `<span style="color:var(--green);font-family:var(--font-mono)">${row.teacher || "—"}</span>`;
      } else {
        col4 = isRest
          ? `<span style="color:var(--text-3);font-style:italic">Staff Room</span>`
          : `<span style="color:var(--green);font-family:var(--font-mono)">${row.location || "—"}</span>`;
      }
 
      tr.innerHTML = `
        <td class="cell-slot"    style="animation-delay:${d}">${row.label}</td>
        <td class="cell-time"    style="animation-delay:${d}">${row.time}</td>
        <td class="cell-subject" style="animation-delay:${d}">${row.subject}</td>
        <td                      style="animation-delay:${d}">${col4}</td>
      `;
    }
 
    tbody.appendChild(tr);
  });
 
  window._lastTimetableData = data;
  window._lastTimetableMode = mode;
 
  // Fade in card
  const card = document.getElementById("timetable-card");
  card.classList.remove("visible");
  void card.offsetWidth;
  setTimeout(() => card.classList.add("visible"), 100);
 
  // Success toast
  const toast = document.getElementById("success-toast");
  toast.classList.remove("show");
  void toast.offsetWidth;
  setTimeout(() => {
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3500);
  }, 400);
 
  // Smooth scroll
  setTimeout(() => {
    block.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 300);
}
 
 
// ═══════════════════════════════════════════════
//  MICRO-UX HELPERS
// ═══════════════════════════════════════════════
 
/** Shake a panel element to signal validation error */
function shakePanel(el) {
  if (!el) return;
  el.style.animation = "none";
  void el.offsetWidth;
  el.style.animation = "panelShake 0.45s ease";
  el.addEventListener("animationend", () => { el.style.animation = ""; }, { once: true });
}
 
const _shakeStyle = document.createElement("style");
_shakeStyle.textContent = `
  @keyframes panelShake {
    0%,100% { transform: translateX(0); }
    15%     { transform: translateX(-10px); }
    35%     { transform: translateX(10px); }
    55%     { transform: translateX(-7px); }
    75%     { transform: translateX(5px); }
  }
`;
document.head.appendChild(_shakeStyle);
 
 
/** Burst particles from a button on click */
function triggerButtonParticles(btn) {
  const particles = btn.querySelectorAll(".gen-btn-particles span");
  if (!particles.length) return;
 
  particles.forEach((p, i) => {
    const angle  = (i / particles.length) * Math.PI * 2;
    const dist   = 40 + Math.random() * 20;
    const tx     = Math.cos(angle) * dist;
    const ty     = Math.sin(angle) * dist;
 
    p.style.cssText = `
      left: 50%; top: 50%;
      opacity: 1;
      transition: transform 0.5s ease, opacity 0.5s ease;
      transform: translate(${tx}px, ${ty}px);
    `;
 
    setTimeout(() => {
      p.style.opacity = "0";
      setTimeout(() => { p.style.cssText = ""; }, 500);
    }, 50);
  });
}
 
 
/** Toggle button loading state */
function setButtonLoading(id, loading) {
  const btn  = document.getElementById(id);
  if (!btn) return;
  const text = btn.querySelector(".gen-text");
 
  if (loading) {
    btn.disabled = true;
    btn.classList.add("loading");
    if (text) text.textContent = "Generating…";
  } else {
    btn.disabled = false;
    btn.classList.remove("loading");
    if (text) text.textContent = "Generate Timetable";
  }
}
 
 
/** Show inline error in result scene */
function showErrorBanner(msg) {
  const scene  = document.querySelector(".result-scene");
  let banner   = document.getElementById("error-banner");
 
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "error-banner";
    banner.style.cssText = `
      background: rgba(255,61,90,0.08);
      border: 1px solid rgba(255,61,90,0.25);
      border-radius: 8px;
      padding: 16px 20px;
      color: #ff3d5a;
      font-family: var(--font-mono);
      font-size: 0.82rem;
      letter-spacing: 1px;
    `;
    scene.appendChild(banner);
  }
 
  banner.textContent = "⚠ " + msg;
  banner.style.display = "block";
}
 
 
/** Simple promise delay */
function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}
 
 
// ═══════════════════════════════════════════════
//  PDF DOWNLOAD — jsPDF + AutoTable (unchanged API)
// ═══════════════════════════════════════════════
document.getElementById("btn-pdf").addEventListener("click", () => {
  const data = window._lastTimetableData;
  const mode = window._lastTimetableMode;
 
  if (!data) { alert("No timetable loaded."); return; }
 
  const { jsPDF } = window.jspdf;
  const doc  = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
 
  // Dark header strip
  doc.setFillColor(2, 4, 8);
  doc.rect(0, 0, pageW, 36, "F");
 
  // Accent stripe
  doc.setFillColor(0, 200, 255);
  doc.rect(0, 0, 3, 36, "F");
 
  doc.setTextColor(0, 200, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("SCHEDULEOS // CAMPUS INTELLIGENCE SYSTEM", 10, 10);
 
  doc.setTextColor(232, 244, 255);
  doc.setFontSize(16);
  doc.text(data.title, 10, 20);
 
  doc.setTextColor(90, 130, 160);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Generated: " + new Date().toLocaleDateString("en-IN", {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    }),
    10, 30
  );
 
  const col4H = mode === "student" ? "Assigned To" : "Location";
  const head  = [["Period", "Time", "Subject", col4H]];
 
  const body = data.timetable.map(row => {
    if (row.type === "break") return ["☕ Break", row.time, "Short Break", ""];
    if (row.type === "lunch") return ["🍽 Lunch", row.time, "Lunch Break", ""];
    const c4 = mode === "student" ? (row.teacher || "—") : (row.location || "Staff Room");
    return [row.label, row.time, row.subject, c4];
  });
 
  doc.autoTable({
    startY: 42,
    head,
    body,
    theme: "grid",
    headStyles: { fillColor: [6,16,32], textColor: [0,200,255], fontStyle:"bold", fontSize:8, letterSpacing:2 },
    bodyStyles: { fontSize:9, textColor:[200,220,240], fillColor:[10,16,24], lineColor:[0,50,80], lineWidth:0.3 },
    alternateRowStyles: { fillColor:[6,12,20] },
    didParseCell(h) {
      const v = h.cell.raw;
      if (typeof v === "string" && v.includes("Break"))
        Object.assign(h.cell.styles, { textColor:[255,61,90], fillColor:[30,8,12] });
      if (typeof v === "string" && v.includes("Lunch"))
        Object.assign(h.cell.styles, { textColor:[255,149,0], fillColor:[28,18,6] });
      if (h.column.index === 0 && h.row.section === "body")
        Object.assign(h.cell.styles, { textColor:[0,200,255], fontStyle:"bold" });
      if (h.column.index === 3 && h.row.section === "body")
        h.cell.styles.textColor = [0,255,157];
    },
    margin: { left:10, right:10 },
    columnStyles: { 0:{cellWidth:28}, 1:{cellWidth:38}, 2:{cellWidth:75}, 3:{cellWidth:45} },
  });
 
  const fy = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(7);
  doc.setTextColor(50, 80, 100);
  doc.text("© ScheduleOS Campus Intelligence · Auto-generated · v3.0", 10, fy);
 
  doc.save(data.title.replace(/[^a-z0-9]/gi,"_").toLowerCase() + ".pdf");
});