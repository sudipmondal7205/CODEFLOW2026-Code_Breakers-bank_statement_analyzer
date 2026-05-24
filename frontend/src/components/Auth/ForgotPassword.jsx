import React, { useState, useEffect, useRef } from "react";
import { Mail, KeyRound, Lock, Eye, EyeOff, ArrowLeft, Sparkles, ShieldAlert, CheckCircle, Send } from "lucide-react";

const STAGES = { EMAIL: "email", OTP: "otp", RESET: "reset", SUCCESS: "success" };

export default function ForgotPassword({ onBack }) {
  const [stage, setStage] = useState(STAGES.EMAIL);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [timer, setTimer] = useState(60);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    let interval = null;
    if (stage === STAGES.OTP && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [stage, timer]);

  const handleSendOtp = (e) => {
    e.preventDefault();
    setError("");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setError("Please enter a valid email address."); return; }
    setIsLoading(true);
    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setTimer(60);
      setIsLoading(false);
      setStage(STAGES.OTP);
    }, 1200);
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    setError("");
    if (value && index < 5) inputRefs[index + 1].current.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp]; newOtp[index - 1] = ""; setOtp(newOtp);
        inputRefs[index - 1].current.focus();
      } else {
        const newOtp = [...otp]; newOtp[index] = ""; setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(paste)) { setOtp(paste.split("")); inputRefs[5].current.focus(); }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setError("Please enter all 6 digits."); return; }
    setIsLoading(true);
    setTimeout(() => {
      if (code === generatedOtp) { setIsLoading(false); setStage(STAGES.RESET); }
      else { setError("Invalid code. Please check and try again."); setIsLoading(false); }
    }, 1000);
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    setIsLoading(true);
    setTimeout(() => { setIsLoading(false); setStage(STAGES.SUCCESS); }, 1200);
  };

  const handleResend = () => {
    if (timer > 0) return;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code); setTimer(60); setOtp(["","","","","",""]); setError("");
  };

  const getStrength = () => {
    if (!newPassword) return { score: 0, label: "", color: "transparent" };
    let s = 0;
    if (newPassword.length >= 8) s++;
    if (/[A-Z]/.test(newPassword)) s++;
    if (/[0-9]/.test(newPassword)) s++;
    if (/[^A-Za-z0-9]/.test(newPassword)) s++;
    const map = { 1: ["Weak", "#f87171"], 2: ["Fair", "#fbbf24"], 3: ["Good", "#60a5fa"], 4: ["Strong", "#34d399"] };
    return { score: s * 25, label: map[s]?.[0] || "Weak", color: map[s]?.[1] || "#f87171" };
  };
  const strength = getStrength();

  // ── Stage: EMAIL ──
  if (stage === STAGES.EMAIL) return (
    <div className="auth-card card glassmorphism animate-fade-in">
      <button className="back-btn-icon" onClick={onBack}><ArrowLeft size={16}/> Back to Login</button>
      <div className="auth-header" style={{marginTop:"1rem"}}>
        <div className="logo-area"><Sparkles size={24} className="accent-color"/><span className="logo-text">APEXBANK</span></div>
        <h2>Reset Password</h2>
        <p className="subtitle">Enter the email address linked to your account and we'll send a reset code.</p>
      </div>
      <form onSubmit={handleSendOtp} className="auth-form">
        <div className="form-group">
          <label htmlFor="fp-email">Email Address</label>
          <div className="input-with-icon">
            <Mail size={18} className="input-icon"/>
            <input type="email" id="fp-email" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} required/>
          </div>
        </div>
        {error && <div className="error-message"><ShieldAlert size={16}/><span>{error}</span></div>}
        <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
          {isLoading ? <span className="spinner-wrapper"><span className="spinner"></span> Sending Code...</span> : <><Send size={16} style={{marginRight:"0.5rem"}}/> Send Reset Code</>}
        </button>
      </form>
    </div>
  );

  // ── Stage: OTP ──
  if (stage === STAGES.OTP) return (
    <div className="otp-container card glassmorphism animate-fade-in">
      <button className="back-btn-icon" onClick={() => setStage(STAGES.EMAIL)}><ArrowLeft size={16}/> Back</button>
      <div className="otp-header">
        <div className="icon-badge"><KeyRound size={28} className="pulse-icon"/></div>
        <h2>Check Your Inbox</h2>
        <p className="subtitle">A 6-digit code was sent to <span className="highlight-email">{email}</span></p>
      </div>
      <div className="demo-otp-banner">💡 <b>Demo Notice:</b> Use code <code>{generatedOtp}</code></div>
      <form onSubmit={handleVerifyOtp} className="otp-form">
        <div className="otp-inputs-wrapper" onPaste={handlePaste}>
          {otp.map((digit, idx) => (
            <input key={idx} ref={inputRefs[idx]} type="text" inputMode="numeric" maxLength={1} value={digit}
              onChange={e => handleOtpChange(idx, e.target.value)} onKeyDown={e => handleOtpKeyDown(idx, e)}
              className={`otp-digit-input ${error ? "input-error" : ""}`} disabled={isLoading} autoFocus={idx === 0}/>
          ))}
        </div>
        {error && <div className="error-message"><ShieldAlert size={16}/><span>{error}</span></div>}
        <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
          {isLoading ? <span className="spinner-wrapper"><span className="spinner"></span> Verifying...</span> : "Verify Code"}
        </button>
      </form>
      <div className="otp-resend">
        <p>Didn't receive it?</p>
        <button type="button" onClick={handleResend} className={`btn-link ${timer > 0 ? "disabled" : ""}`} disabled={timer > 0}>
          {timer > 0 ? `Resend in ${timer}s` : "Resend Code"}
        </button>
      </div>
    </div>
  );

  // ── Stage: RESET ──
  if (stage === STAGES.RESET) return (
    <div className="auth-card card glassmorphism animate-fade-in">
      <div className="auth-header">
        <div className="logo-area"><Sparkles size={24} className="accent-color"/><span className="logo-text">APEXBANK</span></div>
        <h2>Set New Password</h2>
        <p className="subtitle">Choose a strong, memorable password for your account.</p>
      </div>
      <form onSubmit={handleResetPassword} className="auth-form">
        <div className="form-group">
          <label htmlFor="new-pwd">New Password</label>
          <div className="input-with-icon">
            <Lock size={18} className="input-icon"/>
            <input type={showNewPwd ? "text" : "password"} id="new-pwd" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} required/>
            <button type="button" className="password-toggle" onClick={() => setShowNewPwd(v => !v)}>
              {showNewPwd ? <EyeOff size={18}/> : <Eye size={18}/>}
            </button>
          </div>
          {newPassword && (
            <div className="strength-meter-container">
              <div className="strength-header"><span>Strength:</span><span style={{color:strength.color,fontWeight:600}}>{strength.label}</span></div>
              <div className="strength-bar-bg"><div className="strength-bar-fill" style={{width:`${strength.score}%`,backgroundColor:strength.color}}></div></div>
            </div>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="confirm-pwd">Confirm Password</label>
          <div className="input-with-icon">
            <Lock size={18} className="input-icon"/>
            <input type="password" id="confirm-pwd" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required/>
          </div>
        </div>
        {error && <div className="error-message"><ShieldAlert size={16}/><span>{error}</span></div>}
        <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
          {isLoading ? <span className="spinner-wrapper"><span className="spinner"></span> Updating...</span> : "Update Password"}
        </button>
      </form>
    </div>
  );

  // ── Stage: SUCCESS ──
  return (
    <div className="auth-card card glassmorphism animate-fade-in" style={{textAlign:"center"}}>
      <div className="success-celebration">
        <div className="icon-badge" style={{margin:"0 auto 1.5rem auto"}}><CheckCircle size={32} style={{color:"#34d399"}}/></div>
        <h2 style={{color:"#34d399"}}>Password Updated!</h2>
        <p className="subtitle" style={{marginTop:"0.5rem"}}>Your password has been reset successfully. You can now sign in with your new credentials.</p>
        <button onClick={onBack} className="btn btn-primary btn-block" style={{marginTop:"2rem"}}>Back to Sign In</button>
      </div>
    </div>
  );
}
