import { useEffect, useMemo, useState } from 'react';
import { api } from '@appdeploy/client';
import { Activity, AlertCircle, ArrowRight, BrainCircuit, CheckCircle2, Clock3, LoaderCircle, RefreshCw, Target } from 'lucide-react';
import './InterviewIntelligence.css';

type Attempt = {
  id: string; source: string; interviewType: string; targetRole: string; completedAt: string;
  overallScore: number; dimensions: {name:string;score:number;feedback:string}[];
  strengths: string[]; improvements: string[]; actionPlan?: {action:string;why:string}[];
  question?: string; answer?: string; transcript?: string; category?: string; answerMode?: string;
};
type Recommendation = {
  title:string; priority:string; pattern:string; evidenceAttemptIds:string[];
  evidence:string; exercise:string; durationMinutes:number; successMeasure:string;
};
export default function InterviewIntelligence({onNavigate}:{onNavigate:(page:string)=>void}) {
  const [attempts,setAttempts]=useState<Attempt[]>([]);
  const [recommendations,setRecommendations]=useState<Recommendation[]>([]);
  const [summary,setSummary]=useState('');
  const [filter,setFilter]=useState('all');
  const [loading,setLoading]=useState(true);
  const [generating,setGenerating]=useState(false);
  const [errorMessage,setErrorMessage]=useState('');
  const [note,setNote]=useState('');
  async function load() {
    setLoading(true); setErrorMessage('');
    try {
      const response=await api.get('/api/interview-attempts');
      setAttempts(Array.isArray(response.data?.attempts)?response.data.attempts:[]);
    } catch { setErrorMessage('Could not load your saved interview history. Please sign in and retry.'); }
    finally { setLoading(false); }
  }
  async function generate() {
    setGenerating(true); setErrorMessage(''); setNote('');
    try {
      const response=await api.post('/api/interview-intelligence/recommendations');
      setRecommendations(response.data?.recommendations||[]);
      setSummary(response.data?.summary||'');
      setNote(response.data?.note||'');
    } catch { setErrorMessage('AI analysis could not be generated. Your saved interview history is still available. Please retry.'); }
    finally { setGenerating(false); }
  }
  useEffect(()=>{void load();},[]);
  const visible=useMemo(()=>filter==='all'?attempts:attempts.filter(a=>filter==='hr'?a.source==='hr_interview':a.source==='ai_interview_room'),[attempts,filter]);
  const average=visible.length?Math.round(visible.reduce((n,a)=>n+a.overallScore,0)/visible.length):null;
  const grouped=useMemo(()=>{
    const map=new Map<string,{scores:number[];count:number}>();
    visible.forEach(a=>a.dimensions?.forEach(d=>{
      const current=map.get(d.name)||{scores:[],count:0};
      current.scores.push(d.score); current.count++; map.set(d.name,current);
    }));
    return [...map.entries()].map(([name,v])=>({name,score:Math.round(v.scores.reduce((n,s)=>n+s,0)/v.scores.length),count:v.count})).sort((a,b)=>a.score-b.score);
  },[visible]);
  const trend=[...visible].slice(0,12).reverse();
  return <section className="content interview-intelligence-page">
    <div className="ii-heading"><div><span className="section-eyebrow">CAREERPILOT · PERFORMANCE INTELLIGENCE</span><h1>Interview Performance Intelligence</h1><p>Understand your interview patterns and turn saved feedback into focused practice.</p></div><button className="btn-outline" onClick={()=>void load()} disabled={loading}><RefreshCw size={14}/> Refresh history</button></div>
    {errorMessage&&<div className="ii-alert"><AlertCircle size={16}/>{errorMessage}</div>}
    {loading?<div className="panel ii-empty"><LoaderCircle className="spin" size={22}/> Loading your saved interview history…</div>:<>
      <div className="ii-stats">
        <div className="panel"><span>Average score</span><b>{average===null?'—':average+'/100'}</b><small>{visible.length} comparable attempts in this view</small></div>
        <div className="panel"><span>Completed evaluations</span><b>{visible.length}</b><small>Saved to your account</small></div>
        <div className="panel"><span>HR evaluations</span><b>{attempts.filter(a=>a.source==='hr_interview').length}</b><small>Individual answer reviews</small></div>
        <div className="panel"><span>AI interview sessions</span><b>{attempts.filter(a=>a.source==='ai_interview_room').length}</b><small>Full interview reports</small></div>
      </div>
      <div className="ii-toolbar"><div><h2>Performance history</h2><p>Scores are shown only within the selected interview source.</p></div><div className="ii-filters">{[['all','All'],['hr','HR'],['live','AI Interview Room']].map(([id,label])=><button key={id} className={filter===id?'active':''} onClick={()=>setFilter(id)}>{label}</button>)}</div></div>
      {trend.length>0?<div className="panel ii-trend"><div className="ii-chart">{trend.map((a,i)=><div className="ii-bar-column" key={a.id}><span>{a.overallScore}</span><div className="ii-bar-track"><i style={{height:a.overallScore+'%'}}/></div><small>{new Date(a.completedAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</small></div>)}</div><div className="ii-legend"><span><i/> {filter==='all'?'Filtered attempt scores':'Attempt score'}</span><small>Chronological order · most recent 12</small></div></div>:<div className="panel ii-empty"><BrainCircuit size={28}/><h3>No interview evaluations yet</h3><p>Complete an HR answer review or finish an AI Interview Room session. Your saved evaluations will appear here.</p><div><button className="btn-outline" onClick={()=>onNavigate('interview')}>Practise HR Interview <ArrowRight size={14}/></button><button className="btn-primary" onClick={()=>onNavigate('live-interview')}>Open AI Interview Room <ArrowRight size={14}/></button></div></div>}
      {grouped.length>0&&<div className="panel ii-panel"><div className="ii-section-title"><div><h2>Dimension breakdown</h2><p>Average of available scores per dimension; sample counts vary.</p></div><Activity size={18}/></div><div className="ii-dimensions">{grouped.map(d=><div key={d.name}><div><b>{d.name}</b><strong>{d.score}/100 <small>· {d.count} samples</small></strong></div><div className="ii-track"><i style={{width:d.score+'%'}}/></div></div>)}</div></div>}
      <div className="panel ii-panel"><div className="ii-section-title"><div><h2>Evidence-based practice recommendations</h2><p>AI analysis uses saved evaluation evidence, not generic assumptions.</p></div><button className="btn-primary" disabled={generating||attempts.length<2} onClick={()=>void generate()}>{generating?<LoaderCircle size={14} className="spin"/>:<BrainCircuit size={15}/>} Analyse my patterns</button></div>
        {summary&&<p className="ii-summary">{summary}</p>}{note&&<p className="ii-note">{note}</p>}
        {recommendations.length?recommendations.map((r,i)=><article className="ii-recommendation" key={r.title+i}><div className="ii-rec-top"><b>{r.title}</b><span className={'ii-priority '+r.priority.toLowerCase()}>{r.priority} priority</span></div><p>{r.pattern}</p><small>{r.evidenceAttemptIds.length} supporting attempts · {r.durationMinutes} min</small><div className="ii-evidence"><b>Evidence</b><p>{r.evidence}</p></div><div className="ii-evidence"><b>Targeted exercise</b><p>{r.exercise}</p></div><div className="ii-evidence"><b>Success measure</b><p>{r.successMeasure}</p></div></article>):<div className="ii-empty ii-compact"><Target size={22}/><p>{attempts.length<2?'Complete at least two evaluations before analysing recurring weaknesses.':'Run the analysis to identify repeated improvement areas.'}</p></div>}
      </div>
      <div className="panel ii-panel"><div className="ii-section-title"><div><h2>Recent attempts</h2><p>Original evaluations remain unchanged.</p></div><Clock3 size={18}/></div>
        <div className="ii-history">{visible.map(a=><details key={a.id}><summary><span><b>{a.source==='hr_interview'?'HR answer review':'AI Interview Room'}</b><small>{a.targetRole} · {new Date(a.completedAt).toLocaleString('en-IN')}</small></span><strong>{a.overallScore}/100</strong></summary><div className="ii-attempt-detail">{a.question&&<p><b>Question:</b> {a.question}</p>}{a.answer&&<p><b>Answer:</b> {a.answer}</p>}{a.transcript&&<p><b>Transcript:</b> {a.transcript}</p>}<div className="ii-dimensions">{a.dimensions?.map(d=><div key={d.name}><div><b>{d.name}</b><strong>{d.score}/100</strong></div><p>{d.feedback}</p></div>)}</div>{a.improvements?.length>0&&<p><b>Improvements:</b> {a.improvements.join(' · ')}</p>}{a.strengths?.length>0&&<p><b>Strengths:</b> {a.strengths.join(' · ')}</p>}</div></details>)}</div>
      </div>
    </>}
  </section>;
}
