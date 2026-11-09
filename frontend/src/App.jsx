import { useEffect, useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Code2, Trophy, History, LogIn, LogOut, Play, Send, ChevronRight, Terminal, CheckCircle2, CircleAlert, LoaderCircle } from 'lucide-react';
import api from './api.js';

function Nav({ user, onLogout }) {
  return <header className="topbar"><Link to="/" className="brand"><span className="brand-mark"><Code2 size={21}/></span> CodeArena</Link><nav><Link to="/">Problems</Link><Link to="/leaderboard"><Trophy size={16}/> Leaderboard</Link><Link to="/submissions"><History size={16}/> My submissions</Link></nav><div className="nav-right">{user ? <><span className="user-pill">{user.username}</span><button className="btn btn-ghost btn-sm" onClick={onLogout}><LogOut size={15}/> Log out</button></> : <Link className="btn btn-primary btn-sm" to="/login"><LogIn size={15}/> Sign in</Link>}</div></header>;
}
function AuthPage({ mode, onAuth }) {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  async function submit(e) {
    e.preventDefault(); setError('');
    try {
      const { data } = await api.post(`/auth/${mode}`, form);
      localStorage.setItem('ocj_token', data.token); onAuth(data.user); navigate('/');
    } catch (err) { setError(err.response?.data?.message || 'Could not authenticate. Check the API server.'); }
  }
  return <main className="auth-wrap"><form className="auth-card" onSubmit={submit}><div className="eyebrow">YOUR NEXT ACCEPTED SOLUTION</div><h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1><p className="muted">Practice problems. Track progress. Improve every day.</p>
    {mode === 'register' && <label>Username<input required minLength="3" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} placeholder="code_ninja"/></label>}
    <label>Email<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com"/></label>
    <label>Password<input required minLength="8" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="At least 8 characters"/></label>
    {error && <p className="error-text">{error}</p>}<button className="btn btn-primary full">{mode === 'login' ? 'Sign in' : 'Create account'} <ChevronRight size={16}/></button>
    <p className="muted center">{mode === 'login' ? <>New here? <Link to="/register">Create an account</Link></> : <>Already registered? <Link to="/login">Sign in</Link></>}</p></form></main>;
}
function ProblemsPage() {
  const [problems, setProblems] = useState([]); const [error, setError] = useState('');
  useEffect(() => { api.get('/problems').then(r=>setProblems(r.data.problems)).catch(()=>setError('Could not load problems. Is the backend running and seeded?')); }, []);
  return <main className="page"><section className="hero"><div><div className="eyebrow"><span className="live-dot"/> PRACTICE • SUBMIT • LEVEL UP</div><h1>Think in code.<br/><span className="gradient-text">Prove your solution.</span></h1><p>Sharpen your problem-solving skills with hands-on challenges and instant verdicts.</p></div><div className="hero-stat"><div className="stat-icon"><Code2 size={22}/></div><strong>{problems.length.toString().padStart(2,'0')}</strong><span>Available problems</span></div></section>
    <div className="section-heading"><div><h2>Problem set</h2><p className="muted">Pick a challenge and start coding.</p></div><span className="count-chip">{problems.length} problems</span></div>
    {error && <div className="notice"><CircleAlert size={18}/>{error}</div>}
    <div className="problem-list">{problems.map((p,i)=><Link to={`/problems/${p._id}`} className="problem-row" key={p._id}><span className="problem-number">{String(i+1).padStart(2,'0')}</span><div className="problem-main"><strong>{p.title}</strong><span>{p.description}</span></div><span className={`difficulty ${p.difficulty.toLowerCase()}`}>{p.difficulty}</span><ChevronRight className="row-chevron" size={18}/></Link>)}</div>
    {!problems.length && !error && <div className="empty-state"><LoaderCircle className="spin" size={22}/> Loading problems…</div>}
  </main>;
}
function ProblemPage({ user }) {
  const { id } = useParams(); const navigate = useNavigate();
  const [problem,setProblem] = useState(null); const [language,setLanguage] = useState('javascript');
  const [code,setCode] = useState('const fs = require("fs");\nconst input = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);\n// Write your solution here\nconsole.log(input[0] + input[1]);');
  const [stdin,setStdin] = useState('2 3'); const [output,setOutput] = useState('Run your code to see output here.'); const [verdict,setVerdict] = useState('');
  const [busy,setBusy] = useState(false); const [submissionId,setSubmissionId] = useState('');
  useEffect(()=>{ api.get(`/problems/${id}`).then(r=>{setProblem(r.data.problem); if(r.data.problem.testcases?.[0]) setStdin(r.data.problem.testcases[0].input.trimEnd());}).catch(()=>setProblem(false)); },[id]);
  useEffect(()=>{ if(!submissionId) return; const timer=setInterval(()=>api.get(`/submissions/${submissionId}`).then(r=>{const s=r.data.submission;setVerdict(s.status);if(!['Queued','Processing'].includes(s.status)){setOutput(`${s.status}\nPassed ${s.passedTests}/${s.totalTests} test cases${s.errorMessage?`\n${s.errorMessage}`:''}`);setBusy(false);setSubmissionId('');}}).catch(()=>{setBusy(false);setSubmissionId('');}),1800); return ()=>clearInterval(timer); },[submissionId]);
  async function run() { setBusy(true);setVerdict('Running');setOutput('Executing sample input…');try{const {data}=await api.post(`/problems/${id}/run`,{sourceCode:code,language,stdin});setOutput(data.compileOutput||data.stderr||data.stdout||'(No output)');setVerdict(data.status); }catch(err){setOutput(err.response?.data?.message||'Run failed. Check Judge0 configuration.');setVerdict('Failed');}finally{setBusy(false);} }
  async function submit() { if(!user){navigate('/login');return;}setBusy(true);setVerdict('Queued');setOutput('Submission queued. Waiting for evaluation…');try{const {data}=await api.post('/submissions',{problemId:id,sourceCode:code,language});setSubmissionId(data.submission._id);}catch(err){setOutput(err.response?.data?.message||'Submission failed');setBusy(false);setVerdict('Failed');} }
  if(problem===false)return <main className="page"><div className="notice">Problem not found or API unavailable.</div></main>;
  if(!problem)return <main className="page empty-state"><LoaderCircle className="spin"/> Loading problem…</main>;
  return <main className="workspace-page"><div className="breadcrumbs"><Link to="/">Problems</Link><ChevronRight size={14}/><span>{problem.title}</span></div><div className="workspace"><section className="statement panel"><div className="problem-title-line"><span className={`difficulty ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span><span className="tiny-label">PROBLEM</span></div><h1>{problem.title}</h1><p className="statement-text">{problem.description}</p><h3>Input format</h3><p>{problem.inputFormat}</p><h3>Output format</h3><p>{problem.outputFormat}</p><h3>Constraints</h3><ul>{problem.constraints?.map(c=><li key={c}><code>{c}</code></li>)}</ul><h3>Sample test case</h3>{problem.testcases?.map((t,i)=><div className="sample" key={i}><div><span>Input</span><pre>{t.input}</pre></div><div><span>Expected output</span><pre>{t.expectedOutput}</pre></div></div>)}</section>
    <section className="editor-column"><div className="editor-panel panel"><div className="editor-toolbar"><div><span className="editor-dot"/><span className="editor-dot"/><span className="editor-dot"/><span className="editor-label">solution</span></div><select value={language} onChange={e=>{setLanguage(e.target.value);setCode(e.target.value==='python'?'import sys\ndata = list(map(int, sys.stdin.read().split()))\n# Write your solution here\nprint(data[0] + data[1])':e.target.value==='cpp'?'#include <bits/stdc++.h>\nusing namespace std;\nint main(){ long long a,b; cin >> a >> b; cout << a+b << endl; }':'const fs = require("fs");\nconst input = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);\nconsole.log(input[0] + input[1]);')}}><option value="javascript">JavaScript (Node.js)</option><option value="python">Python 3</option><option value="cpp">C++</option></select></div><Editor height="390px" theme="vs-dark" language={language==='javascript'?'javascript':language==='cpp'?'cpp':'python'} value={code} onChange={v=>setCode(v||'')} options={{fontSize:14,minimap:{enabled:false},padding:{top:18},scrollBeyondLastLine:false,automaticLayout:true,wordWrap:'on'}}/><div className="editor-footer"><span><span className="live-dot"/> Ready to execute</span><span>UTF-8 · Spaces: 2</span></div></div>
    <div className="console-panel panel"><div className="console-heading"><div><Terminal size={16}/><strong>Custom input</strong></div><span className="tiny-label">STDIN</span></div><textarea value={stdin} onChange={e=>setStdin(e.target.value)} placeholder="Enter input for your program…" rows="2"/></div>
    <div className="action-bar"><div className="verdict-label">{verdict && <><span className={verdict==='Accepted'?'success-dot':'status-dot'}/>{verdict}</>}</div><div className="action-buttons"><button className="btn btn-secondary" disabled={busy} onClick={run}><Play size={15}/>{busy?'Working…':'Run code'}</button><button className="btn btn-primary" disabled={busy} onClick={submit}><Send size={15}/>{busy?'Submitting…':'Submit solution'}</button></div></div>
    <div className="output-panel panel"><div className="console-heading"><div><Terminal size={16}/><strong>Output</strong></div><span className="tiny-label">RESULT</span></div><pre className="output-text">{output}</pre></div></section></div></main>;
}
function SubmissionsPage({ user }) {
  const [rows,setRows]=useState([]);const [error,setError]=useState('');
  useEffect(()=>{if(!user){setError('Sign in to view your submissions.');return;}api.get('/submissions/mine').then(r=>setRows(r.data.submissions)).catch(()=>setError('Could not load submissions.'));},[user]);
  return <main className="page"><div className="section-heading"><div><div className="eyebrow">YOUR ACTIVITY</div><h1>Submission history</h1><p className="muted">Review your recent attempts and verdicts.</p></div></div>{error&&<div className="notice">{error} <Link to="/login">Sign in</Link></div>}<div className="table-wrap"><table><thead><tr><th>Problem</th><th>Language</th><th>Verdict</th><th>Tests</th><th>Submitted</th></tr></thead><tbody>{rows.map(s=><tr key={s._id}><td>{s.problem?.title||'Problem'}</td><td>{s.language}</td><td><span className={`verdict-tag ${s.status==='Accepted'?'accepted':''}`}>{s.status}</span></td><td>{s.passedTests}/{s.totalTests}</td><td>{new Date(s.createdAt).toLocaleString()}</td></tr>)}</tbody></table>{!rows.length&&!error&&<div className="empty-state">No submissions yet. Solve a problem to get started.</div>}</div></main>;
}
function LeaderboardPage() {
  const [rows,setRows]=useState([]);const [error,setError]=useState('');
  useEffect(()=>{api.get('/leaderboard').then(r=>setRows(r.data.leaderboard)).catch(()=>setError('Could not load leaderboard.'));},[]);
  return <main className="page"><div className="section-heading"><div><div className="eyebrow">COMMUNITY RANKINGS</div><h1>Leaderboard</h1><p className="muted">Consistency beats intensity. Keep solving.</p></div><div className="trophy-hero"><Trophy size={27}/></div></div>{error&&<div className="notice">{error}</div>}<div className="table-wrap"><table><thead><tr><th>Rank</th><th>Coder</th><th>Problems solved</th><th>Accepted submissions</th></tr></thead><tbody>{rows.map((r,i)=><tr key={r._id}><td><span className={`rank ${i<3?'top-rank':''}`}>{String(i+1).padStart(2,'0')}</span></td><td><strong>{r.username}</strong></td><td>{r.solved}</td><td>{r.acceptedSubmissions}</td></tr>)}</tbody></table>{!rows.length&&!error&&<div className="empty-state">No accepted submissions yet. Be the first on the board.</div>}</div></main>;
}
export default function App() {
  const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem('ocj_user')||'null')}catch{return null}});
  function handleAuth(u){setUser(u);localStorage.setItem('ocj_user',JSON.stringify(u));}
  function logout(){localStorage.removeItem('ocj_token');localStorage.removeItem('ocj_user');setUser(null);}
  return <div className="app-shell"><Nav user={user} onLogout={logout}/><Routes><Route path="/" element={<ProblemsPage/>}/><Route path="/login" element={<AuthPage mode="login" onAuth={handleAuth}/>}/><Route path="/register" element={<AuthPage mode="register" onAuth={handleAuth}/>}/><Route path="/problems/:id" element={<ProblemPage user={user}/>}/><Route path="/leaderboard" element={<LeaderboardPage/>}/><Route path="/submissions" element={<SubmissionsPage user={user}/>}/><Route path="*" element={<main className="page"><h1>Page not found</h1><Link to="/">Back to problems</Link></main>}/></Routes><footer className="footer"><span>© 2026 CodeArena</span><span>Built for curious minds <span className="heart">♥</span></span></footer></div>;
}
