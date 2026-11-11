import { useEffect, useState } from 'react';
import { api } from '@appdeploy/client';
import { Bookmark, History, Mic, MicOff, Send, Sparkles } from 'lucide-react';
import './DailyChallenge.css';

type Role = 'Software Developer' | 'AI Engineer';

export default function DailyChallenge() {
  const [role, setRole] = useState<Role>('Software Developer');
  const [item, setItem] = useState<any>(null);
  const [saved, setSaved] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [approach, setApproach] = useState('');
  const [code, setCode] = useState('');
  const [explanation, setExplanation] = useState('');
  const [language, setLanguage] = useState('Java');
  const [review, setReview] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [listening, setListening] = useState(false);

  let recognition: any = null;

  async function lists() {
    try {
      const response = await api.get('/api/daily-challenge/saved');
      setSaved(response.data.items || []);
      setHistory(response.data.history || []);
    } catch {
      setMessage('Could not load saved challenges. Please retry.');
    }
  }

  async function load(nextRole: Role) {
    setBusy(true);
    setMessage('Loading today’s challenge…');
    setReview(null);
    setApproach('');
    setCode('');
    setExplanation('');
    try {
      const response = await api.post('/api/daily-challenge/today', { role: nextRole });
      setItem(response.data.challenge);
      setReview(response.data.challenge.review || null);
      setLanguage(response.data.challenge.languageOptions?.[0] || 'Java');
      setMessage('');
    } catch (error: any) {
      setMessage(error?.response?.data?.error || 'Sign in and retry loading the challenge.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load(role);
    void lists();
  }, []);

  async function save() {
    if (!item?.id) return;
    try {
      const response = await api.post('/api/daily-challenge/save', { id: item.id });
      setSaved(response.data.items || []);
      setMessage(response.data.saved ? 'Challenge saved.' : 'Challenge removed from saved.');
      await lists();
    } catch {
      setMessage('Could not save challenge.');
    }
  }

  async function submit() {
    if (!approach.trim() && !code.trim() && !explanation.trim()) {
      setMessage('Write an approach, code or explanation first.');
      return;
    }
    setBusy(true);
    setMessage('Reviewing your attempt…');
    try {
      const response = await api.post('/api/daily-challenge/review', {
        id: item.id, approach, code, language, explanation
      });
      setReview(response.data.review);
      setMessage('Review saved.');
      await lists();
    } catch (error: any) {
      setMessage(error?.response?.data?.error || 'Review failed.');
    } finally {
      setBusy(false);
    }
  }

  function voice() {
    const browser = window as any;
    const SpeechRecognition = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessage('Speech recognition is unavailable in this browser.');
      return;
    }
    if (listening) {
      recognition?.stop();
      setListening(false);
      return;
    }
    recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let index = event.resultIndex; index < event.results.length; index++) {
        transcript += event.results[index][0].transcript;
      }
      setExplanation(value => value + ' ' + transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.start();
    setListening(true);
  }

  async function openChallenge(challenge: any) {
    setBusy(true);
    setMessage('Opening saved challenge…');
    try {
      const response = await api.get('/api/daily-challenge/saved');
      const all = [...(response.data.items || []), ...(response.data.history || [])];
      const fullChallenge = all.find((entry: any) => entry.id === challenge.id) || challenge;
      const savedReview = fullChallenge.review || null;

      setRole(fullChallenge.role);
      setItem(fullChallenge);
      setReview(savedReview);
      setApproach(savedReview?.approach || '');
      setCode(savedReview?.code || '');
      setExplanation(savedReview?.explanation || '');
      setLanguage(savedReview?.language || fullChallenge.languageOptions?.[0] || 'Java');
      setShowHistory(false);
      setMessage('');
    } catch (error: any) {
      setMessage(error?.response?.data?.error || 'Could not open this saved challenge. Please retry.');
    } finally {
      setBusy(false);
    }
  }

  const displayedChallenges = [
    ...saved,
    ...history.filter(entry => !saved.some(savedEntry => savedEntry.id === entry.id))
  ];

  return (
    <section className="content dc">
      <div className="page-header">
        <div>
          <div className="section-eyebrow">DAILY TECHNICAL PRACTICE</div>
          <h1>Daily Challenge</h1>
          <p>A fresh problem each day for each career track.</p>
        </div>
      </div>

      <div className="dc-bar">
        <div>
          {(['Software Developer', 'AI Engineer'] as Role[]).map(nextRole => (
            <button
              className={nextRole === role ? 'active' : ''}
              key={nextRole}
              onClick={() => {
                setRole(nextRole);
                void load(nextRole);
              }}
            >
              {nextRole}
            </button>
          ))}
        </div>
        <button className="btn-outline" onClick={() => {
          setShowHistory(value => !value);
          void lists();
        }}>
          <History size={15} /> Saved &amp; history ({displayedChallenges.length})
        </button>
      </div>

      {message && <p className="jr-message" role="status">{message}</p>}

      {item && (
        <>
          <article className="panel dc-panel">
            <div className="dc-meta">
              {item.date} · {item.difficulty} · {item.estimatedMinutes} min
              <button onClick={() => void save()}>
                <Bookmark size={17} />
                {saved.some(entry => entry.id === item.id) ? 'Saved' : 'Save'}
              </button>
            </div>
            <h2>{item.title}</h2>
            <p>{item.prompt}</p>
            <b>Requirements</b>
            <ul>{(item.constraints || []).map((constraint: string, index: number) => <li key={index}>{constraint}</li>)}</ul>
            <b>Examples</b>
            {(item.examples || []).map((example: string, index: number) => <pre key={index}>{example}</pre>)}
            <details>
              <summary>Hints</summary>
              {(item.hints || []).map((hint: string, index: number) => <p key={index}>{hint}</p>)}
            </details>
          </article>

          <article className="panel dc-panel">
            <h3>Your attempt</h3>
            <label>
              Approach / pseudocode
              <textarea value={approach} onChange={event => setApproach(event.target.value)} />
            </label>
            <div className="dc-meta">
              <b>Code / query</b>
              <select value={language} onChange={event => setLanguage(event.target.value)}>
                {(item.languageOptions || ['Java', 'Python']).map((option: string) => <option key={option}>{option}</option>)}
              </select>
            </div>
            <textarea className="dc-code" value={code} onChange={event => setCode(event.target.value)} spellCheck={false} />
            <label>
              Explain your reasoning
              <textarea value={explanation} onChange={event => setExplanation(event.target.value)} />
            </label>
            <div className="dc-meta">
              <button className="btn-outline" onClick={voice}>
                {listening ? <MicOff /> : <Mic />}
                {listening ? 'Stop microphone' : 'Speak explanation'}
              </button>
              <small>Browser speech-to-text; audio is not uploaded.</small>
              <button className="btn-primary" disabled={busy} onClick={() => void submit()}>
                <Send size={14} /> Review attempt
              </button>
            </div>
          </article>

          {review && (
            <article className="panel dc-panel">
              <h3><Sparkles size={17} /> {review.overallScore}/100 · {review.verdict}</h3>
              <p>{review.summary}</p>
              {(review.dimensions || []).map((dimension: any, index: number) => (
                <p key={index}><b>{dimension.name} · {dimension.score}/100</b><br />{dimension.feedback}</p>
              ))}
              <h4>Strengths</h4>
              <ul>{(review.strengths || []).map((strength: string, index: number) => <li key={index}>{strength}</li>)}</ul>
              <h4>Improvements</h4>
              <ul>{(review.improvements || []).map((improvement: string, index: number) => <li key={index}>{improvement}</li>)}</ul>
              <h4>Reference solution</h4>
              <pre>{review.idealSolution}</pre>
              <small>Static review only: code is not compiled or executed.</small>
            </article>
          )}
        </>
      )}

      {showHistory && (
        <article className="panel dc-panel">
          <h3>Saved challenges &amp; history</h3>
          {displayedChallenges.length === 0 && <p>No saved or reviewed challenges yet. Save a question to find it here.</p>}
          {displayedChallenges.map(challenge => (
            <button
              className="dc-history"
              key={challenge.id}
              disabled={busy}
              onClick={() => void openChallenge(challenge)}
            >
              <span>{challenge.title}</span>
              <small>{challenge.role} · {challenge.date}</small>
              <b>Open question →</b>
            </button>
          ))}
        </article>
      )}
    </section>
  );
}