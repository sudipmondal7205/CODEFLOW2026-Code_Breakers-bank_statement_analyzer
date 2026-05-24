import React, { useState } from "react";
import { User, Lock, Mail, Eye, EyeOff, ShieldAlert, Sparkles } from "lucide-react";
import { apiRegister } from "../../utils/api";

export default function Register({ onRegisterSuccess, onSwitchToLogin }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Simple password strength calculator
  const getPasswordStrength = () => {
    if (!password) return { label: "", score: 0, color: "transparent" };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    switch (score) {
      case 1: return { label: "Weak", score: 25, color: "#f87171" };
      case 2: return { label: "Fair", score: 50, color: "#fbbf24" };
      case 3: return { label: "Good", score: 75, color: "#60a5fa" };
      case 4: return { label: "Strong", score: 100, color: "#34d399" };
      default: return { label: "Weak", score: 10, color: "#f87171" };
    }
  };

  const strength = getPasswordStrength();

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError("Please fill out all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    try {
      const user = await apiRegister({ firstName, lastName, email, password });
      onRegisterSuccess(user, email, password);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
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
        <h2>Create Account</h2>
        <p className="subtitle">Register to verify details and analyze bank statements.</p>
      </div>

      <form onSubmit={handleRegisterSubmit} className="auth-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input
                type="text"
                id="firstName"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input
                type="text"
                id="lastName"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="regEmail">Email Address</label>
          <div className="input-with-icon">
            <Mail size={18} className="input-icon" />
            <input
              type="email"
              id="regEmail"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="regPassword">Password</label>
          <div className="input-with-icon">
            <Lock size={18} className="input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              id="regPassword"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {password && (
            <div className="strength-meter-container">
              <div className="strength-header">
                <span>Password Strength:</span>
                <span style={{ color: strength.color, fontWeight: "600" }}>{strength.label}</span>
              </div>
              <div className="strength-bar-bg">
                <div
                  className="strength-bar-fill"
                  style={{ width: `${strength.score}%`, backgroundColor: strength.color }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <div className="input-with-icon">
            <Lock size={18} className="input-icon" />
            <input
              type="password"
              id="confirmPassword"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {error && (
          <div className="error-message">
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
          {isLoading ? <span className="spinner-wrapper"><span className="spinner"></span> Creating Account...</span> : "Create Account"}
        </button>
      </form>

      <div className="auth-footer">
        <p>
          Already have an account?{" "}
          <button type="button" onClick={onSwitchToLogin} className="btn-link">
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
