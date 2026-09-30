import { useState } from "react";
import { ArrowRight, BrainCircuit, ChartNoAxesCombined, GraduationCap, ShieldCheck, Target } from "lucide-react";
import { authenticateDemoAccount } from "../../services/demoAuthService";
import "../../styles/login.css";

function LoginForm({ onBack, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const student = await authenticateDemoAccount(email, password);
      onLogin(student);
    } catch (loginError) {
      setError(loginError.message || "Could not sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return <div className="registration-page login-page"><div className="registration-card">
    <aside className="registration-header"><div className="brand-lockup"><div className="logo-circle"><GraduationCap size={27}/></div><div className="brand-words"><h1>CAMPUSLINK</h1><p>ECOSYSTEM</p></div></div><h2 className="brand-quote">Your journey from campus to career starts here.</h2><div className="benefit-list"><div><span><BrainCircuit size={20}/></span><div><b>AI Readiness Analysis</b><small>Understand your technical, academic, and interview readiness.</small></div></div><div><span><Target size={20}/></span><div><b>Smart Job Matching</b><small>Discover relevant roles and see your skill gaps clearly.</small></div></div><div><span><ChartNoAxesCombined size={20}/></span><div><b>Placement Tracking</b><small>Follow every step from application through joining.</small></div></div></div><div className="security-note"><ShieldCheck size={17}/> Campus verified · Secure account setup</div></aside>
    <main className="registration-main login-main"><div className="registration-kicker"><span><i>✧</i> Student sign in</span><small>New to CampusLink? <button type="button" onClick={onBack}>Create account</button></small></div><div className="registration-title"><h2>Welcome back</h2><p>Log in to continue your campus placement journey.</p></div>
      <form className="login-form" onSubmit={handleSubmit} noValidate><div className="form-group"><label htmlFor="login-email">Email ID</label><input id="login-email" type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} placeholder="student@example.com" required/></div><div className="form-group"><label htmlFor="login-password">Password</label><input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} placeholder="Enter your password" required/></div>{error && <p className="login-error" role="alert">{error}</p>}<button type="submit" className="continue-btn" disabled={isSubmitting || !email.trim() || !password}>{isSubmitting ? "Signing in…" : <>Log in <ArrowRight size={18}/></>}</button></form>
      <div className="login-text">Demo accounts are stored on this device. Register and verify your email first if this is your first visit.</div>
    </main>
  </div></div>;
}

export default LoginForm;
