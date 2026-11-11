import { useEffect, useMemo, useState } from 'react';
import { api } from '@appdeploy/client';
import { ArrowDown, ArrowRight, ArrowUp, CalendarCheck, Clock3, LoaderCircle, Pause, Play, Plus, RotateCcw, Sparkles, Target, Trash2, TrendingUp, X, Check, WandSparkles } from 'lucide-react';
import './DailyPlan.css';

type Status = 'pending' | 'completed' | 'skipped';
type Cadence = 'daily' | 'weekly';
type Category = 'Technical practice' | 'Interview preparation' | 'Speaking' | 'Reading' | 'Writing' | 'Listening' | 'Job search' | 'Learning roadmap' | 'Weekly goal' | 'Custom';
type Task = { id: string; title: string; detail: string; category: Category; priority: 'High' | 'Medium' | 'Low'; minutes: number; reason: string; destination: string; status: Status; cadence: Cadence; day: string };
type Plan = { date: string; targetRole: string; summary: string; focus: string; totalMinutes: number; availableMinutes: number; tasks: Task[]; generatedAt: string };
type Props = { profile: any; roadmap: any; roadmapChecks: Record<string, boolean>; matchResult: any; applications: any[]; targetRole: string; signedIn: boolean; onNavigate: (page: string) => void };
type Draft = { title: string; detail: string; category: Category; priority: 'High' | 'Medium' | 'Low'; minutes: number; cadence: Cadence; day: string };

const categories: Category[] = ['Technical practice', 'Interview preparation', 'Speaking', 'Reading', 'Writing', 'Listening', 'Job search', 'Learning roadmap', 'Weekly goal', 'Custom'];
const destinations: Record<string, string> = { 'Technical practice': 'quiz', 'Interview preparation': 'interview', Speaking: 'speaking-lab', Reading: 'reading-lab', Writing: 'writing-lab', Listening: 'listening-lab', 'Job search': 'jobs', 'Learning roadmap': 'roadmap', 'Weekly goal': 'roadmap', Custom: 'overview' };
const days = ['Any day', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const readLocal = (key: string) => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } };
const formatClock = (n: number) => [Math.floor(n / 3600), Math.floor(n % 3600 / 60), n % 60].map(v => String(v).padStart(2, '0')).join(':');

export default function DailyPlan({ profile, roadmap, roadmapChecks, matchResult, applications, targetRole, signedIn, onNavigate }: Props) {
  const date = today();
  const profileContext = useMemo(() => ({
    headline: profile?.headline || '', skills: Array.isArray(profile?.skills) ? profile.skills.slice(0, 30) : [],
    projects: Array.isArray(profile?.projects) ? profile.projects.slice(0, 12) : [],
    education: Array.isArray(profile?.education) ? profile.education.slice(0, 8) : [],
    experience: Array.isArray(profile?.experience) ? profile.experience.slice(0, 8) : [],
    summary: profile?.summary || '', targetRole: roadmap?.role || targetRole || '',
    pendingRoadmapTasks: (roadmap?.weeks || []).flatMap((w: any) => w.tasks || []).filter((t: any) => !roadmapChecks?.[t.id]).slice(0, 8).map((t: any) => t.title),
    jobMatchGaps: (matchResult?.missingSkills || []).slice(0, 10),
    activeApplications: (applications || []).filter((a: any) => !['Rejected', 'Offer'].includes(a.status)).slice(0, 6).map((a: any) => ({ company: a.company, role: a.role, status: a.status })),
  }), [profile, roadmap, roadmapChecks, matchResult, applications, targetRole]);

  const [plan, setPlan] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [availableMinutes, setAvailableMinutes] = useState(840);
  const [timerSeconds, setTimerSeconds] = useState(840 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({ title: '', detail: '', category: 'Technical practice', priority: 'Medium', minutes: 30, cadence: 'daily', day: 'Any day' });
  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [suggestionError, setSuggestionError] = useState('');

  useEffect(() => {
    const saved = readLocal('careerpilot-daily-timer');
    if (saved?.date === date && Number.isFinite(saved.seconds)) setTimerSeconds(Math.max(0, saved.seconds));
  }, [date]);

  useEffect(() => {
    if (!timerRunning) return undefined;
    const interval = window.setInterval(() => setTimerSeconds(v => {
      if (v <= 1) { setTimerRunning(false); return 0; }
      return v - 1;
    }), 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);

  useEffect(() => {
    localStorage.setItem('careerpilot-daily-timer', JSON.stringify({ date, seconds: timerSeconds }));
  }, [date, timerSeconds]);

  async function loadPlan() {
    setBusy(true);
    setErrorText('');
    try {
      let saved: any = null;
      if (signedIn) {
        const response = await api.post('/api/daily-plan', { action: 'get', date });
        saved = response.data?.plan;
      }
      if (!saved) {
        const local = readLocal('careerpilot-daily-plan');
        saved = local?.date === date ? local : null;
      }
      const retainedTasks = (saved?.tasks || []).filter((task: Task) => task.id.startsWith('custom-'));
      const next: Plan = {
        date,
        targetRole: saved?.targetRole || roadmap?.role || targetRole || 'Software Engineer',
        summary: '',
        focus: '',
        totalMinutes: 0,
        availableMinutes: Math.min(840, Math.max(30, saved?.availableMinutes || 840)),
        tasks: retainedTasks,
        generatedAt: new Date().toISOString(),
      };
      setPlan(next);
      setAvailableMinutes(next.availableMinutes);
      localStorage.setItem('careerpilot-daily-plan', JSON.stringify(next));
      if (signedIn && saved && retainedTasks.length !== (saved.tasks || []).length) {
        await api.post('/api/daily-plan', { action: 'update', date, targetRole: next.targetRole, availableMinutes: next.availableMinutes, tasks: retainedTasks });
      }
    } catch {
      const local = readLocal('careerpilot-daily-plan');
      const tasks = local?.date === date ? (local.tasks || []).filter((task: Task) => task.id.startsWith('custom-')) : [];
      const next = { date, targetRole: roadmap?.role || targetRole || 'Software Engineer', summary: '', focus: '', totalMinutes: 0, availableMinutes: local?.availableMinutes || 840, tasks, generatedAt: new Date().toISOString() };
      setPlan(next);
      setAvailableMinutes(next.availableMinutes);
      setErrorText('Cloud plan could not be loaded. Your locally saved tasks are shown where available.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { void loadPlan(); }, [signedIn, date]);

  async function savePlan(next: Plan) {
    setPlan(next);
    setAvailableMinutes(next.availableMinutes);
    localStorage.setItem('careerpilot-daily-plan', JSON.stringify(next));
    if (!signedIn) return;
    setSaving(true);
    try {
      await api.post('/api/daily-plan', { action: 'update', date, targetRole: next.targetRole, availableMinutes: next.availableMinutes, tasks: next.tasks });
      setErrorText('');
    } catch {
      setErrorText('Cloud save could not be confirmed. Your edits remain on this device. Retry cloud save when connected.');
    } finally {
      setSaving(false);
    }
  }

  function openAddTask() {
    setEditingId(null);
    setDraft({ title: '', detail: '', category: 'Technical practice', priority: 'Medium', minutes: 30, cadence: 'daily', day: 'Any day' });
    setSuggestion('');
    setSuggestionError('');
    setModalOpen(true);
  }

  function openEditTask(task: Task) {
    setEditingId(task.id);
    setDraft({ title: task.title, detail: task.detail || '', category: task.category, priority: task.priority, minutes: task.minutes, cadence: task.cadence || 'daily', day: task.day || 'Any day' });
    setSuggestion('');
    setSuggestionError('');
    setModalOpen(true);
  }

  async function askForInstructions() {
    if (!draft.title.trim()) { setSuggestionError('Enter a task title first so AI can tailor the instructions.'); return; }
    setSuggesting(true);
    setSuggestion('');
    setSuggestionError('');
    try {
      const response = await api.post('/api/daily-task-instructions', {
        title: draft.title.trim(), category: draft.category, priority: draft.priority,
        minutes: draft.minutes, cadence: draft.cadence, day: draft.day,
        targetRole: profileContext.targetRole, profile: profileContext,
      });
      setSuggestion(response.data?.instructions || '');
      if (!response.data?.instructions) setSuggestionError('AI did not return usable instructions. You can write them manually.');
    } catch {
      setSuggestionError('AI instructions are unavailable right now. You can write your own instructions.');
    } finally {
      setSuggesting(false);
    }
  }

  function applySuggestion() {
    if (!suggestion) return;
    setDraft(current => ({ ...current, detail: suggestion }));
    setSuggestion('');
    setSuggestionError('');
  }

  function updateTask(id: string, changes: Partial<Task>) {
    if (!plan) return;
    const tasks = plan.tasks.map(task => task.id === id ? { ...task, ...changes } : task);
    void savePlan({ ...plan, tasks });
  }

  function moveTask(id: string, direction: -1 | 1) {
    if (!plan) return;
    const index = plan.tasks.findIndex(task => task.id === id);
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= plan.tasks.length) return;
    const tasks = [...plan.tasks];
    [tasks[index], tasks[nextIndex]] = [tasks[nextIndex], tasks[index]];
    void savePlan({ ...plan, tasks });
  }

  function saveTask() {
    if (!plan || !draft.title.trim()) return;
    const task: Task = {
      id: editingId || ('custom-' + date + '-' + Math.random().toString(36).slice(2, 9)),
      title: draft.title.trim(), detail: draft.detail.trim(), category: draft.category,
      priority: draft.priority, minutes: Math.max(5, Math.min(840, Number(draft.minutes) || 5)),
      reason: 'Added by you.', destination: destinations[draft.category] || 'overview',
      status: 'pending', cadence: draft.cadence, day: draft.day,
    };
    const tasks = editingId ? plan.tasks.map(existing => existing.id === editingId ? task : existing) : [...plan.tasks, task];
    void savePlan({ ...plan, tasks });
    setModalOpen(false);
    setEditingId(null);
  }

  function deleteTask(id: string) {
    if (!plan) return;
    void savePlan({ ...plan, tasks: plan.tasks.filter(task => task.id !== id) });
  }

  function changeAllowance(value: number) {
    if (!plan) return;
    setTimerRunning(false);
    setTimerSeconds(value * 60);
    void savePlan({ ...plan, availableMinutes: value });
  }

  const completed = plan?.tasks.filter(task => task.status === 'completed').length || 0;
  const skipped = plan?.tasks.filter(task => task.status === 'skipped').length || 0;
  const notAttempted = plan?.tasks.filter(task => task.status === 'pending').length || 0;
  const invested = plan?.tasks.filter(task => task.status === 'completed').reduce((total, task) => total + task.minutes, 0) || 0;
  const weekday = new Intl.DateTimeFormat('en-IN', { weekday: 'long', timeZone: 'Asia/Kolkata' }).format(new Date());
  const todayTasks = plan?.tasks.filter(task => task.cadence !== 'weekly' || task.day === 'Any day' || task.day === weekday) || [];
  const weeklyTasks = plan?.tasks.filter(task => task.cadence === 'weekly') || [];

  if (busy) return <section className="content daily-plan-page">Loading your daily plan…</section>;

  return (
    <section className="content daily-plan-page">
      <div className="page-header">
        <div>
          <div className="section-eyebrow">PERSONAL PREPARATION TRACKER</div>
          <h1>My Daily Plan</h1>
          <p>Add your own tasks, set the time and priority, and track your progress.</p>
        </div>
      </div>

      <div className="daily-plan-intro panel">
        <div className="daily-plan-intro-icon"><CalendarCheck size={20} /></div>
        <div className="daily-plan-intro-copy">
          <span>YOUR CAREER ROLE</span>
          <h2>{plan?.targetRole || roadmap?.role || targetRole || 'Software Engineer'}</h2>
        </div>
        <span className="daily-plan-date">{date}</span>
      </div>

      <div className="daily-time-panel panel">
        <div className="daily-timer-heading">
          <div>
            <span>TIME LEFT IN YOUR DAILY BUDGET</span>
            <strong>{formatClock(timerSeconds)}</strong>
            <small>{timerRunning ? 'Timer running' : 'Timer paused'}</small>
          </div>
          <div className="daily-timer-controls">
            <button className="btn-primary" disabled={timerSeconds === 0} onClick={() => setTimerRunning(running => !running)}>
              {timerRunning ? <Pause size={15} /> : <Play size={15} />}
              {timerRunning ? 'Pause timer' : 'Start timer'}
            </button>
            <button className="btn-outline" onClick={() => { setTimerRunning(false); setTimerSeconds((plan?.availableMinutes || availableMinutes) * 60); }}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </div>
        <label className="daily-field daily-allowance-field">
          Daily time allowance
          <select value={plan?.availableMinutes || availableMinutes} onChange={event => changeAllowance(Number(event.target.value))}>
            {Array.from({ length: 28 }, (_, index) => (index + 1) * 30).map(value => (
              <option key={value} value={value}>{value % 60 === 0 ? value / 60 + ' hours' : Math.floor(value / 60) + 'h ' + value % 60 + 'm'}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="daily-progress-grid">
        <div className="daily-progress-card panel"><span>COMPLETED</span><strong>{completed}<small> / {plan?.tasks.length || 0}</small></strong></div>
        <div className="daily-progress-card panel"><span>TIME INVESTED</span><strong>{invested}<small> min</small></strong></div>
        <div className="daily-progress-card panel"><span>ACTIVITY</span><strong>{skipped} skipped</strong><small>{notAttempted} not attempted</small></div>
      </div>

      <div className="daily-task-heading">
        <div>
          <div className="section-eyebrow">YOUR ACTIONS</div>
          <h2>Tasks you choose</h2>
          <p>Add tasks and arrange them in your preferred priority order.</p>
        </div>
        <button className="btn-primary" onClick={openAddTask}><Plus size={15} /> Add task</button>
      </div>

      <div className="daily-task-list">
        {todayTasks.map(task => (
          <article className={'daily-task panel ' + (task.status === 'completed' ? 'is-complete' : task.status === 'skipped' ? 'is-skipped' : '')} key={task.id}>
            <div className="daily-task-check">
              <input type="checkbox" aria-label={'Mark ' + task.title + ' complete'} checked={task.status === 'completed'} onChange={event => updateTask(task.id, { status: event.target.checked ? 'completed' : 'pending' })} />
            </div>
            <div className="daily-task-body">
              <div className="daily-task-meta">
                <span>{task.category}{task.cadence === 'weekly' ? ' · Weekly' : ''}</span>
                <span className={'daily-priority priority-' + task.priority.toLowerCase()}>{task.priority} priority</span>
                <span><Clock3 size={12} /> {task.minutes} min</span>
              </div>
              <h3>{task.title}</h3>
              {task.detail && <p>{task.detail}</p>}
              <div className="daily-task-actions">
                <button className="btn-outline" onClick={() => onNavigate(task.destination || destinations[task.category] || 'overview')}>Open in CareerPilot <ArrowRight size={13} /></button>
                <button className="daily-task-skip" onClick={() => updateTask(task.id, { status: task.status === 'skipped' ? 'pending' : 'skipped' })}>{task.status === 'skipped' ? 'Unskip' : 'Skip'}</button>
                <button className="btn-outline" onClick={() => openEditTask(task)}>Edit</button>
                <button className="daily-task-icon" aria-label="Move task up" onClick={() => moveTask(task.id, -1)}><ArrowUp size={14} /></button>
                <button className="daily-task-icon" aria-label="Move task down" onClick={() => moveTask(task.id, 1)}><ArrowDown size={14} /></button>
                <button className="daily-task-icon danger" aria-label="Delete task" onClick={() => deleteTask(task.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          </article>
        ))}
        {todayTasks.length === 0 && (
          <div className="daily-empty-state panel">
            <CalendarCheck size={24} />
            <h3>Your plan is ready for your tasks</h3>
            <p>Add the first task. You control its title, instructions, task type, time, priority and schedule.</p>
            <button className="btn-primary" onClick={openAddTask}><Plus size={15} /> Add your first task</button>
          </div>
        )}
      </div>

      {weeklyTasks.length > 0 && (
        <div className="daily-weekly-panel panel">
          <div className="section-eyebrow">WEEKLY TASKS</div>
          {weeklyTasks.map(task => (
            <div className="daily-weekly-row" key={task.id}>
              <b>{task.day || 'Any day'}</b><span>{task.title}</span>
              <small>{task.status === 'pending' ? 'Not attempted' : task.status}</small>
              <button onClick={() => openEditTask(task)}>Edit</button>
            </div>
          ))}
        </div>
      )}

      <div className="daily-plan-footer panel">
        <div><TrendingUp size={17} /><div><b>Your plan, your pace</b><p>Mark tasks completed or skipped to keep an accurate record of your preparation.</p></div></div>
        <span className="daily-sync-state">{saving ? 'Saving…' : signedIn ? 'Cloud sync enabled' : 'Saved on this device'}</span>
      </div>

      {errorText && <div className="daily-plan-message"><span>{errorText}</span><button onClick={() => plan && void savePlan(plan)}>Retry cloud save</button></div>}

      {modalOpen && (
        <div className="daily-modal-backdrop" role="presentation">
          <div className="daily-task-modal panel" role="dialog" aria-modal="true" aria-label={editingId ? 'Edit task' : 'Add task'}>
            <div className="daily-modal-head"><h3>{editingId ? 'Edit task' : 'Add a task'}</h3><button onClick={() => setModalOpen(false)} aria-label="Close task form"><X size={17} /></button></div>
            <label className="daily-field">Task title<input value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} placeholder="e.g. Practise Java arrays" /></label>
            <div className="daily-instruction-heading">
              <label className="daily-field">Instructions<textarea rows={4} value={draft.detail} onChange={event => setDraft({ ...draft, detail: event.target.value })} placeholder="Write exactly what you want to do and what you want to finish." /></label>
              <button className="btn-outline daily-ai-instructions-button" onClick={() => void askForInstructions()} disabled={suggesting || !draft.title.trim()}>
                {suggesting ? <LoaderCircle className="daily-spin" size={14} /> : <WandSparkles size={14} />}
                {suggesting ? 'Preparing suggestion…' : 'Ask AI for better instructions'}
              </button>
            </div>
            {suggestionError && <p className="daily-suggestion-error">{suggestionError}</p>}
            {suggestion && (
              <div className="daily-ai-suggestion">
                <div className="daily-ai-suggestion-title"><Sparkles size={14} /> AI suggestion — review before using</div>
                <p>{suggestion}</p>
                <div className="daily-suggestion-actions">
                  <button className="btn-primary" onClick={applySuggestion}><Check size={14} /> Use these instructions</button>
                  <button className="btn-outline" onClick={() => setSuggestion('')}>Dismiss suggestion</button>
                </div>
              </div>
            )}
            <div className="daily-form-grid">
              <label className="daily-field">Task type<select value={draft.category} onChange={event => setDraft({ ...draft, category: event.target.value as Category })}>{categories.map(category => <option key={category}>{category}</option>)}</select></label>
              <label className="daily-field">Priority<select value={draft.priority} onChange={event => setDraft({ ...draft, priority: event.target.value as Draft['priority'] })}><option>High</option><option>Medium</option><option>Low</option></select></label>
              <label className="daily-field">Allotted time (minutes)<input type="number" min="5" max="840" value={draft.minutes} onChange={event => setDraft({ ...draft, minutes: Number(event.target.value) })} /></label>
              <label className="daily-field">Schedule<select value={draft.cadence} onChange={event => setDraft({ ...draft, cadence: event.target.value as Cadence })}><option value="daily">Daily</option><option value="weekly">Weekly</option></select></label>
              {draft.cadence === 'weekly' && <label className="daily-field">Day<select value={draft.day} onChange={event => setDraft({ ...draft, day: event.target.value })}>{days.map(day => <option key={day}>{day}</option>)}</select></label>}
            </div>
            <div className="daily-modal-actions"><button className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary" onClick={saveTask} disabled={!draft.title.trim()}>{editingId ? 'Save changes' : 'Save task'}</button></div>
          </div>
        </div>
      )}
    </section>
  );
}
