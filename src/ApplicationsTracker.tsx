import { useMemo, useState } from 'react';
import { ArrowRight, Bell, CalendarDays, Check, Clock3, Filter, History, Plus, Search, Trash2, X } from 'lucide-react';
import './ApplicationsTracker.css';

type Stage = 'Saved' | 'Applied' | 'Assessment' | 'Interview' | 'Offer' | 'Rejected';
type TimelineItem = { id: string; type: string; title: string; detail: string; date: string; createdAt: string };
type NextAction = { title: string; dueDate: string; status: 'Pending' | 'Completed' };
type Application = {
  id: string; company: string; role: string; status: string; date: string; match: number; note: string;
  location?: string; jobType?: string; jobUrl?: string; salary?: string; source?: string; priority?: string;
  nextAction?: NextAction | null; stageHistory?: { stage: string; date: string }[];
  interviewDate?: string; interviewType?: string; interviewLink?: string; assessmentDate?: string;
  followUps?: { id: string; date: string; status: string; person: string; method: string; note: string }[];
  timeline?: TimelineItem[];
};
const stages: Stage[] = ['Saved', 'Applied', 'Assessment', 'Interview', 'Offer', 'Rejected'];
const today = () => new Date().toISOString().slice(0, 10);
const makeId = () => Math.random().toString(36).slice(2, 10);
const dateLabel = (date?: string) => date ? new Date(date + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not scheduled';
const normalize = (a: Application): Application => ({
  ...a,
  priority: a.priority || 'Medium',
  nextAction: a.nextAction || (a.note ? { title: a.note, dueDate: '', status: 'Pending' } : null),
  stageHistory: a.stageHistory || [{ stage: a.status, date: a.date || today() }],
  followUps: a.followUps || [],
  timeline: a.timeline || [],
});
export default function ApplicationsTracker({ applications, onChange, matchScore }: {
  applications: Application[]; onChange: (apps: Application[]) => void; matchScore: number;
}) {
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('All stages');
  const [priorityFilter, setPriorityFilter] = useState('All priorities');
  const [sort, setSort] = useState('updated');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [form, setForm] = useState({ company: '', role: '', status: 'Applied' as Stage, location: '', jobType: 'Full-time', jobUrl: '', salary: '', source: '', priority: 'Medium', nextTitle: '', nextDate: '', note: '' });
  const [actionForm, setActionForm] = useState({ title: '', dueDate: '' });
  const [noteForm, setNoteForm] = useState('');
  const [followForm, setFollowForm] = useState({ date: '', person: '', method: 'Email', note: '' });
  const [eventForm, setEventForm] = useState({ interviewDate: '', interviewType: 'Technical', interviewLink: '', assessmentDate: '' });

  const apps = useMemo(() => applications.map(normalize), [applications]);
  const active = apps.filter(a => !['Offer', 'Rejected'].includes(a.status));
  const upcoming = apps.flatMap(a => [
    ...(a.interviewDate && a.interviewDate >= today() ? [{ id: a.id + '-i', company: a.company, label: 'Interview', date: a.interviewDate }] : []),
    ...(a.assessmentDate && a.assessmentDate >= today() ? [{ id: a.id + '-a', company: a.company, label: 'Assessment deadline', date: a.assessmentDate }] : []),
    ...(a.nextAction?.dueDate && a.nextAction.status === 'Pending' && a.nextAction.dueDate >= today() ? [{ id: a.id + '-n', company: a.company, label: a.nextAction.title, date: a.nextAction.dueDate }] : [])
  ]).sort((a,b) => a.date.localeCompare(b.date)).slice(0, 5);
  const overdue = apps.filter(a => (a.nextAction?.status === 'Pending' && a.nextAction.dueDate && a.nextAction.dueDate < today()) || (a.followUps || []).some(f => f.status === 'Pending' && f.date < today())).length;
  const filtered = apps.filter(a => (a.company + ' ' + a.role + ' ' + (a.location || '')).toLowerCase().includes(query.toLowerCase())
    && (stageFilter === 'All stages' || a.status === stageFilter)
    && (priorityFilter === 'All priorities' || a.priority === priorityFilter))
    .sort((a,b) => sort === 'company' ? a.company.localeCompare(b.company) : sort === 'next' ? (a.nextAction?.dueDate || '9999').localeCompare(b.nextAction?.dueDate || '9999') : (b.date || '').localeCompare(a.date || ''));

  const commit = (updated: Application[]) => onChange(updated);
  const update = (id: string, patch: Partial<Application>) => commit(apps.map(a => a.id === id ? { ...a, ...patch } : a));
  const addTimeline = (a: Application, type: string, title: string, detail = ''): TimelineItem[] => [
    ...(a.timeline || []), { id: makeId(), type, title, detail, date: today(), createdAt: new Date().toISOString() }
  ];
  const openNew = () => {
    setEditing(null);
    setForm({ company: '', role: '', status: 'Applied', location: '', jobType: 'Full-time', jobUrl: '', salary: '', source: '', priority: 'Medium', nextTitle: '', nextDate: '', note: '' });
    setShowForm(true);
  };
  const openEdit = (a: Application) => {
    setEditing(a);
    setForm({ company: a.company, role: a.role, status: a.status as Stage, location: a.location || '', jobType: a.jobType || 'Full-time', jobUrl: a.jobUrl || '', salary: a.salary || '', source: a.source || '', priority: a.priority || 'Medium', nextTitle: a.nextAction?.title || '', nextDate: a.nextAction?.dueDate || '', note: a.note || '' });
    setShowForm(true);
  };
  const saveForm = () => {
    if (!form.company.trim() || !form.role.trim()) return;
    if (editing) {
      const old = normalize(editing);
      const changedStage = old.status !== form.status;
      const history = changedStage ? [...(old.stageHistory || []), { stage: form.status, date: today() }] : old.stageHistory;
      update(old.id, { company: form.company.trim(), role: form.role.trim(), status: form.status, location: form.location, jobType: form.jobType, jobUrl: form.jobUrl, salary: form.salary, source: form.source, priority: form.priority,
        nextAction: form.nextTitle.trim() ? { title: form.nextTitle.trim(), dueDate: form.nextDate, status: old.nextAction?.title === form.nextTitle.trim() && old.nextAction?.dueDate === form.nextDate ? old.nextAction.status : 'Pending' } : null,
        note: form.note, stageHistory: history, timeline: changedStage ? addTimeline(old, 'Stage', 'Stage changed to ' + form.status) : old.timeline });
    } else {
      const created: Application = { id: makeId(), company: form.company.trim(), role: form.role.trim(), status: form.status, date: today(), match: matchScore,
        location: form.location, jobType: form.jobType, jobUrl: form.jobUrl, salary: form.salary, source: form.source, priority: form.priority,
        nextAction: form.nextTitle.trim() ? { title: form.nextTitle.trim(), dueDate: form.nextDate, status: 'Pending' } : null,
        note: form.note, stageHistory: [{ stage: form.status, date: today() }],
        timeline: [{ id: makeId(), type: 'Created', title: 'Application added', detail: '', date: today(), createdAt: new Date().toISOString() }] };
      commit([created, ...apps]);
    }
    setShowForm(false);
  };
  const selectedApp = apps.find(a => a.id === selected) || null;
  const updateStage = (a: Application, status: Stage) => {
    if (a.status === status) return;
    update(a.id, { status, stageHistory: [...(a.stageHistory || []), { stage: status, date: today() }], timeline: addTimeline(a, 'Stage', 'Stage changed to ' + status) });
  };
  const addNote = (a: Application) => {
    if (!noteForm.trim()) return;
    update(a.id, { timeline: addTimeline(a, 'Note', 'Note added', noteForm.trim()) });
    setNoteForm('');
  };
  const addFollowUp = (a: Application) => {
    if (!followForm.date) return;
    const item = { id: makeId(), date: followForm.date, status: 'Pending', person: followForm.person, method: followForm.method, note: followForm.note };
    update(a.id, { followUps: [...(a.followUps || []), item], timeline: addTimeline(a, 'Follow-up', 'Follow-up scheduled', followForm.date + ' · ' + followForm.method) });
    setFollowForm({ date: '', person: '', method: 'Email', note: '' });
  };
  const completeFollowUp = (a: Application, id: string) => update(a.id, { followUps: (a.followUps || []).map(f => f.id === id ? { ...f, status: 'Completed' } : f) });
  const saveEvents = (a: Application) => {
    update(a.id, { ...eventForm, timeline: addTimeline(a, 'Schedule', 'Interview / assessment details updated') });
  };

  return <section className="content app-tracker">
    <header className="app-tracker-head">
      <div><div className="section-eyebrow">APPLICATION PIPELINE</div><h1>Application tracker</h1><p>Track every opportunity, keep the next action current, and never lose a follow-up.</p></div>
      <button className="btn-primary" onClick={openNew}><Plus size={16}/> Add application</button>
    </header>
    <div className="tracker-metrics">
      <div className="tracker-stat"><span>Total applications</span><b>{apps.length}</b><small>All saved opportunities</small></div>
      <div className="tracker-stat"><span>Active applications</span><b>{active.length}</b><small>Not yet closed</small></div>
      <div className="tracker-stat"><span>Interviews</span><b>{apps.filter(a => a.status === 'Interview').length}</b><small>At interview stage</small></div>
      <div className="tracker-stat"><span>Offers</span><b>{apps.filter(a => a.status === 'Offer').length}</b><small>Positive outcomes</small></div>
    </div>
    <div className="app-tracker-alerts">
      <div><Bell size={16}/><span><b>{overdue}</b> overdue item{overdue === 1 ? '' : 's'} need attention</span></div>
      <div><CalendarDays size={16}/><span><b>{upcoming.length}</b> upcoming event{upcoming.length === 1 ? '' : 's'}</span></div>
    </div>
    <div className="app-tracker-upcoming panel"><div className="app-section-title"><h3>Upcoming schedule</h3><span>Next 5 dates</span></div>
      {upcoming.length ? upcoming.map(item => <div className="app-upcoming-row" key={item.id}><span><b>{item.label}</b><small>{item.company}</small></span><time>{dateLabel(item.date)}</time></div>) : <p className="app-muted">No upcoming dates. Add interview, assessment or next-action dates to see them here.</p>}
    </div>
    <div className="panel app-tracker-list">
      <div className="app-tracker-toolbar">
        <label className="app-search"><Search size={15}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search company, role or location"/></label>
        <label><Filter size={14}/><select value={stageFilter} onChange={e => setStageFilter(e.target.value)}><option>All stages</option>{stages.map(s => <option key={s}>{s}</option>)}</select></label>
        <label><select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}><option>All priorities</option><option>High</option><option>Medium</option><option>Low</option></select></label>
        <label><select value={sort} onChange={e => setSort(e.target.value)}><option value="updated">Newest first</option><option value="next">Next action date</option><option value="company">Company A–Z</option></select></label>
      </div>
      <div className="app-card-list">{filtered.map(raw => {
        const a = normalize(raw);
        const isOverdue = !!a.nextAction?.dueDate && a.nextAction.status === 'Pending' && a.nextAction.dueDate < today();
        return <article className="app-company-card" key={a.id}>
          <div className="app-company-top"><div className="app-company-identity"><div className="company-monogram">{a.company.slice(0,1).toUpperCase()}</div><div><b>{a.company}</b><small>{a.role}{a.location ? ' · ' + a.location : ''}</small></div></div>
            <span className={'app-priority priority-' + (a.priority || 'Medium').toLowerCase()}>{a.priority || 'Medium'} priority</span></div>
          <div className="app-company-meta"><span className={'app-stage stage-' + a.status.toLowerCase()}>{a.status}</span><span>{a.jobType || 'Role type not set'}</span><span>Added {dateLabel(a.date)}</span>{a.salary && <span>{a.salary}</span>}</div>
          <div className="app-next-action"><div><small>NEXT ACTION</small><b>{a.nextAction?.title || 'No next action set'}</b><span>{a.nextAction?.dueDate ? 'Due ' + dateLabel(a.nextAction.dueDate) : 'Set a due date to stay on track'}</span></div>
            {isOverdue && <span className="app-overdue">Overdue</span>}
            <button className="btn-outline app-small-btn" onClick={() => { setActionForm({ title: a.nextAction?.title || '', dueDate: a.nextAction?.dueDate || '' }); setSelected(a.id); }}>Edit action</button>
            {a.nextAction?.status === 'Pending' && a.nextAction.title && <button className="app-icon-btn" title="Mark action completed" onClick={() => update(a.id, { nextAction: { ...a.nextAction!, status: 'Completed' }, timeline: addTimeline(a, 'Action', 'Next action completed', a.nextAction!.title) })}><Check size={15}/></button>}
          </div>
          <div className="app-card-bottom"><label>Stage<select value={a.status} onChange={e => updateStage(a, e.target.value as Stage)}>{stages.filter(s => s !== 'Saved').map(s => <option key={s}>{s}</option>)}</select></label>
            <button className="app-text-btn" onClick={() => setSelected(selected === a.id ? null : a.id)}>{selected === a.id ? 'Hide details' : 'View details'} <ArrowRight size={13}/></button>
            <button className="app-text-btn" onClick={() => openEdit(a)}>Edit application</button>
            <button className="app-icon-btn danger" title="Delete application" onClick={() => { if (window.confirm('Delete this application and its history?')) { commit(apps.filter(x => x.id !== a.id)); if (selected === a.id) setSelected(null); } }}><Trash2 size={14}/></button>
          </div>
          {selected === a.id && <div className="app-detail-panel">
            <div className="app-detail-grid">
              <section><div className="app-section-title"><h4>Stage history</h4><History size={15}/></div>{(a.stageHistory || []).map((h,i) => <div className="app-history-row" key={i}><b>{h.stage}</b><time>{dateLabel(h.date)}</time></div>)}</section>
              <section><div className="app-section-title"><h4>Interview & assessment</h4><CalendarDays size={15}/></div>
                <label>Interview date<input type="date" value={eventForm.interviewDate || a.interviewDate || ''} onChange={e => setEventForm(v => ({...v, interviewDate:e.target.value}))}/></label>
                <label>Interview type<select value={eventForm.interviewType || a.interviewType || 'Technical'} onChange={e => setEventForm(v => ({...v, interviewType:e.target.value}))}><option>Technical</option><option>HR</option><option>Managerial</option><option>Online</option><option>Offline</option></select></label>
                <label>Meeting link / location<input value={eventForm.interviewLink || a.interviewLink || ''} onChange={e => setEventForm(v => ({...v, interviewLink:e.target.value}))} placeholder="Meeting URL or venue"/></label>
                <label>Assessment deadline<input type="date" value={eventForm.assessmentDate || a.assessmentDate || ''} onChange={e => setEventForm(v => ({...v, assessmentDate:e.target.value}))}/></label>
                <button className="btn-outline app-small-btn" onClick={() => saveEvents(a)}>Save schedule</button>
              </section>
              <section><div className="app-section-title"><h4>Follow-ups</h4><Clock3 size={15}/></div>
                {(a.followUps || []).map(f => <div className="app-follow-row" key={f.id}><span><b>{dateLabel(f.date)}</b><small>{f.person || 'Contact not specified'} · {f.method} · {f.note}</small></span><button className="app-icon-btn" onClick={() => completeFollowUp(a,f.id)} disabled={f.status === 'Completed'}>{f.status === 'Completed' ? <Check size={14}/> : 'Done'}</button></div>)}
                <label>Follow-up date<input type="date" value={followForm.date} onChange={e => setFollowForm(v => ({...v,date:e.target.value}))}/></label>
                <label>Contact person<input value={followForm.person} onChange={e => setFollowForm(v => ({...v,person:e.target.value}))} placeholder="Recruiter / HR name"/></label>
                <label>Method<select value={followForm.method} onChange={e => setFollowForm(v => ({...v,method:e.target.value}))}><option>Email</option><option>Phone</option><option>LinkedIn</option><option>Company portal</option></select></label>
                <label>Notes<input value={followForm.note} onChange={e => setFollowForm(v => ({...v,note:e.target.value}))} placeholder="What will you ask?"/></label>
                <button className="btn-outline app-small-btn" onClick={() => addFollowUp(a)}>Schedule follow-up</button>
              </section>
              <section><div className="app-section-title"><h4>Notes & activity</h4><History size={15}/></div>
                <div className="app-note-entry"><textarea value={noteForm} onChange={e => setNoteForm(e.target.value)} placeholder="Add a call summary, recruiter update or important detail…"/><button className="btn-outline app-small-btn" onClick={() => addNote(a)}>Add note</button></div>
                {[...(a.timeline || [])].slice().reverse().map(item => <div className="app-timeline-row" key={item.id}><b>{item.title}</b><small>{item.type} · {dateLabel(item.date)}</small>{item.detail && <p>{item.detail}</p>}</div>)}
              </section>
            </div>
          </div>}
        </article>;
      })}{filtered.length === 0 && <div className="empty-table">No applications match those filters.</div>}</div>
    </div>
    {showForm && <div className="modal-overlay" onClick={() => setShowForm(false)}><div className="modal-card app-modal" onClick={e => e.stopPropagation()}>
      <div className="modal-header"><div><span className="section-eyebrow">APPLICATION DETAILS</span><h2>{editing ? 'Edit application' : 'Add an application'}</h2><p>Keep company details and next actions independently editable.</p></div><button className="top-icon" onClick={() => setShowForm(false)}><X size={17}/></button></div>
      <div className="app-form-grid">
        <label>Company *<input value={form.company} onChange={e => setForm(v => ({...v,company:e.target.value}))} placeholder="Company name"/></label>
        <label>Role title *<input value={form.role} onChange={e => setForm(v => ({...v,role:e.target.value}))} placeholder="Job title"/></label>
        <label>Stage<select value={form.status} onChange={e => setForm(v => ({...v,status:e.target.value as Stage}))}>{stages.map(s => <option key={s}>{s}</option>)}</select></label>
        <label>Priority<select value={form.priority} onChange={e => setForm(v => ({...v,priority:e.target.value}))}><option>High</option><option>Medium</option><option>Low</option></select></label>
        <label>Location<input value={form.location} onChange={e => setForm(v => ({...v,location:e.target.value}))} placeholder="City / remote"/></label>
        <label>Employment type<select value={form.jobType} onChange={e => setForm(v => ({...v,jobType:e.target.value}))}><option>Full-time</option><option>Internship</option><option>Contract</option><option>Part-time</option></select></label>
        <label>Salary / stipend<input value={form.salary} onChange={e => setForm(v => ({...v,salary:e.target.value}))} placeholder="Optional"/></label>
        <label>Application source<input value={form.source} onChange={e => setForm(v => ({...v,source:e.target.value}))} placeholder="Company site, LinkedIn, referral…"/></label>
        <label className="app-wide">Job posting URL<input value={form.jobUrl} onChange={e => setForm(v => ({...v,jobUrl:e.target.value}))} placeholder="https://…"/></label>
        <label>Next action<input value={form.nextTitle} onChange={e => setForm(v => ({...v,nextTitle:e.target.value}))} placeholder="What needs to happen next?"/></label>
        <label>Next action due date<input type="date" value={form.nextDate} onChange={e => setForm(v => ({...v,nextDate:e.target.value}))}/></label>
        <label className="app-wide">Initial notes<textarea value={form.note} onChange={e => setForm(v => ({...v,note:e.target.value}))} placeholder="Job details, recruiter context, expectations…"/></label>
      </div>
      <div className="modal-actions"><button className="btn-outline" onClick={() => setShowForm(false)}>Cancel</button><button className="btn-primary" onClick={saveForm} disabled={!form.company.trim() || !form.role.trim()}>{editing ? 'Save changes' : 'Add application'} <ArrowRight size={14}/></button></div>
    </div></div>}
    {selectedApp && <div className="app-action-editor" role="dialog" aria-label="Edit next action"><div className="app-action-editor-card"><div className="app-section-title"><h3>Edit next action · {selectedApp.company}</h3><button className="app-icon-btn" onClick={() => setSelected(null)}><X size={15}/></button></div><label>Next action<input autoFocus value={actionForm.title} onChange={e => setActionForm(v => ({...v,title:e.target.value}))} placeholder="e.g. Prepare for technical interview"/></label><label>Due date<input type="date" value={actionForm.dueDate} onChange={e => setActionForm(v => ({...v,dueDate:e.target.value}))}/></label><div className="modal-actions"><button className="btn-outline" onClick={() => setSelected(null)}>Cancel</button><button className="btn-primary" onClick={() => { const a = selectedApp; update(a.id, { nextAction: actionForm.title.trim() ? { title: actionForm.title.trim(), dueDate: actionForm.dueDate, status: 'Pending' } : null, timeline: addTimeline(a, 'Action', 'Next action updated', actionForm.title) }); setSelected(null); }}>Save action</button></div></div></div>}
    <div className="method-note"><Bell size={15}/><div><b>Personal tracker</b><p>Your changes update immediately and are saved in this browser. Date alerts are shown here when you open the tracker; automatic push notifications and cross-device sync are not enabled.</p></div></div>
  </section>;
}
