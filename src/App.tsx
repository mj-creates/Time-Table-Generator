import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Download, Zap, Users, GraduationCap, Clock, Monitor } from 'lucide-react';
import ParticleBackground from './components/Effects/Particles';
import CustomCursor from './components/Effects/Cursor';

type Screen = 'welcome' | 'role' | 'student' | 'teacher' | 'result' | 'admin_login' | 'admin_dash';

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Extended type for jsPDF with autotable
interface jsPDFWithPlugin extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [status, setStatus] = useState("SYSTEM BOOT");
  const [time, setTime] = useState("");
  const [teachers, setTeachers] = useState<string[]>([]);
  const [timetableData, setTimetableData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Load persisted schedule and start core background tasks
  useEffect(() => {
    // 1. Fetch System Stats
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/campus-stats');
        const data = await res.json();
        setStats(data);
      } catch (e) {
        console.error("Stats fetch failed", e);
      }
    };
    fetchStats();

    // 2. Fetch/Poll Notifications
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications');
        const data = await res.json();
        setNotifications(data.notifications);
      } catch (e) {
        console.error("Notifications fetch failed", e);
      }
    };
    fetchNotifications();
    const notificationInterval = setInterval(fetchNotifications, 5000);

    // 3. Load Saved Session
    const saved = localStorage.getItem('schedule_os_saved');
    if (saved) {
      try {
        setTimetableData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved schedule", e);
      }
    }

    // 4. Update System Clock
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-GB', { hour12: false }));
    }, 1000);

    return () => {
      clearInterval(notificationInterval);
      clearInterval(timer);
    };
  }, []);

  const regenerateSystem = async () => {
    setStatus("RESETTING_CORE");
    try {
      await fetch('/api/admin/regenerate', { method: 'POST' });
      localStorage.removeItem('schedule_os_saved');
      setTimetableData(null);
      
      const statRes = await fetch('/api/campus-stats');
      setStats(await statRes.json());
      
      setStatus("SYSTEM_REBOOTED");
      setTimeout(() => setStatus("AWAITING_INPUT"), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/teachers');
      const data = await res.json();
      setTeachers(data.teachers);
    } catch (e) {
      console.error(e);
    }
  };

  const generateStudent = async (floor: number, room: number) => {
    setLoading(true);
    setScreen('result');
    setStatus("GENERATING");
    try {
      const res = await fetch('/api/student-timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ floor, room })
      });
      const data = await res.json();
      const payload = { ...data, type: 'student' };
      setTimetableData(payload);
      localStorage.setItem('schedule_os_saved', JSON.stringify(payload));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setStatus("SCHEDULE_READY");
    }
  };

  const generateTeacher = async (name: string) => {
    setLoading(true);
    setScreen('result');
    setStatus("GENERATING");
    try {
      const res = await fetch('/api/teacher-timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher: name })
      });
      const data = await res.json();
      const payload = { ...data, type: 'teacher' };
      setTimetableData(payload);
      localStorage.setItem('schedule_os_saved', JSON.stringify(payload));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setStatus("SCHEDULE_READY");
    }
  };

  const clearSchedule = () => {
    localStorage.removeItem('schedule_os_saved');
    setTimetableData(null);
    setScreen('role');
    setStatus('ROLE_SELECT');
  };

  const exportPDF = () => {
    if (!timetableData) return;
    
    const doc = new jsPDF() as jsPDFWithPlugin;
    const title = timetableData.title;
    
    // Aesthetic Styling for PDF
    doc.setFillColor(2, 4, 8);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(0, 200, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("SCHEDULE OS", 15, 20);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(title, 15, 32);
    
    const headers = [["Period", "Time Slot", "Subject", timetableData.type === 'student' ? 'Faculty' : 'Location']];
    const rows = timetableData.timetable.map((row: any) => [
      row.label,
      row.time,
      row.subject,
      timetableData.type === 'student' ? row.teacher : row.location
    ]);

    doc.autoTable({
      startY: 45,
      head: headers,
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [6, 16, 32], textColor: [0, 200, 255] },
      styles: { fontSize: 10, cellPadding: 5 },
      alternateRowStyles: { fillColor: [245, 250, 255] }
    });

    doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="min-h-screen selection:bg-cyan/30 text-[#e8f4ff] relative overflow-x-hidden">
      <ParticleBackground />
      <CustomCursor />
      <div className="fixed inset-0 pointer-events-none z-10 scanline opacity-30" />
      
      {/* Status Bar */}
      <header className="fixed top-0 left-0 right-0 h-12 z-50 bg-[#020408]/80 backdrop-blur-xl border-b border-white/5 px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="font-disp text-xs tracking-[4px] flex items-center">
            <span className="text-white/40">[</span>
            <span className="text-white px-1">SCHEDULE<span className="text-cyan">R</span></span>
            <span className="text-white/40">]</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-white/40 tracking-widest">
            <div className="live-dot w-1.5 h-1.5" />
            <span>{status}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="font-mono text-[10px] border border-white/10 rounded-full px-3 py-0.5 text-white/40">
            {time}
          </div>
          <div className="font-mono text-[10px] border border-white/10 rounded-full px-3 py-0.5 text-white/40">
            V3.0.0
          </div>
        </div>
      </header>

      <main className="pt-12 min-h-screen flex items-center justify-center relative z-20">
        <AnimatePresence mode="wait">
          {screen === 'welcome' && (
            <WelcomeView 
              key="welcome" 
              stats={stats} 
              onEnter={() => { setScreen('role'); setStatus('ROLE_SELECT'); }} 
            />
          )}

          {screen === 'role' && (
            <RoleView 
              key="role" 
              savedSchedule={timetableData}
              onStudent={() => { setScreen('student'); setStatus('STUDENT_QUERY'); }}
              onTeacher={() => { 
                setScreen('teacher'); 
                setStatus('FACULTY_QUERY');
                fetchTeachers();
              }}
              onAdmin={() => { setScreen('admin_login'); setStatus('ADMIN_AUTH'); }}
              onViewSaved={() => { setScreen('result'); setStatus('SCHEDULE_READY'); }}
            />
          )}

          {screen === 'admin_login' && (
            <AdminLoginView 
              key="admin_login"
              onBack={() => { setScreen('role'); setStatus('ROLE_SELECT'); }}
              onSuccess={() => { setScreen('admin_dash'); setStatus('ADMIN_COMMAND'); }}
            />
          )}

          {screen === 'admin_dash' && (
            <AdminDashView 
              key="admin_dash"
              stats={stats}
              notifications={notifications}
              onRegenerate={regenerateSystem}
              onBack={() => { setScreen('role'); setStatus('ROLE_SELECT'); }}
            />
          )}

          {screen === 'student' && (
            <StudentFormView 
              key="student"
              onBack={() => { setScreen('role'); setStatus('ROLE_SELECT'); }}
              onSubmit={generateStudent}
            />
          )}

          {screen === 'teacher' && (
            <TeacherFormView 
              key="teacher"
              teachers={teachers}
              onBack={() => { setScreen('role'); setStatus('ROLE_SELECT'); }}
              onSubmit={generateTeacher}
            />
          )}

          {screen === 'result' && (
            <ResultView 
              key="result"
              loading={loading}
              data={timetableData}
              notifications={notifications}
              onExport={exportPDF}
              onClear={clearSchedule}
              onBack={() => {
                setScreen(timetableData?.type === 'student' ? 'student' : 'teacher');
                setStatus(timetableData?.type === 'student' ? 'STUDENT_QUERY' : 'FACULTY_QUERY');
              }}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function WelcomeView({ onEnter, stats }: { onEnter: () => void, stats: any, key?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center text-center max-w-4xl px-8"
    >
      <div className="flex items-center gap-4 mb-8 opacity-40">
        <div className="h-[1px] w-12 bg-cyan/50" />
        <span className="font-mono text-[10px] tracking-[4px]">CAMPUS INTELLIGENCE SYSTEM</span>
        <div className="h-[1px] w-12 bg-cyan/50" />
      </div>
      
      <h1 className="font-disp text-6xl md:text-8xl font-black mb-8 leading-none tracking-tight">
        <span className="bg-gradient-to-br from-white via-cyan to-purple bg-clip-text text-transparent">
          SCHEDULE OS
        </span>
      </h1>

      <p className="text-text-dim text-lg max-w-lg mb-12 leading-relaxed">
        Automated timetable generation for every student and faculty member. Built for the modern campus using master logic.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 mb-16">
        <button 
          onClick={onEnter}
          className="glow-btn px-12 py-4 bg-gradient-to-br from-cyan to-purple rounded-full text-black font-disp font-bold text-sm tracking-widest shadow-[0_0_50px_rgba(0,200,255,0.3)] hover:scale-105 active:scale-95 transition-transform"
        >
          <span className="flex items-center gap-2">
            <Zap size={18} fill="currentColor" />
            ENTER SYSTEM
          </span>
        </button>
      </div>

      <div className="flex items-center divide-x divide-white/10">
        <StatItem value="120" label="CLASSROOMS" />
        <StatItem value={stats?.totalTeachers || "48"} label="FACULTY" />
        <StatItem value={stats?.averageOccupancy || "...%"} label="OCCUPANCY" />
      </div>
    </motion.div>
  );
}

function StatItem({ value, label }: { value: string, label: string }) {
  return (
    <div className="px-8 text-center">
      <div className="font-disp text-2xl font-bold text-cyan mb-1">{value}</div>
      <div className="font-mono text-[9px] text-white/30 tracking-[2px]">{label}</div>
    </div>
  );
}

function RoleView({ onStudent, onTeacher, onViewSaved, onAdmin, savedSchedule }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-6xl w-full px-8"
    >
      <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <div className="inline-block px-3 py-1 bg-cyan/5 border border-cyan/20 rounded text-[9px] font-mono tracking-widest text-cyan/60 mb-6">ROLE_SELECT</div>
          <h2 className="font-disp text-4xl font-bold mb-4">Choose Your Role</h2>
          <p className="text-text-dim text-sm">Select your access level to proceed.</p>
        </div>

        <div className="flex gap-4">
          {savedSchedule && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={onViewSaved}
              className="flex items-center gap-4 bg-cyan/10 border border-cyan/30 rounded-2xl p-4 hover:bg-cyan/20 transition-all text-left group"
            >
              <div className="p-3 bg-cyan text-black rounded-xl shadow-[0_0_20px_rgba(0,200,255,0.4)] group-hover:scale-110 transition-transform">
                <Clock size={20} />
              </div>
              <div>
                <div className="text-[9px] font-mono text-cyan tracking-widest mb-1">ACTIVE SESSION</div>
                <div className="text-sm font-bold text-white">View Saved</div>
              </div>
            </motion.button>
          )}

          <button 
            onClick={onAdmin}
            className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all text-left"
          >
            <div className="p-3 bg-white/10 text-white/40 rounded-xl">
              <Zap size={20} />
            </div>
            <div>
              <div className="text-[9px] font-mono text-white/30 tracking-widest mb-1">COMMAND</div>
              <div className="text-sm font-bold text-white/60">Admin Login</div>
            </div>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <RoleCard 
          icon={<GraduationCap size={44} />}
          badge="ACCESS_LVL_1"
          title="Student"
          sub="TIMETABLE"
          desc="View schedule by floor & room. 7 periods with auto-assigned subjects."
          onClick={onStudent}
          color="cyan"
        />
        <RoleCard 
          icon={<Users size={44} />}
          badge="ACCESS_LVL_2"
          title="Faculty"
          sub="TIMETABLE"
          desc="View teaching schedule. Max 5 periods. Rest periods in staff room."
          onClick={onTeacher}
          color="purple"
        />
      </div>
    </motion.div>
  );
}

function RoleCard({ icon, badge, title, sub, desc, onClick, color }: any) {
  const borderColor = color === 'cyan' ? 'border-cyan/20 hover:border-cyan/50' : 'border-purple/20 hover:border-purple/50';
  const badgeColor = color === 'cyan' ? 'bg-cyan/10 text-cyan' : 'bg-purple/10 text-purple';
  const glowShadow = color === 'cyan' ? 'hover:shadow-[0_0_40px_rgba(0,200,255,0.1)]' : 'hover:shadow-[0_0_40px_rgba(176,96,255,0.1)]';

  return (
    <motion.div 
      whileHover={{ y: -8 }}
      onClick={onClick}
      className={`glass-panel p-8 cursor-pointer transition-all duration-300 ${borderColor} ${glowShadow} group relative overflow-hidden`}
    >
      <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-${color}/40 to-transparent group-hover:animate-[scan_1s_infinite] opacity-0 group-hover:opacity-100`} />
      <div className={`mb-6 inline-block px-3 py-1 rounded text-[8px] font-mono tracking-widest ${badgeColor}`}>{badge}</div>
      <div className="mb-6 opacity-80 group-hover:scale-110 transition-transform origin-left">{icon}</div>
      <h3 className="font-disp text-xl font-bold mb-1 tracking-wider">{title}</h3>
      <div className="text-[10px] font-mono tracking-[4px] text-white/30 mb-4">{sub}</div>
      <p className="text-text-dim text-sm leading-relaxed mb-8">{desc}</p>
      <div className="flex items-center justify-between border-t border-white/5 pt-4">
        <div className="flex gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${color === 'cyan' ? 'bg-cyan' : 'bg-purple'} opacity-40`} />
          <div className={`w-1.5 h-1.5 rounded-full ${color === 'cyan' ? 'bg-cyan' : 'bg-purple'} opacity-40`} />
          <div className={`w-1.5 h-1.5 rounded-full ${color === 'cyan' ? 'bg-cyan' : 'bg-purple'} opacity-40`} />
        </div>
        <span className={`text-[10px] font-mono tracking-[2px] ${color === 'cyan' ? 'text-cyan' : 'text-purple'} opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all`}>SELECT →</span>
      </div>
    </motion.div>
  );
}

function StudentFormView({ onBack, onSubmit }: { onBack: () => void, onSubmit: (floor: number, room: number) => void, key?: string }) {
  const [floor, setFloor] = useState("");
  const [room, setRoom] = useState("");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl w-full px-8">
      <div className="glass-panel overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-cyan/5">
          <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-mono text-white/40 hover:text-cyan transition-colors">
            <ChevronLeft size={14} /> BACK
          </button>
          <div className="text-[9px] font-mono tracking-widest text-cyan/60">STUDENT_QUERY</div>
        </div>
        <div className="p-10">
          <h2 className="font-disp text-3xl font-bold mb-2">Locate Your <span className="bg-gradient-to-r from-cyan to-purple bg-clip-text text-transparent italic">Classroom</span></h2>
          <p className="text-text-dim text-sm mb-10">Select your floor and room level to proceed.</p>
          
          <div className="grid sm:grid-cols-2 gap-8 mb-10">
            <div className="space-y-3">
              <label className="font-mono text-[10px] tracking-widest text-white/40 flex items-center gap-2">
                <span className="text-cyan">01</span> FLOOR LEVEL
              </label>
              <select 
                value={floor} 
                onChange={e => setFloor(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 font-mono text-sm focus:outline-none focus:border-cyan/40 transition-colors cursor-pointer"
              >
                <option value="" className="bg-[#0d1521]">Choose floor...</option>
                {[1,2,3,4,5,6].map(f => <option key={f} value={f} className="bg-[#0d1521]">Floor {f}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="font-mono text-[10px] tracking-widest text-white/40 flex items-center gap-2">
                <span className="text-cyan">02</span> ROOM NUMBER
              </label>
              <select 
                value={room} 
                onChange={e => setRoom(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 font-mono text-sm focus:outline-none focus:border-cyan/40 transition-colors cursor-pointer"
              >
                <option value="" className="bg-[#0d1521]">Choose room...</option>
                {Array.from({ length: 20 }, (_, i) => i + 1).map(r => (
                  <option key={r} value={r} className="bg-[#0d1521]">Room {r < 10 ? `0${r}` : r}</option>
                ))}
              </select>
            </div>
          </div>

          <button 
            disabled={!floor || !room}
            onClick={() => onSubmit(parseInt(floor), parseInt(room))}
            className="w-full glow-btn bg-gradient-to-r from-cyan to-purple py-4 rounded-lg text-black font-disp font-bold text-xs tracking-widest disabled:opacity-50 transition-all active:scale-[0.99]"
          >
            GENERATE TIMETABLE
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function TeacherFormView({ teachers, onBack, onSubmit }: { teachers: string[], onBack: () => void, onSubmit: (name: string) => void, key?: string }) {
  const [name, setName] = useState("");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl w-full px-8">
      <div className="glass-panel overflow-hidden border-purple/20">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-purple/5">
          <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-mono text-white/40 hover:text-purple transition-colors">
            <ChevronLeft size={14} /> BACK
          </button>
          <div className="text-[9px] font-mono tracking-widest text-purple/60">FACULTY_QUERY</div>
        </div>
        <div className="p-10">
          <h2 className="font-disp text-3xl font-bold mb-2">Faculty <span className="bg-gradient-to-r from-purple to-cyan bg-clip-text text-transparent italic">Lookup</span></h2>
          <p className="text-text-dim text-sm mb-10">Retrieve your teaching schedule for today.</p>
          
          <div className="space-y-3 mb-10">
            <label className="font-mono text-[10px] tracking-widest text-white/40 flex items-center gap-2">
              <span className="text-purple">01</span> FACULTY NAME
            </label>
            <select 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 font-mono text-sm focus:outline-none focus:border-purple/40 transition-colors cursor-pointer"
            >
              <option value="" className="bg-[#0d1521]">Select faculty member...</option>
              {teachers.map((t: string) => <option key={t} value={t} className="bg-[#0d1521]">{t}</option>)}
            </select>
          </div>

          <button 
            disabled={!name}
            onClick={() => onSubmit(name)}
            className="w-full glow-btn bg-gradient-to-r from-purple to-cyan py-4 rounded-lg text-black font-disp font-bold text-xs tracking-widest disabled:opacity-50 transition-all active:scale-[0.99]"
          >
            GENERATE TIMETABLE
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function AdminLoginView({ onBack, onSuccess }: any) {
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const login = async () => {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pass })
    });
    const data = await res.json();
    if (data.success) onSuccess();
    else setError(data.error);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md w-full px-8">
      <div className="glass-panel p-10 text-center">
        <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
          <Monitor className="text-red-500" />
        </div>
        <h2 className="font-disp text-2xl font-bold mb-2">Restricted Area</h2>
        <p className="text-white/40 text-xs mb-8 font-mono tracking-widest uppercase">Admin Authorization Required</p>
        
        <input 
          type="password"
          placeholder="Access Code"
          value={pass}
          onChange={e => setPass(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg p-3 font-mono text-sm mb-4 text-center focus:outline-none focus:border-red-500/40"
        />
        {error && <div className="text-red-500 text-[10px] font-mono mb-4">{error}</div>}
        
        <div className="flex gap-4">
          <button onClick={onBack} className="flex-1 py-3 border border-white/10 rounded-lg font-mono text-[10px] hover:bg-white/5">CANCEL</button>
          <button onClick={login} className="flex-1 py-3 bg-red-500 text-black font-disp font-bold text-[10px] rounded-lg">AUTHORIZE</button>
        </div>
      </div>
    </motion.div>
  );
}

function AdminDashView({ onRegenerate, onBack, stats, notifications }: any) {
  const [msg, setMsg] = useState("");

  const broadcast = async () => {
    if (!msg) return;
    await fetch('/api/admin/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    });
    setMsg("");
  };

  const clearAlerts = async () => {
    await fetch('/api/admin/clear-notifications', { method: 'POST' });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl w-full px-8">
      <div className="glass-panel overflow-hidden border-red-500/20">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-red-500/5">
          <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-mono text-white/40 hover:text-red-500">
            <ChevronLeft size={14} /> EXIT COMMAND
          </button>
          <div className="text-[9px] font-mono tracking-widest text-red-500/60">ADMIN_COMMAND_PROMPT</div>
        </div>
        
        <div className="p-10 grid md:grid-cols-2 gap-12">
          <div>
            <h3 className="font-disp text-xl font-bold mb-6 flex items-center gap-3">
              <span className="text-red-500 text-xs">◈</span> BROADCAST ALERT
            </h3>
            <textarea 
              value={msg}
              onChange={e => setMsg(e.target.value)}
              placeholder="Enter system announcement (e.g., Physics Lab shifted to Hall A)..."
              className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 font-mono text-sm mb-4 focus:outline-none focus:border-red-500/30 resize-none"
            />
            <button 
              onClick={broadcast}
              className="w-full bg-red-500 text-black font-disp font-bold py-3 rounded-lg text-xs tracking-widest hover:scale-[1.02] active:scale-95 transition-all"
            >
              SEND NOTIFICATION
            </button>
            <button 
              onClick={clearAlerts}
              className="w-full mt-2 text-white/30 font-mono text-[10px] tracking-widest hover:text-red-400 py-2"
            >
              CLEAR ACTIVE ALERTS
            </button>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="font-disp text-xs tracking-widest text-white/30 mb-4 uppercase">System Control</h3>
              <button 
                onClick={onRegenerate}
                className="w-full py-4 border border-white/10 rounded-xl text-white hover:bg-red-500/10 transition-all font-mono text-xs text-left px-6 flex items-center justify-between"
              >
                <span>RECALCULATE MASTER SCHEDULE</span>
                <Zap size={14} className="text-red-500" />
              </button>
            </div>

            <div>
              <h3 className="font-disp text-xs tracking-widest text-white/30 mb-4 uppercase">Live Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="text-[9px] font-mono text-white/40 mb-1">OCCUPANCY</div>
                  <div className="font-disp text-lg text-red-500">{stats?.averageOccupancy || "33%"}</div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="text-[9px] font-mono text-white/40 mb-1">ACTIVE CLASSES</div>
                  <div className="font-disp text-lg text-red-500">{stats?.activeClassesNow || "42"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ResultView({ loading, data, onBack, onExport, onClear, notifications }: { loading: boolean, data: any, onBack: () => void, onExport: () => void, onClear: () => void, notifications: any[], key?: string }) {
  if (loading || !data) {
    return (
      <div className="flex flex-col items-center gap-12 max-w-sm w-full">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan border-r-cyan animate-spin" />
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-purple border-l-purple animate-[spin_0.8s_linear_infinite_reverse]" />
          <div className="absolute inset-0 flex items-center justify-center font-mono text-[8px] text-white/40 tracking-[4px]">PROCESSING</div>
        </div>
        <div className="text-center space-y-4">
          <div className="font-mono text-cyan text-sm tracking-widest">CONNECTING TO DATACENTER</div>
          <div className="flex flex-col gap-2">
            {[1,2,3].map(i => (
              <div key={i} className={`h-1 mx-12 rounded-full bg-white/10 overflow-hidden`}>
                <div className={`h-full bg-cyan/50 animate-[loading_2s_ease-in-out_infinite]`} style={{ animationDelay: `${i * 0.2}s` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl w-full px-8 pb-20"
    >
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-xs font-mono text-white/40 hover:text-cyan transition-colors">
          <ChevronLeft size={18} /> BACK TO FORM
        </button>
        <div className="text-center">
          <h2 className="font-disp text-2xl font-bold">{data.title}</h2>
          <p className="text-[10px] font-mono text-white/30 tracking-[2px] mt-1 uppercase">Today · Campus Intelligence Alpha</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onClear}
            className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg text-[10px] font-mono text-white/40 hover:text-red-400 transition-all font-bold"
          >
            WIPE SESSION
          </button>
          <button 
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 border border-cyan/20 rounded-lg text-[10px] font-mono text-cyan hover:bg-cyan/10 transition-all font-bold"
          >
            <Download size={14} /> EXPORT PDF
          </button>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        {notifications.length > 0 && (
          <div className="bg-red-500/10 border-b border-red-500/20 p-4 flex items-center gap-4">
            <div className="animate-pulse bg-red-500 w-2 h-2 rounded-full" />
            <div className="flex-1">
              <span className="font-mono text-[9px] text-red-500 tracking-widest mr-4 uppercase">System Alert</span>
              <span className="text-xs font-bold text-red-100">{notifications[0].message}</span>
            </div>
          </div>
        )}
        <div className="p-4 border-b border-white/5 bg-cyan/5 flex justify-between items-center px-8">
          <div className="text-[9px] font-mono tracking-widest text-white/40">SCHEDULE_DATA_STREAM</div>
          <div className="flex items-center gap-2 text-[9px] font-mono text-green">
            <div className="live-dot w-1.5 h-1.5" /> LIVE
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-white/5 font-mono text-[10px] text-white/40 tracking-[3px] text-left">
                <th className="p-5 pl-8 uppercase">Period</th>
                <th className="p-5 uppercase">Time Slot</th>
                <th className="p-5 uppercase">Subject</th>
                <th className="p-5 pr-8 uppercase">{data.type === 'student' ? 'Assigned Faculty' : 'Location'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.timetable.map((row: any, i: number) => {
                const isBreak = row.type === 'break' || row.type === 'lunch';
                return (
                  <tr key={i} className={`group transition-colors ${isBreak ? 'bg-white/[0.02]' : 'hover:bg-cyan/[0.03]'}`}>
                    <td className={`p-5 pl-8 font-mono text-xs ${isBreak ? 'text-white/20' : 'text-cyan'}`}>{row.label}</td>
                    <td className="p-5 font-mono text-xs text-white/40">{row.time}</td>
                    <td className={`p-5 font-medium ${isBreak ? 'italic text-white/40' : 'text-white/90'}`}>{row.subject}</td>
                    <td className="p-5 pr-8 font-mono text-xs text-green/60">
                      {data.type === 'student' ? (row.teacher || 'TBA') : (row.location || 'Staff Room')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
