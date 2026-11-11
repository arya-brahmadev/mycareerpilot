import { useState } from 'react';
import { api } from '@appdeploy/client';
import { getDocument } from 'pdfjs-dist';
import { ArrowRight, BookOpen, FileText, Link2, LoaderCircle, MessageSquareText, ShieldCheck, Sparkles, Target, Upload } from 'lucide-react';

type Props={profile:any;resumeText:string;onEditProfile:()=>void;onBuildRoadmap:(role:string,description:string)=>void;onNavigate:(page:string)=>void;onMatchReady:(score:number,summary:string,matchedSkills:string[],missingSkills:string[],strengths:string[],recommendations:string[])=>void};
type Report={matchScore:number;readinessScore:number;readinessLabel:string;summary:string;requirements:{name:string;importance:string;evidence:string;reason:string}[];technicalGaps:{skill:string;priority:string;why:string;learningActivity:string;verification:string}[];communicationGaps:{area:string;observation:string;practice:string;lab:string}[];resumeGaps:{gap:string;impact:string;action:string}[];readinessDimensions:{name:string;score:number;status:string;detail:string}[];projects:{title:string;objective:string;stack:string[];deliverables:string[];skillsProved:string[]}[];interviewQuestions:{category:string;question:string;whatToCover:string}[];resources:{title:string;url:string;kind:string;forSkill:string}[];resumeActions:{priority:string;section:string;action:string;copyText:string;evidence:string;status:string}[];recommendations:string[];matchedSkills:string[];missingSkills:string[];strengths:string[]};
const validUrl=(s:string)=>{try{const u=new URL(s);return u.protocol==='https:'?u.toString():''}catch{return ''}};
export default function JobReadiness({profile,resumeText,onEditProfile,onBuildRoadmap,onNavigate,onMatchReady}:Props){
 const [title,setTitle]=useState('Software Engineer Intern'),[company,setCompany]=useState(''),[description,setDescription]=useState(''),[url,setUrl]=useState(''),[pdfName,setPdfName]=useState(''),[report,setReport]=useState<Report|null>(null),[tab,setTab]=useState('analysis'),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[questions,setQuestions]=useState<any[]>([]),[answers,setAnswers]=useState<Record<number,number>>({}),[skill,setSkill]=useState(''),[quizResult,setQuizResult]=useState<any>(null),[feedback,setFeedback]=useState<string[]>([]),[task,setTask]=useState(''),[solution,setSolution]=useState(''),[review,setReview]=useState<any>(null);
 const getApiError = (err: unknown, fallback: string) => {
   const value = err as { response?: { data?: { error?: string } }; message?: string };
   const message = value?.response?.data?.error || value?.message || fallback;
   return message.includes('ai_usage_limit_exceeded') || message.includes('429')
     ? 'The AI service has reached its current usage limit. Try again after it resets.'
     : message;
 };
 async function importPdf(file: File) {
   setBusy(true);
   try {
     const pdf = await getDocument({ data: await file.arrayBuffer() }).promise;
     let text = '';
     for (let i = 1; i <= Math.min(pdf.numPages, 25); i++) {
       const page = await pdf.getPage(i);
       const content = await page.getTextContent();
       text += content.items.map((item: any) => item.str || '').join(' ') + '\\n';
     }
     if (text.trim().length < 80) throw new Error('PDF has too little selectable text. Paste the job description instead.');
     setDescription(text.slice(0, 12000));
     setPdfName(file.name);
     setMessage('PDF text extracted. Review before analysis.');
   } catch (err) {
     setMessage(getApiError(err, 'Could not read PDF.'));
   } finally {
     setBusy(false);
   }
 }
 async function importUrl() {
   if (!validUrl(url)) { setMessage('Enter a valid public HTTPS job URL.'); return; }
   setBusy(true);
   try {
     const result = await api.post('/api/job-description-from-url', { url });
     if (!result.data.description) { setMessage(result.data.importError || 'Could not import this page. Paste the job description manually.'); return; }
     setDescription(String(result.data.description).slice(0, 12000));
     if (result.data.title) setTitle(result.data.title);
     setMessage('Imported page text. Review the description before analysis.');
   } catch (err) {
     setMessage(getApiError(err, 'Page extraction failed. Paste the description manually.'));
   } finally {
     setBusy(false);
   }
 }
 async function analyse() {
   if (description.trim().length < 80) { setMessage('Add a complete job description (at least 80 characters).'); return; }
   setBusy(true);
   setMessage('Analysing requirements and candidate evidence…');
   try {
     const result = await api.post('/api/job-readiness-analysis', {
       profile, resumeText: resumeText.slice(0, 16000), title, company, description: description.slice(0, 9000),
     });
     const data = result.data as Report;
     if (!Array.isArray(data.technicalGaps) || !Array.isArray(data.requirements)) throw new Error('The report was incomplete. Please retry.');
     setReport(data);
     setTab('analysis');
     onMatchReady(data.matchScore, data.summary, data.matchedSkills || [], data.missingSkills || [], data.strengths || [], data.recommendations || []);
     setMessage('Report ready. Unverified skills are not treated as proven gaps.');
   } catch (err) {
     setMessage(getApiError(err, 'Analysis failed. Try again.'));
   } finally {
     setBusy(false);
   }
 }
 async function testSkill(value: string) {
   setBusy(true); setSkill(value); setQuizResult(null); setAnswers({});
   try {
     const result = await api.post('/api/job-skill-assessment', { mode: 'generate', skill: value, role: title, description: description.slice(0, 6000) });
     setQuestions(result.data.questions || []);
     setTab('assessment');
   } catch (err) {
     setMessage(getApiError(err, 'Assessment generation failed.'));
   } finally {
     setBusy(false);
   }
 }
 async function submitQuiz() {
   if (questions.some((question, index) => answers[index] === undefined)) { setMessage('Answer every question first.'); return; }
   const score = Math.round(questions.reduce((total, question, index) => total + (answers[index] === question.correctIndex ? 1 : 0), 0) / questions.length * 100);
   setQuizResult({ score, correct: questions.filter((question, index) => answers[index] === question.correctIndex).length, total: questions.length });
   setBusy(true);
   try {
     const result = await api.post('/api/job-skill-assessment', {
       mode: 'feedback', skill, role: title, score,
       questions: questions.map((question, index) => ({ question: question.question, chosen: question.options[answers[index]], correct: question.options[question.correctIndex], explanation: question.explanation })),
     });
     setFeedback(result.data.feedback || []);
   } catch (err) {
     setFeedback([getApiError(err, 'Review missed concepts.'), 'Build a small working example.', 'Test and explain your implementation.']);
   } finally {
     setBusy(false);
   }
 }
 async function reviewSolution() {
   if (solution.trim().length < 40) { setMessage('Submit a meaningful solution or explanation.'); return; }
   setBusy(true);
   try {
     const result = await api.post('/api/job-coding-review', { role: title, task, answer: solution, description: description.slice(0, 4000) });
     setReview(result.data);
   } catch (err) {
     setMessage(getApiError(err, 'Review failed.'));
   } finally {
     setBusy(false);
   }
 }

 const tabs=[['analysis','Job analysis'],['gaps','Skill gaps'],['roadmap','Improvement plan'],['resume-actions','Resume actions'],['assessment','Verify skills'],['report','Readiness report']];
 const lab=(name:string)=>onNavigate(name==='HR Interview'?'interview':name==='AI Interview Room'?'live-interview':'verbal');
 return <section className="content job-readiness"><div className="page-header"><div><div className="section-eyebrow">JOB-SPECIFIC CAREER READINESS</div><h1>Job matching</h1><p>Understand a specific job, close the gaps and verify what you can demonstrate.</p></div></div>
 <div className="jr-input-grid"><div className="panel jr-input-panel"><div className="panel-heading"><div><h3>Target job</h3><p>Use the original employer posting where possible.</p></div><span className="required-label">Required</span></div><div className="field-grid"><label>Job title<input value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Company (optional)<input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company name"/></label></div><div className="jr-source-row"><label className="jr-url-field"><Link2 size={15}/><input value={url} onChange={e=>setUrl(e.target.value)} placeholder="Public HTTPS job posting URL"/><button className="btn-outline" onClick={()=>void importUrl()} disabled={busy}>Import URL</button></label><label className="jr-upload"><Upload size={15}/> Upload job PDF<input type="file" accept=".pdf,application/pdf" onChange={e=>{const f=e.target.files?.[0];if(f)void importPdf(f);e.currentTarget.value=''}}/></label>{pdfName&&<small>{pdfName}</small>}</div><label className="block-field">Job description<textarea className="job-description" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Paste responsibilities, required/preferred skills, qualifications and selection details…"/></label><div className="input-bottom"><span><FileText size={14}/> {description.trim().split(/\s+/).filter(Boolean).length} words</span><button className="btn-primary" onClick={()=>void analyse()} disabled={busy}>{busy?<LoaderCircle size={15}/>:<Sparkles size={15}/>} Analyse job & readiness</button></div><div className="inline-profile-note"><span>Using <b>{profile?.name||'your profile'}</b> · {profile?.skills?.length||0} listed skills</span><button onClick={onEditProfile}>Edit resume/profile</button></div></div>
 <div className="panel jr-profile-panel"><ShieldCheck size={22}/><h3>Evidence-first analysis</h3><p>Resume mentions are claims, not proof of proficiency. The report separates demonstrated evidence, claimed skills and information not found.</p><div className="jr-evidence-key"><span>● Demonstrated in supplied evidence</span><span>● Claimed, not verified</span><span>● Not found / needs verification</span></div><b>Profile used</b><small>{profile?.headline||'Candidate profile'} · {(profile?.projects||[]).length} projects</small></div></div>
 {message&&<div className="jr-message" role="status">{message}</div>}{!report&&<div className="match-hint"><div className="hint-icon"><Target size={19}/></div><div><b>Your job-specific report appears here</b><p>Paste, import a URL or upload a text-based PDF, then analyse against your current profile.</p></div></div>}
 {report&&<><div className="jr-tabs">{tabs.map(([id,label])=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}>{label}</button>)}</div>
 {tab==='analysis'&&<div className="jr-report"><div className="jr-score-grid"><div className="panel jr-section"><span>RESUME-TO-JOB MATCH</span><strong>{report.matchScore}/100</strong><p>{report.summary}</p></div><div className="panel jr-section"><span>JOB READINESS ESTIMATE</span><strong>{report.readinessScore}/100</strong><p>{report.readinessLabel}. Preparation estimate, not hiring probability.</p></div></div><div className="panel jr-section"><h3>Job requirements and evidence</h3><div className="jr-requirements">{report.requirements.map((r,i)=><article key={i}><b>{r.name}</b><small>{r.importance} · {r.evidence}</small><p>{r.reason}</p></article>)}</div></div><div className="panel jr-section"><h3>Readiness dimensions</h3><div className="jr-dimensions">{report.readinessDimensions.map(d=><article key={d.name}><b>{d.name} · {d.score}/100</b><div className="jr-bar"><i style={{width:d.score+'%'}}/></div><small>{d.status} · {d.detail}</small></article>)}</div></div></div>}
 {tab==='gaps'&&<div className="jr-report jr-three-grid"><div className="panel jr-section"><h3>Technical skill gaps</h3>{report.technicalGaps.map(g=><article className="jr-gap" key={g.skill}><b>{g.skill} · {g.priority}</b><p>{g.why}</p><small>Learn: {g.learningActivity}</small><small>Verify: {g.verification}</small><button className="btn-outline" onClick={()=>void testSkill(g.skill)}>Test this skill</button></article>)}</div><div className="panel jr-section"><h3>Communication gaps</h3>{report.communicationGaps.map(g=><article className="jr-gap" key={g.area}><b>{g.area}</b><p>{g.observation}</p><small>{g.practice}</small><button className="btn-outline" onClick={()=>lab(g.lab)}>{g.lab} <ArrowRight size={12}/></button></article>)}</div><div className="panel jr-section"><h3>Resume gaps</h3>{report.resumeGaps.map(g=><article className="jr-gap" key={g.gap}><b>{g.gap}</b><p>{g.impact}</p><small>{g.action}</small><button className="btn-outline" onClick={onEditProfile}>Review resume</button></article>)}</div></div>}
 {tab==='roadmap'&&<div className="jr-report"><div className="panel jr-section"><div className="panel-heading"><div><h3>Prioritised improvement plan</h3><p>Convert the highest-impact gaps into learning and evidence.</p></div><button className="btn-primary" onClick={()=>onBuildRoadmap(title,description)}>Generate detailed roadmap</button></div>{report.technicalGaps.slice(0,6).map((g,i)=><article className="jr-action" key={g.skill}><b>{i+1}. {g.skill}</b><p>{g.learningActivity}</p><small>Proof: {g.verification}</small><button className="btn-quiet" onClick={()=>void testSkill(g.skill)}>Verify</button></article>)}<h3>Learning resources</h3><div className="jr-resource-grid">{report.resources.map((r,i)=><a key={i} href={validUrl(r.url)||undefined} target="_blank" rel="noreferrer"><BookOpen size={14}/><span><b>{r.title}</b><small>{r.kind} · {r.forSkill}</small></span></a>)}</div></div><div className="panel jr-section"><h3>Job-relevant portfolio projects</h3>{report.projects.map((p,i)=><article className="jr-gap" key={i}><b>{p.title}</b><p>{p.objective}</p><small>Stack: {p.stack.join(' · ')}</small><small>Deliverables: {p.deliverables.join(' · ')}</small><small>Skills proved: {p.skillsProved.join(' · ')}</small></article>)}</div><div className="panel jr-section"><h3>Job-specific interview questions</h3>{report.interviewQuestions.map((q,i)=><article className="jr-gap" key={i}><small>{q.category}</small><b>{q.question}</b><p>Cover: {q.whatToCover}</p></article>)}</div></div>}
 {tab==='resume-actions'&&<div className="jr-report"><div className="panel jr-section"><div className="panel-heading"><div><h3>Resume actions for this job</h3><p>Prioritised edits grounded in your supplied evidence.</p></div><button className="btn-primary" onClick={()=>onNavigate('build-resume')}><FileText size={14}/> Open Resumate</button></div>{(report.resumeActions||[]).map((a:any,i:number)=><article className="jr-gap" key={i}><b>{i+1}. {a.priority} · {a.section}</b><p>{a.action}</p><small>Evidence: {a.evidence}</small><pre>{a.copyText}</pre><button className="btn-outline" onClick={()=>void navigator.clipboard?.writeText(a.copyText)}>Copy wording</button><small>Status: {a.status}</small></article>)}</div></div>}
 {tab==='assessment'&&<div className="jr-report"><div className="panel jr-section"><h3>Technical skill verification</h3><p>Scenario questions are one evidence point, not proof of mastery.</p>{report.technicalGaps.map(g=><button className="jr-skill-choice" key={g.skill} onClick={()=>void testSkill(g.skill)}>{g.skill} →</button>)}{questions.length>0&&<div className="jr-quiz"><h3>{skill} assessment</h3>{questions.map((q,i)=><article className="jr-mcq" key={i}><b>{i+1}. {q.question}</b>{q.options.map((o:string,j:number)=><label key={j}><input type="radio" name={'skill'+i} checked={answers[i]===j} disabled={!!quizResult} onChange={()=>setAnswers(v=>({...v,[i]:j}))}/>{o}</label>)}{quizResult&&<small>{q.explanation}</small>}</article>)}{!quizResult?<button className="btn-primary" onClick={()=>void submitQuiz()}>Submit assessment</button>:<div className="jr-result"><strong>{quizResult.score}% · {quizResult.correct}/{quizResult.total}</strong>{feedback.map((f,i)=><p key={i}>{f}</p>)}</div>}</div>}</div><div className="panel jr-section"><h3>Practical task review</h3><p>Static AI review only; it does not execute or test your code.</p><label className="block-field">Task<textarea value={task} onChange={e=>setTask(e.target.value)} placeholder="Paste a coding prompt or design task"/></label><label className="block-field">Your solution / explanation<textarea value={solution} onChange={e=>setSolution(e.target.value)} placeholder="Paste code and explain approach, complexity, tests and trade-offs"/></label><button className="btn-primary" onClick={()=>void reviewSolution()} disabled={busy}>Review practical response</button>{review&&<div className="jr-result"><strong>{review.score}/100</strong><p>{review.summary}</p>{(review.strengths||[]).map((x:string,i:number)=><p key={i}>+ {x}</p>)}{(review.improvements||[]).map((x:string,i:number)=><p key={i}>Improve: {x}</p>)}</div>}</div><div className="panel jr-section"><h3>Communication verification</h3><p>Spoken ability cannot be diagnosed from resume text. Complete a live exercise.</p><button className="btn-outline" onClick={()=>lab('Communication Lab')}><MessageSquareText size={14}/> Communication Lab</button><button className="btn-outline" onClick={()=>lab('HR Interview')}>HR Interview practice</button></div></div>}
 {tab==='report'&&<div className="jr-report"><div className="panel jr-final-report"><span>JOB-SPECIFIC READINESS</span><strong>{report.readinessScore}/100</strong><h2>{report.readinessLabel}</h2><p>{report.summary}</p></div><div className="panel jr-section"><h3>Before you apply or interview</h3>{report.recommendations.map((r,i)=><article className="jr-action" key={i}><b>{i+1}. {r}</b></article>)}<p className="jr-disclaimer">This is not a hiring prediction. Do not delay every application until an arbitrary score is high.</p></div></div>}</>}
 </section>;
}