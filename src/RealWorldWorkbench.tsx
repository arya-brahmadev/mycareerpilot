import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@appdeploy/client';
import { ArrowLeft, ArrowRight, Bot, BriefcaseBusiness, CheckCircle2, Clock3, Code2, Database, FileText, LoaderCircle, MessageSquare, Save, Send, ShieldCheck, Sparkles, Target, TerminalSquare } from 'lucide-react';
import './RealWorldWorkbench.css';

type Role = 'Software Developer' | 'AI Engineer' | 'Data Analyst';
type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
type Scenario = { id: string; role: Role; title: string; company: string; category: string; summary: string; context: string; assignment: string; deliverables: string[]; skills: string[]; };
type Message = { role: 'candidate' | 'manager'; text: string; createdAt: string };
type WorkplaceEvent = { id: string; sender: string; kind: string; urgency: string; message: string; requestedAction: string; createdAt: string };
type Session = { id: string; scenarioId: string; role: Role; difficulty: Difficulty; title: string; status: string; updatedAt: string; work: Record<string,string>; messages: Message[]; durationMinutes?: number; deadlineAt?: string };
type Review = { overallScore: number; summary: string; dimensions: { name: string; score: number; feedback: string }[]; strengths: string[]; improvements: string[]; nextSteps: string[] };
type Performance = { totalCompleted: number; averageScore: number; roleAverages: { role: string; count: number; average: number }[]; skillAverages: { name: string; average: number; count: number }[]; recentTrend: { title: string; role: string; score: number; completedAt: string }[]; recommendation: string; readiness: string };

const scenarios: Scenario[] = [
  { id:'dev-booking-race', role:'Software Developer', title:'Stop the duplicate bookings', company:'Northstar Health', category:'Debugging · Backend', summary:'Two patients occasionally receive the same appointment slot.', context:'Two concurrent requests can both pass an application-level availability check before either writes a booking. The booking API serves several clinics and must protect doctor/time-slot integrity.', assignment:'Investigate the race condition and propose a safe backend fix. Explain where the consistency guarantee belongs and how you would verify it.', deliverables:['Root-cause explanation','Proposed code or pseudocode','Concurrency test plan'], skills:['Concurrency','Database integrity','Transactions','Testing'] },
  { id:'dev-api-outage', role:'Software Developer', title:'Recover a failing customer API', company:'Orbit Commerce', category:'Incident response · APIs', summary:'An order-history endpoint returns intermittent 500 errors after a release.', context:'Some customers receive 500 responses after yesterday’s release. The issue is intermittent and affects only some accounts. The team needs a safe diagnosis and low-risk recovery plan.', assignment:'Prioritise the investigation, identify evidence to inspect and recommend a recovery plan that limits customer impact.', deliverables:['Investigation sequence','Likely failure points','Recovery and regression plan'], skills:['Debugging','Logs','API reliability','Prioritisation'] },
  { id:'dev-feature-request', role:'Software Developer', title:'Deliver a late feature change', company:'Cedar Workspace', category:'Feature delivery · Requirements', summary:'A client changes acceptance criteria close to the deadline.', context:'A team invitation feature must now expire after 48 hours and administrators must be able to revoke invitations. The delivery date is unchanged.', assignment:'Clarify requirements, identify design impact and propose a realistic delivery plan.', deliverables:['Updated acceptance criteria','Implementation outline','Risk and test checklist'], skills:['Requirements','API design','Estimation','Communication'] },
  { id:'ai-support-hallucination', role:'AI Engineer', title:'Fix an unreliable support assistant', company:'Helio Support', category:'LLM reliability · Evaluation', summary:'A support assistant invents refund policies and cites irrelevant passages.', context:'The assistant uses a company policy knowledge base. Reviews show invented refund windows and irrelevant citations. The product team wants safer answers without turning every response into a refusal.', assignment:'Diagnose likely failure points and design an evaluation-led improvement plan for retrieval, prompting and answer behaviour.', deliverables:['Failure analysis','Proposed system changes','Evaluation examples and metrics'], skills:['LLM evaluation','RAG','Prompt design','Reliability'] },
  { id:'ai-document-rag', role:'AI Engineer', title:'Improve a policy search assistant', company:'Meridian Finance', category:'RAG · System design', summary:'Employees cannot find the correct policy in a large document set.', context:'The assistant searches hundreds of policy documents. It retrieves outdated versions and misses relevant sections when employees use everyday language.', assignment:'Design a retrieval pipeline that improves relevance and makes source freshness visible.', deliverables:['Retrieval architecture','Chunking and ranking approach','Evaluation dataset plan'], skills:['Embeddings','Retrieval','Data pipelines','Evaluation'] },
  { id:'ai-model-cost', role:'AI Engineer', title:'Reduce inference cost without losing quality', company:'Vertex Assist', category:'Model evaluation · Optimisation', summary:'An AI feature is exceeding its monthly inference budget.', context:'Usage doubled and inference spend is above budget. Leadership wants lower cost without damaging answer quality or response time.', assignment:'Propose a measurement-first optimisation plan and explain the quality and latency trade-offs you would monitor.', deliverables:['Baseline metrics','Optimisation options','Quality guardrail plan'], skills:['Model selection','Latency','Cost analysis','Experiment design'] },
  { id:'data-sales-drop', role:'Data Analyst', title:'Explain the sales conversion drop', company:'Orbit Commerce', category:'Business analysis · SQL', summary:'Weekly conversion fell while traffic remained roughly stable.', context:'The e-commerce team reports a two-week conversion decline. Marketing suspects checkout friction. Daily order, session and campaign tables are available.', assignment:'Define the analysis needed to isolate where conversion changed and recommend the next business action.', deliverables:['Metric definition','SQL or analysis outline','Findings and recommendation'], skills:['SQL','Funnel analysis','Data interpretation','Communication'] },
  { id:'data-customer-churn', role:'Data Analyst', title:'Investigate rising customer churn', company:'Northstar Subscriptions', category:'Analytics · Retention', summary:'Monthly cancellations have increased and the retention team needs direction.', context:'A subscription business has seen more cancellations. The team wants to identify affected customer groups and tenure bands without confusing correlation with cause.', assignment:'Build a structured investigation plan and distinguish observed patterns from claims needing further testing.', deliverables:['Churn metric definition','Segmentation and SQL plan','Evidence-based recommendation'], skills:['SQL','Cohort analysis','Statistics','Storytelling'] },
  { id:'data-inventory', role:'Data Analyst', title:'Resolve an inventory reporting mismatch', company:'Cedar Retail', category:'Data quality · Reporting', summary:'The dashboard and warehouse export show different stock counts.', context:'Store managers see one inventory count in the dashboard while the warehouse export shows another. The mismatch often appears after returns and transfers.', assignment:'Trace likely sources of disagreement, define reconciliation checks and recommend how reporting should communicate uncertainty.', deliverables:['Data lineage questions','Reconciliation query outline','Reporting recommendation'], skills:['SQL','Data quality','Reconciliation','Stakeholder communication'] }
];

const roleCopy: Record<Role,string> = {
  'Software Developer':'Debug services, deliver features and make engineering trade-offs.',
  'AI Engineer':'Design reliable AI systems and evaluate model behaviour.',
  'Data Analyst':'Investigate business questions and turn data into decisions.'
};
const blankWork = () => ({ approach:'', writtenAnswer:'', code:'', sql:'', testPlan:'', decision:'', risks:'' });
const makeId = () => 'sim_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,10);

export default function RealWorldWorkbench() {
  const [role,setRole] = useState<Role>('Software Developer');
  const [difficulty,setDifficulty] = useState<Difficulty>('Beginner');
  const [scenarioId,setScenarioId] = useState('dev-booking-race');
  const [active,setActive] = useState<Scenario|null>(null);
  const [sessionId,setSessionId] = useState('');
  const [work,setWork] = useState<Record<string,string>>(blankWork());
  const [messages,setMessages] = useState<Message[]>([]);
  const [managerInput,setManagerInput] = useState('');
  const [busy,setBusy] = useState('');
  const [notice,setNotice] = useState('');
  const [saved,setSaved] = useState<Session[]>([]);
  const [review,setReview] = useState<Review|null>(null);
  const [tab,setTab] = useState<'work'|'manager'|'review'>('work');
  const [showSaved,setShowSaved] = useState(false);
  const [durationMinutes,setDurationMinutes] = useState(30);
  const [timerDeadline,setTimerDeadline] = useState<string|null>(null);
  const [secondsLeft,setSecondsLeft] = useState(0);
  const [events,setEvents] = useState<WorkplaceEvent[]>([]);
  const [eventBusy,setEventBusy] = useState(false);
  const [showPerformance,setShowPerformance] = useState(false);
  const [performance,setPerformance] = useState<Performance|null>(null);
  const [performanceBusy,setPerformanceBusy] = useState(false);
  const [performanceError,setPerformanceError] = useState('');
  const autoSubmitted = useRef(false);
  const roleScenarios = useMemo(()=>scenarios.filter(s=>s.role===role),[role]);
  const selected = roleScenarios.find(s=>s.id===scenarioId) || roleScenarios[0];

  const loadSaved = async () => {
    try {
      const r = await api.get('/api/simulations');
      setSaved(Array.isArray(r.data.sessions) ? r.data.sessions : []);
    } catch { setNotice('Sign in to load saved simulations.'); }
  };
  const loadPerformance = async () => {
    setPerformanceBusy(true); setPerformanceError('');
    try { const r = await api.get('/api/simulation-performance'); setPerformance(r.data as Performance); }
    catch (e:any) { setPerformanceError(e?.response?.data?.error || 'Could not load performance history. Sign in and retry.'); }
    finally { setPerformanceBusy(false); }
  };
  useEffect(()=>{ void loadSaved(); },[]);

  const updateWork = (key:string,value:string) => setWork(current=>({...current,[key]:value}));
  const start = (scenario:Scenario) => {
    const deadline = new Date(Date.now() + durationMinutes * 60000).toISOString();
    autoSubmitted.current = false;
    setActive(scenario); setSessionId(makeId()); setWork(blankWork()); setMessages([]); setReview(null); setTab('work'); setNotice(''); setEvents([]); setTimerDeadline(deadline); setSecondsLeft(durationMinutes * 60);
  };
  const save = async () => {
    if (!active || !sessionId) return;
    setBusy('save'); setNotice('');
    try {
      await api.post('/api/simulations',{id:sessionId,scenarioId:active.id,role:active.role,difficulty,title:active.title,status:review?'submitted':'in_progress',work,messages,durationMinutes,deadlineAt:timerDeadline,review,completedAt:review?new Date().toISOString():undefined});
      setNotice('Simulation saved. You can resume it from Saved simulations.');
      await loadSaved();
    } catch (e:any) { setNotice(e?.response?.data?.error || 'Could not save. Sign in and try again. Your current work remains on this screen.'); }
    finally { setBusy(''); }
  };
  const resume = (session:Session) => {
    const scenario = scenarios.find(s=>s.id===session.scenarioId);
    if (!scenario) { setNotice('This saved scenario is no longer available.'); return; }
    setActive(scenario); setRole(session.role); setDifficulty(session.difficulty); setScenarioId(session.scenarioId);
    autoSubmitted.current = false;
    setSessionId(session.id); setWork({...blankWork(),...(session.work||{})}); setMessages(session.messages||[]); setReview(null); setTab('work'); setShowSaved(false); setEvents([]);
    const savedDeadline = session.deadlineAt || new Date(Date.now() + (session.durationMinutes || 30) * 60000).toISOString();
    setDurationMinutes(session.durationMinutes || 30); setTimerDeadline(savedDeadline); setSecondsLeft(Math.max(0,Math.ceil((new Date(savedDeadline).getTime()-Date.now())/1000)));
  };
  const sendToManager = async () => {
    if (!active || managerInput.trim().length<3) return;
    const message = managerInput.trim();
    const next = [...messages,{role:'candidate' as const,text:message,createdAt:new Date().toISOString()}];
    setMessages(next); setManagerInput(''); setBusy('manager'); setNotice('');
    try {
      const r = await api.post('/api/simulations/manager',{scenario:{title:active.title,role:active.role,company:active.company,context:active.context,assignment:active.assignment,deliverables:active.deliverables},difficulty,work,message,history:messages.slice(-10)});
      const answer = String(r.data.reply||'I need a little more detail. Explain your reasoning and the evidence behind it.');
      setMessages(current=>[...current,{role:'manager',text:answer,createdAt:new Date().toISOString()}]);
    } catch (e:any) {
      setMessages(current=>[...current,{role:'manager',text:'I could not reach the manager service just now. Your message is still in this session; try again shortly.',createdAt:new Date().toISOString()}]);
      setNotice(e?.response?.data?.error || 'AI manager is temporarily unavailable.');
    } finally { setBusy(''); }
  };
  const submit = async (timedOut = false) => {
    if (!active || autoSubmitted.current || (busy && busy !== 'manager')) return;
    const filled = Object.values(work).some(v=>v.trim().length>0);
    if (!filled && !timedOut) { setNotice('Add at least one part of your work before submitting.'); return; }
    autoSubmitted.current = true;
    setBusy('review'); setNotice(timedOut ? 'Time is up. Your current work is being submitted automatically…' : ''); setReview(null);
    try {
      const r = await api.post('/api/simulations/review',{scenario:{title:active.title,role:active.role,company:active.company,context:active.context,assignment:active.assignment,deliverables:active.deliverables,skills:active.skills},difficulty,work,timedOut});
      setReview(r.data as Review); setTab('review'); setTimerDeadline(null);
      await api.post('/api/simulations',{id:sessionId,scenarioId:active.id,role:active.role,difficulty,title:active.title,status:'submitted',work,messages,durationMinutes,deadlineAt:timerDeadline,review:r.data,completedAt:new Date().toISOString()});
      await loadSaved();
    } catch (e:any) { autoSubmitted.current = false; setNotice(e?.response?.data?.error || 'Review could not be completed. Your work has not been cleared; retry submission.'); }
    finally { setBusy(''); }
  };

  useEffect(()=>{
    if (!active || !timerDeadline || review) return;
    const tick = () => {
      const remaining = Math.max(0,Math.ceil((new Date(timerDeadline).getTime()-Date.now())/1000));
      setSecondsLeft(remaining);
      if (remaining === 0 && !autoSubmitted.current) void submit(true);
    };
    tick();
    const interval = window.setInterval(tick,1000);
    return ()=>window.clearInterval(interval);
  },[active?.id,timerDeadline,review]);

  useEffect(()=>{
    if (!active || review) return;
    let stopped = false;
    const interval = window.setInterval(async ()=>{
      if (stopped || eventBusy || busy === 'review') return;
      setEventBusy(true);
      try {
        const response = await api.post('/api/simulations/event',{scenario:{title:active.title,role:active.role,company:active.company,context:active.context,assignment:active.assignment,deliverables:active.deliverables},difficulty,work,events:events.slice(-5)});
        if (!stopped && response.data?.event) setEvents(current=>[...current,response.data.event as WorkplaceEvent]);
      } catch { if (!stopped) setNotice('A workplace update could not be generated. Your current work is safe.'); }
      finally { if (!stopped) setEventBusy(false); }
    },180000);
    return ()=>{stopped=true;window.clearInterval(interval);};
  },[active?.id,review]);

  const timerLabel = String(Math.floor(secondsLeft/60)).padStart(2,'0')+':'+String(secondsLeft%60).padStart(2,'0');

  if (!active && showPerformance) return <section className="content rww-page">
    <div className="rww-work-top"><button className="rww-back" onClick={()=>setShowPerformance(false)}><ArrowLeft size={15}/> Back to simulator</button><span className="rww-kicker">CAREERPILOT · PERFORMANCE & PROGRESSION</span><button className="rww-secondary" onClick={()=>void loadPerformance()} disabled={performanceBusy}>Refresh</button></div>
    <header className="rww-hero"><div><span className="rww-kicker">EVIDENCE-BASED DEVELOPMENT</span><h1>Career Performance <em>& Progression</em></h1><p>Practical-workplace performance and skill trends based only on completed simulation reviews.</p></div><div className="rww-hero-icon"><Target size={36}/><small>YOUR PROGRESS</small></div></header>
    {performanceBusy&&!performance?<p className="rww-notice">Loading your saved simulation evidence…</p>:performanceError?<p className="rww-notice">{performanceError}</p>:performance&&<>
      <div className="rww-performance-stats"><article><span>Completed simulations</span><b>{performance.totalCompleted}</b></article><article><span>Average practice score</span><b>{performance.totalCompleted?performance.averageScore+'/100':'—'}</b></article><article><span>Roles practised</span><b>{performance.roleAverages.length}/3</b></article></div>
      {performance.totalCompleted===0?<div className="rww-performance-empty"><h2>Your evidence base starts with your first review</h2><p>Complete and submit an assignment. Only saved completed reviews count; legacy sessions without review evidence are excluded.</p><button className="rww-primary" onClick={()=>setShowPerformance(false)}>Start a simulation <ArrowRight size={15}/></button></div>:<>
        <div className="rww-performance-grid"><section className="rww-performance-panel"><h2>Role performance</h2>{performance.roleAverages.map(item=><div className="rww-performance-row" key={item.role}><div><b>{item.role}</b><span>{item.count} completed · {item.average}/100 average</span></div><div className="rww-score-track"><i style={{width:item.average+'%'}}/></div></div>)}</section><section className="rww-performance-panel"><h2>Competency profile</h2>{performance.skillAverages.length?performance.skillAverages.map(item=><div className="rww-performance-row" key={item.name}><div><b>{item.name}</b><span>{item.count} review ratings · {item.average}/100</span></div><div className="rww-score-track"><i style={{width:item.average+'%'}}/></div></div>):<p>Competency ratings will appear as reviews are saved.</p>}</section></div>
        <section className="rww-performance-panel"><h2>Recent performance history</h2><div className="rww-history-list">{performance.recentTrend.map(item=><article key={item.title+item.completedAt}><div><b>{item.title}</b><span>{item.role} · {new Date(item.completedAt).toLocaleDateString()}</span></div><strong>{item.score}/100</strong></article>)}</div></section>
        <div className="rww-performance-grid"><section className="rww-performance-panel"><h2>Recommended next focus</h2><p>{performance.recommendation}</p><small>Recurring priorities require the same competency to appear in at least two reviews.</small></section><section className="rww-performance-panel"><h2>Workplace-readiness snapshot</h2><b className="rww-readiness-label">{performance.readiness}</b><p>{performance.totalCompleted<3?'Early evidence only: complete at least three reviewed assignments for a more stable view.':'Practice snapshot only, not a hiring prediction or formal certification.'}</p></section></div>
      </>}
    </>}
    <p className="rww-notice">Performance data is private to your signed-in account. Historical sessions without saved rubric evidence are not counted.</p>
  </section>;

  if (!active) return <section className="content rww-page">
    <header className="rww-hero"><div><span className="rww-kicker">CAREERPILOT · PRACTICAL WORKPLACE EXPERIENCE</span><h1>Real-World <em>Job Simulator</em></h1><p>Take ownership of a realistic assignment, handle changing priorities and defend your decisions to an AI manager. New stakeholder updates arrive during the session.</p><div className="rww-pills"><span><Clock3 size={14}/> User-timed practice</span><span><ShieldCheck size={14}/> Curated scenarios</span><span><Save size={14}/> Saved sessions</span></div></div><div className="rww-hero-icon"><BriefcaseBusiness size={36}/><small>DAY 01</small></div></header>
    <div className="rww-topline"><div><span className="rww-kicker">STEP 01</span><h2>Choose your job role</h2><p>Each role has three role-specific workplace assignments.</p></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button className="rww-secondary" onClick={()=>{setShowPerformance(true);void loadPerformance();}}><Target size={15}/> Performance & progression</button><button className="rww-secondary" onClick={()=>{setShowSaved(v=>!v);void loadSaved();}}> <Save size={15}/> Saved simulations ({saved.length})</button></div></div>
    {showSaved && <div className="rww-saved-list">{saved.length===0?<p>No saved sessions yet. Start an assignment and save your work.</p>:saved.map(s=><button key={s.id} onClick={()=>resume(s)}><span><b>{s.title}</b><small>{s.role} · {s.difficulty} · {s.status==='submitted'?'Submitted':'In progress'}</small></span><ArrowRight size={16}/></button>)}</div>}
    <div className="rww-role-grid">{(Object.keys(roleCopy) as Role[]).map(r=><button key={r} className={'rww-role '+(role===r?'selected':'')} onClick={()=>{setRole(r);setScenarioId(scenarios.find(s=>s.role===r)!.id);}}><span>{r==='Software Developer'?<Code2/>:r==='AI Engineer'?<Bot/>:<Database/>}</span><b>{r}</b><small>{roleCopy[r]}</small><em>3 assignments</em></button>)}</div>
    <div className="rww-columns"><main><div className="rww-topline"><div><span className="rww-kicker">STEP 02</span><h2>Set challenge level</h2><p>Difficulty changes the expected depth, not the scenario facts.</p></div></div><div className="rww-difficulty">{(['Beginner','Intermediate','Advanced'] as Difficulty[]).map((d,i)=><button key={d} className={difficulty===d?'selected':''} onClick={()=>setDifficulty(d)}><small>0{i+1}</small><b>{d}</b><span>{d==='Beginner'?'Guided fundamentals':d==='Intermediate'?'Trade-offs and prioritisation':'Ambiguity and deeper ownership'}</span></button>)}</div><div className="rww-topline"><div><span className="rww-kicker">STEP 03</span><h2>Choose your time limit</h2><p>When the countdown ends, your current answer is submitted automatically for review.</p></div></div><div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:18}}>{[15,30,45,60].map(minutes=><button key={minutes} onClick={()=>setDurationMinutes(minutes)} style={{padding:'10px 16px',borderRadius:9,border:'1px solid '+(durationMinutes===minutes?'#6ca9e8':'#344960'),background:durationMinutes===minutes?'#173653':'#101d2d',color:'#e6edf7',fontWeight:700}}>{minutes} minutes</button>)}</div><div className="rww-topline"><div><span className="rww-kicker">STEP 04</span><h2>Choose an assignment</h2><p>Review the situation before you start the work session.</p></div></div><div className="rww-scenarios">{roleScenarios.map((s,i)=><button key={s.id} className={scenarioId===s.id?'selected':''} onClick={()=>setScenarioId(s.id)}><small>0{i+1} · {s.category} · {s.company}</small><b>{s.title}</b><span>{s.summary}</span><ArrowRight size={16}/></button>)}</div></main><aside className="rww-start-card"><BriefcaseBusiness size={22}/><span className="rww-kicker">SIMULATION SUMMARY</span><h3>{selected.title}</h3><p>{selected.summary}</p><div><span>Role</span><b>{role}</b></div><div><span>Difficulty</span><b>{difficulty}</b></div><div><span>Deliverables</span><b>{selected.deliverables.length}</b></div><button className="rww-primary" onClick={()=>start(selected)}>Open assignment <ArrowRight size={16}/></button></aside></div>
    {notice&&<p className="rww-notice">{notice}</p>}
  </section>;

  return <section className="content rww-page">
    <div className="rww-work-top"><button className="rww-back" onClick={()=>{setActive(null);setNotice('');void loadSaved();}}><ArrowLeft size={15}/> All simulations</button><span className="rww-kicker">LIVE WORK SESSION · {active.company.toUpperCase()} · {durationMinutes} MINUTES</span><button className="rww-secondary" onClick={save} disabled={!!busy}><Save size={15}/>{busy==='save'?'Saving…':'Save progress'}</button></div>
    <header className="rww-assignment-head"><div><span className="rww-kicker">{active.role} · {difficulty} · {active.category}</span><h1>{active.title}</h1><p>{active.summary}</p></div><div className="rww-status"><span style={{fontSize:22,fontWeight:800,color:secondsLeft<=60?'#ffb08d':'#9bcaff'}}><Clock3 size={16}/> {timerLabel}</span><span>{durationMinutes}-minute limit · auto-submit on expiry</span></div></header>
    <div className="rww-work-grid"><aside className="rww-brief"><div className="rww-panel-title"><FileText size={17}/><b>Assignment briefing</b></div><h3>Workplace context</h3><p>{active.context}</p><div className="rww-callout"><span className="rww-kicker">YOUR ASSIGNMENT</span><p>{active.assignment}</p></div><h3>Expected deliverables</h3><ul>{active.deliverables.map(d=><li key={d}><CheckCircle2 size={14}/>{d}</li>)}</ul><h3>Skills in focus</h3><div className="rww-tags">{active.skills.map(s=><span key={s}>{s}</span>)}</div></aside>
      <main className="rww-work-main">{events.length>0&&<section style={{padding:'14px 18px',borderBottom:'1px solid #35485d',background:'#17283b'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}><b style={{color:'#b9d8f5',fontSize:12}}>Live workplace updates</b><span style={{fontSize:9,color:'#91a8c0'}}>{eventBusy?'Checking for an update…':events.length+' update(s)'}</span></div>{events.map((event,index)=><article key={event.id} style={{marginTop:10,padding:12,border:'1px solid #38536e',borderRadius:9,background:'#102033'}}><div style={{display:'flex',justifyContent:'space-between',gap:8,fontSize:10,color:'#9bcaff'}}><b>{event.sender} · {event.kind}</b><b>{event.urgency}</b></div><p style={{fontSize:11,lineHeight:1.7,color:'#dce7f3'}}>{event.message}</p><p style={{fontSize:10,color:'#a9bfd5',marginBottom:0}}>Your response: {event.requestedAction}</p></article>)}</section>}<nav className="rww-tabs"><button className={tab==='work'?'active':''} onClick={()=>setTab('work')}><Code2 size={15}/> Workbench</button><button className={tab==='manager'?'active':''} onClick={()=>setTab('manager')}><MessageSquare size={15}/> AI manager <span>{messages.length}</span></button><button className={tab==='review'?'active':''} onClick={()=>setTab('review')} disabled={!review}><Target size={15}/> Review</button></nav>
      {tab==='work'&&<div className="rww-editor-panel"><div className="rww-editor-intro"><div><span className="rww-kicker">YOUR DELIVERABLES</span><h2>Build your response</h2><p>Use the fields relevant to this assignment. Save at any time; submit when your reasoning and evidence are ready.</p></div><span className="rww-draft-badge">DRAFT</span></div>
        <label>1. Approach and root-cause analysis<textarea value={work.approach} onChange={e=>updateWork('approach',e.target.value)} placeholder="What is happening? What assumptions need validation? Outline your investigation step by step."/></label>
        <label>2. Written solution / technical explanation<textarea value={work.writtenAnswer} onChange={e=>updateWork('writtenAnswer',e.target.value)} placeholder="Explain the solution you recommend, why it works and the trade-offs."/></label>
        {(active.role==='Software Developer'||active.role==='AI Engineer')&&<label><span className="rww-label-icon"><TerminalSquare size={15}/>3. Code / pseudocode</span><textarea className="rww-code" spellCheck={false} value={work.code} onChange={e=>updateWork('code',e.target.value)} placeholder={'// Write code or pseudocode here.\n// Explain important decisions in comments.'}/></label>}
        {active.role==='Data Analyst'&&<label><span className="rww-label-icon"><Database size={15}/>3. SQL query / analysis</span><textarea className="rww-code" spellCheck={false} value={work.sql} onChange={e=>updateWork('sql',e.target.value)} placeholder={'-- Write SQL here\nSELECT ...'}/></label>}
        <label>4. Testing and validation plan<textarea value={work.testPlan} onChange={e=>updateWork('testPlan',e.target.value)} placeholder="How will you verify correctness? Include edge cases, metrics or sample checks."/></label>
        <div className="rww-two-fields"><label>5. Key decision and trade-off<textarea value={work.decision} onChange={e=>updateWork('decision',e.target.value)} placeholder="What would you choose and why?"/></label><label>6. Risks and open questions<textarea value={work.risks} onChange={e=>updateWork('risks',e.target.value)} placeholder="What could still go wrong? What would you clarify?"/></label></div>
        <div className="rww-submit-row"><span>Code and SQL are reviewed as text in this phase; they are not executed.</span><button className="rww-primary" onClick={()=>void submit(false)} disabled={!!busy}>{busy==='review'?<><LoaderCircle className="rww-spin" size={16}/> Reviewing…</>:<>Submit for AI review <ArrowRight size={16}/></>}</button></div>
      </div>}
      {tab==='manager'&&<div className="rww-manager-panel"><div className="rww-manager-intro"><span className="rww-manager-avatar"><Bot size={21}/></span><div><b>Your AI project manager</b><p>Ask clarifying questions, explain your decisions or request a review of your approach.</p></div></div><div className="rww-chat-log">{messages.length===0&&<div className="rww-manager-welcome"><Sparkles size={22}/><b>Let's work through this assignment.</b><p>What is your initial understanding of the problem, and what would you investigate first?</p><button onClick={()=>setManagerInput('I have reviewed the brief. What should I clarify with the stakeholder before choosing a solution?')}>Ask what to clarify first <ArrowRight size={14}/></button></div>}{messages.map((m,i)=><div key={i} className={'rww-message '+m.role}><span>{m.role==='manager'?<Bot size={14}/>:<BriefcaseBusiness size={14}/>} {m.role==='manager'?'Project manager':'You'}</span><p>{m.text}</p></div>)}</div><div className="rww-chat-compose"><textarea value={managerInput} onChange={e=>setManagerInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();void sendToManager();}}} placeholder="Explain your thinking or ask your manager a question…"/><button className="rww-primary" onClick={sendToManager} disabled={!!busy||managerInput.trim().length<3}>{busy==='manager'?<LoaderCircle className="rww-spin" size={16}/>:<Send size={16}/>} Send</button></div><p className="rww-chat-hint">The manager can challenge assumptions and ask follow-ups. AI feedback is practice guidance, not an employer decision.</p></div>}
      {tab==='review'&&review&&<div className="rww-review-panel"><div className="rww-score"><div><span className="rww-kicker">PRACTICE REVIEW</span><h2>{review.overallScore}<small>/100</small></h2><p>{review.summary}</p></div><Target size={34}/></div><div className="rww-rubric">{review.dimensions.map(d=><div key={d.name}><div><b>{d.name}</b><strong>{d.score}/100</strong></div><div className="rww-score-track"><i style={{width:d.score+'%'}}/></div><p>{d.feedback}</p></div>)}</div><div className="rww-feedback-grid"><article><h3>What worked</h3>{review.strengths.map((s,i)=><p key={i}><CheckCircle2 size={14}/>{s}</p>)}</article><article><h3>What to improve</h3>{review.improvements.map((s,i)=><p key={i}>• {s}</p>)}</article></div><div className="rww-next-steps"><h3>Recommended next steps</h3><ol>{review.nextSteps.map((s,i)=><li key={i}>{s}</li>)}</ol></div><button className="rww-secondary" onClick={()=>setTab('work')}> <ArrowLeft size={14}/> Revise your submission</button></div>}
      </main></div>
    {notice&&<p className="rww-notice">{notice}</p>}
  </section>;
}
