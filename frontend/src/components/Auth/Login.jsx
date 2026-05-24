import React, { useState } from "react";
import { Lock, Mail, Eye, EyeOff, ShieldAlert, Sparkles } from "lucide-react";
import { apiLogin, saveSession } from "../../utils/api";

export default function Login({ onLogin, onSwitchToRegister, onForgotPassword }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError("Please enter both email and password."); return; }
    setIsLoading(true);
    setError("");
    try {
      const data = await apiLogin({ email, password });
      saveSession(data.access_token, data.user);
      onLogin(data.user);
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="auth-card card glassmorphism animate-fade-in">
      <div className="auth-header">
        <div className="logo-area">
          <Sparkles size={24} className="accent-color" />
          <span className="logo-text">APEXBANK</span>
        </div>
        <h2>Welcome Back</h2>
        <p className="subtitle">Securely log in to analyze your bank statements.</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <div className="input-with-icon">
            <Mail size={18} className="input-icon" />
            <input type="email" id="email" placeholder="name@company.com"
              value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} required />
          </div>
        </div>

        <div className="form-group">
          <div className="label-wrapper">
            <label htmlFor="password">Password</label>
            <button type="button" className="forgot-password-btn" onClick={onForgotPassword}>
              Forgot password?
            </button>
          </div>
          <div className="input-with-icon">
            <Lock size={18} className="input-icon" />
            <input type={showPassword ? "text" : "password"} id="password" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} required />
            <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
          {isLoading ? (
            <span className="spinner-wrapper"><span className="spinner"></span> Signing in...</span>
          ) : "Sign In"}
        </button>
      </form>

      <div className="auth-footer">
        <p>
          Don't have an account?{" "}
          <button type="button" onClick={onSwitchToRegister} className="btn-link">
            Create Account
          </button>
        </p>
      </div>
    </div>
  );
}
