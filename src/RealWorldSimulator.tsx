import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  CheckCircle2,
  Clock3,
  Code2,
  Database,
  FileText,
  Layers3,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import './RealWorldSimulator.css';

type SimulatorRole = 'Software Developer' | 'AI Engineer' | 'Data Analyst';
type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

type Scenario = {
  id: string;
  role: SimulatorRole;
  title: string;
  company: string;
  category: string;
  summary: string;
  context: string;
  assignment: string;
  deliverables: string[];
  skills: string[];
  difficultyNotes: Record<Difficulty, string>;
};

const scenarios: Scenario[] = [
  {
    id: 'dev-booking-race',
    role: 'Software Developer',
    title: 'Stop the duplicate bookings',
    company: 'Northstar Health',
    category: 'Debugging · Backend',
    summary: 'Patients are occasionally receiving the same appointment slot.',
    context: 'Northstar Health has reported that two patients can sometimes confirm the same doctor and time slot. The issue is intermittent and support has supplied two example booking references. The booking API is used by a growing number of clinics.',
    assignment: 'Investigate the likely race condition and propose a safe backend fix. Explain where the consistency guarantee should live and how you would verify it.',
    deliverables: ['Root-cause explanation', 'Proposed code or pseudocode', 'Concurrency test plan'],
    skills: ['Concurrency', 'API design', 'Database integrity', 'Testing'],
    difficultyNotes: {
      Beginner: 'Focus on explaining the duplicate-booking problem and one reliable way to prevent it.',
      Intermediate: 'Compare application-level checks with database constraints and transactional handling.',
      Advanced: 'Address concurrent requests, transaction isolation, idempotency and operational edge cases.',
    },
  },
  {
    id: 'dev-api-outage',
    role: 'Software Developer',
    title: 'Recover a failing customer API',
    company: 'Orbit Commerce',
    category: 'Incident response · APIs',
    summary: 'A customer-facing endpoint has become unreliable after a release.',
    context: 'The support team reports intermittent 500 responses from the order-history endpoint after yesterday’s release. The issue affects some accounts but not all. The team needs a safe diagnosis and a low-risk recovery plan.',
    assignment: 'Prioritise the investigation, identify evidence you would inspect and recommend a recovery plan that limits customer impact.',
    deliverables: ['Investigation sequence', 'Likely failure points', 'Recovery and regression plan'],
    skills: ['Debugging', 'Logs and observability', 'API reliability', 'Prioritisation'],
    difficultyNotes: {
      Beginner: 'Identify the first checks you would make and how you would communicate the issue.',
      Intermediate: 'Use logs, request patterns and release changes to narrow the fault.',
      Advanced: 'Balance rollback, mitigation, data integrity and post-incident prevention.',
    },
  },
  {
    id: 'dev-feature-request',
    role: 'Software Developer',
    title: 'Deliver a late feature change',
    company: 'Cedar Workspace',
    category: 'Feature delivery · Requirements',
    summary: 'A client changes the acceptance criteria close to the deadline.',
    context: 'You are implementing a team invitation feature. The client now wants invitations to expire after 48 hours and wants administrators to revoke them. The original delivery date has not changed.',
    assignment: 'Clarify the requirement, identify the impact on the existing design and propose a realistic delivery plan.',
    deliverables: ['Updated acceptance criteria', 'Implementation outline', 'Risk and test checklist'],
    skills: ['Requirement analysis', 'Design', 'Estimation', 'Communication'],
    difficultyNotes: {
      Beginner: 'Separate the new requirements from the existing scope and list questions for the client.',
      Intermediate: 'Explain data-model, API and UI changes with a practical delivery sequence.',
      Advanced: 'Negotiate scope, migration and backward compatibility under a fixed deadline.',
    },
  },
  {
    id: 'ai-support-hallucination',
    role: 'AI Engineer',
    title: 'Fix an unreliable support assistant',
    company: 'Helio Support',
    category: 'LLM reliability · Evaluation',
    summary: 'The assistant confidently invents refund policies that do not exist.',
    context: 'A customer-support assistant answers questions using a company policy knowledge base. Recent reviews show it invents refund windows and cites irrelevant policy passages. The product team wants a safer experience without making every answer a refusal.',
    assignment: 'Diagnose likely failure points and design an evaluation-led improvement plan for retrieval, prompting and answer behaviour.',
    deliverables: ['Failure analysis', 'Proposed system changes', 'Evaluation examples and success metrics'],
    skills: ['LLM evaluation', 'RAG', 'Prompt design', 'Reliability'],
    difficultyNotes: {
      Beginner: 'Explain why a language model may invent details and how grounding can help.',
      Intermediate: 'Review retrieval quality, context assembly, abstention and test-set design.',
      Advanced: 'Propose measurable offline and online evaluations, risk controls and regression gates.',
    },
  },
  {
    id: 'ai-document-rag',
    role: 'AI Engineer',
    title: 'Improve a policy search assistant',
    company: 'Meridian Finance',
    category: 'RAG · System design',
    summary: 'Employees cannot reliably find the right policy in a large document set.',
    context: 'The internal assistant searches hundreds of policy documents. It often retrieves outdated versions and misses relevant sections when employees use everyday language rather than policy terminology.',
    assignment: 'Design a retrieval pipeline that improves relevance and makes source freshness visible to users.',
    deliverables: ['Retrieval architecture', 'Chunking and ranking approach', 'Evaluation dataset plan'],
    skills: ['Embeddings', 'Retrieval', 'Data pipelines', 'Evaluation'],
    difficultyNotes: {
      Beginner: 'Describe the basic stages of a retrieval-augmented generation system.',
      Intermediate: 'Address metadata filters, chunking, reranking and document versioning.',
      Advanced: 'Design retrieval metrics, freshness controls and a robust evaluation strategy.',
    },
  },
  {
    id: 'ai-model-cost',
    role: 'AI Engineer',
    title: 'Reduce inference cost without losing quality',
    company: 'Vertex Assist',
    category: 'Model evaluation · Optimisation',
    summary: 'An AI feature is exceeding its monthly inference budget.',
    context: 'Usage has doubled and the AI feature is now above its monthly budget. Product leadership wants lower cost, but the current answer quality and response time are important to customers.',
    assignment: 'Propose a measurement-first optimisation plan and explain which quality and latency trade-offs you would monitor.',
    deliverables: ['Baseline metrics', 'Optimisation options', 'Quality guardrail plan'],
    skills: ['Model selection', 'Latency', 'Cost analysis', 'Experiment design'],
    difficultyNotes: {
      Beginner: 'Identify the metrics needed before changing the model or prompt.',
      Intermediate: 'Compare caching, routing, prompt length and model alternatives.',
      Advanced: 'Design controlled experiments with quality thresholds and cost-per-success metrics.',
    },
  },
  {
    id: 'data-sales-drop',
    role: 'Data Analyst',
    title: 'Explain the sales conversion drop',
    company: 'Orbit Commerce',
    category: 'Business analysis · SQL',
    summary: 'The weekly conversion rate fell, and leadership wants an evidence-based explanation.',
    context: 'The e-commerce team reports that conversion fell over the last two weeks. Traffic is roughly stable, but the marketing team suspects checkout friction. You have order, session and campaign tables with daily records.',
    assignment: 'Define the analysis needed to isolate where conversion changed and present the next business action you would recommend.',
    deliverables: ['Metric definition', 'SQL or analysis outline', 'Findings and recommendation'],
    skills: ['SQL', 'Funnel analysis', 'Data interpretation', 'Business communication'],
    difficultyNotes: {
      Beginner: 'Define the conversion metric and outline a simple funnel comparison.',
      Intermediate: 'Segment by device, channel and funnel step; explain data-quality checks.',
      Advanced: 'Address confounding factors, cohort effects and how to validate the suspected cause.',
    },
  },
  {
    id: 'data-customer-churn',
    role: 'Data Analyst',
    title: 'Investigate rising customer churn',
    company: 'Northstar Subscriptions',
    category: 'Analytics · Retention',
    summary: 'Monthly cancellations have increased and the retention team needs direction.',
    context: 'A subscription business has seen a rise in monthly cancellations. The retention team wants to know which customer groups changed, whether the increase is concentrated in a particular tenure band and what action is justified.',
    assignment: 'Build a structured investigation plan and distinguish observed patterns from claims that would need further testing.',
    deliverables: ['Churn metric definition', 'Segmentation and SQL plan', 'Evidence-based recommendation'],
    skills: ['SQL', 'Cohort analysis', 'Statistics', 'Storytelling'],
    difficultyNotes: {
      Beginner: 'Define churn clearly and identify the first useful customer segments.',
      Intermediate: 'Compare cohorts, tenure bands and plan types while checking data quality.',
      Advanced: 'Discuss retention bias, causal limits and a follow-up experiment.',
    },
  },
  {
    id: 'data-inventory',
    role: 'Data Analyst',
    title: 'Resolve an inventory reporting mismatch',
    company: 'Cedar Retail',
    category: 'Data quality · Reporting',
    summary: 'The dashboard and warehouse report different stock numbers.',
    context: 'Store managers see one inventory count in the dashboard while the warehouse export shows another. The mismatch appears most often after returns and transfers are processed.',
    assignment: 'Trace the likely sources of disagreement, define reconciliation checks and recommend how the reporting should communicate uncertainty.',
    deliverables: ['Data lineage questions', 'Reconciliation query outline', 'Reporting recommendation'],
    skills: ['SQL', 'Data quality', 'Reconciliation', 'Stakeholder communication'],
    difficultyNotes: {
      Beginner: 'List the tables and business events you would inspect first.',
      Intermediate: 'Design checks for duplicate, delayed and missing inventory movements.',
      Advanced: 'Propose a consistent stock definition, reconciliation process and monitoring controls.',
    },
  },
];

const roleDetails: Record<SimulatorRole, { description: string; icon: typeof Code2; accent: string }> = {
  'Software Developer': {
    description: 'Debug services, deliver features and make engineering trade-offs.',
    icon: Code2,
    accent: 'blue',
  },
  'AI Engineer': {
    description: 'Design reliable AI systems and evaluate model behaviour.',
    icon: Bot,
    accent: 'violet',
  },
  'Data Analyst': {
    description: 'Investigate business questions and turn data into decisions.',
    icon: ChartNoAxesCombined,
    accent: 'teal',
  },
};

export default function RealWorldSimulator() {
  const [role, setRole] = useState<SimulatorRole>('Software Developer');
  const [difficulty, setDifficulty] = useState<Difficulty>('Beginner');
  const [scenarioId, setScenarioId] = useState('dev-booking-race');
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);

  const roleScenarios = useMemo(() => scenarios.filter(item => item.role === role), [role]);
  const selectedScenario = roleScenarios.find(item => item.id === scenarioId) || roleScenarios[0];

  const chooseRole = (nextRole: SimulatorRole) => {
    setRole(nextRole);
    const firstScenario = scenarios.find(item => item.role === nextRole);
    setScenarioId(firstScenario?.id || '');
    setActiveScenario(null);
  };

  const startBriefing = () => {
    if (selectedScenario) setActiveScenario(selectedScenario);
  };

  if (activeScenario) {
    const RoleIcon = roleDetails[activeScenario.role].icon;
    return (
      <section className="content rws-page">
        <div className="rws-back-row">
          <button className="rws-text-button" onClick={() => setActiveScenario(null)}><ArrowLeft size={15} /> Back to simulation lobby</button>
          <span className="rws-phase-label">PHASE 1 · SCENARIO BRIEFING</span>
        </div>
        <div className="rws-briefing-hero">
          <div className="rws-briefing-copy">
            <span className="rws-eyebrow">YOUR FIRST ASSIGNMENT · {activeScenario.company.toUpperCase()}</span>
            <h1>{activeScenario.title}</h1>
            <p>{activeScenario.summary}</p>
            <div className="rws-meta-row"><span><RoleIcon size={14}/>{activeScenario.role}</span><span><Clock3 size={14}/>30-minute target</span><span>{difficulty}</span></div>
          </div>
          <div className="rws-briefing-symbol"><BriefcaseBusiness size={36}/></div>
        </div>
        <div className="rws-briefing-grid">
          <article className="rws-panel rws-assignment-panel">
            <div className="rws-panel-heading"><div><span className="rws-eyebrow">PROJECT CONTEXT</span><h2>What is happening?</h2></div><FileText size={19}/></div>
            <p>{activeScenario.context}</p>
            <div className="rws-assignment-callout"><span className="rws-eyebrow">YOUR ASSIGNMENT</span><p>{activeScenario.assignment}</p></div>
          </article>
          <aside className="rws-panel">
            <div className="rws-panel-heading"><div><span className="rws-eyebrow">EXPECTED DELIVERABLES</span><h2>What you'll submit</h2></div><Target size={18}/></div>
            <ul className="rws-deliverables">{activeScenario.deliverables.map(item => <li key={item}><CheckCircle2 size={15}/>{item}</li>)}</ul>
            <div className="rws-skills-block"><span className="rws-eyebrow">SKILLS IN FOCUS</span><div className="rws-tags">{activeScenario.skills.map(skill => <span key={skill}>{skill}</span>)}</div></div>
          </aside>
        </div>
        <div className="rws-panel rws-level-note"><div className="rws-note-icon"><ShieldCheck size={18}/></div><div><b>{difficulty} challenge focus</b><p>{activeScenario.difficultyNotes[difficulty]}</p></div></div>
        <div className="rws-phase-notice"><Sparkles size={17}/><div><b>Your assignment is ready.</b><p>The scenario library and briefing are available in Phase 1. The interactive workbench, AI manager conversations and adaptive challenge events are being added in Phase 2.</p></div></div>
      </section>
    );
  }

  return (
    <section className="content rws-page">
      <div className="rws-hero">
        <div className="rws-hero-copy">
          <span className="rws-eyebrow">CAREERPILOT · PRACTICAL WORKPLACE EXPERIENCE</span>
          <h1>Real-World <span>Job Simulator</span></h1>
          <p>Step into a role, take ownership of a realistic assignment and see what the work actually asks of you.</p>
          <div className="rws-hero-points"><span><Clock3 size={14}/>30-minute work session</span><span><Layers3 size={14}/>Guided + surprise challenges</span><span><ShieldCheck size={14}/>Curated scenarios</span></div>
        </div>
        <div className="rws-hero-mark"><BriefcaseBusiness size={34}/><span>DAY 01</span></div>
      </div>

      <div className="rws-section-heading"><div><span className="rws-eyebrow">STEP 01</span><h2>Choose your job role</h2><p>Each role has its own curated workplace scenarios and deliverables.</p></div><span className="rws-step-count">01 / 03</span></div>
      <div className="rws-role-grid">
        {(Object.keys(roleDetails) as SimulatorRole[]).map(item => {
          const Icon = roleDetails[item].icon;
          return <button key={item} className={'rws-role-card ' + (role === item ? 'selected' : '') + ' ' + roleDetails[item].accent} onClick={() => chooseRole(item)} aria-pressed={role === item}>
            <span className="rws-role-icon"><Icon size={21}/></span><span className="rws-role-check">{role === item ? <CheckCircle2 size={17}/> : null}</span><b>{item}</b><small>{roleDetails[item].description}</small><em>{roleScenarios.length} curated scenarios</em>
          </button>;
        })}
      </div>

      <div className="rws-config-grid">
        <div className="rws-config-main">
          <div className="rws-section-heading"><div><span className="rws-eyebrow">STEP 02</span><h2>Set your challenge level</h2><p>Choose a starting level. Later phases will adapt challenge intensity within this range.</p></div><span className="rws-step-count">02 / 03</span></div>
          <div className="rws-difficulty-grid">
            {(['Beginner', 'Intermediate', 'Advanced'] as Difficulty[]).map((item, index) => <button key={item} className={'rws-difficulty-card ' + (difficulty === item ? 'selected' : '')} onClick={() => setDifficulty(item)} aria-pressed={difficulty === item}><span>0{index + 1}</span><b>{item}</b><small>{item === 'Beginner' ? 'Guided fundamentals and clear expectations' : item === 'Intermediate' ? 'More trade-offs and less scaffolding' : 'Ambiguous constraints and deeper ownership'}</small></button>)}
          </div>

          <div className="rws-section-heading rws-scenario-heading"><div><span className="rws-eyebrow">STEP 03</span><h2>Choose a workplace assignment</h2><p>These scenarios are curated to reflect common entry-level workplace challenges.</p></div><span className="rws-step-count">03 / 03</span></div>
          <div className="rws-scenario-list">
            {roleScenarios.map((item, index) => <button key={item.id} className={'rws-scenario-card ' + (selectedScenario?.id === item.id ? 'selected' : '')} onClick={() => setScenarioId(item.id)} aria-pressed={selectedScenario?.id === item.id}>
              <span className="rws-scenario-index">{String(index + 1).padStart(2, '0')}</span><span className="rws-scenario-copy"><small>{item.category} · {item.company}</small><b>{item.title}</b><span>{item.summary}</span></span><span className="rws-scenario-arrow">{selectedScenario?.id === item.id ? <CheckCircle2 size={18}/> : <ArrowRight size={17}/>}</span>
            </button>)}
          </div>
        </div>

        <aside className="rws-start-panel">
          <div className="rws-start-icon"><BriefcaseBusiness size={22}/></div>
          <span className="rws-eyebrow">SIMULATION SUMMARY</span>
          <h3>{selectedScenario?.title}</h3>
          <p>{selectedScenario?.summary}</p>
          <div className="rws-summary-line"><span>Role</span><b>{role}</b></div>
          <div className="rws-summary-line"><span>Starting level</span><b>{difficulty}</b></div>
          <div className="rws-summary-line"><span>Target duration</span><b>30 minutes</b></div>
          <div className="rws-summary-line"><span>Deliverables</span><b>{selectedScenario?.deliverables.length || 0}</b></div>
          <button className="rws-start-button" disabled={!selectedScenario} onClick={startBriefing}>Review assignment briefing <ArrowRight size={16}/></button>
          <div className="rws-start-foot"><ShieldCheck size={14}/><span>No code execution in this phase. Your workbench arrives in a later phase.</span></div>
        </aside>
      </div>
      <div className="rws-library-note"><Database size={17}/><div><b>Curated scenario library</b><p>Phase 1 uses reviewed scenario templates and difficulty-specific guidance. AI-generated variations and saved simulation sessions are intentionally not enabled yet.</p></div></div>
    </section>
  );
}
