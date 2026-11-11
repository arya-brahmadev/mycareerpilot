import { useMemo, useState } from 'react';
import { api } from '@appdeploy/client';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ClipboardList, LoaderCircle, PenLine, RotateCcw, Sparkles, Target } from 'lucide-react';
import './WritingLab.css';

type Skill = { id: string; name: string; application: string; purpose: string; hints: string[]; structure: string[]; task: string };
type Review = { overallScore: number; summary: string; dimensions: { name: string; score: number; feedback: string }[]; strengths: string[]; improvements: string[]; revisedVersion: string; futureTips: string[] };

const skills: Skill[] = [
  { id: 'email', name: 'Business Email Writing', application: 'Managers, HR and clients', purpose: 'Write clear emails with a useful subject, professional greeting, focused message and appropriate close.', hints: ['Decide the purpose before writing: request, update, follow-up or confirmation.', 'Use a specific subject line that tells the reader what the email needs.', 'Put the main message or request near the beginning.', 'Keep paragraphs short and use a polite, direct tone.', 'End with the action needed, a deadline if relevant, and a professional sign-off.'], structure: ['Subject line', 'Greeting', 'Purpose and context', 'Request, update or key details', 'Next step / deadline', 'Professional closing'], task: 'Write a professional email to your project manager requesting a two-day extension for a project deliverable. Explain the reason briefly, state what is already complete and propose a revised submission date. Do not invent an emergency.' },
  { id: 'formal', name: 'Formal Communication', application: 'Workplace messages and discussions', purpose: 'Replace casual or vague language with respectful, precise workplace language.', hints: ['Address the reader appropriately.', 'Avoid slang, chat abbreviations and overly familiar expressions.', 'Use respectful wording without sounding unnatural or excessively stiff.', 'State the issue or request clearly.', 'Keep the tone calm, factual and considerate.'], structure: ['Appropriate opening', 'Context', 'Clear message or request', 'Relevant detail', 'Polite close'], task: 'Write a short formal message to a colleague explaining that a meeting needs to be rescheduled and asking them to confirm a suitable alternative time.' },
  { id: 'concise', name: 'Concise Writing', application: 'Emails, reports and documentation', purpose: 'Communicate the full meaning with fewer, more useful words.', hints: ['Write the main point first.', 'Remove repeated ideas and filler phrases.', 'Prefer specific verbs over long phrases.', 'Keep one main idea per sentence.', 'Do not remove details the reader needs to act.'], structure: ['Main point', 'Essential supporting detail', 'Action or conclusion'], task: 'Write a concise project status update in 80–120 words covering progress, one current blocker, its impact and the next action.' },
  { id: 'grammar', name: 'Grammar & Vocabulary', application: 'All professional communication', purpose: 'Build accurate sentences, punctuation and precise word choice.', hints: ['Use complete sentences with a clear subject and verb.', 'Check subject–verb agreement and consistent tense.', 'Use punctuation to separate ideas, not decorate sentences.', 'Choose precise, familiar words instead of forcing complex vocabulary.', 'Read the final text aloud to catch awkward phrasing.'], structure: ['Opening statement', 'Two or three connected details', 'Closing statement'], task: 'Write a 120–150 word paragraph explaining why clear communication is important in a software development team. Focus on correct sentence formation, punctuation and precise vocabulary.' },
  { id: 'report', name: 'Report Writing', application: 'Project and business reports', purpose: 'Present facts, findings and recommendations in a logical, scannable format.', hints: ['Start with the purpose and scope of the report.', 'Separate facts, observations and recommendations.', 'Use descriptive headings.', 'Support conclusions with evidence or examples.', 'End with clear findings and practical next steps.'], structure: ['Title and purpose', 'Background / scope', 'Findings', 'Analysis', 'Conclusion', 'Recommendations'], task: 'Write a short report on the progress of a college software project. Include its objective, work completed, one challenge, its impact and recommended next steps. Clearly label sections.' },
  { id: 'proposal', name: 'Proposal Writing', application: 'Project ideas and business solutions', purpose: 'Present a problem, a practical solution and the value of acting on it.', hints: ['Define the problem before presenting your idea.', 'Explain who is affected and why it matters.', 'Describe the proposed solution in practical terms.', 'Mention resources, risks or constraints where relevant.', 'State the expected benefits and the decision you want.'], structure: ['Proposal title', 'Problem / opportunity', 'Proposed solution', 'Implementation outline', 'Benefits and risks', 'Requested decision'], task: 'Write a proposal to your college department suggesting a simple digital system to manage student club events. Explain the current problem, proposed features, implementation steps and expected benefits.' },
  { id: 'technical', name: 'Technical Writing', application: 'Software documentation and technical reports', purpose: 'Explain technical information accurately so another person can use or understand it.', hints: ['Identify the intended reader and their technical knowledge.', 'Explain the purpose before the implementation detail.', 'Use consistent terms and define unfamiliar abbreviations.', 'Present steps in the order a reader should follow.', 'Avoid unsupported claims; include examples or constraints.'], structure: ['Purpose and audience', 'Prerequisites / context', 'Steps or technical explanation', 'Example / expected result', 'Limitations or troubleshooting'], task: 'Write beginner-friendly technical documentation explaining how to run a simple web application locally. Include prerequisites, setup steps, how to start it and how a user can confirm it is running.' },
  { id: 'persuasive', name: 'Persuasive Writing', application: 'Proposals and client communication', purpose: 'Make a convincing case using reader needs, sound reasoning and evidence.', hints: ['Understand what matters to the reader.', 'Make one clear recommendation.', 'Support it with relevant reasons or evidence.', 'Acknowledge a realistic concern or trade-off.', 'Finish with a specific next step rather than pressure.'], structure: ['Audience need / problem', 'Main recommendation', 'Reasons and evidence', 'Concern and response', 'Call to action'], task: 'Write a persuasive message to your team lead explaining why the team should adopt code reviews for a student software project. Use practical benefits and acknowledge one possible drawback.' },
  { id: 'critical', name: 'Critical Thinking', application: 'Problem-solving and decision-making', purpose: 'Organise reasoning, compare options and reach a justified conclusion.', hints: ['Separate the problem from assumptions about its cause.', 'Identify the facts you know and what is still uncertain.', 'Compare at least two possible approaches.', 'Consider trade-offs and likely consequences.', 'End with a conclusion supported by your reasoning.'], structure: ['Problem statement', 'Known facts and assumptions', 'Options', 'Trade-offs', 'Reasoned recommendation'], task: 'A student project team is missing deadlines because tasks are not clearly assigned. Analyse the likely causes, compare two ways to improve coordination and recommend one approach with reasons.' },
  { id: 'proofread', name: 'Proofreading & Editing', application: 'Finalising professional documents', purpose: 'Find errors, ambiguity and unnecessary content before sharing a document.', hints: ['Check the purpose and whether every paragraph supports it.', 'Review sentence grammar, spelling and punctuation.', 'Look for vague references such as “this” without a clear subject.', 'Remove repetition and unnecessary words.', 'Check names, dates, figures, formatting and consistency separately.'], structure: ['Purpose and completeness check', 'Organisation check', 'Sentence-level edit', 'Spelling and punctuation check', 'Final accuracy check'], task: 'Write a short professional update (100–140 words) about a completed team task and then proofread it yourself before submitting. Keep the message factual, clear and ready to send.' }
];

export default function WritingLab() {
  const [mode, setMode] = useState<'topic' | 'skills' | null>(null);
  const [topicChoice, setTopicChoice] = useState<'manual' | 'ai'>('manual');
  const [manualTopic, setManualTopic] = useState('');
  const [topic, setTopic] = useState('');
  const [topicSource, setTopicSource] = useState('');
  const [topicBusy, setTopicBusy] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [draft, setDraft] = useState('');
  const [review, setReview] = useState<Review | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showHints, setShowHints] = useState(true);
  const prompt = mode === 'topic' ? topic : selectedSkill?.task || '';
  const title = mode === 'topic' ? topic : selectedSkill?.name || 'Professional writing practice';
  const wordCount = useMemo(() => draft.trim() ? draft.trim().split(/\s+/).length : 0, [draft]);

  const resetDraft = () => { setDraft(''); setReview(null); setErrorMessage(''); };
  const chooseMode = (next: 'topic' | 'skills') => { setMode(next); setTopic(''); setTopicSource(''); setSelectedSkill(null); resetDraft(); };
  const getTopic = async () => {
    setTopicBusy(true); setErrorMessage('');
    try {
      const response = await api.post('/api/writing-topic', {});
      setTopic(String(response.data.topic || ''));
      setTopicSource(String(response.data.source || 'ai'));
      resetDraft();
    } catch { setErrorMessage('A topic could not be suggested right now. Please try again.'); }
    finally { setTopicBusy(false); }
  };
  const useManualTopic = () => {
    if (manualTopic.trim().length < 3) { setErrorMessage('Enter a topic with at least three characters.'); return; }
    setTopic(manualTopic.trim()); setTopicSource('manual'); resetDraft();
  };
  const evaluate = async () => {
    if (draft.trim().length < 50) { setErrorMessage('Write at least 50 characters so the feedback has enough evidence to assess.'); return; }
    setBusy(true); setErrorMessage('');
    try {
      const response = await api.post('/api/writing-assessment', {
        mode, skill: selectedSkill ? { name: selectedSkill.name, purpose: selectedSkill.purpose, application: selectedSkill.application } : null,
        prompt, title, draft: draft.trim()
      });
      setReview(response.data as Review);
    } catch { setErrorMessage('The writing assessment could not be generated. Your draft is still here; please retry.'); }
    finally { setBusy(false); }
  };
  const backToSetup = () => { setReview(null); setErrorMessage(''); };
  const startOver = () => { setMode(null); setTopic(''); setTopicSource(''); setSelectedSkill(null); resetDraft(); };

  return (
    <section className="content writing-lab-page">
      <div className="writing-heading">
        <div><span className="writing-eyebrow">VERBAL · WRITING PRACTICE</span><h1>Professional Writing Lab</h1><p>Build clear, confident workplace writing through guided practice and specific AI feedback.</p></div>
        <div className="writing-heading-icon"><PenLine size={23}/></div>
      </div>

      {!mode && <div className="writing-mode-grid">
        <button className="writing-mode-card" onClick={() => chooseMode('topic')}><span className="writing-mode-icon"><BookOpen size={22}/></span><span className="writing-kicker">MODE 01</span><h2>Write About a Topic</h2><p>Choose your own topic or ask AI for a prompt, then write in your own words.</p><b>Start topic writing <ArrowRight size={15}/></b></button>
        <button className="writing-mode-card" onClick={() => chooseMode('skills')}><span className="writing-mode-icon"><Target size={22}/></span><span className="writing-kicker">MODE 02</span><h2>Improve Professional Writing Skills</h2><p>Choose a workplace writing skill. Get beginner hints before writing and a detailed assessment after.</p><b>Explore professional skills <ArrowRight size={15}/></b></button>
      </div>}

      {mode && !review && <div className="writing-flow">
        <div className="writing-toolbar"><button className="btn-outline" onClick={startOver}><ArrowLeft size={14}/> Change writing mode</button><span>{mode === 'topic' ? 'TOPIC WRITING' : 'PROFESSIONAL SKILLS'}</span></div>
        {mode === 'topic' && <div className="panel writing-setup">
          <span className="writing-kicker">CHOOSE YOUR TOPIC</span><h2>What would you like to write about?</h2><p>Write about a subject you know, or get a fresh prompt from AI.</p>
          <div className="writing-choice-row"><button className={topicChoice === 'manual' ? 'active' : ''} onClick={() => {setTopicChoice('manual');setTopic('');setTopicSource('');resetDraft();}}>I will choose a topic</button><button className={topicChoice === 'ai' ? 'active' : ''} onClick={() => {setTopicChoice('ai');setTopic('');setTopicSource('');resetDraft();}}>Give me a topic using AI</button></div>
          {topicChoice === 'manual' ? <label className="writing-field">Your topic<input value={manualTopic} onChange={e => setManualTopic(e.target.value)} placeholder="e.g. Why teamwork matters in software projects" maxLength={180}/><button className="btn-primary" onClick={useManualTopic}>Use this topic <ArrowRight size={14}/></button></label> : <div className="writing-ai-topic"><p>AI will suggest an open-ended topic suitable for professional and general writing practice.</p><button className="btn-primary" disabled={topicBusy} onClick={getTopic}>{topicBusy ? <><LoaderCircle size={14}/> Finding a topic…</> : <><Sparkles size={14}/> Give me a topic</>}</button></div>}
          {topic && <div className="writing-selected-topic"><span className="writing-kicker">{topicSource === 'backup' ? 'BACKUP PRACTICE TOPIC' : topicSource === 'ai' ? 'AI-GENERATED TOPIC' : 'YOUR TOPIC'}</span><h3>{topic}</h3>{topicSource === 'backup' && <p>AI topic suggestions are temporarily unavailable, so a curated practice topic is provided instead.</p>}</div>}
          {errorMessage && <p className="writing-error">{errorMessage}</p>}
        </div>}

        {mode === 'skills' && !selectedSkill && <div className="panel writing-skill-picker"><span className="writing-kicker">CHOOSE A SKILL TO PRACTISE</span><h2>Professional writing skills</h2><p>Start with any skill. Each one includes a beginner guide, a realistic writing task and an individual assessment.</p><div className="writing-skill-grid">{skills.map((skill, i) => <button key={skill.id} className="writing-skill-card" onClick={() => {setSelectedSkill(skill);setShowHints(true);resetDraft();}}><span>{String(i+1).padStart(2,'0')}</span><div><b>{skill.name}</b><small>{skill.application}</small></div><ArrowRight size={15}/></button>)}</div></div>}

        {mode === 'skills' && selectedSkill && <div className="panel writing-skill-guide">
          <div className="writing-skill-guide-head"><div><span className="writing-kicker">BEGINNER GUIDANCE</span><h2>{selectedSkill.name}</h2><p>{selectedSkill.purpose}</p></div><button className="btn-outline" onClick={() => {setSelectedSkill(null);resetDraft();}}>Change skill</button></div>
          <div className="writing-hint-box"><div className="writing-hint-head"><div><b><Sparkles size={15}/> Before you write</b><p>Use these hints to plan your answer. They guide you without writing it for you.</p></div><button onClick={() => setShowHints(v => !v)}>{showHints ? 'Hide hints' : 'Show hints'}</button></div>
            {showHints && <div className="writing-hint-columns"><div><b>Tips to remember</b><ul>{selectedSkill.hints.map((hint,i)=><li key={i}>{hint}</li>)}</ul></div><div><b>Suggested structure</b><ol>{selectedSkill.structure.map((item,i)=><li key={i}>{item}</li>)}</ol></div></div>}
          </div>
        </div>}

        {prompt && <div className="writing-workspace">
          <div className="panel writing-editor">
            <div className="writing-editor-head"><div><span className="writing-kicker">{mode === 'skills' ? 'YOUR PRACTICE TASK' : 'YOUR WRITING PROMPT'}</span><h2>{mode === 'skills' ? selectedSkill?.name : 'Write your response'}</h2></div><span>{wordCount} words</span></div>
            <div className="writing-prompt"><b>Writing task</b><p>{prompt}</p></div>
            <label className="writing-draft-label" htmlFor="writing-draft">Your draft</label>
            <textarea id="writing-draft" value={draft} onChange={e => setDraft(e.target.value)} rows={13} placeholder="Start writing here. Focus on communicating your ideas clearly; you can refine the language after your first draft."/>
            <div className="writing-editor-foot"><span>Minimum 50 characters for a meaningful assessment · {wordCount} words</span><button className="btn-primary" onClick={evaluate} disabled={busy || draft.trim().length < 50}>{busy ? <><LoaderCircle size={14}/> Evaluating…</> : <>Evaluate my writing <ArrowRight size={14}/></>}</button></div>
            {errorMessage && <p className="writing-error">{errorMessage}</p>}
          </div>
          <aside className="writing-side"><div className="panel writing-side-card"><ClipboardList size={18}/><h3>Before submitting</h3><ul><li>Does your writing answer the task?</li><li>Can the reader follow your main point?</li><li>Are your sentences clear and complete?</li><li>Have you removed repeated ideas?</li></ul></div><div className="panel writing-side-card"><Target size={18}/><h3>What AI reviews</h3><p>Task fulfilment, structure, professional tone, clarity, grammar and vocabulary. Feedback is based on the text you submit.</p></div></aside>
        </div>}
      </div>}

      {review && <div className="writing-report">
        <div className="writing-toolbar"><button className="btn-outline" onClick={backToSetup}><ArrowLeft size={14}/> Back to my draft</button><span>WRITING ASSESSMENT</span></div>
        <div className="panel writing-score-hero"><div><span className="writing-kicker">AI WRITING SCORE</span><h2>{review.overallScore}<small>/100</small></h2><p>{review.summary}</p><span className="writing-report-title">{title}</span></div><div className="writing-score-ring" style={{'--writing-score': review.overallScore + '%'} as React.CSSProperties}><b>{review.overallScore}</b></div></div>
        <div className="panel writing-dimensions"><div className="writing-section-title"><h3>Score breakdown</h3><p>Each dimension includes evidence-based feedback from your draft.</p></div>{review.dimensions.map(item => <div className="writing-dimension" key={item.name}><div><b>{item.name}</b><strong>{item.score}/100</strong></div><div className="writing-progress"><span style={{width:item.score+'%'}}/></div><p>{item.feedback}</p></div>)}</div>
        <div className="writing-report-columns"><div className="panel"><h3><CheckCircle2 size={16}/> What you did well</h3><ul>{review.strengths.map((item,i)=><li key={i}>{item}</li>)}</ul></div><div className="panel"><h3><Target size={16}/> What to improve</h3><ul>{review.improvements.map((item,i)=><li key={i}>{item}</li>)}</ul></div></div>
        <div className="panel writing-revision"><h3><Sparkles size={16}/> Example of a stronger version</h3><p>{review.revisedVersion}</p><small>Use this as a learning reference. Keep your own facts, examples and commitments accurate.</small></div>
        <div className="panel writing-revision"><h3>Your future improvement tips</h3><ol>{review.futureTips.map((item,i)=><li key={i}>{item}</li>)}</ol></div>
        <p className="writing-disclaimer">This is AI-generated practice feedback, not a certified language, academic or employer assessment. Scores are formative estimates based on the submitted text.</p>
        <div className="writing-report-actions"><button className="btn-outline" onClick={() => {setReview(null);setDraft('');setErrorMessage('');}}><RotateCcw size={14}/> Practise again</button><button className="btn-primary" onClick={startOver}>Choose another writing mode <ArrowRight size={14}/></button></div>
      </div>}
    </section>
  );
}
