import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@appdeploy/client';
import { ArrowRight, BookOpen, CheckCircle2, Clock3, LoaderCircle, Mic, MicOff, RotateCcw, Sparkles, Target, Volume2 } from 'lucide-react';
import './ReadingLab.css';

type Question = { question: string; options: string[]; correctIndex: number; explanation: string };
type VocabularyItem = { word: string; meaning: string; example: string };
type Passage = { title: string; passage: string; questions?: Question[]; vocabulary?: VocabularyItem[]; source?: string };

function splitPassageParagraphs(text: string): string[] {
  const existing = text.split(/\n\s*\n/).map(part => part.trim()).filter(Boolean);
  if (existing.length >= 3) return existing;
  const sentences = text.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(part => part.trim()).filter(Boolean) || [text.trim()];
  if (sentences.length < 3) return existing.length ? existing : [text.trim()];
  const paragraphCount = Math.min(5, Math.max(3, Math.ceil(sentences.length / 4)));
  const perParagraph = Math.ceil(sentences.length / paragraphCount);
  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += perParagraph) paragraphs.push(sentences.slice(i, i + perParagraph).join(' '));
  return paragraphs.length >= 3 ? paragraphs : [sentences.slice(0, 2).join(' '), sentences.slice(2, 4).join(' '), sentences.slice(4).join(' ')].filter(Boolean);
}

function VocabularySection({ items }: { items: VocabularyItem[] }) {
  if (!items.length) return null;
  return <section className="panel reading-vocabulary"><span className="reading-kicker">BUILD YOUR VOCABULARY</span><h3>Useful words from this passage</h3><div className="reading-vocabulary-grid">{items.map((item, index) => <article className="reading-vocabulary-item" key={item.word + index}><b>{item.word}</b><p>{item.meaning}</p><small>Example: {item.example}</small></article>)}</div></section>;
}
type ReadingReport = { overallScore: number; summary: string; dimensions: { name: string; score: number; feedback: string }[]; strengths: string[]; improvements: string[]; practiceTips: string[] };

export default function ReadingLab() {
  const [mode,setMode] = useState<'comprehension'|'aloud'|null>(null);
  const [stage,setStage] = useState<'setup'|'instructions'|'active'|'results'>('setup');
  const [busy,setBusy] = useState(false); const [error,setError] = useState('');
  const [passage,setPassage] = useState<Passage|null>(null);
  const [answers,setAnswers] = useState<Record<number,number>>({});
  const [score,setScore] = useState(0); const [remaining,setRemaining] = useState(600);
  const [duration,setDuration] = useState(1); const [transcript,setTranscript] = useState('');
  const [comprehensionDifficulty,setComprehensionDifficulty] = useState('Intermediate');
  const [aloudDifficulty,setAloudDifficulty] = useState('Intermediate');
  const [recognitionLanguage,setRecognitionLanguage] = useState('en-IN');
  const [micActive,setMicActive] = useState(false); const [micMessage,setMicMessage] = useState('');
  const [report,setReport] = useState<ReadingReport|null>(null); const [elapsed,setElapsed] = useState(0);
  const recognitionRef = useRef<any>(null); const startedAtRef = useRef(0);
  const questions = passage?.questions || [];
  const wordCount = useMemo(()=>transcript.trim()?transcript.trim().split(/\s+/).length:0,[transcript]);

  const reset = () => { if(recognitionRef.current){try{recognitionRef.current.stop();}catch{}} recognitionRef.current=null;setMicActive(false);setMicMessage('');setError('');setPassage(null);setAnswers({});setTranscript('');setReport(null);setScore(0);setElapsed(0);setRemaining(600);setStage('setup');setMode(null); };
  const generate = async (nextMode:'comprehension'|'aloud') => {
    setBusy(true);setError('');setMode(nextMode);
    try { const topics=['AI and human judgement','climate adaptation and global warming','wildlife conservation and biodiversity','ethics, honesty and humanity','technology and positive social impact','teamwork and leadership in the workplace','critical thinking and online information','science and cleaner energy','professional communication and decision-making'];const topic=topics[Math.floor(Math.random()*topics.length)];const difficulty=nextMode==='aloud'?aloudDifficulty:comprehensionDifficulty;const result=await api.post('/api/reading-generate',{mode:nextMode,duration:nextMode==='aloud'?duration:10,topic,difficulty});const data=result.data as Passage;
      if(!data?.passage||(nextMode==='comprehension'&&(!Array.isArray(data.questions)||data.questions.length!==5||data.questions.some(q=>!q.question||!Array.isArray(q.options)||q.options.length!==4))) )throw new Error('The exercise was incomplete. Please generate it again.');
      setPassage(data);setAnswers({});setTranscript('');setReport(null);setRemaining(600);setElapsed(0);setStage('instructions');
    } catch(e){setError(e instanceof Error?e.message:'Could not prepare the exercise. Please retry.');} finally{setBusy(false);}
  };
  const finishComprehension = () => { if(stage!=='active')return;setScore(questions.reduce((sum,q,i)=>sum+(answers[i]===q.correctIndex?1:0),0));setStage('results'); };
  useEffect(()=>{if(stage!=='active'||mode!=='comprehension')return;const timer=window.setInterval(()=>setRemaining(v=>Math.max(0,v-1)),1000);return()=>window.clearInterval(timer);},[stage,mode]);
  useEffect(()=>{if(stage==='active'&&mode==='comprehension'&&remaining===0)finishComprehension();},[remaining,stage,mode]);
  useEffect(()=>{if(stage!=='active'||mode!=='aloud')return;const timer=window.setInterval(()=>setElapsed(Math.floor((Date.now()-startedAtRef.current)/1000)),500);return()=>window.clearInterval(timer);},[stage,mode]);

  const startRecognition = () => {
    const Ctor=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
    if(!Ctor){setMicMessage('Speech recognition is not supported in this browser. Try the latest Chrome or Edge, or type your transcript below.');return;}
    try { const rec=new Ctor();rec.lang=recognitionLanguage;rec.continuous=true;rec.interimResults=true;
      rec.onresult=(event:any)=>{let finalText='';let interim='';const firstNewResult=Number.isInteger(event.resultIndex)?event.resultIndex:Math.max(0,event.results.length-1);for(let i=firstNewResult;i<event.results.length;i++){const result=event.results[i];const part=result?.[0]?.transcript||'';if(result?.isFinal)finalText+=part+' ';else interim+=part;}
        if(finalText.trim())setTranscript(current=>(current.trim()?current.trim()+' ':'')+finalText.trim());
        setMicMessage(interim?'Listening… '+interim.slice(0,90):(finalText?'Words captured. Continue reading…':'Listening…'));
      };
      rec.onerror=(event:any)=>{setMicMessage(event.error==='not-allowed'?'Microphone permission was denied. Allow microphone access in browser settings.':event.error==='no-speech'?'No speech was detected. Check your microphone and restart recognition.':'Speech recognition paused ('+(event.error||'unknown error')+'). Restart it or type the transcript.');setMicActive(false);};
      rec.onend=()=>{setMicActive(false);if(recognitionRef.current===rec)setMicMessage(current=>current.startsWith('Listening')?'Recognition stopped. Restart the microphone if you have more to read.':current);};recognitionRef.current=rec;rec.start();setMicActive(true);setMicMessage('Microphone is listening. Read the displayed text at a natural pace.');
    } catch {setMicMessage('Could not start the microphone. Check browser permissions and try again.');setMicActive(false);}
  };
  const stopRecognition=()=>{if(recognitionRef.current){try{recognitionRef.current.stop();}catch{}}setMicActive(false);setMicMessage('Microphone stopped. Review the recognised words before submitting.');};
  const startAloud=()=>{setTranscript('');setElapsed(0);startedAtRef.current=Date.now();setStage('active');setMicMessage('Press Start microphone when you are ready to read aloud.');};
  const submitAloud=async()=>{
    if(recognitionRef.current)stopRecognition();
    if(transcript.trim().length<8){setError('No clear reading transcript was captured. Start the microphone and read the passage, or type what you read.');return;}
    setBusy(true);setError('');
    try{const seconds=Math.max(1,elapsed||Math.floor((Date.now()-startedAtRef.current)/1000));const result=await api.post('/api/reading-assessment',{passage:passage?.passage||'',transcript:transcript.trim(),durationSeconds:seconds,allottedMinutes:duration});setReport(result.data as ReadingReport);setStage('results');}
    catch{setError('The reading assessment could not be generated. Your transcript is still here; please retry.');}finally{setBusy(false);}
  };
  const startComprehension=()=>{setRemaining(600);setStage('active');};

  return <section className="content reading-lab-page">
    <div className="reading-heading"><div><span className="reading-eyebrow">VERBAL · READING PRACTICE</span><h1>Reading Lab</h1><p>Improve comprehension and read-aloud confidence through timed exercises and practical feedback.</p></div><div className="reading-heading-icon"><BookOpen size={23}/></div></div>
    {stage==='setup'&&<>
      <div className="reading-mode-grid">
        <button className="reading-mode-card" disabled={busy} onClick={()=>setMode('comprehension')}><span className="reading-mode-icon"><BookOpen size={22}/></span><span className="reading-kicker">EXERCISE 01</span><h2>Unseen Passage</h2><p>Read a fresh passage, answer five multiple-choice questions and check your comprehension.</p><b>Set difficulty <ArrowRight size={15}/></b></button>
        <button className="reading-mode-card" onClick={()=>setMode('aloud')}><span className="reading-mode-icon"><Volume2 size={22}/></span><span className="reading-kicker">EXERCISE 02</span><h2>Read Out Loud</h2><p>Practise reading a prepared sentence or passage with microphone-based transcript feedback.</p><b>Set reading duration <ArrowRight size={15}/></b></button>
      </div>
      {mode==='comprehension'&&<div className="panel reading-setup"><span className="reading-kicker">CHOOSE YOUR LEVEL</span><h2>Comprehension difficulty</h2><p>Choose the vocabulary and complexity that suit your current reading level.</p><label className="reading-difficulty-label">Difficulty<select value={comprehensionDifficulty} onChange={e=>setComprehensionDifficulty(e.target.value)}><option>Easy</option><option>Intermediate</option><option>Advanced</option></select></label><div className="reading-setup-actions"><button className="btn-outline" onClick={()=>setMode(null)}>Back</button><button className="btn-primary" disabled={busy} onClick={()=>void generate('comprehension')}>{busy?<><LoaderCircle size={14}/> Preparing…</>:<><Sparkles size={14}/> Generate unseen passage</>}</button></div></div>}
      {mode==='aloud'&&<div className="panel reading-setup"><span className="reading-kicker">CHOOSE YOUR PRACTICE</span><h2>Read-aloud settings</h2><label className="reading-difficulty-label">Difficulty<select value={aloudDifficulty} onChange={e=>setAloudDifficulty(e.target.value)}><option>Easy</option><option>Intermediate</option><option>Advanced</option></select></label><p>How long would you like to read? Shorter sessions use a shorter passage; longer sessions use a fuller passage.</p><div className="reading-duration-options">{[1,2,3,4,5].map(n=><button key={n} className={duration===n?'active':''} onClick={()=>setDuration(n)}>{n}<small>min</small></button>)}</div><div className="reading-setup-actions"><button className="btn-outline" onClick={()=>setMode(null)}>Back</button><button className="btn-primary" disabled={busy} onClick={()=>void generate('aloud')}>{busy?<><LoaderCircle size={14}/> Preparing…</>:<><Sparkles size={14}/> Generate reading passage</>}</button></div></div>}
      {error&&<p className="reading-error">{error}</p>}
    </>}
    {stage==='instructions'&&passage&&<div className="panel reading-instructions"><span className="reading-kicker">EXERCISE READY</span><h2>Before you begin</h2>{passage.source==='curated-fallback'&&<p className="reading-fallback-note">A prepared practice passage is being used because AI text generation is temporarily unavailable. Your reading exercise will work normally.</p>}
      {mode==='comprehension'?<><p>Read the unseen passage carefully, then answer all five questions. The 10-minute timer starts only when you select Start exercise.</p><ul><li>Read the full passage once before answering.</li><li>Look for the main idea, supporting details, context clues and the author's purpose.</li><li>Choose one answer for each question. You can change answers before submitting.</li><li>Each correct answer earns 1 mark. There is no negative marking.</li><li>The exercise submits automatically when 10 minutes expire; unanswered questions score zero.</li></ul><div className="reading-facts"><span>5 questions</span><span>10 minutes</span><span>5 marks total</span></div><button className="btn-primary" onClick={startComprehension}><Clock3 size={15}/> Start 10-minute exercise</button></>:
      <><p>You have {duration} minute{duration>1?'s':''} for this read-aloud practice. The timer begins when you start. The microphone converts speech into text for comparison.</p><ul><li>Find a quiet place and allow microphone access when prompted.</li><li>Read at a natural, steady pace; do not rush.</li><li>Pronounce each word clearly and pause naturally at punctuation.</li><li>If speech recognition stops, restart the microphone. You may also type the words you read.</li><li>When finished, stop the microphone and submit your transcript.</li></ul><div className="reading-facts"><span>{duration} minute{duration>1?'s':''}</span><span>Microphone enabled</span><span>AI feedback</span></div><button className="btn-primary" onClick={startAloud}><Mic size={15}/> Start read-aloud exercise</button></>}
    </div>}
    {stage==='active'&&passage&&mode==='comprehension'&&<div className="reading-active">
      <div className="reading-active-top panel"><div><span className="reading-live-label"><i/> EXERCISE IN PROGRESS</span><b>Unseen passage · 5 questions</b><small>{Object.keys(answers).length} of 5 answered</small></div><div className={'reading-countdown '+(remaining<=60?'urgent':'')}><Clock3 size={17}/><strong>{String(Math.floor(remaining/60)).padStart(2,'0')}:{String(remaining%60).padStart(2,'0')}</strong><small>TIME LEFT</small></div></div>
      <article className="panel reading-passage"><span className="reading-kicker">UNSEEN PASSAGE</span><h2>{passage.title}</h2>{splitPassageParagraphs(passage.passage).map((paragraph,i)=><p key={i}>{paragraph}</p>)}</article>
      {questions.map((q,i)=><article className="panel reading-question" key={i}><div className="reading-question-meta"><span>QUESTION {i+1} OF 5</span><small>1 MARK</small></div><h3>{q.question}</h3><div className="reading-options">{q.options.map((option,j)=><button key={j} className={answers[i]===j?'chosen':''} onClick={()=>setAnswers(current=>({...current,[i]:j}))}><span>{String.fromCharCode(65+j)}</span>{option}</button>)}</div></article>)}
      <div className="reading-submit-bar"><span>{5-Object.keys(answers).length} unanswered</span><button className="btn-primary" onClick={finishComprehension}>Submit answers <ArrowRight size={15}/></button></div>
    </div>}
    {stage==='active'&&passage&&mode==='aloud'&&<div className="reading-aloud-active">
      <div className="reading-active-top panel"><div><span className="reading-live-label"><i/> READ-ALOUD PRACTICE</span><b>{duration}-minute reading session</b><small>{wordCount} recognised words · {Math.floor(elapsed/60)}:{String(elapsed%60).padStart(2,'0')} elapsed</small></div><div className="reading-countdown"><Clock3 size={17}/><strong>{Math.max(0,duration*60-elapsed)}s</strong><small>SESSION TIME</small></div></div>
      <article className="panel reading-passage reading-aloud-passage"><span className="reading-kicker">READ THIS TEXT OUT LOUD</span><h2>{passage.title}</h2>{splitPassageParagraphs(passage.passage).map((paragraph,i)=><p key={i}>{paragraph}</p>)}</article>
      <div className="panel reading-mic-panel"><div><h3><Mic size={17}/> Microphone and transcript</h3><p>Allow microphone access, then read the passage. The transcript helps estimate word accuracy and pace; it does not capture every feature of your voice.</p></div><label className="reading-language-label">Recognition language<select value={recognitionLanguage} onChange={e=>setRecognitionLanguage(e.target.value)} disabled={micActive}><option value="en-IN">English (India)</option><option value="en-US">English (US)</option><option value="en-GB">English (UK)</option></select></label><div className="reading-mic-actions"><button className="btn-primary" onClick={micActive?stopRecognition:startRecognition}>{micActive?<><MicOff size={15}/> Stop microphone</>:<><Mic size={15}/> Start microphone</>}</button><span className={micActive?'reading-mic-on':''}>{micActive?'Listening':'Microphone off'}</span></div>{micMessage&&<p className="reading-mic-message">{micMessage}</p>}<label>Recognised transcript (you can correct or enter it manually)<textarea rows={5} value={transcript} onChange={e=>setTranscript(e.target.value)} placeholder="Recognised words appear here. If speech recognition is unavailable, type what you read."/></label><div className="reading-transcript-foot"><span>{wordCount} words captured</span><button className="btn-primary" onClick={()=>void submitAloud()} disabled={busy||transcript.trim().length<8}>{busy?<><LoaderCircle size={14}/> Analysing…</>:<>Submit for assessment <ArrowRight size={14}/></>}</button></div>{error&&<p className="reading-error">{error}</p>}</div>
    </div>}
    {stage==='results'&&mode==='comprehension'&&<div className="reading-results"><div className="panel reading-score-hero"><div><span className="reading-kicker">COMPREHENSION RESULT</span><h2>{score}<small>/5</small></h2><p>{score===5?'All five answers are correct.':score>=3?'You understood several key points. Review the explanations to strengthen accuracy.':'Revisit the passage and review how each answer is supported by the text.'}</p></div><div className="reading-score-ring"><b>{score}/5</b></div></div>
      {questions.map((q,i)=><article className="panel reading-answer-review" key={i}><div><span>QUESTION {i+1}</span><b className={answers[i]===q.correctIndex?'correct':'incorrect'}>{answers[i]===q.correctIndex?'Correct · 1 mark':answers[i]===undefined?'Not answered · 0 marks':'Incorrect · 0 marks'}</b></div><h3>{q.question}</h3><p>Your answer: {answers[i]===undefined?'Not answered':q.options[answers[i]]}</p><p>Correct answer: <b>{q.options[q.correctIndex]}</b></p><small>{q.explanation}</small></article>)}
      <VocabularySection items={passage?.vocabulary || []}/>
      <div className="reading-report-actions"><button className="btn-outline" onClick={reset}><RotateCcw size={14}/> Practise again</button><button className="btn-primary" onClick={reset}>Choose another exercise <ArrowRight size={14}/></button></div>
    </div>}
    {stage==='results'&&mode==='aloud'&&report&&<div className="reading-results"><div className="panel reading-score-hero"><div><span className="reading-kicker">READ-ALOUD PRACTICE SCORE</span><h2>{report.overallScore}<small>/100</small></h2><p>{report.summary}</p></div><div className="reading-score-ring"><b>{report.overallScore}</b></div></div>
      <div className="panel reading-dimensions"><span className="reading-kicker">SKILL BREAKDOWN</span>{report.dimensions.map(d=><div className="reading-dimension" key={d.name}><div><b>{d.name}</b><strong>{d.score}/100</strong></div><div className="reading-progress"><span style={{width:d.score+'%'}}/></div><p>{d.feedback}</p></div>)}</div>
      <div className="reading-report-columns"><div className="panel"><h3><CheckCircle2 size={16}/> Strengths</h3><ul>{report.strengths.map((s,i)=><li key={i}>{s}</li>)}</ul></div><div className="panel"><h3><Target size={16}/> Areas to improve</h3><ul>{report.improvements.map((s,i)=><li key={i}>{s}</li>)}</ul></div></div>
      <div className="panel reading-tips"><h3>Practice recommendations</h3><ol>{report.practiceTips.map((s,i)=><li key={i}>{s}</li>)}</ol></div>
      <p className="reading-disclaimer">AI feedback is based on the displayed text, recognised transcript and elapsed time. Browser speech recognition may mishear words. It cannot reliably score pronunciation, intonation, voice quality or accent; those are not measured here.</p>
      <VocabularySection items={passage?.vocabulary || []}/>
      <div className="reading-report-actions"><button className="btn-outline" onClick={reset}><RotateCcw size={14}/> Practise again</button><button className="btn-primary" onClick={reset}>Choose another exercise <ArrowRight size={14}/></button></div>
    </div>}
    {error&&stage!=='active'&&<p className="reading-error">{error}</p>}
  </section>;
}
