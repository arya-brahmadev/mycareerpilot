import { api } from '@appdeploy/client';
import { ArrowRight, Headphones, LoaderCircle, Pause, Play, RotateCcw, Volume2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import './ListeningLab.css';

type Question = { question: string; options: string[]; correctIndex: number; explanation: string };
type Vocabulary = { word: string; meaning: string; example: string };
type Exercise = { title: string; transcript: string; questions: Question[]; vocabulary: Vocabulary[] };

export default function ListeningLab() {
  const [mode, setMode] = useState<'understand' | 'workplace'>('understand');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [topic, setTopic] = useState('Technology and society');
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [stage, setStage] = useState<'setup' | 'active' | 'results'>('setup');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [rate, setRate] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const score = useMemo(() => exercise ? exercise.questions.reduce((sum, q, i) => sum + (answers[i] === q.correctIndex ? 1 : 0), 0) : 0, [exercise, answers]);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const load = () => {
      const available = window.speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith('en'));
      setVoices(available);
      if (!voiceName && available.length) setVoiceName((available.find(v => /en-in/i.test(v.lang)) || available[0]).name);
    };
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', load);
      window.speechSynthesis.cancel();
    };
  }, [voiceName]);

  const stopAudio = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  };
  const playAudio = () => {
    if (!exercise || !('speechSynthesis' in window)) {
      setError('Audio playback is not supported in this browser. Try the latest Chrome or Edge.');
      return;
    }
    stopAudio();
    const utterance = new SpeechSynthesisUtterance(exercise.transcript);
    const voice = voices.find(v => v.name === voiceName);
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => { setSpeaking(false); setError('Audio playback stopped unexpectedly. Please try again.'); };
    window.speechSynthesis.speak(utterance);
  };
  const generate = async () => {
    setBusy(true); setError(''); stopAudio(); setExercise(null); setAnswers({});
    try {
      const response = await api.post('/api/listening-generate', { mode, difficulty, topic });
      const data = response.data as Exercise;
      if (!data.transcript || !Array.isArray(data.questions) || data.questions.length !== 5 || data.questions.some(q => !Array.isArray(q.options) || q.options.length !== 4)) throw new Error('The exercise response was incomplete. Please generate it again.');
      setExercise(data); setStage('active');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate a listening exercise. Please retry.');
    } finally { setBusy(false); }
  };
  const submit = () => { stopAudio(); setStage('results'); };
  const reset = () => { stopAudio(); setExercise(null); setAnswers({}); setStage('setup'); setError(''); };

  return <section className="content listening-lab-page">
    <header className="listening-heading"><div><span className="listening-eyebrow">VERBAL SKILLS · LISTENING PRACTICE</span><h1>Listening Lab</h1><p>Build the ability to understand spoken English in everyday and professional situations.</p></div><div className="listening-heading-icon"><Headphones size={22}/></div></header>
    {stage === 'setup' && <>
      <div className="listening-mode-grid">
        <button className={'listening-mode-card ' + (mode === 'understand' ? 'selected' : '')} onClick={() => setMode('understand')}><span className="listening-mode-icon"><Headphones size={19}/></span><b>Listen &amp; Understand</b><small>Short talks, stories, news-style explainers and informational passages.</small><em>{mode === 'understand' ? 'Selected' : 'Choose practice'}</em></button>
        <button className={'listening-mode-card ' + (mode === 'workplace' ? 'selected' : '')} onClick={() => setMode('workplace')}><span className="listening-mode-icon"><Volume2 size={19}/></span><b>Workplace Listening</b><small>Meetings, manager instructions, client conversations and interview exchanges.</small><em>{mode === 'workplace' ? 'Selected' : 'Choose practice'}</em></button>
      </div>
      <div className="panel listening-setup"><span className="listening-kicker">CUSTOMISE YOUR SESSION</span><h2>Choose your listening level</h2><div className="listening-levels">{['Easy','Intermediate','Advanced'].map(level => <button key={level} className={difficulty === level ? 'active' : ''} onClick={() => setDifficulty(level)}>{level}</button>)}</div>
        <label className="listening-topic">Topic or situation<input value={topic} onChange={e => setTopic(e.target.value)} maxLength={120} placeholder="e.g. Project deadline meeting"/></label>
        <div className="listening-facts"><span>5 comprehension questions</span><span>Unlimited audio replay</span><span>Vocabulary after submission</span></div>
        <button className="btn-primary listening-generate" disabled={busy || !topic.trim()} onClick={() => void generate()}>{busy ? <><LoaderCircle size={15}/> Creating exercise…</> : <>Generate listening exercise <ArrowRight size={15}/></>}</button>
      </div>
      <p className="listening-note">Audio uses English voices available on your device or browser. Voice and accent choices depend on your system.</p>
    </>}
    {stage === 'active' && exercise && <div className="listening-exercise">
      <div className="panel listening-player"><span className="listening-kicker">{mode === 'workplace' ? 'WORKPLACE LISTENING' : 'LISTEN & UNDERSTAND'} · {difficulty.toUpperCase()}</span><h2>{exercise.title}</h2><p>Listen carefully, identify the main ideas and details, then answer the questions.</p>
        <div className="listening-controls"><button className="listening-play" onClick={playAudio}><Play size={16}/>{speaking ? 'Replay audio' : 'Play audio'}</button><button className="listening-stop" onClick={stopAudio} disabled={!speaking}><Pause size={15}/> Stop</button>
          <label>Playback speed<select value={rate} onChange={e => setRate(Number(e.target.value))}><option value={0.75}>0.75×</option><option value={0.9}>0.9×</option><option value={1}>1× Normal</option><option value={1.1}>1.1×</option><option value={1.25}>1.25×</option></select></label>
          {voices.length > 0 && <label>Voice<select value={voiceName} onChange={e => setVoiceName(e.target.value)}>{voices.map(v => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}</select></label>}
        </div><p className="listening-player-hint">Replay as often as you need. The transcript remains hidden until you submit.</p>
      </div>
      {exercise.questions.map((q, i) => <article className="panel listening-question" key={i}><div className="listening-question-meta"><span>QUESTION {i + 1} OF 5</span><span>1 MARK</span></div><h3>{q.question}</h3><div className="listening-options">{q.options.map((option, j) => <button key={j} className={answers[i] === j ? 'chosen' : ''} onClick={() => setAnswers(current => ({...current, [i]: j}))}><span>{String.fromCharCode(65 + j)}</span>{option}</button>)}</div></article>)}
      <div className="listening-submit"><span>{Object.keys(answers).length} of 5 answered</span><button className="btn-primary" onClick={submit}>Submit answers <ArrowRight size={14}/></button></div>
    </div>}
    {stage === 'results' && exercise && <div className="listening-results">
      <div className="panel listening-score"><div><span className="listening-kicker">YOUR LISTENING RESULT</span><h2>{score}<small>/5</small></h2><p>{score === 5 ? 'All five answers are correct.' : score >= 3 ? 'You understood several key points. Review the explanations.' : 'Review the transcript and explanations, then practise again.'}</p></div><div className="listening-score-ring"><b>{score}/5</b></div></div>
      {exercise.questions.map((q, i) => <article className="panel listening-review" key={i}><div><span>QUESTION {i + 1}</span><b className={answers[i] === q.correctIndex ? 'correct' : 'incorrect'}>{answers[i] === q.correctIndex ? 'Correct' : 'Review this answer'}</b></div><h3>{q.question}</h3><p>Your answer: {answers[i] === undefined ? 'Not answered' : q.options[answers[i]]}</p><p>Correct answer: <b>{q.options[q.correctIndex]}</b></p><small>{q.explanation}</small></article>)}
      <section className="panel listening-transcript"><div className="listening-transcript-head"><div><span className="listening-kicker">AUDIO SCRIPT</span><h3>{exercise.title}</h3></div><button className="listening-play" onClick={playAudio}><Play size={14}/> Listen again</button></div><p>{exercise.transcript}</p></section>
      {exercise.vocabulary?.length > 0 && <section className="panel listening-vocabulary"><span className="listening-kicker">BUILD YOUR VOCABULARY</span><h3>Useful words from this exercise</h3><div>{exercise.vocabulary.map((v, i) => <article key={v.word + i}><b>{v.word}</b><p>{v.meaning}</p><small>Example: {v.example}</small></article>)}</div></section>}
      <div className="listening-actions"><button className="btn-outline" onClick={reset}><RotateCcw size={14}/> New exercise</button><button className="btn-primary" onClick={() => { setAnswers({}); setStage('active'); }}>Try questions again <ArrowRight size={14}/></button></div>
    </div>}
    {error && <p className="listening-error">{error}</p>}
  </section>;
}
