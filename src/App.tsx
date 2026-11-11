import { useEffect, useMemo, useRef, useState } from 'react';
import { api, auth } from '@appdeploy/client';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  FileText,
  Filter,
  GraduationCap,
  ListChecks,
  LoaderCircle,
  LockKeyhole,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  Users,
  X,
  Zap,
} from 'lucide-react';
import './index.css';
import SpeakingLab from './SpeakingLab';
import WritingLab from './WritingLab';
import ReadingLab from './ReadingLab';
import ListeningLab from './ListeningLab';
import HRInterview from './HRInterview';
import InterviewIntelligence from './InterviewIntelligence';
import DailyPlan from './DailyPlan';
import ApplicationsTracker from './ApplicationsTracker';
import JobReadiness from './JobReadiness';
import DailyChallenge from './DailyChallenge';
import RealWorldSimulator from './RealWorldWorkbench';
import { RotateCcw } from 'lucide-react';
import { BookOpen } from 'lucide-react';
import { CalendarCheck } from 'lucide-react';
import { BrainCircuit } from 'lucide-react';

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

type ResumeProfile = {
  name: string;
  email: string;
  headline: string;
  degree?: string;
  certifications?: string[];
  skills: string[];
  education: string[];
  projects: string[];
  experience: string[];
  summary: string;
};
type MatchResult = {
  score: number;
  summary: string;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  recommendations: string[];
};
type RoadmapTask = { id: string; title: string; detail: string; hours: number; resources: {label:string;url:string;kind:string}[] };
type Roadmap = { role:string; experience:string; codingLevel:string; durationWeeks:number; hoursPerWeek:number; priority:string; weeks: { week:number; focus:string; goal:string; tasks: RoadmapTask[]; project:string; outcome:string; checkpoint:string }[] };
const ROADMAP_ROLES=['Software Engineer Intern','Frontend Developer','Backend Developer','Full Stack Developer','AI Engineer','Machine Learning Engineer','Data Scientist','Data Analyst','Cybersecurity Analyst','DevOps Engineer','Cloud Engineer','Data Engineer','Android Developer','iOS Developer','QA / Automation Engineer','Product Manager','UI/UX Designer','Other'];
type InterviewResult = {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  revisedAnswer: string;
  feedback: string;
};
type Application = {
  id: string;
  company: string;
  role: string;
  status: string;
  date: string;
  match: number;
  note: string;
};
type Role = 'student' | 'recruiter';
type QuizQuestion = { question: string; options: string[]; correctIndex: number; explanation: string; concept: string };
type QuizResult = { answers: Record<number, number>; score: number; total: number; completedAt: string };

const QUESTIONS = [
  {
    category: 'Introduction',
    question:
      'Tell me about yourself and the kind of role you are preparing for.',
  },
  {
    category: 'Problem solving',
    question:
      'Describe a difficult problem you solved. What was your approach and what did you learn?',
  },
  {
    category: 'Projects',
    question:
      'Walk me through a project you built. What was your contribution and what would you improve?',
  },
  {
    category: 'Behavioural',
    question:
      'Tell me about a time you received critical feedback and how you acted on it.',
  },
  {
    category: 'Role fit',
    question:
      'Why should a team choose you for this role over another entry-level candidate?',
  },
];

const INITIAL_APPS: Application[] = [
  {
    id: 'a1',
    company: 'Northstar Labs',
    role: 'Software Engineer Intern',
    status: 'Applied',
    date: '2026-10-21',
    match: 78,
    note: 'Recruiter screening pending',
  },
  {
    id: 'a2',
    company: 'Orbit Systems',
    role: 'Graduate Engineer',
    status: 'Assessment',
    date: '2026-10-19',
    match: 84,
    note: 'Online assessment due this week',
  },
  {
    id: 'a3',
    company: 'Cedar Digital',
    role: 'Frontend Developer',
    status: 'Interview',
    date: '2026-10-16',
    match: 71,
    note: 'Prepare project walkthrough',
  },
  {
    id: 'a4',
    company: 'Vertex Analytics',
    role: 'Data Analyst Trainee',
    status: 'Saved',
    date: '2026-10-14',
    match: 63,
    note: 'Review SQL requirements',
  },
];

const INITIAL_PROFILE: ResumeProfile = {
  name: 'Arya Sharma',
  email: 'arya.sharma@example.com',
  headline: 'B.Tech Information Technology · 2027 graduate',
  skills: ['Java', 'Python', 'SQL', 'React', 'Git', 'Data Structures'],
  education: ['B.Tech Information Technology · 2023–2027'],
  projects: ['Campus Event Management System', 'Resume analysis dashboard'],
  experience: ['Academic and personal projects'],
  summary:
    'Entry-level software candidate building practical projects and strengthening core computer science fundamentals.',
};

const JOBS = [
  {
    company: 'Northstar Labs',
    role: 'Software Engineer Intern',
    location: 'Bengaluru · Hybrid',
    type: 'Internship',
    match: 86,
    skills: ['Java', 'Data Structures', 'SQL', 'Git'],
    salary: '₹25k–35k / month',
    posted: '2 days ago',
  },
  {
    company: 'Orbit Systems',
    role: 'Graduate Engineer Trainee',
    location: 'Noida · On-site',
    type: 'Full-time',
    match: 81,
    skills: ['Java', 'SQL', 'OOP', 'Problem solving'],
    salary: '₹5.5–7 LPA',
    posted: '1 day ago',
  },
  {
    company: 'Cedar Digital',
    role: 'Frontend Developer',
    location: 'Remote · India',
    type: 'Full-time',
    match: 74,
    skills: ['React', 'JavaScript', 'CSS', 'REST APIs'],
    salary: '₹6–9 LPA',
    posted: '4 days ago',
  },
  {
    company: 'Vertex Analytics',
    role: 'Data Analyst Trainee',
    location: 'Gurugram · Hybrid',
    type: 'Full-time',
    match: 67,
    skills: ['SQL', 'Python', 'Excel', 'Statistics'],
    salary: '₹4.5–6 LPA',
    posted: '3 days ago',
  },
];

function readStore<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}
function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function App() {
  const [role, setRole] = useState<Role>(() =>
    readStore('careerpilot-role', 'student')
  );
  const [page, setPage] = useState('daily-plan');
  const [verbalExpanded, setVerbalExpanded] = useState(false);
  const [quizMode,setQuizMode]=useState<'practice'|'interview'>('practice');
  const [quizSourceMode,setQuizSourceMode]=useState<'topic'|'pdf'>('topic');
  const [quizTopic,setQuizTopic]=useState(''); const [quizPdfName,setQuizPdfName]=useState('');
  const [quizSourceText,setQuizSourceText]=useState(''); const [quizRole,setQuizRole]=useState('Software Engineer');
  const [quizDifficulty,setQuizDifficulty]=useState('Medium'); const [quizCount,setQuizCount]=useState('10'); const [quizMinutes,setQuizMinutes]=useState('15');
  const [quizStatus,setQuizStatus]=useState<'setup'|'instructions'|'active'|'results'>('setup');
  const [quizQuestions,setQuizQuestions]=useState<QuizQuestion[]>([]); const [quizAnswers,setQuizAnswers]=useState<Record<number,number>>({});
  const [quizRemaining,setQuizRemaining]=useState(0); const [quizResult,setQuizResult]=useState<QuizResult|null>(null);
  const [quizTips,setQuizTips]=useState<string[]>([]); const [quizGenerating,setQuizGenerating]=useState(false);
  const quizFileInput=useRef<HTMLInputElement>(null);
  const [indiaNow, setIndiaNow] = useState(() => new Date());
  const [profile, setProfile] = useState<ResumeProfile>(() =>
    readStore('careerpilot-profile', INITIAL_PROFILE)
  );
  const [resumeText, setResumeText] = useState(() =>
    readStore('careerpilot-resume-text', '')
  );
  const [resumeName, setResumeName] = useState(() =>
    readStore('careerpilot-resume-name', 'Sample student profile')
  );
  const [resumePdfBase64, setResumePdfBase64] = useState('');
  const [applications, setApplications] = useState<Application[]>(() =>
    readStore('careerpilot-applications', INITIAL_APPS)
  );
  const [jobTitle, setJobTitle] = useState('Software Engineer Intern');
  const [jobCompany, setJobCompany] = useState('Northstar Labs');
  const [jobDescription, setJobDescription] = useState(
    'We are looking for a software engineering intern with Java, data structures, object-oriented programming, SQL, Git, debugging, and clear communication skills. Candidates should demonstrate projects, an understanding of algorithms, and the ability to work with a team.'
  );
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(() => readStore('careerpilot-roadmap', null));
  const [roadmapRole,setRoadmapRole]=useState(()=>readStore('careerpilot-roadmap-role','Software Engineer Intern'));
  const [roadmapCustomRole,setRoadmapCustomRole]=useState('');
  const [roadmapExperience,setRoadmapExperience]=useState(()=>readStore('careerpilot-roadmap-experience','Beginner / Student'));
  const [roadmapCoding,setRoadmapCoding]=useState(()=>readStore('careerpilot-roadmap-coding','Beginner'));
  const [roadmapDuration,setRoadmapDuration]=useState(()=>readStore('careerpilot-roadmap-duration','12'));
  const [roadmapHours,setRoadmapHours]=useState(()=>readStore('careerpilot-roadmap-hours','8'));
  const [roadmapChecks,setRoadmapChecks]=useState<Record<string,boolean>>(()=>readStore('careerpilot-roadmap-checks',{}));
  const [roadmapMonth,setRoadmapMonth]=useState(()=>new Date().getMonth());
  const [roadmapYear,setRoadmapYear]=useState(()=>new Date().getFullYear());
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [interviewResult, setInterviewResult] =
    useState<InterviewResult | null>(null);
  const [liveInterviewRole, setLiveInterviewRole] = useState('Software Engineer Intern');
  const [liveInterviewType, setLiveInterviewType] = useState<'HR' | 'Technical'>('Technical');
  const [liveInterviewDifficulty, setLiveInterviewDifficulty] = useState('Intermediate');
  const [liveInterviewStyle, setLiveInterviewStyle] = useState('Professional');
  const [liveInterviewDuration, setLiveInterviewDuration] = useState('30');
  const [liveInterviewJobDescription, setLiveInterviewJobDescription] = useState('');
  const [liveInterviewMode, setLiveInterviewMode] = useState<'text' | 'audio'>('audio');
  const [liveInterviewPanel, setLiveInterviewPanel] = useState<'transcript' | 'flow' | 'notes'>('transcript');
  const [liveInterviewNotes, setLiveInterviewNotes] = useState('');
  const [liveCameraOn, setLiveCameraOn] = useState(false);
  const [liveSpeakerOn, setLiveSpeakerOn] = useState(true);
  const [liveInterviewerSpeaking, setLiveInterviewerSpeaking] = useState(false);
  const [liveResumeFileName, setLiveResumeFileName] = useState('');
  const [liveMicActive, setLiveMicActive] = useState(false);
  const liveResumeInput = useRef<HTMLInputElement>(null);
  const speechRecognition = useRef<MediaRecorder | null>(null);
  const liveAudioStream = useRef<MediaStream | null>(null);
  const liveAudioChunks = useRef<Blob[]>([]);
  const [liveInterviewResume, setLiveInterviewResume] = useState(() => readStore('careerpilot-live-interview-resume', readStore('careerpilot-resume-text', '')));
  const [liveInterviewActive, setLiveInterviewActive] = useState(false);
  const [liveInterviewHistory, setLiveInterviewHistory] = useState<{ speaker: 'interviewer' | 'candidate'; content: string }[]>([]);
  const [liveInterviewDraft, setLiveInterviewDraft] = useState('');
  const [liveInterviewReport, setLiveInterviewReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [eligibility, setEligibility] = useState({
    cgpa: '7.2',
    backlogs: '0',
    graduation: '2027',
    allowedBacklogs: '0',
    minCgpa: '6.5',
    branch: 'Information Technology',
  });
  const [mobileNav, setMobileNav] = useState(false);
  const [accountUser, setAccountUser] = useState<{userId:string;email?:string;name?:string;picture?:string;scope:string}|null>(null);
  const [accountReady, setAccountReady] = useState(false);
  const [accountBusy, setAccountBusy] = useState(false);
  const resumeInput = useRef<HTMLInputElement>(null);

  const saveProfile = (next: ResumeProfile, text?: string, name?: string) => {
    setProfile(next);
    localStorage.setItem('careerpilot-profile', JSON.stringify(next));
    if (text !== undefined) {
      setResumeText(text);
      localStorage.setItem('careerpilot-resume-text', text);
    }
    if (name !== undefined) {
      setResumeName(name);
      localStorage.setItem('careerpilot-resume-name', name);
    }
  };
  const saveApps = (next: Application[]) => {
    setApplications(next);
    localStorage.setItem('careerpilot-applications', JSON.stringify(next));
  };

  useEffect(() => {
    const updateIndiaClock = () => setIndiaNow(new Date());
    updateIndiaClock();
    const clockTimer = window.setInterval(updateIndiaClock, 1000);
    return () => window.clearInterval(clockTimer);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const user = await auth.getUser();
        if (!active) return;
        setAccountUser(user);
        if (user) {
          const result = await api.get('/api/student-profile');
          if (!active) return;
          const saved = result.data;
          if (saved?.profile) {
            setProfile(saved.profile as ResumeProfile);
            setResumeText(saved.resumeText || ''); setResumeName(saved.resumeName || 'Uploaded resume');
            setResumePdfBase64(saved.resumePdfBase64 || '');
            setLiveInterviewResume(saved.resumeText || '');
            localStorage.setItem('careerpilot-profile', JSON.stringify(saved.profile));
            localStorage.setItem('careerpilot-resume-text', saved.resumeText || '');
            localStorage.setItem('careerpilot-resume-name', saved.resumeName || 'Uploaded resume');
            localStorage.setItem('careerpilot-live-interview-resume', saved.resumeText || '');
          } else {
            setProfile(current => ({...current, name:user.name || current.name, email:user.email || current.email}));
          }
        }
      } catch { if (active) setNotice('Could not restore your account profile. Please refresh before changing saved resume details.'); }
      finally { if (active) setAccountReady(true); }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!accountUser || !accountReady) return;
    const timer = window.setTimeout(() => {
      void api.put('/api/student-profile', {profile, resumeText, resumeName, resumePdfBase64}).catch(() => setNotice('Cloud sync failed. Your changes remain on this device; check your connection.'));
    }, 800);
    return () => window.clearTimeout(timer);
  }, [accountUser?.userId, accountReady, profile, resumeText, resumeName, resumePdfBase64]);

  async function signInWithGoogle() {
    setAccountBusy(true); setNotice('Redirecting to Google sign-in…');
    try { await auth.signInWithRedirect({scope:'openid email profile offline_access'}); }
    catch { setAccountBusy(false); setNotice('Google sign-in could not start. Enable browser storage and try again.'); }
  }
  async function signOutAccount() {
    try { await auth.signOut(); setAccountUser(null); setAccountReady(false); setNotice('You have signed out.'); }
    catch { setNotice('Could not sign out. Please retry.'); }
  }
  useEffect(() => {
    const receiveResume = async (event: MessageEvent) => {
      if (event.origin !== 'https://resumate-eu6i0y.v2.appdeploy.ai') return;
      if (event.data?.type !== 'CAREERPILOT_RESUME_READY') return;
      const payload = event.data.payload as { resume?: any; pdfBase64?: string; fileName?: string };
      const r = payload?.resume;
      const pdf = payload?.pdfBase64;
      if (!r || typeof pdf !== 'string' || pdf.length < 100 || pdf.length > 8_000_000) {
        setNotice('The resume could not be received. Please try uploading it again.');
        return;
      }
      const education = Array.isArray(r.education) ? r.education : [];
      const projects = Array.isArray(r.projects) ? r.projects : [];
      const experience = Array.isArray(r.experience) ? r.experience : [];
      const certifications = Array.isArray(r.certifications) ? r.certifications : [];
      const nextProfile: ResumeProfile = {
        name: String(r.profile?.name || profile.name || ''),
        email: String(r.profile?.email || profile.email || ''),
        headline: String(r.profile?.headline || ''),
        degree: String(education[0]?.degree || profile.degree || ''),
        skills: Array.isArray(r.skills) ? r.skills.filter((x:unknown):x is string=>typeof x==='string') : [],
        education: education.map((x:any)=>[x.degree,x.school,x.location,x.dates,x.detail].filter(Boolean).join(' · ')),
        projects: projects.map((x:any)=>[x.name,x.description,x.stack,...(x.bullets||[])].filter(Boolean).join(' — ')),
        experience: experience.map((x:any)=>[x.role,x.company,x.location,x.dates,...(x.bullets||[])].filter(Boolean).join(' — ')),
        certifications: certifications.filter((x:unknown):x is string=>typeof x==='string'),
        summary: String(r.profile?.summary || '')
      };
      const fullText = [nextProfile.name,nextProfile.headline,nextProfile.email,nextProfile.summary,'EDUCATION',...nextProfile.education,'SKILLS',...nextProfile.skills,'PROJECTS',...nextProfile.projects,'EXPERIENCE',...nextProfile.experience,'CERTIFICATIONS',...nextProfile.certifications].join('\\n');
      const fileName = String(payload.fileName || 'CareerPilot-Resume.pdf').slice(0,180);
      try {
        await api.put('/api/student-profile', {profile:nextProfile,resumeText:fullText,resumeName:fileName,resumePdfBase64:pdf});
        setProfile(nextProfile); setResumeText(fullText); setResumeName(fileName); setResumePdfBase64(pdf);
        setLiveInterviewResume(fullText); localStorage.setItem('careerpilot-live-interview-resume',fullText);
        localStorage.setItem('careerpilot-profile',JSON.stringify(nextProfile));
        localStorage.setItem('careerpilot-resume-text',fullText); localStorage.setItem('careerpilot-resume-name',fileName);
        setMatchResult(null); setRoadmap(null); setPage('resume');
        setNotice('Your new resume has been uploaded. The previous version has been replaced in your CareerPilot profile.');
      } catch { setNotice('Resume received, but it could not be saved to your student account. Please retry while signed in.'); }
    };
    window.addEventListener('message', receiveResume);
    return () => window.removeEventListener('message', receiveResume);
  }, [profile]);

  const nav = [
    { id: 'daily-plan', label: 'My Daily Plan', icon: CalendarCheck, group: 'WORKSPACE' },
    { id: 'daily-challenge', label: 'Daily Challenge', icon: Zap, group: 'WORKSPACE' },
    {
      id: 'build-resume',
      label: 'Build resume',
      icon: FileText,
      group: 'WORKSPACE',
    },
    { id: 'jobs', label: 'Job matching', icon: Target, group: 'WORKSPACE' },
    {
      id: 'roadmap',
      label: 'Learning roadmap',
      icon: ListChecks,
      group: 'WORKSPACE',
    },
    { id: 'quiz', label: 'Quiz Studio', icon: ClipboardCheck, group: 'PREPARATION' },
    { id: 'verbal', label: 'Verbal', icon: Activity, group: 'PREPARATION' },
    {
      id: 'interview',
      label: 'HR Interview Preparation',
      icon: MessageSquareText,
      group: 'PREPARATION',
    },
    {
      id: 'live-interview',
      label: 'AI Interview Room',
      icon: MessageSquareText,
      group: 'PREPARATION',
    },
    { id: 'interview-intelligence', label: 'Interview Intelligence', icon: BrainCircuit, group: 'PREPARATION' },
    { id: 'real-world-simulator', label: 'Real-World Job Simulator', icon: BriefcaseBusiness, group: 'PREPARATION' },
    {
      id: 'applications',
      label: 'Applications',
      icon: BriefcaseBusiness,
      group: 'PREPARATION',
    },
  ];
  const filteredApps = applications.filter(
    a =>
      (a.company + ' ' + a.role).toLowerCase().includes(search.toLowerCase()) &&
      (statusFilter === 'All statuses' || a.status === statusFilter)
  );
  const applicationCounts = useMemo(
    () => ({
      active: applications.filter(
        a => !['Rejected', 'Offer'].includes(a.status)
      ).length,
      interviews: applications.filter(a => a.status === 'Interview').length,
      offers: applications.filter(a => a.status === 'Offer').length,
      saved: applications.filter(a => a.status === 'Saved').length,
    }),
    [applications]
  );
  const readiness = Math.min(
    100,
    Math.round(
      profile.skills.length * 5.5 +
        (profile.projects.length > 0 ? 16 : 0) +
        (resumeText ? 10 : 0) +
        (matchResult ? 10 : 0)
    )
  );
  const eligibilityPass =
    Number(eligibility.cgpa) >= Number(eligibility.minCgpa) &&
    Number(eligibility.backlogs) <= Number(eligibility.allowedBacklogs);

  async function parseResume(file: File) {
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
    if (file.size > (isPdf ? 6 : 12) * 1024 * 1024) {
      setNotice(isPdf ? 'Choose a PDF smaller than 6 MB so it can be saved with your profile.' : 'Choose a resume smaller than 12 MB.');
      return;
    }
    setLoading(true);
    setNotice('Reading resume…');
    try {
      let text = '';
      let pdfBase64 = '';
      if (isPdf) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        let binary = '';
        for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
        pdfBase64 = btoa(binary);
        const pdf = await getDocument({ data: bytes }).promise;
        for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text +=
            content.items
              .map((item: unknown) =>
                typeof item === 'object' && item !== null && 'str' in item
                  ? String((item as { str: unknown }).str)
                  : ''
              )
              .join(' ') + '\n';
        }
      } else {
        text = await file.text();
      }
      if (text.trim().length < 60) {
        setNotice(
          'Not enough selectable text found. Try a text-based PDF or TXT file. Scanned-image OCR is not included.'
        );
        return;
      }
      const result = await api.post('/api/resume-parse', {
        text: text.slice(0, 24000),
        filename: file.name,
      });
      const parsed = result.data.profile as ResumeProfile;
      saveProfile(parsed, text, file.name);
      if (pdfBase64) setResumePdfBase64(pdfBase64);
      setLiveInterviewResume(text.slice(0,16000));
      localStorage.setItem('careerpilot-live-interview-resume', text.slice(0,16000));
      setMatchResult(null);
      setRoadmap(null);
      setNotice(
        'Resume parsed. Review extracted details and correct anything inaccurate.'
      );
      setPage('resume');
    } catch {
      setNotice(
        'Resume parsing failed. Try a text-based PDF or TXT file, or check the connection.'
      );
    } finally {
      setLoading(false);
      if (resumeInput.current) resumeInput.current.value = '';
    }
  }

  async function runMatch() {
    if (jobDescription.trim().length < 40) {
      setNotice('Paste a complete job description to get a meaningful match.');
      return;
    }
    setLoading(true);
    setNotice('Comparing your profile with the role requirements…');
    setMatchResult(null);
    try {
      const result = await api.post('/api/match', {
        profile,
        resumeText: resumeText.slice(0, 16000),
        title: jobTitle,
        company: jobCompany,
        description: jobDescription,
      });
      setMatchResult(result.data as MatchResult);
      setNotice(
        'Match report ready. Use it as guidance, not an automated hiring decision.'
      );
    } catch {
      setNotice(
        'Could not generate the match report. Try a shorter job description.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function buildRoadmap() {
    const targetRole=roadmapRole==='Other'?roadmapCustomRole.trim():roadmapRole;
    if(!targetRole){setNotice('Enter the role you want to prepare for.');return;}
    setLoading(true);setNotice('Building your detailed role-specific roadmap…');
    try {
      const result=await api.post('/api/roadmap',{profile,resumeText:resumeText.slice(0,12000),match:matchResult,targetRole,experience:roadmapExperience,codingLevel:roadmapCoding,durationWeeks:Number(roadmapDuration),hoursPerWeek:Number(roadmapHours),description:matchResult?jobDescription:''});
      const plan=result.data as Roadmap;
      setRoadmap(plan);setRoadmapChecks({});
      localStorage.setItem('careerpilot-roadmap',JSON.stringify(plan));localStorage.setItem('careerpilot-roadmap-checks','{}');
      localStorage.setItem('careerpilot-roadmap-role',roadmapRole);localStorage.setItem('careerpilot-roadmap-experience',roadmapExperience);localStorage.setItem('careerpilot-roadmap-coding',roadmapCoding);localStorage.setItem('careerpilot-roadmap-duration',roadmapDuration);localStorage.setItem('careerpilot-roadmap-hours',roadmapHours);
      setNotice((plan as Roadmap & {generationMode?:string}).generationMode==='fallback' ? 'Your roadmap is ready using the built-in role curriculum. AI generation is temporarily unavailable; you can still use and track this plan.' : 'Your AI-generated roadmap is ready. Tick tasks as you complete them.');
    } catch (e) {setNotice(e instanceof Error ? e.message : 'Could not build the roadmap. Please retry or choose a shorter duration.');}
    finally{setLoading(false);}
  }
  function toggleRoadmapTask(id:string,checked:boolean){setRoadmapChecks(current=>{const next={...current,[id]:checked};localStorage.setItem('careerpilot-roadmap-checks',JSON.stringify(next));return next;});}
  const roadmapTaskCount=roadmap?.weeks.reduce((n,w)=>n+w.tasks.length,0)||0;
  const roadmapDone=Object.values(roadmapChecks).filter(Boolean).length;
  const roadmapPercent=roadmapTaskCount?Math.round(roadmapDone/roadmapTaskCount*100):0;
  const today=new Date();
  const calendarFirst=new Date(roadmapYear,roadmapMonth,1);
  const calendarDays=new Date(roadmapYear,roadmapMonth+1,0).getDate();
  const calendarCells=[...Array(calendarFirst.getDay()).fill(null),...Array.from({length:calendarDays},(_,i)=>i+1)];

  async function evaluateAnswer() {
    if (answerText.trim().length < 25) {
      setNotice('Write at least a few sentences before requesting feedback.');
      return;
    }
    setLoading(true);
    setNotice(
      'Reviewing your answer for clarity, evidence, structure and role fit…'
    );
    setInterviewResult(null);
    try {
      const result = await api.post('/api/interview-feedback', {
        question: QUESTIONS[questionIndex],
        answer: answerText,
        profile,
        targetRole: jobTitle,
      });
      setInterviewResult(result.data as InterviewResult);
      setNotice(
        'Feedback ready. Use the suggestions to practise a second attempt.'
      );
    } catch {
      setNotice('Interview feedback could not be generated. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLiveResumeUpload(file: File) {
    if (file.size > 12 * 1024 * 1024) { setNotice('Choose a resume smaller than 12 MB.'); return; }
    setLoading(true); setNotice('Extracting your resume details…');
    try {
      let text = '';
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const pdf = await getDocument({ data: await file.arrayBuffer() }).promise;
        for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
          const page = await pdf.getPage(i); const content = await page.getTextContent();
          text += content.items.map((item: unknown) => typeof item === 'object' && item !== null && 'str' in item ? String((item as { str: unknown }).str) : '').join(' ') + '\\n';
        }
      } else if (file.name.toLowerCase().endsWith('.txt') || file.type.startsWith('text/')) { text = await file.text(); }
      else { setNotice('Upload a text-based PDF or TXT resume. Scanned PDFs and DOCX files are not supported here yet.'); return; }
      if (text.trim().length < 60) { setNotice('Not enough selectable text found. Try a text-based PDF or TXT resume.'); return; }
      setLiveInterviewResume(text.slice(0, 16000)); setLiveResumeFileName(file.name);
      localStorage.setItem('careerpilot-live-interview-resume', text.slice(0, 16000));
      try { const parsed = await api.post('/api/resume-parse', { text: text.slice(0, 24000), filename: file.name }); saveProfile(parsed.data.profile as ResumeProfile, text, file.name); } catch { /* Resume text remains available if structured extraction fails. */ }
      setNotice('Resume uploaded. The interviewer will use the extracted skills, projects, experience and certifications when present.');
    } catch { setNotice('Could not read this resume. Try a text-based PDF or TXT file.'); }
    finally { setLoading(false); if (liveResumeInput.current) liveResumeInput.current.value = ''; }
  }

  function speakInterviewer(text: string) {
    if (liveInterviewMode !== 'audio' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'en-IN'; utterance.rate = 0.94;
    const indianVoice = window.speechSynthesis.getVoices().find(voice => voice.lang.toLowerCase() === 'en-in');
    if (indianVoice) utterance.voice = indianVoice; window.speechSynthesis.speak(utterance);
  }

  async function startAudioResponse() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { setNotice('Audio recording is not supported here. Use the latest Chrome or Edge over HTTPS, or type your answer.'); return; }
    try {
      setNotice('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      liveAudioStream.current = stream;
      const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
      const mimeType = candidates.find(type => MediaRecorder.isTypeSupported(type)) || '';
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 32000 }) : new MediaRecorder(stream, { audioBitsPerSecond: 32000 });
      liveAudioChunks.current = [];
      recorder.ondataavailable = event => { if (event.data?.size) liveAudioChunks.current.push(event.data); };
      recorder.onerror = () => { setLiveMicActive(false); stream.getTracks().forEach(track => track.stop()); liveAudioStream.current = null; setNotice('Recording stopped unexpectedly. Check microphone permission and try again.'); };
      recorder.onstop = () => {
        const actualType = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(liveAudioChunks.current, { type: actualType });
        liveAudioChunks.current = [];
        stream.getTracks().forEach(track => track.stop());
        liveAudioStream.current = null;
        speechRecognition.current = null;
        setLiveMicActive(false);
        void transcribeLiveAudio(blob, actualType.split(';')[0]);
      };
      speechRecognition.current = recorder;
      recorder.start(1000);
      setLiveMicActive(true);
      setNotice('Recording your answer… Press Stop recording when you finish.');
    } catch (cause) {
      liveAudioStream.current?.getTracks().forEach(track => track.stop());
      liveAudioStream.current = null;
      setLiveMicActive(false);
      const name = (cause as DOMException)?.name;
      setNotice(name === 'NotAllowedError' || name === 'PermissionDeniedError' ? 'Microphone access was blocked. Allow microphone access in your browser settings and try again.' : 'Could not start the microphone. Check that it is connected and not being used by another app.');
    }
  }

  function stopAudioResponse() {
    const recorder = speechRecognition.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
  }

  async function transcribeLiveAudio(blob: Blob, mimeType: string) {
    if (!blob.size) { setNotice('No audio was captured. Try recording again or type your answer.'); return; }
    if (blob.size > 1400000) { setNotice('This recording is too large. Please record a shorter answer (about 60 seconds) and try again.'); return; }
    setLoading(true);
    setNotice('Transcribing your answer with CareerPilot AI…');
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Audio conversion failed'));
        reader.onerror = () => reject(new Error('Audio conversion failed'));
        reader.readAsDataURL(blob);
      });
      const audioData = dataUrl.split(',')[1] || '';
      const result = await api.post('/api/hr-transcribe', { audioData, mimeType });
      const transcript = String(result.data?.transcript || '').trim();
      if (!transcript) throw new Error('No transcript returned');
      setLiveInterviewDraft(current => current.trim() ? current.trim() + ' ' + transcript : transcript);
      const uncertain = Array.isArray(result.data?.uncertainPhrases) ? result.data.uncertainPhrases.filter((v: unknown) => typeof v === 'string' && v.trim()).slice(0, 5) : [];
      setNotice(uncertain.length ? 'Transcript ready. Please double-check unclear phrases: ' + uncertain.join('; ') : 'Transcript ready. Review or edit it, then send your answer.');
    } catch {
      setNotice('AI transcription could not process this recording. You can record again or type your answer.');
    } finally { setLoading(false); }
  }

  async function startLiveInterview() {
    const candidateResume = liveInterviewResume.trim() || resumeText.trim();
    if (!liveInterviewRole.trim()) { setNotice('Enter the role you are interviewing for.'); return; }
    setLoading(true); setNotice('Preparing your interview room…'); setLiveInterviewReport(null);
    try {
      const result = await api.post('/api/live-interview-turn', {
        role: liveInterviewRole.trim(), interviewType: liveInterviewType, difficulty: liveInterviewDifficulty,
        style: liveInterviewStyle, durationMinutes: Number(liveInterviewDuration), jobDescription: liveInterviewJobDescription.trim(),
        resume: candidateResume, history: [], message: ''
      });
      const firstTurn = { speaker: 'interviewer' as const, content: result.data.interviewerMessage };
      setLiveInterviewHistory([firstTurn]); setLiveInterviewActive(true); setLiveInterviewDraft('');
      setLiveInterviewPanel('transcript'); setLiveInterviewerSpeaking(false);
      speakInterviewer(result.data.interviewerMessage);
      if (candidateResume) localStorage.setItem('careerpilot-live-interview-resume', candidateResume);
      setPage('live-interview'); setNotice('Interview started. Take your time and answer naturally.');
    } catch { setNotice('Could not start the interview. Please check your connection and try again.'); }
    finally { setLoading(false); }
  }

  async function sendLiveInterviewAnswer(forceRate = false) {
    const message = liveInterviewDraft.trim();
    const shouldRate = forceRate || /now\s+we\s+end\s+this\s+interview\s+here\s+now\s+give\s+me\s+the\s+rating|now\s+rate\s+the\s+interview/i.test(message);
    if (!shouldRate && message.length < 2) { setNotice('Write your answer before sending it.'); return; }
    setLoading(true);
    try {
      if (shouldRate) {
        if (speechRecognition.current && speechRecognition.current.state !== 'inactive') speechRecognition.current.stop(); setLiveMicActive(false);
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        setNotice('Ending the interview and preparing your assessment…');
        const result = await api.post('/api/live-interview-rate', {
          role: liveInterviewRole, interviewType: liveInterviewType, resume: liveInterviewResume.trim() || resumeText,
          history: liveInterviewHistory
        });
        setLiveInterviewReport(result.data);
        try {
          await api.post('/api/interview-attempts', {
            attemptId: 'live-' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 10)),
            source: 'ai_interview_room', interviewType: liveInterviewType, targetRole: liveInterviewRole,
            overallScore: result.data.overallScore, dimensions: result.data.dimensions,
            strengths: result.data.strengths, improvements: result.data.improvements,
            actionPlan: result.data.actionPlan, transcript: liveInterviewHistory.map(turn => turn.speaker.toUpperCase() + ': ' + turn.content).join('\\n').slice(0, 22000),
            completedAt: new Date().toISOString(), difficulty: liveInterviewDifficulty
          });
        } catch { setNotice('Interview report ready, but cloud history could not be saved. You can retry from Interview Intelligence.'); }
        setLiveInterviewActive(false);
        setLiveInterviewDraft('');
        setNotice('Interview complete. Your role-specific assessment is ready.');
      } else {
        const nextHistory = [...liveInterviewHistory, { speaker: 'candidate' as const, content: message }];
        const result = await api.post('/api/live-interview-turn', {
          role: liveInterviewRole, interviewType: liveInterviewType, difficulty: liveInterviewDifficulty,
          style: liveInterviewStyle, durationMinutes: Number(liveInterviewDuration), jobDescription: liveInterviewJobDescription.trim(),
          resume: liveInterviewResume.trim() || resumeText, history: nextHistory, message
        });
        setLiveInterviewHistory([...nextHistory, { speaker: 'interviewer' as const, content: result.data.interviewerMessage }]);
        speakInterviewer(result.data.interviewerMessage);
        setLiveInterviewDraft('');
        setNotice('');
      }
    } catch { setNotice('The interviewer could not respond. Your previous answers are still on screen; please try again.'); }
    finally { setLoading(false); }
  }

  function resetLiveInterview() {
    setLiveInterviewActive(false);
    setLiveInterviewHistory([]);
    setLiveInterviewDraft('');
    setLiveInterviewReport(null); setLiveMicActive(false);
    if (speechRecognition.current && speechRecognition.current.state !== 'inactive') speechRecognition.current.stop();
    liveAudioStream.current?.getTracks().forEach(track => track.stop());
    liveAudioStream.current = null;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setNotice('');
  }

  async function readQuizPdf(file: File) {
    if(file.size>10*1024*1024){setNotice('Choose a PDF smaller than 10 MB.');return;}
    setQuizGenerating(true);
    try {
      const pdf=await getDocument({data:await file.arrayBuffer()}).promise; let extracted='';
      for(let i=1;i<=Math.min(pdf.numPages,35);i++){const p=await pdf.getPage(i);const c=await p.getTextContent();extracted+=c.items.map((item:unknown)=>typeof item==='object'&&item!==null&&'str' in item?String((item as {str:unknown}).str):'').join(' ')+'\\n';}
      if(extracted.trim().length<80){setNotice('This PDF has too little selectable text. Scanned/image-only PDFs are not supported yet.');return;}
      setQuizSourceText(extracted.slice(0,24000));setQuizPdfName(file.name);setNotice('PDF text extracted. AI will use this content as the quiz source.');
    }catch{setNotice('Could not read this PDF. Try a text-based PDF file.');}
    finally{setQuizGenerating(false);if(quizFileInput.current)quizFileInput.current.value='';}
  }
  async function generateQuiz(){
    const source=quizSourceMode==='pdf'?quizSourceText.trim():quizTopic.trim();
    if(source.length<(quizSourceMode==='pdf'?80:3)){setNotice(quizSourceMode==='pdf'?'Upload a text-based PDF before generating the quiz.':'Enter a topic or subject to build your quiz.');return;}
    if(quizMode==='interview'&&!quizRole.trim()){setNotice('Enter the role you are preparing to interview for.');return;}
    setQuizGenerating(true);setNotice('AI is analysing your material and preparing balanced MCQs…');
    try{
      const result=await api.post('/api/quiz-generate',{mode:quizMode,sourceType:quizSourceMode,source,topic:quizTopic,targetRole:quizRole,difficulty:quizDifficulty,questionCount:Number(quizCount)});
      const questions=result.data.questions as QuizQuestion[];
      if(!Array.isArray(questions)||questions.length!==Number(quizCount)||questions.some(q=>!q.question||!Array.isArray(q.options)||q.options.length!==4||!Number.isInteger(q.correctIndex)||q.correctIndex<0||q.correctIndex>3||!q.explanation))throw new Error('The generated quiz did not pass question validation. Please generate it again.');
      setQuizQuestions(questions);setQuizAnswers({});setQuizResult(null);setQuizTips([]);setQuizRemaining(Number(quizMinutes)*60);setQuizStatus('instructions');setNotice('Your quiz is ready. Review the instructions before starting.');
    }catch(e){setNotice(e instanceof Error?e.message:'Could not generate this quiz. Try a shorter topic or PDF.');}
    finally{setQuizGenerating(false);}
  }
  function finishQuiz(){
    if(quizStatus!=='active')return;
    const score=quizQuestions.reduce((sum,q,i)=>sum+(quizAnswers[i]===q.correctIndex?1:0),0);
    setQuizResult({answers:{...quizAnswers},score,total:quizQuestions.length,completedAt:new Date().toISOString()});setQuizStatus('results');
    setNotice(quizRemaining<=0?'Time is up. Your quiz was submitted automatically.':'Quiz submitted. Review every answer and your improvement plan below.');
    void api.post('/api/quiz-feedback',{mode:quizMode,topic:quizTopic||quizPdfName,targetRole:quizRole,difficulty:quizDifficulty,mistakes:quizQuestions.map((q,i)=>({concept:q.concept,question:q.question,chosen:quizAnswers[i]===undefined?'Not answered':q.options[quizAnswers[i]],correct:q.options[q.correctIndex],explanation:q.explanation})).filter((q,i)=>quizAnswers[i]!==quizQuestions[i].correctIndex)})
      .then(r=>setQuizTips(Array.isArray(r.data.tips)?r.data.tips:[]))
      .catch(()=>setQuizTips(['Review the explanations for every missed question.','Make short notes on concepts you could not recall.','Attempt another quiz on the same topic after revising.']));
  }
  useEffect(()=>{if(quizStatus!=='active')return;const timer=window.setInterval(()=>setQuizRemaining(v=>Math.max(0,v-1)),1000);return()=>window.clearInterval(timer);},[quizStatus]);
  useEffect(()=>{if(quizStatus==='active'&&quizRemaining===0)finishQuiz();},[quizStatus,quizRemaining]);
  const resetQuiz=()=>{setQuizStatus('setup');setQuizQuestions([]);setQuizAnswers({});setQuizResult(null);setQuizTips([]);setQuizRemaining(Number(quizMinutes)*60);setNotice('');};
  const setPageSafe = (id: string) => {
    setPage(id);
    if (id === 'speaking-lab' || id === 'writing-lab' || id === 'reading-lab' || id === 'listening-lab') setVerbalExpanded(true);
    setMobileNav(false);
    setNotice('');
  };
  const showInitials = (profile.name || 'A')
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="app-shell">
      <aside className={'sidebar ' + (mobileNav ? 'mobile-open' : '')}>
        <div className="brand-row">
          <div className="brand-mark">
            <span>c</span>
            <i />
          </div>
          <div className="brand-name">
            career<span>pilot</span>
          </div>
          <button className="close-mobile" onClick={() => setMobileNav(false)}>
            <X size={18} />
          </button>
        </div>
        <div className="student-workspace-label"><GraduationCap size={17}/><span><b>Student workspace</b><small>Career development</small></span></div>
        <div className="nav-scroll">
          {['WORKSPACE', 'PREPARATION'].map(group => (
            <div key={group}>
              <div className="nav-group">{group}</div>
              {nav
                .filter(
                  n =>
                    n.group === group
                )
                .map(item => {
                  const Icon = item.icon;
                  if (item.id === 'verbal') {
                    return (
                      <div key={item.id} className="nav-verbal-group">
                        <button
                          className={'nav-link ' + (page === 'speaking-lab' || page === 'writing-lab' || page === 'reading-lab' || page === 'listening-lab' || verbalExpanded ? 'selected' : '')}
                          onClick={() => setVerbalExpanded(value => !value)}
                          aria-expanded={verbalExpanded}
                        >
                          <Icon size={17} />
                          <span>{item.label}</span>
                          <ChevronDown size={14} className={'nav-verbal-chevron ' + (verbalExpanded ? 'is-open' : '')} />
                        </button>
                        {verbalExpanded && (
                          <div className="nav-verbal-submenu">
                            <button
                              className={'nav-verbal-sublink ' + (page === 'speaking-lab' ? 'selected' : '')}
                              onClick={() => setPageSafe('speaking-lab')}
                            >
                              <span className="nav-verbal-dot" />
                              <span>Communication Lab</span>
                            </button>
                            <button
                              className={'nav-verbal-sublink ' + (page === 'writing-lab' ? 'selected' : '')}
                              onClick={() => setPageSafe('writing-lab')}
                            >
                              <span className="nav-verbal-dot" />
                              <span>Writing Lab</span>
                            </button>
                            <button
                              className={'nav-verbal-sublink ' + (page === 'reading-lab' ? 'selected' : '')}
                              onClick={() => setPageSafe('reading-lab')}
                            >
                              <span className="nav-verbal-dot" />
                              <span>Reading Lab</span>
                            </button>
                            <button className={'nav-verbal-sublink ' + (page === 'listening-lab' ? 'selected' : '')} onClick={() => setPageSafe('listening-lab')}>
                              <span className="nav-verbal-dot" />
                              <span>Listening Lab</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return (
                    <button
                      key={item.id}
                      className={'nav-link ' + (page === item.id ? 'selected' : '')}
                      onClick={() => setPageSafe(item.id)}
                    >
                      <Icon size={17} />
                      <span>{item.label}</span>
                      {item.id === 'applications' && role === 'student' && (
                        <em>{applicationCounts.active}</em>
                      )}
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <button className="sidebar-user-profile" onClick={() => setPageSafe('resume')} title="Open student profile"><div className="user-avatar">{showInitials}</div><div className="user-details"><b>{profile.name || 'Student profile'}</b><span>{accountUser?.email || 'View profile'}</span></div></button>
            <button title="Profile" onClick={() => setPageSafe('resume')}>
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu"
              onClick={() => setMobileNav(!mobileNav)}
            >
              <Menu size={19} />
            </button>
            <div className="crumb">
              Workspace <span>/</span>{' '}
              <b>{page === 'speaking-lab' ? 'Communication Lab' : page === 'writing-lab' ? 'Writing Lab' : page === 'reading-lab' ? 'Reading Lab' : page === 'listening-lab' ? 'Listening Lab' : nav.find(n => n.id === page)?.label || 'Workspace'}</b>
            </div>
          </div>
          <div className="topbar-right">
            <div className="india-clock" aria-label="Current date and time in India">
              <span className="india-clock-date">{new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' }).format(indiaNow)}</span>
              <strong>{new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).format(indiaNow)}</strong>
              <small>IST</small>
            </div>
            <button className="google-account-button" disabled={accountBusy} onClick={() => accountUser ? void signOutAccount() : void signInWithGoogle()}>{accountUser ? <><CheckCircle2 size={14}/><span>{accountUser.name || accountUser.email || 'Student account'}</span><small>Sign out</small></> : <><LockKeyhole size={14}/><span>{accountBusy ? 'Connecting…' : 'Sign in with Google'}</span></>}</button>
            <div className="status-online">
              <i /> All systems normal
            </div>
            <button
              className="top-icon"
              title="Search applications"
              onClick={() => setPageSafe('applications')}
            >
              <Search size={17} />
            </button>
            <button
              className="profile-pill"
              onClick={() => setPageSafe('resume')}
            >
              <span>{showInitials}</span>
              <ChevronDown size={13} />
            </button>
          </div>
        </header>

        {notice && (
          <div className="notice">
            <span>{notice}</span>
            <button onClick={() => setNotice('')}>
              <X size={14} />
            </button>
          </div>
        )}

        {page === 'speaking-lab' && <SpeakingLab />}
        {page === 'writing-lab' && <WritingLab />}
        {page === 'reading-lab' && <ReadingLab />}
        {page === 'listening-lab' && <ListeningLab />}

        {page === 'quiz' && (
          <section className="content quiz-studio-page">
            <PageHeader eyebrow="PRACTICE & PREPARATION" title="Quiz Studio" subtitle="Turn any topic or study material into a focused MCQ session, then learn from every mistake." />
            {quizStatus === 'setup' && <>
              <div className="quiz-mode-grid">
                <button className={'quiz-mode-card '+(quizMode==='practice'?'selected':'')} onClick={()=>setQuizMode('practice')}><span className="quiz-mode-icon"><BookOpen size={19}/></span><b>Practice a topic</b><small>Check understanding, recall and application of a subject or chapter.</small><em>{quizMode==='practice'?'Selected':'Choose practice'}</em></button>
                <button className={'quiz-mode-card '+(quizMode==='interview'?'selected':'')} onClick={()=>setQuizMode('interview')}><span className="quiz-mode-icon"><BriefcaseBusiness size={19}/></span><b>Interview focused</b><small>Prepare for role-specific interviews with applied questions and realistic scenarios.</small><em>{quizMode==='interview'?'Selected':'Choose interview prep'}</em></button>
              </div>
              <div className="panel quiz-config-panel">
                <div className="panel-heading"><div><h3>{quizMode==='practice'?'Build your practice quiz':'Build your interview quiz'}</h3><p>{quizMode==='practice'?'AI will use your topic or study material to create a balanced assessment.':'AI will shape questions around the role and knowledge area you provide.'}</p></div><span className="source-badge">AI powered</span></div>
                {quizMode==='interview'&&<label className="quiz-field">Target interview role<input value={quizRole} onChange={e=>setQuizRole(e.target.value)} placeholder="e.g. Java Developer, Data Analyst, Frontend Engineer"/></label>}
                <div className="quiz-field"><span className="quiz-field-label">Choose your quiz source</span><div className="quiz-source-toggle"><button className={quizSourceMode==='topic'?'active':''} onClick={()=>setQuizSourceMode('topic')}>Enter a topic</button><button className={quizSourceMode==='pdf'?'active':''} onClick={()=>setQuizSourceMode('pdf')}>Upload a PDF</button></div></div>
                {quizSourceMode==='topic'?<label className="quiz-field">Topic or subject<textarea value={quizTopic} onChange={e=>setQuizTopic(e.target.value)} placeholder={quizMode==='practice'?'e.g. DBMS — normalization, indexing, transactions and ACID properties':'e.g. Java — OOP, collections, multithreading and exception handling'} rows={4}/></label>:<div className="quiz-upload-area"><input ref={quizFileInput} type="file" accept=".pdf,application/pdf" hidden onChange={e=>{const f=e.target.files?.[0];if(f)void readQuizPdf(f);}}/><button className="quiz-upload-button" onClick={()=>quizFileInput.current?.click()} disabled={quizGenerating}><FileText size={20}/><span><b>{quizPdfName||'Choose a study PDF'}</b><small>{quizSourceText?'Text extracted and ready for AI analysis':'Text-based PDF, up to 10 MB · first 35 pages'}</small></span><Upload size={17}/></button>{quizSourceText&&<button className="quiz-clear-source" onClick={()=>{setQuizSourceText('');setQuizPdfName('');}}>Remove PDF</button>}<p>Scanned or image-only PDFs are not supported yet. Extracted text is sent to AI for quiz generation.</p></div>}
                <div className="quiz-settings-grid">
                  <label className="quiz-field">Difficulty<select value={quizDifficulty} onChange={e=>setQuizDifficulty(e.target.value)}><option>Easy</option><option>Medium</option><option>Hard</option></select></label>
                  <label className="quiz-field">Number of questions<select value={quizCount} onChange={e=>setQuizCount(e.target.value)}>{[5,10,15,20,25,30].map(n=><option key={n} value={n}>{n} questions</option>)}</select></label>
                  <label className="quiz-field">Time allotted<select value={quizMinutes} onChange={e=>setQuizMinutes(e.target.value)}>{[5,10,15,20,30,45,60,90].map(n=><option key={n} value={n}>{n} minutes</option>)}</select></label>
                </div>
                <div className="quiz-config-footer"><span><ShieldCheck size={14}/> 1 mark per correct answer · No negative marking</span><button className="btn-primary" onClick={()=>void generateQuiz()} disabled={quizGenerating}>{quizGenerating?<><LoaderCircle size={15} className="quiz-spin"/> Analysing material…</>:<><Sparkles size={15}/> Generate quiz</>}</button></div>
              </div>
            </>}
            {quizStatus==='instructions'&&<div className="panel quiz-instructions"><div className="quiz-result-kicker"><CheckCircle2 size={15}/> QUIZ GENERATED</div><h2>Before you begin</h2><p className="quiz-instructions-sub">Your {quizMode==='practice'?'practice':'role-focused interview'} assessment is ready. The timer starts only when you press Start quiz.</p><div className="quiz-summary-chips"><span>{quizMode==='practice'?'Topic practice':'Interview focused'}</span><span>{quizDifficulty}</span><span>{quizQuestions.length} questions</span><span>{quizMinutes} minutes</span></div><ul className="quiz-rules"><li>Every question has four options and exactly one correct answer.</li><li>Each correct answer earns <b>1 mark</b>. There is <b>no negative marking</b>.</li><li>You can change your selected answer before submitting.</li><li>The quiz submits automatically when the timer reaches zero.</li><li>You can submit manually at any time. Unanswered questions receive zero marks.</li><li>After submission, you will see your score, correct answers, explanations and improvement tips.</li></ul><div className="quiz-config-footer"><button className="btn-outline" onClick={resetQuiz}>Change settings</button><button className="btn-primary" onClick={()=>{setQuizRemaining(Number(quizMinutes)*60);setQuizStatus('active');setNotice('Quiz started. Good luck.');}}><Zap size={15}/> Start quiz</button></div></div>}
            {quizStatus==='active'&&<div className="quiz-active-wrap"><div className="quiz-active-top panel"><div><span className="quiz-live-label"><i/> QUIZ IN PROGRESS</span><b>{quizMode==='practice'?'Topic practice':'Interview assessment'} · {quizDifficulty}</b><small>{Object.keys(quizAnswers).length} of {quizQuestions.length} answered</small></div><div className={'quiz-countdown '+(quizRemaining<=60?'urgent':'')}><Clock3 size={17}/><strong>{String(Math.floor(quizRemaining/60)).padStart(2,'0')}:{String(quizRemaining%60).padStart(2,'0')}</strong><small>TIME LEFT</small></div></div><div className="quiz-progress-track"><span style={{width:(Object.keys(quizAnswers).length/quizQuestions.length*100)+'%'}}/></div>
              {quizQuestions.map((q,i)=><article className="panel quiz-question-card" key={i}><div className="quiz-question-meta"><span>QUESTION {i+1} OF {quizQuestions.length}</span><small>1 MARK</small></div><h3>{q.question}</h3><div className="quiz-options">{q.options.map((option,j)=><button key={j} className={'quiz-option '+(quizAnswers[i]===j?'chosen':'')} onClick={()=>setQuizAnswers(current=>({...current,[i]:j}))}><span>{String.fromCharCode(65+j)}</span>{option}</button>)}</div></article>)}
              <div className="quiz-submit-bar"><span>{quizQuestions.length-Object.keys(quizAnswers).length} question(s) unanswered</span><button className="btn-primary" onClick={finishQuiz}>Submit quiz <ArrowRight size={15}/></button></div></div>}
            {quizStatus==='results'&&quizResult&&<div className="quiz-results-wrap">
              <div className="panel quiz-score-hero"><div><span className="quiz-result-kicker"><CheckCircle2 size={15}/> QUIZ COMPLETED</span><h2>{quizResult.score}<small> / {quizResult.total}</small></h2><p>{Math.round(quizResult.score/quizResult.total*100)}% accuracy · {quizResult.total-quizResult.score} incorrect or unanswered</p></div><div className="quiz-score-circle" style={{'--quiz-score':(quizResult.score/quizResult.total*100)+'%'} as React.CSSProperties}><b>{Math.round(quizResult.score/quizResult.total*100)}%</b></div></div>
              <div className="quiz-result-stats"><div className="panel"><small>Correct</small><b>{quizResult.score}</b></div><div className="panel"><small>Incorrect / skipped</small><b>{quizResult.total-quizResult.score}</b></div><div className="panel"><small>Total marks</small><b>{quizResult.total}</b></div></div>
              <div className="panel quiz-review-panel"><div className="panel-heading"><div><h3>Answer review</h3><p>See what you selected and understand the correct answer.</p></div></div>{quizQuestions.map((q,i)=>{const correct=quizResult.answers[i]===q.correctIndex;const chosen=quizResult.answers[i];return <article className={'quiz-review-item '+(correct?'is-correct':'is-wrong')} key={i}><div className="quiz-review-status">{correct?<CheckCircle2 size={14}/>:<X size={14}/>} QUESTION {i+1} · {correct?'CORRECT':'INCORRECT / NOT ANSWERED'}</div><h4>{q.question}</h4><p className="quiz-your-answer">Your answer: <b>{chosen===undefined?'Not answered':q.options[chosen]}</b></p>{!correct&&<p className="quiz-correct-answer">Correct answer: <b>{q.options[q.correctIndex]}</b></p>}<p className="quiz-explanation">{q.explanation}</p><small>Concept: {q.concept}</small></article>;})}</div>
              <div className="panel quiz-tips-panel"><div className="panel-heading"><div><h3>Your next-attempt improvement plan</h3><p>Actionable advice based on the concepts you missed.</p></div><Sparkles size={17}/></div>{quizTips.length?<ol>{quizTips.map((tip,i)=><li key={i}>{tip}</li>)}</ol>:<p className="quiz-tips-loading"><LoaderCircle size={14} className="quiz-spin"/> Analysing your mistakes and preparing personalised tips…</p>}</div>
              <div className="quiz-result-actions"><button className="btn-outline" onClick={resetQuiz}>Create another quiz</button><button className="btn-primary" onClick={()=>{setQuizAnswers({});setQuizResult(null);setQuizTips([]);setQuizRemaining(Number(quizMinutes)*60);setQuizStatus('instructions');}}>Retake this quiz</button></div>
            </div>}
          </section>
        )}

        {page === 'daily-plan' && <DailyPlan profile={profile} roadmap={roadmap} roadmapChecks={roadmapChecks} matchResult={matchResult} applications={applications} targetRole={roadmap?.role || jobTitle} signedIn={!!accountUser} onNavigate={setPageSafe} />}
        {page === 'daily-challenge' && <DailyChallenge />}

        {page === 'overview' && (
          <section className="content">
            <div className="welcome-line">
              <div>
                <p>
                  Small, consistent steps turn preparation into progress. Here's
                  your current placement picture.
                </p>
              </div>
              <button
                className="btn-primary"
                onClick={() => resumeInput.current?.click()}
              >
                <Upload size={16} /> Upload resume
              </button>
              <input
                ref={resumeInput}
                type="file"
                accept=".pdf,.txt,text/plain,application/pdf"
                hidden
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) void parseResume(f);
                }}
              />
            </div>
            <div className="hero-card">
              <div className="hero-copy">
                <div className="hero-overline">
                  <span /> YOUR NEXT CHAPTER STARTS HERE
                </div>
                <h2>
                  Build a career plan
                  <br />
                  that <em>moves with you.</em>
                </h2>
                <p>
                  Understand your strengths, close the right skill gaps, and
                  approach every application with more clarity.
                </p>
                <div className="hero-actions">
                  <button
                    className="btn-light"
                    onClick={() => setPageSafe('jobs')}
                  >
                    Review job matches <ArrowRight size={15} />
                  </button>
                  <button
                    className="btn-quiet"
                    onClick={() => setPageSafe('roadmap')}
                  >
                    View learning plan
                  </button>
                </div>
              </div>
              <div className="hero-illustration">
                <div className="hero-ring ring-one" />
                <div className="hero-ring ring-two" />
                <div className="hero-doc">
                  <div className="doc-top">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="doc-person" />
                  <div className="doc-line wide" />
                  <div className="doc-line" />
                  <div className="doc-line short" />
                  <div className="doc-rule" />
                  <div className="doc-skills">
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
                <div className="floating-score">
                  <div className="score-mark">
                    <TrendingUp size={15} />
                  </div>
                  <div>
                    <b>{readiness}%</b>
                    <small>Profile readiness</small>
                  </div>
                  <ArrowUpRight size={14} />
                </div>
                <div className="floating-check">
                  <CheckCircle2 size={17} />
                  <span>Progress saved</span>
                </div>
              </div>
            </div>
            <div className="metric-grid">
              <div className="metric-card">
                <div className="metric-top">
                  <span>Applications in progress</span>
                  <span className="metric-icon icon-blue">
                    <BriefcaseBusiness size={16} />
                  </span>
                </div>
                <strong>{applicationCounts.active}</strong>
                <div className="metric-bottom">
                  <span className="metric-note">
                    {applicationCounts.saved} saved for later
                  </span>
                  <button onClick={() => setPageSafe('applications')}>
                    View tracker <ArrowRight size={12} />
                  </button>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-top">
                  <span>Interviews scheduled</span>
                  <span className="metric-icon icon-amber">
                    <CalendarDays size={16} />
                  </span>
                </div>
                <strong>{applicationCounts.interviews}</strong>
                <div className="metric-bottom">
                  <span className="metric-note">Keep your answers sharp</span>
                  <button onClick={() => setPageSafe('interview')}>
                    Practise <ArrowRight size={12} />
                  </button>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-top">
                  <span>Skills in your profile</span>
                  <span className="metric-icon icon-green">
                    <Zap size={16} />
                  </span>
                </div>
                <strong>{profile.skills.length}</strong>
                <div className="metric-bottom">
                  <span className="metric-note">
                    Across your current resume
                  </span>
                  <button onClick={() => setPageSafe('resume')}>
                    Review skills <ArrowRight size={12} />
                  </button>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-top">
                  <span>Placement offers</span>
                  <span className="metric-icon icon-purple">
                    <Target size={16} />
                  </span>
                </div>
                <strong>{applicationCounts.offers}</strong>
                <div className="metric-bottom">
                  <span className="metric-note">Every step counts</span>
                  <button onClick={() => setPageSafe('applications')}>
                    View outcomes <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>
            <div className="section-row">
              <div>
                <h2>Your next best steps</h2>
                <p>Actions based on where you are today.</p>
              </div>
              <button
                className="link-button"
                onClick={() => setPageSafe('roadmap')}
              >
                See full roadmap <ArrowRight size={14} />
              </button>
            </div>
            <div className="next-steps">
              <button
                className="step-card"
                onClick={() => setPageSafe('resume')}
              >
                <div className="step-number">01</div>
                <div className="step-body">
                  <b>Review your profile</b>
                  <p>
                    Make sure your resume reflects your latest projects and
                    skills.
                  </p>
                  <span className="step-status">
                    {resumeText ? 'Resume uploaded' : 'Profile starter active'}
                  </span>
                </div>
                <ArrowRight size={16} />
              </button>
              <button className="step-card" onClick={() => setPageSafe('jobs')}>
                <div className="step-number">02</div>
                <div className="step-body">
                  <b>Check role fit</b>
                  <p>
                    Compare your skills against a job description before
                    applying.
                  </p>
                  <span className="step-status">Skill gap analysis</span>
                </div>
                <ArrowRight size={16} />
              </button>
              <button
                className="step-card"
                onClick={() => setPageSafe('interview')}
              >
                <div className="step-number">03</div>
                <div className="step-body">
                  <b>Practise out loud</b>
                  <p>
                    Build a clearer, evidence-backed answer to common questions.
                  </p>
                  <span className="step-status">5 practice questions</span>
                </div>
                <ArrowRight size={16} />
              </button>
            </div>
            <div className="section-row recent-row">
              <div>
                <h2>Recent applications</h2>
                <p>A quick view of your current pipeline.</p>
              </div>
              <button
                className="link-button"
                onClick={() => setPageSafe('applications')}
              >
                Open tracker <ArrowRight size={14} />
              </button>
            </div>
            <ApplicationTable
              apps={applications.slice(0, 4)}
              onStatus={(id, status) =>
                saveApps(
                  applications.map(a => (a.id === id ? { ...a, status } : a))
                )
              }
            />
            <div className="fine-print">
              <ShieldCheck size={14} /> Your profile and tracker are saved in
              this browser. AI-generated recommendations are advisory and do not
              guarantee placement outcomes.
            </div>
          </section>
        )}

        {page === 'build-resume' && (
          <section className="content build-resume-page">
            <PageHeader eyebrow="RESUME STUDIO" title="Build your resume" subtitle="Choose how you want to update the resume saved in your CareerPilot profile." action={<button className="btn-outline" onClick={() => setPageSafe('resume')}>Back to profile</button>} />
            <div className="resume-update-choices">
              <article className="resume-update-choice panel">
                <div className="resume-choice-icon"><Sparkles size={20}/></div>
                <span className="section-eyebrow">OPTION 01</span>
                <h2>Update in Resumate</h2>
                <p>Open the resume builder, make changes in the editor, then send the finished PDF and details back to CareerPilot.</p>
                <button className="btn-primary full-width" onClick={() => document.getElementById('resumate-workspace')?.scrollIntoView({behavior:'smooth',block:'start'})}>Open Resumate editor <ArrowRight size={15}/></button>
              </article>
              <article className="resume-update-choice panel">
                <div className="resume-choice-icon"><Upload size={20}/></div>
                <span className="section-eyebrow">OPTION 02</span>
                <h2>Update manually</h2>
                <p>Already have a resume PDF on your computer? Upload it directly. CareerPilot will extract its details and replace your saved resume.</p>
                <input type="file" accept=".pdf,application/pdf" hidden id="manual-resume-upload" onChange={e => {const file=e.target.files?.[0];if(file)void parseResume(file);e.currentTarget.value='';}} />
                <button className="btn-outline full-width" disabled={loading} onClick={() => document.getElementById('manual-resume-upload')?.click()}>{loading?<LoaderCircle size={15} className="spin"/>:<Upload size={15}/>} Choose resume PDF</button>
                <small className="resume-manual-note">Text-based PDF · up to 6 MB · scanned/image-only PDFs are not supported</small>
              </article>
            </div>
            <div className="build-resume-frame-wrap panel" id="resumate-workspace">
              <div className="build-resume-frame-head"><div><b>Resumate editor</b><span>Use this option to create or edit your resume.</span></div><span className="source-badge">Embedded workspace</span></div>
              <iframe className="build-resume-frame" title="Resumate resume builder" src="https://resumate-eu6i0y.v2.appdeploy.ai/" allow="clipboard-read; clipboard-write" />
            </div>
            <p className="build-resume-help">After editing in Resumate, choose <b>Upload to CareerPilot</b>. Either update option replaces the previous resume saved in your profile.</p>
          </section>
        )}

        {page === 'resume' && (
          <section className="content">
            <PageHeader
              eyebrow="PROFILE & SKILLS"
              title="Resume workspace"
              subtitle="Build a reliable picture of your experience before comparing yourself with a role."
              action={
                <button className="btn-primary" onClick={() => setPageSafe('build-resume')}>
                  <FileText size={15} /> Build / update resume
                </button>
              }
            />
            <input
              ref={resumeInput}
              type="file"
              accept=".pdf,.txt,text/plain,application/pdf"
              hidden
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) void parseResume(f);
              }}
            />
            <div className="resume-layout">
              <div className="panel profile-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Candidate profile</h3>
                    <p>Review and edit extracted information.</p>
                  </div>
                  <span className="source-badge">
                    {resumeText ? 'Resume extracted' : 'Starter profile'}
                  </span>
                </div>
                <div className="profile-summary">
                  <div className="large-avatar">{showInitials}</div>
                  <div>
                    <h2>{profile.name}</h2>
                    <p>{profile.headline}</p>
                    <span>
                      {profile.email || 'Add an email to your resume'}
                    </span>
                  </div>
                </div>
                <div className="field-grid">
                  <label>
                    Full name
                    <input
                      value={profile.name}
                      onChange={e =>
                        saveProfile({ ...profile, name: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Email
                    <input
                      value={profile.email}
                      onChange={e =>
                        saveProfile({ ...profile, email: e.target.value })
                      }
                    />
                  </label>
                  <label className="full-field">Headline<input value={profile.headline} onChange={e => saveProfile({ ...profile, headline: e.target.value })}/></label>
                  <label className="full-field">Degree / programme<input value={profile.degree || profile.education?.[0] || ''} onChange={e => saveProfile({ ...profile, degree: e.target.value })} placeholder="e.g. B.Tech Information Technology"/></label>
                </div>
                <div className="panel-divider" />
                <div className="panel-heading">
                  <div>
                    <h3>Extracted skills</h3>
                    <p>Separate skills with commas to update the list.</p>
                  </div>
                </div>
                <textarea
                  className="skills-editor"
                  value={profile.skills.join(', ')}
                  onChange={e =>
                    saveProfile({
                      ...profile,
                      skills: e.target.value
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
                <div className="skill-tags">
                  {profile.skills.map(s => (
                    <span key={s}>
                      {s}
                      <button
                        title={'Remove ' + s}
                        onClick={() =>
                          saveProfile({
                            ...profile,
                            skills: profile.skills.filter(x => x !== s),
                          })
                        }
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="panel-divider" />
                <div className="panel-heading">
                  <div>
                    <h3>Projects & experience</h3>
                    <p>These details help make your match more useful.</p>
                  </div>
                </div>
                <label className="block-field">
                  Projects
                  <textarea
                    value={profile.projects.join('\n')}
                    onChange={e =>
                      saveProfile({
                        ...profile,
                        projects: e.target.value.split('\n').filter(Boolean),
                      })
                    }
                    placeholder="One project per line"
                  />
                </label>
                <label className="block-field">
                  Experience
                  <textarea
                    value={profile.experience.join('\n')}
                    onChange={e =>
                      saveProfile({
                        ...profile,
                        experience: e.target.value.split('\n').filter(Boolean),
                      })
                    }
                    placeholder="Internships, work, or relevant experience"
                  />
                </label>
                <label className="block-field">
                  Education
                  <textarea
                    value={profile.education.join('\n')}
                    onChange={e =>
                      saveProfile({
                        ...profile,
                        education: e.target.value.split('\n').filter(Boolean),
                      })
                    }
                    placeholder="Degree, institution, graduation year"
                  />
                </label>
                <label className="block-field">Certifications<textarea value={(profile.certifications || []).join('\n')} onChange={e => saveProfile({...profile,certifications:e.target.value.split('\n').map(s=>s.trim()).filter(Boolean)})} placeholder="One certification per line"/></label>
                <label className="block-field">Professional summary<textarea value={profile.summary || ''} onChange={e => saveProfile({...profile,summary:e.target.value})}/></label>
                <div className="panel-heading"><div><h3>Resume details</h3><p>Full extracted text available to CareerPilot tools.</p></div><span className="source-badge">{resumeText ? 'Saved' : 'Not uploaded'}</span></div>
                <pre className="resume-source-text">{resumeText || 'Create a resume in Resumate to make its details available across CareerPilot.'}</pre>
                {resumePdfBase64 && <div className="saved-resume-file"><div><FileText size={18}/><span><b>{resumeName}</b><small>Latest uploaded PDF · previous version replaced</small></span></div><a href={'data:application/pdf;base64,'+resumePdfBase64} download={resumeName || 'CareerPilot-Resume.pdf'} className="btn-outline">Download PDF</a></div>}
                <div className="profile-foot"><CheckCircle2 size={14}/> Changes save on this device{accountUser ? ' and sync to your Google account' : ''}.</div>
              </div>
              <div className="right-stack">
                <div className="panel readiness-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Profile readiness</h3>
                      <p>A practical checklist, not a hiring score.</p>
                    </div>
                    <Target size={18} className="muted-icon" />
                  </div>
                  <div className="readiness-number">
                    {readiness}
                    <span>/100</span>
                  </div>
                  <div className="progress-track">
                    <span style={{ width: readiness + '%' }} />
                  </div>
                  <div className="readiness-list">
                    <div>
                      <CheckCircle2 size={15} />
                      <span>Skills listed</span>
                      <b>
                        {profile.skills.length > 0 ? 'Complete' : 'Add skills'}
                      </b>
                    </div>
                    <div>
                      <CheckCircle2 size={15} />
                      <span>Education added</span>
                      <b>
                        {profile.education.length
                          ? 'Complete'
                          : 'Add education'}
                      </b>
                    </div>
                    <div>
                      <CheckCircle2 size={15} />
                      <span>Projects listed</span>
                      <b>
                        {profile.projects.length ? 'Complete' : 'Add projects'}
                      </b>
                    </div>
                    <div>
                      <CheckCircle2 size={15} />
                      <span>Resume text parsed</span>
                      <b>{resumeText ? 'Complete' : 'Optional'}</b>
                    </div>
                  </div>
                </div>
                <div className="panel upload-panel">
                  <div className="upload-graphic">
                    <Upload size={20} />
                  </div>
                  <h3>Update your resume</h3>
                  <p>Upload a text-based PDF or TXT file once. Your saved resume is reused across job matching, learning roadmaps and interview tools. Upload a new version here whenever you need to replace it.</p>
                  <button className="btn-outline full-width" onClick={() => setPageSafe('build-resume')}>Update in Resumate</button>
                  <button className="btn-quiet full-width" onClick={() => resumeInput.current?.click()}>Upload PDF / TXT directly</button>
                  <small>{resumeName}</small>
                </div>
                <div className="panel note-panel">
                  <ShieldCheck size={16} />
                  <div>
                    <b>Keep it accurate</b>
                    <p>
                      AI extraction can miss context. Confirm names, dates,
                      skill levels and achievements before applying.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {page === 'jobs' && <JobReadiness profile={profile} resumeText={resumeText} onEditProfile={() => setPageSafe('resume')} onBuildRoadmap={(role, description) => { setJobTitle(role); setRoadmapRole(role); setRoadmapCustomRole(''); setJobDescription(description); void buildRoadmap(); }} onNavigate={setPageSafe} onMatchReady={(score, summary, matchedSkills, missingSkills, strengths, recommendations) => setMatchResult({score, summary, matchedSkills, missingSkills, strengths, recommendations})} />}

        {page === 'jobs-legacy' && (
          <section className="content">
            <PageHeader
              eyebrow="ROLE FIT"
              title="Job matching"
              subtitle="Compare your profile to a real role. The report separates evidence you have from skills you may need to build."
            />
            <div className="match-layout">
              <div className="panel job-input-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Role details</h3>
                    <p>
                      Paste the job description as published by the employer.
                    </p>
                  </div>
                  <span className="required-label">Required</span>
                </div>
                <div className="field-grid">
                  <label>
                    Job title
                    <input
                      value={jobTitle}
                      onChange={e => setJobTitle(e.target.value)}
                    />
                  </label>
                  <label>
                    Company
                    <input
                      value={jobCompany}
                      onChange={e => setJobCompany(e.target.value)}
                    />
                  </label>
                </div>
                <label className="block-field">
                  Job description
                  <textarea
                    className="job-description"
                    value={jobDescription}
                    onChange={e => setJobDescription(e.target.value)}
                    placeholder="Paste responsibilities, required skills, qualifications and experience…"
                  />
                </label>
                <div className="input-bottom">
                  <span>
                    <FileText size={14} />{' '}
                    {jobDescription.trim().split(/\s+/).filter(Boolean).length}{' '}
                    words
                  </span>
                  <button
                    className="btn-primary"
                    disabled={loading}
                    onClick={() => void runMatch()}
                  >
                    {loading ? (
                      <LoaderCircle size={15} className="spin" />
                    ) : (
                      <Sparkles size={15} />
                    )}{' '}
                    Analyse match
                  </button>
                </div>
                <div className="inline-profile-note">
                  <div className="tiny-avatar">{showInitials}</div>
                  <span>
                    Matching against <b>{profile.name || 'your profile'}</b> ·{' '}
                    {profile.skills.length} listed skills
                  </span>
                  <button onClick={() => setPageSafe('resume')}>
                    Edit profile
                  </button>
                </div>
              </div>
              <div className="panel role-preview">
                <div className="preview-company">
                  <div className="company-monogram">
                    {(jobCompany || 'C').slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h3>{jobTitle || 'Target role'}</h3>
                    <p>{jobCompany || 'Company name'}</p>
                  </div>
                </div>
                <div className="preview-label">PROFILE USED</div>
                <div className="preview-profile">
                  <div className="tiny-avatar">{showInitials}</div>
                  <div>
                    <b>{profile.name}</b>
                    <span>{profile.headline}</span>
                  </div>
                </div>
                <div className="preview-label">SKILLS IN PROFILE</div>
                <div className="preview-tags">
                  {profile.skills.slice(0, 8).map(s => (
                    <span key={s}>{s}</span>
                  ))}
                </div>
                <div className="preview-footer">
                  <ShieldCheck size={15} /> No application is submitted by
                  running this analysis.
                </div>
              </div>
            </div>
            {matchResult && (
              <div className="match-results">
                <div className="match-score-panel panel">
                  <div>
                    <div className="section-eyebrow">YOUR MATCH REPORT</div>
                    <h2>
                      {matchResult.score}% <span>match</span>
                    </h2>
                    <p>{matchResult.summary}</p>
                  </div>
                  <div
                    className="score-circle"
                    style={
                      {
                        '--score': matchResult.score + '%',
                      } as React.CSSProperties
                    }
                  >
                    <div>
                      <b>{matchResult.score}</b>
                      <span>/100</span>
                    </div>
                  </div>
                </div>
                <div className="match-detail-grid">
                  <div className="panel">
                    <div className="panel-heading">
                      <div>
                        <h3>
                          <CheckCircle2 size={16} /> Skills that align
                        </h3>
                        <p>Evidence found in your profile or resume.</p>
                      </div>
                      <span className="count-pill positive">
                        {matchResult.matchedSkills.length}
                      </span>
                    </div>
                    <div className="result-skill-list">
                      {matchResult.matchedSkills.map(s => (
                        <span key={s} className="positive-skill">
                          <Check size={12} />
                          {s}
                        </span>
                      ))}
                      {!matchResult.matchedSkills.length && (
                        <p className="empty-copy">
                          No clear matches were found in the supplied text.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="panel">
                    <div className="panel-heading">
                      <div>
                        <h3>
                          <Target size={16} /> Skills to develop
                        </h3>
                        <p>Potential gaps to verify against the full role.</p>
                      </div>
                      <span className="count-pill warning">
                        {matchResult.missingSkills.length}
                      </span>
                    </div>
                    <div className="result-skill-list">
                      {matchResult.missingSkills.map(s => (
                        <span key={s} className="missing-skill">
                          {s}
                        </span>
                      ))}
                      {!matchResult.missingSkills.length && (
                        <p className="empty-copy">
                          No obvious skill gaps were identified.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="panel recommendations-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>How to improve your fit</h3>
                      <p>
                        Prioritised actions based on the current comparison.
                      </p>
                    </div>
                    <button
                      className="btn-primary"
                      onClick={() => void buildRoadmap()}
                    >
                      <ListChecks size={15} /> Build my roadmap
                    </button>
                  </div>
                  <ul className="recommendation-list">
                    {[
                      ...matchResult.strengths,
                      ...matchResult.recommendations,
                    ].map((r, i) => (
                      <li key={i}>
                        <span>{String(i + 1).padStart(2, '0')}</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="fine-print">
                  <ShieldCheck size={14} /> This score is an AI-assisted
                  estimate based on supplied text, not a prediction of recruiter
                  decisions.
                </div>
              </div>
            )}
            {!matchResult && (
              <div className="match-hint">
                <div className="hint-icon">
                  <Activity size={19} />
                </div>
                <div>
                  <b>Your analysis will appear here</b>
                  <p>
                    For a useful result, upload your resume first and use the
                    full requirements section from a real job posting.
                  </p>
                </div>
              </div>
            )}
            <div className="section-row">
              <div>
                <h2>Example roles to explore</h2>
                <p>Sample listings for testing the matching workflow.</p>
              </div>
              <span className="demo-label">ILLUSTRATIVE DATA</span>
            </div>
            <div className="job-cards">
              {JOBS.map(j => (
                <div className="job-card" key={j.company + j.role}>
                  <div className="job-card-top">
                    <div className="company-monogram">{j.company[0]}</div>
                    <span className="job-type">{j.type}</span>
                  </div>
                  <h3>{j.role}</h3>
                  <p className="job-company">
                    {j.company} · {j.location}
                  </p>
                  <div className="job-skill-row">
                    {j.skills.slice(0, 3).map(s => (
                      <span key={s}>{s}</span>
                    ))}
                  </div>
                  <div className="job-card-bottom">
                    <span>{j.salary}</span>
                    <button
                      onClick={() => {
                        setJobTitle(j.role);
                        setJobCompany(j.company);
                        setJobDescription(
                          'We are looking for a candidate with ' +
                            j.skills.join(', ') +
                            '. Demonstrate these skills through projects, sound fundamentals, communication, and collaborative problem solving.'
                        );
                        setPageSafe('jobs');
                        setNotice(
                          'Sample role loaded. Click Analyse match to compare it with your profile.'
                        );
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      Use role <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {page === 'roadmap' && (
          <section className="content roadmap-page">
            <PageHeader eyebrow="PERSONALISED DEVELOPMENT" title="Learning roadmap" subtitle="A practical, project-led plan shaped around your target role, current level and available study time." />
            <div className="roadmap-today panel"><div><span className="section-eyebrow">TODAY</span><b>{today.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</b><small>{today.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})} · Your local date</small></div><div className="roadmap-today-icon"><CalendarDays size={22}/></div></div>
            <div className="roadmap-intro"><div className="roadmap-mark"><ListChecks size={23}/></div><div><span className="section-eyebrow">YOUR CURRENT TARGET</span><h2>{roadmap?.role || (roadmapRole==='Other'?roadmapCustomRole:roadmapRole) || 'Software Engineer Intern'}</h2><p>Based on your listed skills{matchResult?' and latest job-match report':''}. Adjust the plan as your priorities change.</p></div><div className="roadmap-duration"><b>{roadmap?.durationWeeks || Number(roadmapDuration)}</b><span>week plan</span></div></div>
            <div className="roadmap-config panel"><div className="panel-heading"><div><h3>Build your learning plan</h3><p>Choose any career path. Your saved resume and skills will be used as context.</p></div><Sparkles size={18}/></div><div className="roadmap-form-grid"><label>Target role<select value={roadmapRole} onChange={e=>setRoadmapRole(e.target.value)}>{ROADMAP_ROLES.map(r=><option key={r}>{r}</option>)}</select></label>{roadmapRole==='Other'&&<label>Enter your role<input value={roadmapCustomRole} onChange={e=>setRoadmapCustomRole(e.target.value)} placeholder="e.g. Blockchain Developer"/></label>}<label>Experience level<select value={roadmapExperience} onChange={e=>setRoadmapExperience(e.target.value)}><option>Beginner / Student</option><option>Fresher (0–1 year)</option><option>Intermediate (1–3 years)</option><option>Career switcher</option></select></label><label>Coding level<select value={roadmapCoding} onChange={e=>setRoadmapCoding(e.target.value)}><option>Beginner</option><option>Basic fundamentals</option><option>Intermediate</option><option>Advanced</option><option>Non-coding / exploring</option></select></label><label>Plan duration<select value={roadmapDuration} onChange={e=>setRoadmapDuration(e.target.value)}>{['4','6','8','12','16','20','24'].map(n=><option key={n} value={n}>{n} weeks</option>)}</select></label><label>Study time per week<select value={roadmapHours} onChange={e=>setRoadmapHours(e.target.value)}>{['3','5','8','10','12','15','20','25','30','35','40','45','50','55','60','65','70','75','80','85','90'].map(n=><option key={n} value={n}>{n} hours</option>)}</select></label></div>{Number(roadmapHours)>40&&<p className="roadmap-hours-warning">This is a very high weekly workload. Check that it is sustainable alongside sleep, college and other responsibilities.</p>}<div className="roadmap-form-foot"><span>Profile: {profile.name || 'Student'} · {profile.skills.length} listed skills · {resumeText?'Resume saved':'No resume uploaded yet'}</span><button className="btn-primary" disabled={loading} onClick={()=>void buildRoadmap()}>{loading?<LoaderCircle size={15} className="spin"/>:<Sparkles size={15}/>} {roadmap?'Regenerate roadmap':'Generate detailed roadmap'}</button></div></div>
            <div className="roadmap-progress panel"><div><div><span className="section-eyebrow">ROADMAP COMPLETION</span><b>{roadmapPercent}%</b></div><p>{roadmapDone} of {roadmapTaskCount} tasks completed</p></div><div className="progress-track"><span style={{width:roadmapPercent+'%'}}/></div></div>
            <div className="roadmap-calendar panel"><div className="panel-heading"><div><h3>Calendar</h3><p>Today is highlighted. Use this to plan your study sessions.</p></div><div className="calendar-nav"><button onClick={()=>{const d=new Date(roadmapYear,roadmapMonth-1,1);setRoadmapMonth(d.getMonth());setRoadmapYear(d.getFullYear());}}><ChevronDown size={15}/></button><b>{calendarFirst.toLocaleDateString('en-IN',{month:'long',year:'numeric'})}</b><button onClick={()=>{const d=new Date(roadmapYear,roadmapMonth+1,1);setRoadmapMonth(d.getMonth());setRoadmapYear(d.getFullYear());}}><ChevronDown size={15}/></button></div></div><div className="calendar-grid">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><b key={d}>{d}</b>)}{calendarCells.map((d,i)=><span key={i} className={d===today.getDate()&&roadmapMonth===today.getMonth()&&roadmapYear===today.getFullYear()?'calendar-today':''}>{d||''}</span>)}</div></div>
            {roadmap ? <><div className="roadmap-priority"><Target size={16}/><div><b>Primary focus</b><p>{roadmap.priority}</p></div></div><div className="roadmap-list">{roadmap.weeks.map(w=><article className="roadmap-week" key={w.week}><div className="week-marker"><span>{String(w.week).padStart(2,'0')}</span><i/></div><div className="week-content"><div className="week-top"><div><span className="week-label">WEEK {w.week}</span><h3>{w.focus}</h3><p>{w.goal}</p></div><span className="week-badge">{w.tasks.reduce((n,t)=>n+(roadmapChecks[t.id]?1:0),0)}/{w.tasks.length} done</span></div><div className="roadmap-task-list">{w.tasks.map(t=><div className={'roadmap-task '+(roadmapChecks[t.id]?'is-done':'')} key={t.id}><label><input type="checkbox" checked={!!roadmapChecks[t.id]} onChange={e=>toggleRoadmapTask(t.id,e.target.checked)}/><span><b>{t.title}</b><small>{t.detail} · ~{t.hours} hrs</small></span></label><div className="roadmap-resources">{t.resources.map((r,i)=><a key={i} href={r.url} target="_blank" rel="noreferrer">{r.kind}: {r.label} ↗</a>)}</div></div>)}</div><div className="roadmap-project"><b>Weekly project:</b> {w.project}</div><div className="week-outcome"><Target size={14}/><span><b>Deliverable:</b> {w.outcome}</span></div><p className="roadmap-checkpoint"><b>End-of-week checkpoint:</b> {w.checkpoint}</p></div></article>)}</div></>:<div className="roadmap-empty panel"><div className="empty-illustration"><CalendarDays size={25}/></div><h3>Build a plan around the role you actually want.</h3><p>Choose your role, current level, study time and duration above. CareerPilot will create a detailed week-by-week plan with projects and learning resources.</p></div>}
            <div className="method-note"><ShieldCheck size={16}/><div><b>Progress is yours to control</b><p>Tick tasks only when completed. Your checklist and progress are saved in this browser; signed-in cloud sync is being added for this roadmap tracker.</p></div></div>
          </section>
        )}

        {page === 'live-interview' && (
          <section className="content live-interview-page">
            <PageHeader
              eyebrow="REALISTIC PRACTICE SESSION"
              title="AI Interview Room"
              subtitle="A conversational, role-specific interview that adapts to your answers and asks follow-up questions. The session stays open until you request your rating."
            />
            {!liveInterviewActive && !liveInterviewReport && (
              <div className="live-setup panel">
                <div className="live-setup-heading"><div className="live-setup-icon"><MessageSquareText size={22}/></div><div><h2>Set up your interview</h2><p>Give the interviewer the same context a recruiter would have.</p></div></div>
                <label className="block-field">Target role<input value={liveInterviewRole} onChange={e=>setLiveInterviewRole(e.target.value)} placeholder="e.g. Graduate Software Engineer"/></label>
                <div className="live-mode-picker"><button type="button" className={'live-mode-card '+(liveInterviewMode==='text'?'selected':'')} onClick={()=>setLiveInterviewMode('text')}><MessageSquareText size={20}/><b>Text-based interview</b><span>Type answers and read follow-up questions.</span></button><button type="button" className={'live-mode-card '+(liveInterviewMode==='audio'?'selected':'')} onClick={()=>setLiveInterviewMode('audio')}><Activity size={20}/><b>Audio-based interview</b><span>Hear the interviewer in Indian English and answer by voice.</span></button></div>
                <div className="live-upload-box"><input ref={liveResumeInput} type="file" accept=".pdf,.txt,application/pdf,text/plain" onChange={e=>{const file=e.target.files?.[0];if(file)void handleLiveResumeUpload(file);}} hidden/><button type="button" className="live-upload-button" disabled={loading} onClick={()=>liveResumeInput.current?.click()}><Upload size={18}/><span><b>{liveResumeFileName || (liveInterviewResume.trim() ? 'Resume ready' : 'Upload your resume')}</b><small>PDF or TXT · max 12 MB · no copy-pasting required</small></span><ArrowRight size={16}/></button>{(liveInterviewResume.trim() || resumeText.trim()) && <p className="live-resume-hint"><CheckCircle2 size={14}/> {liveResumeFileName || 'Previously uploaded resume'} is ready to use.</p>}</div>
                {liveInterviewMode==='audio' && <p className="live-audio-note"><Activity size={15}/> Voice mode uses your browser microphone to record answers and CareerPilot AI to transcribe them. The interviewer speaks using your device's available English voice. No additional API key is required.</p>}
                <div className="live-setup-foot"><span><ShieldCheck size={15}/> Questions are tailored to the role, resume skills, projects, experience and certifications where listed.</span><button className="btn-primary" disabled={loading || (!liveInterviewResume.trim() && !resumeText.trim())} onClick={()=>void startLiveInterview()}>{loading?<LoaderCircle size={15} className="spin"/>:<ArrowRight size={15}/>} Start interview</button></div>
                {!liveInterviewResume.trim() && resumeText.trim() && <p className="live-resume-hint">Your existing uploaded resume will be used. Upload another file to replace it.</p>
              }</div>
            )}
            {liveInterviewActive && (
              <div className="live-room panel">
                <div className="live-room-top"><div className="interviewer-avatar"><MessageSquareText size={20}/></div><div className="live-room-title"><h2>Interview in progress</h2><p>{liveInterviewRole} · AI interviewer · Adaptive follow-ups</p></div><span className="live-status"><i/> LIVE SESSION</span></div>
                <div className="live-context-strip"><span><b>Candidate context</b> Resume-based questions</span><span><b>How it works</b> Answer in your own words; follow-ups may challenge assumptions or ask for evidence.</span></div>
                <div className="live-transcript">
                  {liveInterviewHistory.map((item,i)=><div key={i} className={'live-message '+(item.speaker==='candidate'?'candidate-message':'interviewer-message')}><div className="message-avatar">{item.speaker==='candidate'?(profile.name||'Y').slice(0,1).toUpperCase():<MessageSquareText size={15}/>}</div><div className="message-content"><span>{item.speaker==='candidate'?'YOU': 'INTERVIEWER'}</span><p>{item.content}</p></div></div>)}
                  {loading && <div className="live-thinking"><LoaderCircle size={15} className="spin"/> Interviewer is considering your answer…</div>}
                </div>
                <div className="live-compose"><label htmlFor="live-answer">{liveInterviewMode==='audio'?'Your spoken response':'Your response'}</label>{liveInterviewMode==='audio' && <div className="live-audio-controls"><button type="button" className="btn-outline" disabled={loading || liveMicActive} onClick={()=>void startAudioResponse()}><Activity size={15}/> Start recording</button><button type="button" className="btn-outline" disabled={!liveMicActive} onClick={stopAudioResponse}><CheckCircle2 size={15}/> Stop recording & transcribe</button><span>{liveMicActive?'Recording… speak naturally, then stop.':'Your transcript will appear below for review.'}</span></div>}<textarea id="live-answer" value={liveInterviewDraft} onChange={e=>setLiveInterviewDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();void sendLiveInterviewAnswer(false);}}} placeholder={liveInterviewMode==='audio'?'Your speech transcript appears here. You can also type your answer.':'Answer as if you were speaking to a real interviewer. Press Enter to send, Shift+Enter for a new line.'}/><div className="live-compose-bottom"><span>Be specific. The interviewer may ask you to justify claims or explain trade-offs.</span><button className="btn-primary" disabled={loading||!liveInterviewDraft.trim()} onClick={()=>void sendLiveInterviewAnswer(false)}><ArrowRight size={15}/> Send answer</button></div><div className="live-end-row"><span>Finish the interview when you are ready for your assessment.</span><button className="btn-outline" disabled={loading || liveMicActive} onClick={()=>{setLiveInterviewDraft('now rate the interview');void sendLiveInterviewAnswer(true);}}><CheckCircle2 size={14}/> End & rate interview</button></div></div>
              </div>
            )}
            {liveInterviewReport && (
              <div className="live-report">
                <div className="live-report-hero panel"><div><span className="section-eyebrow">INTERVIEW ASSESSMENT</span><h2>{liveInterviewReport.overallScore}<span>/100</span></h2><p>{liveInterviewReport.summary}</p><div className="live-report-role"><Target size={14}/> Assessed for {liveInterviewRole}</div></div><div className="live-score-ring" style={{'--score':liveInterviewReport.overallScore+'%'} as React.CSSProperties}><div><b>{liveInterviewReport.overallScore}</b><span>/100</span></div></div></div>
                <div className="live-score-grid">{(liveInterviewReport.dimensions||[]).map((d:any)=><div className="panel live-dimension" key={d.name}><span>{d.name}</span><b>{d.score}<small>/100</small></b><div className="progress-track"><span style={{width:d.score+'%'}}/></div><p>{d.feedback}</p></div>)}</div>
                <div className="live-report-grid"><div className="panel"><div className="panel-heading"><div><h3><CheckCircle2 size={16}/> What you did well</h3><p>Strengths supported by your interview answers.</p></div></div><ul className="live-feedback-list">{(liveInterviewReport.strengths||[]).map((s:string,i:number)=><li key={i}>{s}</li>)}</ul></div><div className="panel"><div className="panel-heading"><div><h3><Target size={16}/> Highest-impact improvements</h3><p>Specific changes to make for this role.</p></div></div><ul className="live-feedback-list">{(liveInterviewReport.improvements||[]).map((s:string,i:number)=><li key={i}>{s}</li>)}</ul></div></div>
                <div className="panel live-practice-plan"><div className="panel-heading"><div><h3>Your practice plan</h3><p>Turn the assessment into a repeatable next step.</p></div></div>{(liveInterviewReport.actionPlan||[]).map((a:any,i:number)=><div className="live-action-row" key={i}><span>{String(i+1).padStart(2,'0')}</span><div><b>{a.action}</b><p>{a.why}</p></div></div>)}</div>
                <div className="live-report-actions"><button className="btn-outline" onClick={resetLiveInterview}><RotateCcw size={14}/> Start another interview</button><button className="btn-primary" onClick={()=>setPageSafe('roadmap')}><ListChecks size={15}/> Open learning roadmap</button></div>
                <p className="live-report-disclaimer"><ShieldCheck size={14}/> This is AI-generated practice feedback, not an employer decision. The score reflects the answers in this session and the selected role.</p>
              </div>
            )}
          </section>
        )}

        {page === 'interview' && <HRInterview profile={profile} resumeText={resumeText} />}
        {page === 'interview-intelligence' && <InterviewIntelligence onNavigate={setPageSafe} />}
        {page === 'real-world-simulator' && <RealWorldSimulator />}

        {page === '__legacy-interview-disabled' && (
          <section className="content">
            <PageHeader
              eyebrow="PRACTICE STUDIO"
              title="Mock interview"
              subtitle="Practise one answer at a time. Feedback focuses on structure, specificity and how clearly you communicate your contribution."
            />
            <div className="interview-layout">
              <div className="panel interview-main">
                <div className="interview-top">
                  <div>
                    <span className="section-eyebrow">
                      QUESTION {questionIndex + 1} OF {QUESTIONS.length}
                    </span>
                    <div className="question-progress">
                      {QUESTIONS.map((q, i) => (
                        <span
                          key={q.category}
                          className={i <= questionIndex ? 'done' : ''}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="question-category">
                    {QUESTIONS[questionIndex].category}
                  </span>
                </div>
                <div className="question-content">
                  <div className="question-mark">“</div>
                  <h2>{QUESTIONS[questionIndex].question}</h2>
                  <p>
                    Take a moment to organise your thoughts. A specific example
                    is more useful than a list of general qualities.
                  </p>
                </div>
                <label className="block-field answer-label">
                  YOUR ANSWER
                  <textarea
                    className="answer-editor"
                    value={answerText}
                    onChange={e => setAnswerText(e.target.value)}
                    placeholder="Try a clear structure: situation, your task, the action you took, and the result. Use your own experience…"
                  />
                </label>
                <div className="answer-controls">
                  <span>
                    {answerText.trim().split(/\s+/).filter(Boolean).length}{' '}
                    words
                  </span>
                  <div>
                    <button
                      className="btn-outline"
                      onClick={() => {
                        setAnswerText('');
                        setInterviewResult(null);
                      }}
                    >
                      Clear answer
                    </button>
                    <button
                      className="btn-primary"
                      disabled={loading}
                      onClick={() => void evaluateAnswer()}
                    >
                      {loading ? (
                        <LoaderCircle size={15} className="spin" />
                      ) : (
                        <Sparkles size={15} />
                      )}{' '}
                      Get feedback
                    </button>
                  </div>
                </div>
                {interviewResult && (
                  <div className="feedback-panel">
                    <div className="feedback-head">
                      <div>
                        <span className="section-eyebrow">YOUR FEEDBACK</span>
                        <h3>Specific, actionable notes</h3>
                      </div>
                      <div className="feedback-score">
                        <b>{interviewResult.overallScore}</b>
                        <span>/100</span>
                      </div>
                    </div>
                    <p>{interviewResult.feedback}</p>
                    <div className="feedback-columns">
                      <div>
                        <b className="good-title">
                          <CheckCircle2 size={14} /> What worked
                        </b>
                        {interviewResult.strengths.map((s, i) => (
                          <p key={i}>• {s}</p>
                        ))}
                      </div>
                      <div>
                        <b className="improve-title">
                          <Target size={14} /> What to improve
                        </b>
                        {interviewResult.improvements.map((s, i) => (                          <p key={i}>• {s}</p>
                        ))}
                      </div>
                    </div>
                    <div className="rewrite-box">
                      <b>Example of a tighter answer</b>
                      <p>{interviewResult.revisedAnswer}</p>
                      <small>
                        Use this as a structure guide, not a script to memorise.
                        Keep the facts your own.
                      </small>
                    </div>
                  </div>
                )}
                <div className="question-nav">
                  <button
                    className="btn-outline"
                    disabled={questionIndex === 0}
                    onClick={() => {
                      setQuestionIndex(i => i - 1);
                      setInterviewResult(null);
                    }}
                  >
                    Previous question
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setQuestionIndex(i => (i + 1) % QUESTIONS.length);
                      setAnswerText('');
                      setInterviewResult(null);
                    }}
                  >
                    Next question <ArrowRight size={14} />
                  </button>
                </div>
              </div>
              <div className="interview-aside">
                <div className="panel interview-guide">
                  <div className="guide-icon">
                    <MessageSquareText size={18} />
                  </div>
                  <h3>Answer with substance</h3>
                  <p>
                    Interviewers need to understand what you did, why you did
                    it, and what changed because of your work.
                  </p>
                  <div className="guide-step">
                    <span>S</span>
                    <div>
                      <b>Situation</b>
                      <small>Give the relevant context.</small>
                    </div>
                  </div>
                  <div className="guide-step">
                    <span>T</span>
                    <div>
                      <b>Task</b>
                      <small>Explain your responsibility.</small>
                    </div>
                  </div>
                  <div className="guide-step">
                    <span>A</span>
                    <div>
                      <b>Action</b>
                      <small>Describe your specific decisions.</small>
                    </div>
                  </div>
                  <div className="guide-step">
                    <span>R</span>
                    <div>
                      <b>Result</b>
                      <small>Share outcome and learning.</small>
                    </div>
                  </div>
                </div>
                <div className="panel interview-tips">
                  <h3>Before you submit</h3>
                  <p>
                    <Check size={13} /> Use a real example
                  </p>
                  <p>
                    <Check size={13} /> Be clear about your contribution
                  </p>
                  <p>
                    <Check size={13} /> Include a result or lesson
                  </p>
                  <p>
                    <Check size={13} /> Avoid claiming work you did not do
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {page === 'applications' && (
          <ApplicationsTracker
            applications={applications}
            onChange={saveApps}
            matchScore={matchResult?.score ?? 0}
          />
        )}

        {false && page === 'eligibility' && (
          <section className="content">
            <PageHeader
              eyebrow="PLACEMENT RULES"
              title="Eligibility checker"
              subtitle="Compare your details against a company's published criteria before investing time in an application."
            />
            <div className="eligibility-layout">
              <div className="panel eligibility-form">
                <div className="panel-heading">
                  <div>
                    <h3>Your academic details</h3>
                    <p>Enter values from your latest official records.</p>
                  </div>
                  <ClipboardCheck size={19} className="muted-icon" />
                </div>
                <div className="field-grid">
                  <label>
                    Current CGPA
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.01"
                      value={eligibility.cgpa}
                      onChange={e =>
                        setEligibility({ ...eligibility, cgpa: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Active backlogs
                    <input
                      type="number"
                      min="0"
                      value={eligibility.backlogs}
                      onChange={e =>
                        setEligibility({
                          ...eligibility,
                          backlogs: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Graduation year
                    <select
                      value={eligibility.graduation}
                      onChange={e =>
                        setEligibility({
                          ...eligibility,
                          graduation: e.target.value,
                        })
                      }
                    >
                      {['2026', '2027', '2028', '2029', '2030'].map(y => (
                        <option key={y}>{y}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Degree / branch
                    <input
                      value={eligibility.branch}
                      onChange={e =>
                        setEligibility({
                          ...eligibility,
                          branch: e.target.value,
                        })
                      }
                    />
                  </label>
                </div>
                <div className="panel-divider" />
                <div className="panel-heading">
                  <div>
                    <h3>Company criteria</h3>
                    <p>
                      Replace these examples with the official role
                      requirements.
                    </p>
                  </div>
                </div>
                <div className="field-grid">
                  <label>
                    Minimum CGPA
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={eligibility.minCgpa}
                      onChange={e =>
                        setEligibility({
                          ...eligibility,
                          minCgpa: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Maximum active backlogs
                    <input
                      type="number"
                      min="0"
                      value={eligibility.allowedBacklogs}
                      onChange={e =>
                        setEligibility({
                          ...eligibility,
                          allowedBacklogs: e.target.value,
                        })
                      }
                    />
                  </label>
                </div>
                <div className="inline-alert">
                  <CircleHelp size={15} />
                  <span>
                    Some employers also require no history of backlogs, specific
                    branches, or minimum marks in Class 10 and 12. Add those
                    manually when relevant.
                  </span>
                </div>
              </div>
              <div className="panel eligibility-result">
                <div
                  className={
                    'eligibility-status ' +
                    (eligibilityPass ? 'pass' : 'review')
                  }
                >
                  <div className="eligibility-status-icon">
                    {eligibilityPass ? (
                      <CheckCircle2 size={23} />
                    ) : (
                      <ShieldCheck size={23} />
                    )}
                  </div>
                  <span>
                    {eligibilityPass
                      ? 'Criteria entered: passing'
                      : 'Criteria entered: mismatch'}
                  </span>
                </div>
                <h2>
                  {eligibilityPass
                    ? 'You meet the entered criteria.'
                    : 'One or more criteria are not met.'}
                </h2>
                <p>
                  {eligibilityPass
                    ? 'Based on the values entered, your CGPA and active backlog count meet the selected thresholds. Verify every condition in the official job notice.'
                    : 'Review the comparisons below. This check does not account for any additional conditions unless you enter them.'}
                </p>
                <div className="criteria-check">
                  <div>
                    <span>CGPA threshold</span>
                    <b
                      className={
                        Number(eligibility.cgpa) >= Number(eligibility.minCgpa)
                          ? 'text-pass'
                          : 'text-fail'
                      }
                    >
                      {Number(eligibility.cgpa) >= Number(eligibility.minCgpa)
                        ? 'Meets threshold'
                        : 'Below threshold'}
                    </b>
                    <small>
                      {eligibility.cgpa} / {eligibility.minCgpa} minimum
                    </small>
                  </div>
                  <div>
                    <span>Active backlogs</span>
                    <b
                      className={
                        Number(eligibility.backlogs) <=
                        Number(eligibility.allowedBacklogs)
                          ? 'text-pass'
                          : 'text-fail'
                      }
                    >
                      {Number(eligibility.backlogs) <=
                      Number(eligibility.allowedBacklogs)
                        ? 'Within limit'
                        : 'Exceeds limit'}
                    </b>
                    <small>
                      {eligibility.backlogs} / {eligibility.allowedBacklogs}{' '}
                      allowed
                    </small>
                  </div>
                </div>
                <div className="eligibility-disclaimer">
                  <ShieldCheck size={15} />
                  <span>
                    Indicative only. The employer's official criteria and
                    placement cell rules take precedence.
                  </span>
                </div>
              </div>
            </div>
            <div className="panel criteria-table">
              <div className="panel-heading">
                <div>
                  <h3>Before you apply</h3>
                  <p>
                    A quick checklist for reading eligibility requirements
                    carefully.
                  </p>
                </div>
              </div>
              {[
                'Minimum CGPA / percentage and rounding rules',
                'Active and historical backlog conditions',
                'Eligible degree, branch and graduation batch',
                'Class 10 / 12 marks if specified',
                'Work authorisation, location or joining constraints',
              ].map((s, i) => (
                <div className="checklist-row" key={s}>
                  <span>{i + 1}</span>
                  {s}
                  <CheckCircle2 size={15} />
                </div>
              ))}
            </div>
          </section>
        )}

        {false && page === 'recruiter' && (
          <section className="content">
            <PageHeader
              eyebrow="HIRING OPERATIONS"
              title="Recruiter insights"
              subtitle="A sample campus hiring overview for reviewing pipeline health, candidate readiness and skill demand."
              action={
                <button
                  className="btn-outline"
                  onClick={() =>
                    setNotice(
                      'These analytics use illustrative demo records. Connect your placement database before using them for real hiring decisions.'
                    )
                  }
                >
                  <CalendarDays size={14} /> Last 30 days{' '}
                  <ChevronDown size={13} />
                </button>
              }
            />
            <div className="demo-notice">
              <Activity size={15} />
              <span>
                <b>Demo analytics</b> — these are illustrative candidate and
                pipeline figures, not live college placement data.
              </span>
            </div>
            <div className="recruiter-metrics">
              <div className="recruiter-stat">
                <div>
                  <span>Active candidates</span>
                  <Users size={17} />
                </div>
                <b>248</b>
                <small>
                  <i>+12%</i> vs previous period
                </small>
                <div className="spark-bars">
                  {[25, 34, 30, 48, 42, 58, 50, 65, 59, 74, 69, 82].map(
                    (v, i) => (
                      <span key={i} style={{ height: v + '%' }} />
                    )
                  )}
                </div>
              </div>
              <div className="recruiter-stat">
                <div>
                  <span>Interview conversion</span>
                  <TrendingUp size={17} />
                </div>
                <b>32.4%</b>
                <small>
                  <i>+4.8 pts</i> vs previous period
                </small>
                <div className="spark-bars green-bars">
                  {[40, 30, 42, 48, 45, 55, 50, 62, 58, 75, 71, 86].map(
                    (v, i) => (
                      <span key={i} style={{ height: v + '%' }} />
                    )
                  )}
                </div>
              </div>
              <div className="recruiter-stat">
                <div>
                  <span>Open roles</span>
                  <BriefcaseBusiness size={17} />
                </div>
                <b>18</b>
                <small>Across 9 hiring partners</small>
                <div className="spark-bars amber-bars">
                  {[35, 42, 33, 49, 40, 52, 61, 50, 64, 60, 74, 80].map(
                    (v, i) => (
                      <span key={i} style={{ height: v + '%' }} />
                    )
                  )}
                </div>
              </div>
              <div className="recruiter-stat">
                <div>
                  <span>Shortlist readiness</span>
                  <Target size={17} />
                </div>
                <b>71%</b>
                <small>Meets stated baseline criteria</small>
                <div className="spark-bars purple-bars">
                  {[30, 40, 38, 49, 46, 55, 60, 58, 70, 66, 78, 85].map(
                    (v, i) => (
                      <span key={i} style={{ height: v + '%' }} />
                    )
                  )}
                </div>
              </div>
            </div>
            <div className="analytics-grid">
              <div className="panel analytics-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Candidate pipeline</h3>
                    <p>Distribution across the sample hiring funnel.</p>
                  </div>
                  <MoreHorizontal size={17} className="muted-icon" />
                </div>
                <div className="funnel-chart">
                  {[
                    {
                      label: 'Profile created',
                      value: 248,
                      pct: 100,
                      color: 'navy',
                    },
                    {
                      label: 'Eligibility checked',
                      value: 196,
                      pct: 79,
                      color: 'blue',
                    },
                    {
                      label: 'Shortlisted',
                      value: 112,
                      pct: 45,
                      color: 'violet',
                    },
                    {
                      label: 'Interviewed',
                      value: 81,
                      pct: 33,
                      color: 'green',
                    },
                    {
                      label: 'Offers extended',
                      value: 26,
                      pct: 10,
                      color: 'amber',
                    },
                  ].map(row => (
                    <div className="funnel-row" key={row.label}>
                      <div className="funnel-label">
                        <span>{row.label}</span>
                        <b>{row.value}</b>
                      </div>
                      <div className="funnel-track">
                        <span
                          className={row.color}
                          style={{ width: row.pct + '%' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="panel analytics-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Skills in demand</h3>
                    <p>Most common skills across current sample roles.</p>
                  </div>
                  <span className="demo-label">SAMPLE</span>
                </div>
                <div className="demand-list">
                  {[
                    { name: 'Java', pct: 84, count: 21 },
                    { name: 'SQL', pct: 72, count: 18 },
                    { name: 'Data Structures', pct: 68, count: 17 },
                    { name: 'React', pct: 56, count: 14 },
                    { name: 'Python', pct: 48, count: 12 },
                  ].map(s => (
                    <div className="demand-row" key={s.name}>
                      <div>
                        <span>{s.name}</span>
                        <b>{s.count} roles</b>
                      </div>
                      <div className="demand-track">
                        <span style={{ width: s.pct + '%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="panel recruiter-table">
              <div className="panel-heading">
                <div>
                  <h3>Candidate review queue</h3>
                  <p>
                    Illustrative records for testing recruiter-facing views.
                  </p>
                </div>
                <button
                  className="btn-outline"
                  onClick={() =>
                    setNotice(
                      'Export is not connected in this demo. Use the sample table for review only.'
                    )
                  }
                >
                  <ArrowDownRight size={14} /> Export
                </button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Target role</th>
                    <th>Skills match</th>
                    <th>Eligibility</th>
                    <th>Next step</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      name: 'Meera Kapoor',
                      degree: 'B.Tech · CSE',
                      role: 'Software Engineer',
                      match: 92,
                      eligible: 'Eligible',
                      next: 'Technical interview',
                    },
                    {
                      name: 'Kabir Singh',
                      degree: 'B.Tech · IT',
                      role: 'Graduate Engineer',
                      match: 84,
                      eligible: 'Eligible',
                      next: 'Online assessment',
                    },
                    {
                      name: 'Riya Verma',
                      degree: 'B.Tech · ECE',
                      role: 'Data Analyst',
                      match: 76,
                      eligible: 'Review',
                      next: 'Verify branch criteria',
                    },
                    {
                      name: 'Arjun Nair',
                      degree: 'B.Tech · CSE',
                      role: 'Frontend Developer',
                      match: 69,
                      eligible: 'Eligible',
                      next: 'Resume review',
                    },
                  ].map(c => (
                    <tr key={c.name}>
                      <td>
                        <div className="candidate-cell">
                          <div>
                            {c.name
                              .split(' ')
                              .map(n => n[0])
                              .join('')}
                          </div>
                          <span>
                            <b>{c.name}</b>
                            <small>{c.degree}</small>
                          </span>
                        </div>
                      </td>
                      <td>{c.role}</td>
                      <td>
                        <div className="match-bar">
                          <span style={{ width: c.match + '%' }} />
                          <b>{c.match}%</b>
                        </div>
                      </td>
                      <td>
                        <span
                          className={
                            'eligibility-tag ' +
                            (c.eligible === 'Eligible'
                              ? 'eligible'
                              : 'review-tag')
                          }
                        >
                          {c.eligible}
                        </span>
                      </td>
                      <td>{c.next}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="fine-print">
              <ShieldCheck size={14} /> Candidate-level matching should support
              human review, not make automated hiring decisions. Do not use
              inferred protected characteristics.
            </div>
          </section>
        )}

        <footer className="app-footer">
          <span>
            CareerPilot
          </span>
          <span>Built for clearer decisions, not automated decisions.</span>
        </footer>
      </main>


      {loading && (
        <div className="loading-toast">
          <LoaderCircle className="spin" size={15} />
          <span>Working on your request…</span>
        </div>
      )}
    </div>
  );
}

function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <div className="section-eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action && <div className="header-action">{action}</div>}
    </div>
  );
}

function ApplicationTable({
  apps,
  onStatus,
  onDelete,
}: {
  apps: Application[];
  onStatus: (id: string, status: string) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <div className="table-scroll">
      <table className="applications-table">
        <thead>
          <tr>
            <th>Company / role</th>
            <th>Date added</th>
            <th>Match</th>
            <th>Status</th>
            <th>Next action</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {apps.map(a => (
            <tr key={a.id}>
              <td>
                <div className="application-company">
                  <div className="company-monogram">{a.company[0]}</div>
                  <span>
                    <b>{a.company}</b>
                    <small>{a.role}</small>
                  </span>
                </div>
              </td>
              <td className="date-cell">{a.date}</td>
              <td>
                <div className="match-cell">
                  <span>{a.match ? a.match + '%' : '—'}</span>
                  {a.match > 0 && (
                    <div>
                      <i style={{ width: a.match + '%' }} />
                    </div>
                  )}
                </div>
              </td>
              <td>
                <select
                  className={'status-select status-' + a.status.toLowerCase()}
                  value={a.status}
                  onChange={e => onStatus(a.id, e.target.value)}
                >
                  {[
                    'Saved',
                    'Applied',
                    'Assessment',
                    'Interview',
                    'Offer',
                    'Rejected',
                  ].map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </td>
              <td className="note-cell">{a.note || 'Add a next step'}</td>
              <td>
                {onDelete && (
                  <button
                    className="row-delete"
                    title="Delete application"
                    onClick={() => onDelete(a.id)}
                  >
                    <X size={14} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
