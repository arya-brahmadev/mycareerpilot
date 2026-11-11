import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@appdeploy/client';
import { ArrowRight, BookOpen, CheckCircle2, Filter, LoaderCircle, Mic, Search, Sparkles, Square, Target } from 'lucide-react';
import './HRInterview.css';

type Q = { id: string; category: string; prompt: string; focus: string; source?: string };
type Profile = { name?: string; headline?: string; skills?: string[]; education?: string[]; projects?: string[]; experience?: string[]; summary?: string };
type Review = { overallScore: number; summary: string; dimensions: {name:string;score:number;feedback:string}[]; strengths:string[]; improvements:string[]; revisedAnswer:string };
const BANK: {category:string;description:string;items:[string,string][]}[] = [
{category:'Personal introduction',description:'Your story and first impression',items:[
['Tell me about yourself.','A concise, relevant professional introduction'],['Walk me through your background.','How your experiences connect to this opportunity'],['What should I know about you that is not on your resume?','Relevant context beyond the document'],['How would your friends or colleagues describe you?','Self-awareness supported by evidence']]},
{category:'Education and academics',description:'Your choices, learning and academic record',items:[
['Why did you choose your degree and college?','Intentional choices and genuine motivation'],['Which subject did you find most challenging, and how did you handle it?','Learning approach and persistence'],['How has your education prepared you for this role?','Connecting study to workplace needs'],['Can you explain a low grade, backlog or gap in your academic record?','Honesty, ownership and improvement']]},
{category:'Strengths and weaknesses',description:'Self-awareness and growth',items:[
['What are your greatest strengths?','Relevant strengths with specific evidence'],['What is your biggest weakness?','A real development area and concrete action'],['What feedback have you received more than once?','Openness to feedback and follow-through'],['What is one habit you are actively trying to change?','Self-awareness and measurable progress']]},
{category:'Career goals and motivation',description:'Direction, ambition and professional purpose',items:[
['Where do you see yourself in five years?','Realistic direction and willingness to grow'],['What are your short-term and long-term career goals?','A credible plan connected to the role'],['What motivates you to do your best work?','Sustainable sources of motivation'],['What does career success mean to you?','Your definition of meaningful progress']]},
{category:'Company and job motivation',description:'Why this employer, role and industry',items:[
['Why do you want to join our company?','Specific research and genuine alignment'],['Why are you interested in this position?','Understanding of role responsibilities'],['What do you know about our products, services or customers?','Preparation and business awareness'],['Why should we hire you over other candidates?','Evidence-based value, not empty confidence']]},
{category:'Behavioural and situational',description:'How you act when something happens',items:[
['Tell me about a time you faced a difficult challenge.','Problem solving, ownership and outcome'],['Describe a situation where you made a mistake. What did you do next?','Accountability and corrective action'],['Tell me about a time you had to meet a tight deadline.','Prioritisation and execution under pressure'],['Describe a time you received critical feedback and acted on it.','Coachability and visible change']]},
{category:'Teamwork and collaboration',description:'Working effectively with different people',items:[
['Tell me about a time you worked with a difficult teammate.','Professional conflict resolution'],['What would you do if a team member was not contributing?','Constructive communication and escalation'],['Describe a disagreement within a team and how it was resolved.','Listening, evidence and compromise'],['Do you prefer working independently or in a team?','Adaptability and understanding of the work']]},
{category:'Leadership and ownership',description:'Initiative, responsibility and influence',items:[
['Tell me about a time you took initiative without being asked.','Proactive ownership and impact'],['How do you motivate a team that is losing momentum?','Practical leadership and empathy'],['Describe a time you were responsible for a team outcome.','Accountability beyond individual tasks'],['How would you handle a team member taking credit for your work?','Assertiveness and professional resolution']]},
{category:'Communication and interpersonal skills',description:'Clarity, listening and professional interaction',items:[
['How would you explain a complex idea to someone without a technical background?','Audience-aware communication'],['How do you handle misunderstandings at work?','Clarification and respectful resolution'],['Tell me about a time you had to persuade someone.','Reasoning, listening and influence'],['What do you do when you do not understand an instruction?','Asking useful questions before acting']]},
{category:'Adaptability and learning',description:'Handling change and learning unfamiliar things',items:[
['Tell me about something you learned independently.','Learning strategy and application'],['What would you do if you were assigned work outside your expertise?','Resourcefulness and sensible escalation'],['Describe a time plans changed unexpectedly. How did you respond?','Flexibility without losing priorities'],['How do you stay current in your field?','A consistent learning habit']]},
{category:'Work ethic and professionalism',description:'Reliability, discipline and accountability',items:[
['How do you prioritise when several tasks are urgent?','Judgement, communication and planning'],['What does professionalism mean to you?','Practical workplace behaviours'],['What would you do if you finished your work before the deadline?','Initiative and team awareness'],['How do you stay focused when work becomes repetitive?','Consistency and quality control']]},
{category:'Failure, rejection and criticism',description:'Resilience and lessons learned',items:[
['Tell me about a failure that taught you something important.','Honest reflection and learning'],['How do you handle rejection?','Emotional recovery and constructive next steps'],['Describe a goal you did not achieve.','Ownership without excuses'],['How do you respond when your work is not recognised?','Professional maturity and communication']]},
{category:'Salary and job expectations',description:'Practical expectations and availability',items:[
['What are your salary expectations?','Research, flexibility and realistic expectations'],['Are you willing to relocate or work from the office?','Clear and honest constraints'],['Are you comfortable working in shifts or travelling when required?','Understanding actual job conditions'],['When would you be available to join?','Accurate availability and commitments']]},
{category:'Ethics and workplace integrity',description:'Judgement, trust and responsible conduct',items:[
['What would you do if your manager asked you to do something unethical?','Principled judgement and appropriate escalation'],['How would you handle confidential company information?','Trust and information security'],['What would you do if you noticed a colleague violating company policy?','Proportionate action and reporting'],['Would you admit a mistake if nobody else had noticed it?','Integrity and accountability']]},
{category:'Fresher and campus placement',description:'Transitioning from college to a first job',items:[
['Why should we hire a fresher instead of an experienced candidate?','Potential, evidence and learning agility'],['You do not have corporate experience. Why should we trust you?','Transferable evidence from projects and responsibilities'],['How have you prepared for campus placements?','Consistency and practical preparation'],['How would you adapt to your first corporate environment?','Learning, feedback and professional conduct']]},
{category:'Resume and project discussion',description:'Defending the details you have claimed',items:[
['Walk me through the project you are most proud of.','Ownership, decisions, challenges and outcomes'],['What was your individual contribution to your team project?','Specific personal work versus team output'],['What would you improve if you rebuilt that project?','Reflection and technical or process judgement'],['Which skill on your resume are you strongest in, and how have you demonstrated it?','Evidence behind a stated skill']]},
{category:'Tricky and pressure questions',description:'Composure when questions are uncomfortable',items:[
['Why should we not hire you?','Honest self-assessment without self-sabotage'],['Convince me to hire you in 30 seconds.','A concise, evidence-led value proposition'],['What would you do if you were not selected?','Perspective and constructive response'],['What question were you hoping I would not ask?','Composure and thoughtful honesty']]},
{category:'Questions to ask the interviewer',description:'Questions that help you assess the opportunity',items:[
['What does success look like in this role during the first six months?','Understanding expectations and outcomes'],['What are the biggest challenges someone in this role will face?','Realistic understanding of the work'],['How is performance evaluated and feedback delivered?','Growth, accountability and management style'],['What are the next steps in the selection process?','Professional close and process clarity']]}
];
const BASE: Q[] = BANK.flatMap((g, gi) => g.items.map((item, i) => ({id:'base-'+gi+'-'+i,category:g.category,prompt:item[0],focus:item[1]})));

export default function HRInterview({profile,resumeText}:{profile:Profile;resumeText:string}) {
 const [category,setCategory]=useState('All categories');
 const [query,setQuery]=useState('');
 const [experience,setExperience]=useState('Fresher / Student');
 const [role,setRole]=useState('Software Engineer');
 const [selectedId,setSelectedId]=useState(BASE[0].id);
 const [answer,setAnswer]=useState('');
 const [answerMode,setAnswerMode]=useState<'write'|'speak'>('write');
 const [active,setActive]=useState(false);
 const [listening,setListening]=useState(false);
 const [audioSupported,setAudioSupported]=useState(true);
 const [transcribing,setTranscribing]=useState(false);
 const mediaRecorderRef=useRef<MediaRecorder|null>(null);
 const audioChunksRef=useRef<Blob[]>([]);
 const audioStreamRef=useRef<MediaStream|null>(null);
 const finalTranscriptRef=useRef('');
 const [review,setReview]=useState<Review|null>(null);
 const [saveNotice,setSaveNotice]=useState('');
 const [generated,setGenerated]=useState<Q[]>([]);
 const [busy,setBusy]=useState(false);
 const [generating,setGenerating]=useState(false);
 const [errorMessage,setErrorMessage]=useState('');
 const questions=useMemo(()=>[...BASE,...generated].filter(q=>(category==='All categories'||q.category===category)&&(!query.trim()||(q.prompt+' '+q.category+' '+q.focus).toLowerCase().includes(query.toLowerCase()))),[category,query,generated]);
 const selected=questions.find(q=>q.id===selectedId)||questions[0]||BASE[0];
 const words=answer.trim()?answer.trim().split(/\s+/).length:0;
 const behavioural=/behavioural|teamwork|leadership|failure/i.test(selected.category);
 useEffect(()=>{
  setAudioSupported(Boolean(navigator.mediaDevices?.getUserMedia&&typeof MediaRecorder!=='undefined'));
  return()=>{
   try{mediaRecorderRef.current?.stop();}catch{/* recorder may already be stopped */}
   audioStreamRef.current?.getTracks().forEach(track=>track.stop());
  };
 },[]);
 function stopSpeaking(){
  const recorder=mediaRecorderRef.current;
  if(recorder&&recorder.state!=='inactive'){
   try{recorder.stop();}catch{/* recorder may already be stopped */}
  }
  setListening(false);
 }
 function stopSession(){
  setActive(false);
  stopSpeaking();
 }
 function startSession(){
  setAnswer('');
  finalTranscriptRef.current='';
  setReview(null);
  setErrorMessage('');
  setActive(true);
 }
 async function transcribeRecording(blob:Blob,mimeType:string){
  if(!blob.size){setErrorMessage('No audio was captured. Check your microphone and try again.');return;}
  if(blob.size>1400000){setErrorMessage('This recording is too large to transcribe. Please record a shorter answer (under about 75 seconds) and try again.');return;}
  setTranscribing(true);
  setErrorMessage('');
  try{
   const dataUrl=await new Promise<string>((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>typeof reader.result==='string'?resolve(reader.result):reject(new Error('Audio conversion failed'));
    reader.onerror=()=>reject(new Error('Audio conversion failed'));
    reader.readAsDataURL(blob);
   });
   const audioData=dataUrl.split(',')[1]||'';
   if(!audioData)throw new Error('Audio conversion failed');
   const response=await api.post('/api/hr-transcribe',{audioData,mimeType});
   const transcript=String(response.data?.transcript||'').trim();
   if(!transcript)throw new Error('The transcription service returned an empty transcript');
   setAnswer(previous=>{
    const combined=previous.trim()?previous.trim()+' '+transcript:transcript;
    finalTranscriptRef.current=combined;
    return combined;
   });
   setReview(null);
   const uncertain=Array.isArray(response.data?.uncertainPhrases)?response.data.uncertainPhrases.filter((v:unknown)=>typeof v==='string'&&v.trim()).slice(0,5):[];
   if(uncertain.length)setErrorMessage('Please double-check these possibly unclear words or phrases in the transcript: '+uncertain.join('; '));
  }catch{
   setErrorMessage('AI transcription could not process this recording. Your recording was not added to the answer; please try again or type your response.');
  }finally{setTranscribing(false);}
 }
 async function startRecording(){
  if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){
   setAudioSupported(false);
   setErrorMessage('Audio recording is not supported in this browser. Use the latest Chrome or Edge over HTTPS, or choose Write answer.');
   return;
  }
  try{
   setErrorMessage('');
   setReview(null);
   const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
   audioStreamRef.current=stream;
   const candidates=['audio/webm;codecs=opus','audio/webm','audio/mp4'];
   const mimeType=candidates.find(type=>MediaRecorder.isTypeSupported(type))||'';
   const recorder=mimeType?new MediaRecorder(stream,{mimeType,audioBitsPerSecond:32000}):new MediaRecorder(stream,{audioBitsPerSecond:32000});
   audioChunksRef.current=[];
   recorder.ondataavailable=(event)=>{if(event.data&&event.data.size)audioChunksRef.current.push(event.data);};
   recorder.onerror=()=>{
    setListening(false);setActive(false);
    stream.getTracks().forEach(track=>track.stop());
    setErrorMessage('Audio recording stopped unexpectedly. Check microphone permissions and try again.');
   };
   recorder.onstop=()=>{
    const actualType=recorder.mimeType||mimeType||'audio/webm';
    const blob=new Blob(audioChunksRef.current,{type:actualType});
    audioChunksRef.current=[];
    stream.getTracks().forEach(track=>track.stop());
    audioStreamRef.current=null;
    mediaRecorderRef.current=null;
    setListening(false);
    setActive(false);
    void transcribeRecording(blob,actualType.split(';')[0]);
   };
   mediaRecorderRef.current=recorder;
   recorder.start(1000);
   setActive(true);
   setListening(true);
  }catch(error){
   audioStreamRef.current?.getTracks().forEach(track=>track.stop());
   audioStreamRef.current=null;
   setListening(false);setActive(false);
   const name=(error as DOMException)?.name;
   setErrorMessage(name==='NotAllowedError'||name==='PermissionDeniedError'
    ?'Microphone access was blocked. Click the site controls beside the address bar, set Microphone to Allow, then try again.'
    :name==='NotFoundError'
    ?'No microphone was found. Connect or enable a microphone, then retry.'
    :'Could not start audio recording. Check your microphone and browser permissions.');
  }
 }
 function toggleMicrophone(){
  if(listening){stopSpeaking();return;}
  void startRecording();
 }
 function changeCategory(next:string){stopSession();setCategory(next);const first=[...BASE,...generated].find(q=>next==='All categories'||q.category===next);if(first)setSelectedId(first.id);setAnswer('');setReview(null);}
 async function generateMore(){
  setGenerating(true);setErrorMessage('');
  try{const response=await api.post('/api/hr-question-variations',{category:selected.category,targetRole:role,experience,resumeText:resumeText.slice(0,5500),profile});const next=(response.data?.questions||[]).map((v:any,i:number)=>({id:'ai-'+Date.now()+'-'+i,category:selected.category,prompt:String(v.question||''),focus:String(v.whatItTests||'Role-relevant judgement and communication'),source:'ai'})).filter((v:Q)=>v.prompt);if(!next.length)throw new Error('Empty question list');setGenerated(old=>[...next,...old]);setSelectedId(next[0].id);setAnswer('');setReview(null);}
  catch{setErrorMessage('Could not generate tailored questions right now. Your question library is still available; please retry.');}finally{setGenerating(false);}
 }
 async function evaluate(){
  if(answer.trim().length<25){setErrorMessage('Give a few complete sentences before requesting feedback.');return;}
  stopSession();setBusy(true);setReview(null);setErrorMessage('');
  try{const response=await api.post('/api/hr-interview-assess',{question:selected.prompt,category:selected.category,answer,targetRole:role,experience,profile,resumeText:resumeText.slice(0,5500)});setReview(response.data);setSaveNotice('Saving evaluation to your account…');try{await api.post('/api/interview-attempts',{attemptId:'hr-'+(typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2,10)),source:'hr_interview',interviewType:'HR',targetRole:role,overallScore:response.data.overallScore,dimensions:response.data.dimensions,strengths:response.data.strengths,improvements:response.data.improvements,question:selected.prompt,answer,category:selected.category,answerMode,completedAt:new Date().toISOString()});setSaveNotice('Evaluation saved to your account.');}catch{setSaveNotice('Evaluation is ready, but cloud saving failed. Your feedback remains visible; retry by evaluating again.');}}
  catch{setErrorMessage('The answer could not be assessed right now. Your draft is still on this screen; please retry.');}finally{setBusy(false);}
 }
 return <section className="content hr-interview-page">
  <div className="hr-hero"><div><span className="section-eyebrow">CAREERPILOT · INTERVIEW PREPARATION</span><h1>HR Interview Preparation</h1><p>Practise the questions recruiters ask, understand what they evaluate, and improve your answers with structured AI feedback.</p><div className="hr-hero-stats"><span><b>18</b> categories</span><span><b>72+</b> curated questions</span><span><b>AI</b> answer review</span></div></div><div className="hr-hero-mark"><BookOpen size={32}/><span>Be prepared.<br/>Be specific.</span></div></div>
  <div className="hr-context panel"><div className="hr-context-heading"><div><b>Personalise your practice</b><p>Choose a target role and experience level.</p></div><Filter size={18}/></div><div className="hr-context-fields"><label>Target role<input value={role} onChange={e=>setRole(e.target.value)} placeholder="e.g. Graduate Software Engineer"/></label><label>Candidate level<select value={experience} onChange={e=>setExperience(e.target.value)}><option>Fresher / Student</option><option>0–2 years</option><option>3–5 years</option><option>6+ years</option></select></label><div className="hr-resume-context"><CheckCircle2 size={15}/><span>{resumeText.trim()?'Saved resume context will be used for tailored questions.':'Add a resume in Build Resume to enable resume-based tailoring.'}</span></div></div></div>
  <div className="hr-workspace"><aside className="hr-library panel"><div className="hr-library-head"><div><span className="section-eyebrow">QUESTION LIBRARY</span><h2>Explore questions</h2></div><span className="hr-count">{BASE.length+generated.length}</span></div><label className="hr-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search questions..."/></label><label className="hr-category-select">Category<select value={category} onChange={e=>changeCategory(e.target.value)}><option>All categories</option>{BANK.map(g=><option key={g.category}>{g.category}</option>)}</select></label><div className="hr-category-list">{BANK.map(g=><button key={g.category} className={category===g.category?'active':''} onClick={()=>changeCategory(g.category)}><span>{g.category}</span><small>{g.items.length+generated.filter(q=>q.category===g.category).length}</small></button>)}</div><div className="hr-question-list">{questions.map((q,i)=><button key={q.id} className={selected.id===q.id?'selected':''} onClick={()=>{stopSession();setSelectedId(q.id);setAnswer('');setReview(null);}}><span>Q{i+1}</span><b>{q.prompt}</b>{q.source&&<em>AI</em>}</button>)}{!questions.length&&<p className="hr-empty">No questions match this search.</p>}</div></aside>
   <div className="hr-practice-column"><div className="hr-question-card panel"><div className="hr-question-meta"><span>{selected.category}</span>{selected.source&&<span className="hr-ai-tag">AI generated</span>}</div><span className="section-eyebrow">INTERVIEW QUESTION</span><h2>{selected.prompt}</h2><div className="hr-tests"><Target size={16}/><div><b>What the interviewer is evaluating</b><p>{selected.focus}</p></div></div><div className="hr-framework"><b>Before you answer: what the interviewer wants</b>{behavioural?<div className="hr-framework-steps"><span><b>S</b> Situation</span><span><b>T</b> Task</span><span><b>A</b> Action</span><span><b>R</b> Result</span></div>:<p>Start with a direct response → explain your reasoning → support it with a real example → connect it to the role. Keep it natural rather than memorised.</p>}<small>Use real experiences. College projects, volunteering and personal responsibilities can be valid examples for freshers. The focus above explains what evidence the interviewer is listening for.</small></div>
    <div className="hr-mode-switch"><b>How would you like to answer?</b><div><button className={answerMode==='write'?'active':''} onClick={()=>{stopSession();setAnswerMode('write');setErrorMessage('');}}><BookOpen size={15}/> Write answer</button><button className={answerMode==='speak'?'active':''} onClick={()=>{stopSession();setAnswerMode('speak');setErrorMessage('');}}><Mic size={15}/> Speak answer</button></div></div>
    <div className="hr-answer-area"><div className="hr-answer-label"><label htmlFor="hr-answer">{answerMode==='write'?'YOUR WRITTEN ANSWER':'YOUR SPOKEN ANSWER · TRANSCRIPT'}</label><span>{words} words</span></div>
    {answerMode==='write'?<textarea id="hr-answer" value={answer} onChange={e=>{setAnswer(e.target.value);setReview(null);}} placeholder="Write the answer as you would say it in an interview. Use a specific example where possible..."/>:
     <div className="hr-speech-panel">
      <div className="hr-speech-session-head"><div><b>{transcribing?'TRANSCRIBING AUDIO':listening?'RECORDING AUDIO':active?'SESSION READY':'READY TO PRACTISE'}</b><span>{transcribing?'AI is converting your recording into an editable transcript.':listening?'Recording your answer. Click Stop microphone when you finish.':active?'Recording stopped. Your transcript will appear after AI processing.':'Click Use microphone to record your answer.'}</span></div><span className={listening?'hr-session-live':''}>{transcribing?'PROCESSING':listening?'RECORDING':active?'PAUSED':'READY'}</span></div>
      <div className="hr-speech-primary-controls">
       <button type="button" className="hr-use-microphone" onClick={toggleMicrophone} disabled={busy||transcribing||!audioSupported}>{transcribing?'Transcribing…':listening?'Stop microphone':'Use microphone'}</button>
       {active&&<button type="button" className="hr-start-session" onClick={stopSession}>End session</button>}
      </div>
      <textarea id="hr-answer" value={answer} onChange={e=>{setAnswer(e.target.value);finalTranscriptRef.current=e.target.value;setReview(null);}} placeholder="Your spoken words will appear here when microphone recognition is active. You can also type or edit your answer..." />
      <p>Your recording is sent securely to AI speech transcription after you stop. Review and correct the transcript before submitting it for interview feedback.</p>
      <small>Use a quiet environment and speak naturally. Recordings are limited to about 75 seconds per take. AI transcription can still make mistakes, so review names, numbers and technical terms.</small>
     </div>}
    <div className="hr-answer-actions"><button className="btn-outline" onClick={()=>{stopSession();setAnswer('');finalTranscriptRef.current='';setReview(null);}}>Clear answer</button><button className="btn-primary" disabled={busy||transcribing||active||answer.trim().length<25||listening} onClick={()=>void evaluate()}>{busy?<LoaderCircle size={15} className="spin"/>:<Sparkles size={15}/>} Evaluate my {answerMode==='write'?'written':'spoken'} answer</button></div></div>{errorMessage&&<p className="hr-error">{errorMessage}</p>}
   </div>
   <div className="hr-ai-tools panel"><div><span className="section-eyebrow">PERSONALISED PRACTICE</span><h3>Need more questions for this topic?</h3><p>Generate fresh variations tailored to your target role, experience level and saved resume context.</p></div><button className="btn-outline" disabled={generating} onClick={()=>void generateMore()}>{generating?<LoaderCircle size={15} className="spin"/>:<Sparkles size={15}/>} Generate 5 tailored questions <ArrowRight size={14}/></button></div>
   {review&&<div className="hr-assessment panel"><div className="hr-assessment-top"><div><span className="section-eyebrow">AI ANSWER REVIEW</span><h2>Your feedback</h2><p>{review.summary}</p></div><div className="hr-score"><b>{review.overallScore}</b><span>/100</span></div></div><div className="hr-dimensions">{review.dimensions.map(d=><div key={d.name}><div><b>{d.name}</b><strong>{d.score}/100</strong></div><div className="hr-score-track"><span style={{width:d.score+'%'}}/></div><p>{d.feedback}</p></div>)}</div><div className="hr-feedback-grid"><div><h3><CheckCircle2 size={16}/> What worked</h3>{review.strengths.map((s,i)=><p key={i}>• {s}</p>)}</div><div><h3><Target size={16}/> What to improve</h3>{review.improvements.map((s,i)=><p key={i}>• {s}</p>)}</div></div><div className="hr-rewrite"><b>Suggested answer structure</b><p>{review.revisedAnswer}</p><small>This is a coaching example, not a script. Replace prompts with details that are true for you.</small></div><button className="btn-outline" onClick={()=>{setReview(null);setAnswer('');}}>Practise this question again</button></div>}</div>
  {saveNotice&&<p className="hr-integrity-note">{saveNotice}</p>}
  </div><div className="hr-integrity-note"><CheckCircle2 size={15}/><span>AI feedback evaluates your written answer or speech transcript, not your personality or hiring suitability. AI transcription may still mishear words; review the transcript before submitting. The app does not assess acoustic pronunciation, accent or tone. This feature does not measure pronunciation, tone or accent. Scores are practice guidance, not a prediction of an employer decision.</span></div>
 </section>;
}
