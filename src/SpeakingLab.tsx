import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@appdeploy/client';
import { Activity, ArrowRight, BookOpen, CheckCircle2, Clock3, LoaderCircle, Mic, MicOff, RotateCcw, Sparkles, Target, UserRound } from 'lucide-react';
import './SpeakingLab.css';

type Assessment = {
  overallScore: number;
  summary: string;
  dimensions: { name: string; score: number; feedback: string }[];
  strengths: string[];
  improvements: string[];
  revisedAnswer: string;
  exercises: string[];
};
type ResumeQuestion = { title: string; question: string; focus: string };
const SpeechRecognitionConstructor = () => (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export default function SpeakingLab() {
  const [mode, setMode] = useState<'topic' | 'resume' | null>(null);
  const [topicChoice, setTopicChoice] = useState<'manual' | 'ai'>('manual');
  const [manualTopic, setManualTopic] = useState('');
  const [topicPrompt, setTopicPrompt] = useState('');
  const [topicSource, setTopicSource] = useState<'ai' | 'backup' | 'manual' | ''>('');
  const [topicBusy, setTopicBusy] = useState(false);
  const [resumeQuestions, setResumeQuestions] = useState<ResumeQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questionsBusy, setQuestionsBusy] = useState(false);
  const [resumeMissing, setResumeMissing] = useState(false);
  const [duration] = useState(120);
  const [remaining, setRemaining] = useState(120);
  const [transcript, setTranscript] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [active, setActive] = useState(false);
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');
  const prompt = mode === 'resume' ? resumeQuestions[questionIndex]?.question || '' : topicPrompt;
  const promptTitle = mode === 'resume' ? resumeQuestions[questionIndex]?.title || 'Resume question' : (topicPrompt || manualTopic || 'Topic practice');
  const words = useMemo(() => transcript.trim() ? transcript.trim().split(/\s+/).length : 0, [transcript]);
  const estimatedWpm = elapsed > 0 ? Math.round(words / (elapsed / 60)) : 0;
  const speechSupported = typeof window !== 'undefined' && !!SpeechRecognitionConstructor();

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => {
      setElapsed(value => value + 1);
      setRemaining(value => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [active]);

  useEffect(() => {
    if (active && remaining === 0) stopSession();
  }, [remaining, active]);

  useEffect(() => () => {
    try { recognitionRef.current?.stop(); } catch { /* no active recogniser */ }
  }, []);

  const stopSession = () => {
    setActive(false);
    try { recognitionRef.current?.stop(); } catch { /* no active recogniser */ }
    setListening(false);
  };

  const resetAnswer = () => {
    stopSession();
    setTranscript('');
    finalTranscriptRef.current = '';
    setElapsed(0);
    setRemaining(duration);
    setAssessment(null);
    setErrorMessage('');
  };

  const generateResumeQuestions = async () => {
    const resumeText = localStorage.getItem('careerpilot-resume-text') || '';
    let profile: unknown = {};
    try { profile = JSON.parse(localStorage.getItem('careerpilot-profile') || '{}'); } catch { profile = {}; }
    if (resumeText.trim().length < 60 && !Object.keys(profile as object).length) {
      setResumeMissing(true);
      return;
    }
    setQuestionsBusy(true);
    setErrorMessage('');
    try {
      const response = await api.post('/api/speaking-resume-questions', { resumeText, profile });
      const questions = Array.isArray(response.data.questions) ? response.data.questions as ResumeQuestion[] : [];
      if (!questions.length) throw new Error('No questions returned');
      setResumeQuestions(questions);
      setQuestionIndex(0);
      resetAnswer();
      setResumeMissing(false);
    } catch {
      setErrorMessage('AI could not generate resume questions right now. Please try again.');
    } finally {
      setQuestionsBusy(false);
    }
  };

  const chooseMode = (nextMode: 'topic' | 'resume') => {
    resetAnswer();
    setMode(nextMode);
    setTopicPrompt('');
    setTopicSource('');
    setResumeQuestions([]);
    setQuestionIndex(0);
    setResumeMissing(false);
    if (nextMode === 'resume') void generateResumeQuestions();
  };

  const generateTopic = async () => {
    setTopicBusy(true);
    setErrorMessage('');
    try {
      const response = await api.post('/api/speaking-topic', {});
      const topic = String(response.data.topic || '');
      const angle = String(response.data.angle || '');
      setTopicPrompt(angle ? topic + ' — ' + angle : topic);
      setTopicSource(response.data.source === 'backup' ? 'backup' : 'ai');
      resetAnswer();
    } catch {
      setErrorMessage('AI could not suggest a topic right now. Please try again.');
    } finally {
      setTopicBusy(false);
    }
  };

  const useManualTopic = () => {
    if (manualTopic.trim().length < 2) {
      setErrorMessage('Enter a topic you want to speak about.');
      return;
    }
    setTopicPrompt('Speak about: ' + manualTopic.trim() + '. Explain your thoughts clearly and support them with examples.');
    setTopicSource('manual');
    resetAnswer();
  };

  const startSession = () => {
    setTranscript('');
    finalTranscriptRef.current = '';
    setElapsed(0);
    setRemaining(duration);
    setAssessment(null);
    setErrorMessage('');
    setActive(true);
  };

  const toggleMicrophone = () => {
    if (listening) {
      try { recognitionRef.current?.stop(); } catch { /* no active recogniser */ }
      setListening(false);
      return;
    }
    const Recognition = SpeechRecognitionConstructor();
    if (!Recognition) {
      setErrorMessage('Speech recognition is not available in this browser. You can still type your answer below.');
      return;
    }
    try {
      const recognition = new Recognition();
      recognition.lang = 'en-IN';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const part = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalTranscriptRef.current += part + ' ';
          else interim += part;
        }
        setTranscript((finalTranscriptRef.current + interim).trimStart());
      };
      recognition.onerror = () => {
        setListening(false);
        setErrorMessage('Microphone recognition stopped. Check browser permission, or continue by typing.');
      };
      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
      recognition.start();
      setListening(true);
      setErrorMessage('');
    } catch {
      setErrorMessage('Could not start microphone recognition. Check microphone permission and try again.');
    }
  };

  const evaluate = async () => {
    stopSession();
    if (transcript.trim().length < 35) {
      setErrorMessage('Add a little more detail before requesting an assessment (at least 35 characters).');
      return;
    }
    setBusy(true);
    setErrorMessage('');
    try {
      const response = await api.post('/api/speaking-assessment', {
        mode,
        prompt,
        resumeContext: mode === 'resume' ? (localStorage.getItem('careerpilot-resume-text') || '') : '',
        transcript: transcript.trim(),
        elapsedSeconds: Math.max(1, elapsed),
        wordCount: words,
        estimatedWpm,
      });
      const result = response.data as Assessment;
      setAssessment(result);
      try {
        const history = JSON.parse(localStorage.getItem('careerpilot-speaking-history') || '[]');
        history.unshift({ id: Date.now(), title: promptTitle, mode, score: result.overallScore, words, date: new Date().toISOString() });
        localStorage.setItem('careerpilot-speaking-history', JSON.stringify(history.slice(0, 8)));
      } catch { /* report remains visible if storage is unavailable */ }
    } catch {
      setErrorMessage('The assessment could not be generated right now. Your transcript is still here; please retry.');
    } finally {
      setBusy(false);
    }
  };

  const backToModes = () => {
    resetAnswer();
    setMode(null);
    setTopicPrompt('');
    setTopicSource('');
    setResumeQuestions([]);
    setErrorMessage('');
  };

  return (
    <section className="content speaking-lab-page">
      <div className="speaking-heading">
        <div><span className="speaking-eyebrow">COMMUNICATION PRACTICE</span><h1>Professional Communication Lab</h1><p>Choose what you want to speak about. Get a score, clear feedback and a focused plan to improve your next response.</p></div>
        <div className="speaking-heading-icon"><Activity size={23}/></div>
      </div>

      {!mode && <div className="speaking-mode-grid">
        <button className="speaking-mode-card" onClick={() => chooseMode('topic')}><div className="speaking-mode-icon"><BookOpen size={22}/></div><span className="speaking-label">MODE 01</span><h2>Speak about a topic</h2><p>Choose any topic yourself or ask AI to give you a fresh topic to practise on.</p><b>Choose topic practice <ArrowRight size={15}/></b></button>
        <button className="speaking-mode-card" onClick={() => chooseMode('resume')}><div className="speaking-mode-icon"><UserRound size={22}/></div><span className="speaking-label">MODE 02</span><h2>Speak about your resume</h2><p>AI creates personalised interview questions about your actual skills, projects and experience.</p><b>Practise resume questions <ArrowRight size={15}/></b></button>
      </div>}

      {mode && !assessment && <>
        <div className="speaking-mode-toolbar"><button className="btn-outline" disabled={active || busy} onClick={backToModes}>← Change practice mode</button><span>{mode === 'topic' ? 'TOPIC PRACTICE' : 'RESUME-BASED PRACTICE'}</span></div>

        {mode === 'topic' && <div className="speaking-prompt-panel panel">
          <div className="speaking-panel-top"><div><span className="speaking-label">CHOOSE YOUR TOPIC</span><h2>What would you like to speak about?</h2><p>Pick a topic yourself or let AI surprise you with one.</p></div></div>
          <div className="speaking-topic-options"><button className={'speaking-option '+(topicChoice === 'manual' ? 'selected' : '')} onClick={() => { setTopicChoice('manual'); setTopicPrompt(''); setTopicSource(''); resetAnswer(); }}>I will choose a topic</button><button className={'speaking-option '+(topicChoice === 'ai' ? 'selected' : '')} onClick={() => { setTopicChoice('ai'); setTopicPrompt(''); setTopicSource(''); resetAnswer(); }}>Give me a topic using AI</button></div>
          {topicChoice === 'manual' ? <div className="speaking-topic-input"><label htmlFor="speaking-topic">Your topic</label><input id="speaking-topic" value={manualTopic} onChange={event => setManualTopic(event.target.value)} placeholder="e.g. How AI is changing education" maxLength={160}/><button className="btn-primary" onClick={useManualTopic}>Use this topic <ArrowRight size={15}/></button></div> : <div className="speaking-topic-input"><p>AI will choose a useful, open-ended topic suitable for speaking practice.</p><button className="btn-primary" disabled={topicBusy} onClick={generateTopic}>{topicBusy ? <><LoaderCircle className="speaking-spin" size={15}/> Finding a topic…</> : <><Sparkles size={15}/> Give me an AI topic</>}</button></div>}
          {topicPrompt && <div className="speaking-selected-prompt"><span className="speaking-label">{topicSource === 'backup' ? 'BACKUP PRACTICE TOPIC' : topicSource === 'ai' ? 'AI-GENERATED TOPIC' : 'YOUR SPEAKING TOPIC'}</span><h3>{topicPrompt}</h3>{topicSource === 'backup' && <p className="speaking-topic-fallback-note">AI topic generation is temporarily unavailable, so we have provided a curated backup topic. You can still practise and get your assessment.</p>}</div>
        }</div>}

        {mode === 'resume' && <div className="speaking-prompt-panel panel">
          <div className="speaking-panel-top"><div><span className="speaking-label">AI-GENERATED RESUME QUESTIONS</span><h2>Questions based on your experience</h2><p>AI uses your saved resume to ask about details you actually listed.</p></div><button className="btn-outline" disabled={questionsBusy || active || busy} onClick={generateResumeQuestions}>{questionsBusy ? 'Generating…' : 'Regenerate questions'}</button></div>
          {resumeMissing ? <div className="speaking-resume-empty"><h3>Your resume is not available yet</h3><p>Upload your resume in Build Resume or Resume & skills first. Then return here to generate questions from your actual projects, skills and experience.</p></div> : questionsBusy ? <p className="speaking-browser-note"><LoaderCircle size={15} className="speaking-spin"/> Generating questions from your resume…</p> : resumeQuestions.length > 0 ? <div className="speaking-question-list">{resumeQuestions.map((item, index) => <button key={index} className={'speaking-question-item '+(questionIndex === index ? 'selected' : '')} onClick={() => { setQuestionIndex(index); resetAnswer(); }}><span>Q{index + 1}</span><div><b>{item.title}</b><small>{item.question}</small><em>Focus: {item.focus}</em></div></button>)}</div> : <p>Generate questions to begin. Questions will be based on your saved resume.</p>}
        </div>}

        {prompt && <div className="speaking-workspace">
          <div className="panel speaking-capture">
            <div className="speaking-capture-top"><div><h3>{mode === 'resume' ? 'Your answer to this resume question' : 'Your response'}</h3><p>{active ? 'Speak naturally. You can also correct or complete the transcript.' : 'Start a timed response, speak using your microphone where supported, or type your answer.'}</p></div><span className={'speaking-session-state '+(active ? 'is-active' : '')}>{active ? 'SESSION LIVE' : 'NOT STARTED'}</span></div>
            <div className="speaking-active-prompt"><span className="speaking-label">{mode === 'resume' ? 'INTERVIEW QUESTION' : 'TOPIC'}</span><p>{prompt}</p></div>
            <div className="speaking-timer"><Clock3 size={17}/><strong>{String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}</strong><span>TIME LEFT</span><small>{elapsed}s elapsed</small></div>
            <textarea value={transcript} onChange={event => { setTranscript(event.target.value); finalTranscriptRef.current = event.target.value; }} placeholder="Your spoken words will appear here when microphone recognition is available. You can also type your response…" rows={9}/>
            <div className="speaking-metrics"><span><b>{words}</b> words</span><span><b>{estimatedWpm || '—'}</b> estimated words/min</span><span><b>{duration}s</b> target</span></div>
            {errorMessage && <p className="speaking-error">{errorMessage}</p>}
            <div className="speaking-controls">
              {!active ? <button className="btn-primary" onClick={startSession} disabled={busy || !prompt}><Clock3 size={15}/> Start speaking session</button> : <button className="btn-outline" onClick={stopSession}>End session</button>}
              {active && <button className={'speaking-mic-button '+(listening ? 'listening' : '')} onClick={toggleMicrophone}><Mic size={15}/>{listening ? 'Stop microphone' : 'Use microphone'}</button>}
              <button className="btn-primary" onClick={evaluate} disabled={busy || active || transcript.trim().length < 35}>{busy ? <><LoaderCircle size={15} className="speaking-spin"/> Assessing…</> : <>Assess my response <ArrowRight size={15}/></>}</button>
            </div>
            {!speechSupported && <p className="speaking-browser-note"><MicOff size={14}/> Speech recognition is not supported in this browser. The typed-response mode works without it.</p>}
            <p className="speaking-privacy-note">Speech is converted to text by your browser. AI analyses the transcript and timing metadata; it does not receive an audio recording.</p>
          </div>
          <aside className="speaking-side">
            <div className="panel speaking-guide"><div className="speaking-guide-icon"><Target size={18}/></div><h3>Structure your answer</h3><p>Make one clear point, explain your reasoning, support it with an example and close with a takeaway.</p></div>
            <div className="panel speaking-guide"><h3>What AI evaluates</h3><ul><li>Relevance to your topic or resume question</li><li>Logical structure and clarity</li><li>Grammar and sentence control</li><li>Vocabulary and precision</li><li>Examples, evidence and completeness</li></ul><p className="speaking-browser-note">Pronunciation, accent and intonation are not scored from a transcript.</p></div>
          </aside>
        </div>}
        {errorMessage && !prompt && <p className="speaking-error">{errorMessage}</p>}
      </>}

      {assessment && <div className="speaking-report">
        <div className="panel speaking-report-hero"><div><span className="speaking-label">AI SPEAKING ASSESSMENT · {mode === 'resume' ? 'RESUME PRACTICE' : 'TOPIC PRACTICE'}</span><h2>{assessment.overallScore}<small>/100</small></h2><p>{assessment.summary}</p><div className="speaking-report-stats"><span>{words} words</span><span>{elapsed}s speaking time</span><span>{estimatedWpm || '—'} estimated WPM</span></div></div><div className="speaking-score-ring" style={{ '--speaking-score': assessment.overallScore + '%' } as React.CSSProperties}><b>{assessment.overallScore}</b></div></div>
        <div className="speaking-dimensions panel"><div className="speaking-section-heading"><div><h3>Score breakdown</h3><p>Each score is based on evidence in your transcript.</p></div></div>{assessment.dimensions.map(item => <div className="speaking-dimension" key={item.name}><div><b>{item.name}</b><strong>{item.score}/100</strong></div><div className="speaking-progress"><span style={{width:item.score+'%'}}/></div><p>{item.feedback}</p></div>)}</div>
        <div className="speaking-report-columns"><div className="panel"><h3><CheckCircle2 size={16}/> What you did well</h3><ul>{assessment.strengths.map((item,i)=><li key={i}>{item}</li>)}</ul></div><div className="panel"><h3><Target size={16}/> What to improve next time</h3><ul>{assessment.improvements.map((item,i)=><li key={i}>{item}</li>)}</ul></div></div>
        <div className="panel speaking-rewrite"><h3><Sparkles size={16}/> A stronger version of your answer</h3><p>{assessment.revisedAnswer}</p><small>Use this as a learning example. Keep your own facts and experience truthful.</small></div>
        <div className="panel speaking-rewrite"><h3>Your next practice steps</h3><ol>{assessment.exercises.map((item,i)=><li key={i}>{item}</li>)}</ol></div>
        <p className="speaking-privacy-note">This is AI-generated practice feedback, not a certified CEFR, IELTS, TOEFL or employer score. Pronunciation and vocal delivery are not measured because no audio is analysed.</p>
        <div className="speaking-controls"><button className="btn-outline" onClick={resetAnswer}><RotateCcw size={14}/> Practise this again</button>{mode === 'resume' && <button className="btn-primary" onClick={() => { setQuestionIndex((questionIndex+1)%resumeQuestions.length); resetAnswer(); }} disabled={resumeQuestions.length < 2}>Next resume question <ArrowRight size={15}/></button>}<button className="btn-outline" onClick={backToModes}>Choose another practice mode</button></div>
      </div>}
    </section>
  );
}
