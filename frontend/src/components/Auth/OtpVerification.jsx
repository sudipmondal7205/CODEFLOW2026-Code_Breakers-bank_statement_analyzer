import React, { useState, useEffect, useRef } from "react";
import { KeyRound, ShieldAlert, CheckCircle, ArrowLeft } from "lucide-react";

export default function OtpVerification({ email, demoOtp, onVerify, onCancel, onResend }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    // Start countdown timer
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Handle value change
  const handleChange = (index, value) => {
    // Only allow numbers
    if (isNaN(value)) return;

    const newOtp = [...otp];
    // Take only the last character entered
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Clear error
    setError("");

    // Auto-focus next field
    if (value && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  // Handle backspace or paste
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        // Focus previous input and clear it
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs[index - 1].current.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
  };

  // Handle paste event
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pasteData)) {
      const pasteDigits = pasteData.split("");
      setOtp(pasteDigits);
      inputRefs[5].current.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      setError("Please enter all 6 digits of the verification code.");
      return;
    }

    setIsVerifying(true);
    setError("");

    // Simulate network delay for verification
    setTimeout(() => {
      if (otpCode === demoOtp) {
        setSuccess(true);
        setIsVerifying(false);
        setTimeout(() => {
          onVerify(otpCode);
        }, 1200);
      } else {
        setError("Invalid verification code. Please check and try again.");
        setIsVerifying(false);
      }
    }, 1500);
  };

  const handleResendClick = () => {
    if (timer > 0) return;
    setOtp(["", "", "", "", "", ""]);
    setTimer(60);
    setError("");
    inputRefs[0].current.focus();
    onResend();
  };

  return (
    <div className="otp-container card glassmorphism animate-fade-in">
      <button className="back-btn-icon" onClick={onCancel} title="Go Back">
        <ArrowLeft size={18} /> Back
      </button>
      
      <div className="otp-header">
        <div className="icon-badge">
          <KeyRound size={28} className="pulse-icon" />
        </div>
        <h2>Verify Your Email</h2>
        <p className="subtitle">
          We've sent a 6-digit verification code to <span className="highlight-email">{email}</span>.
        </p>
      </div>

      <div className="demo-otp-banner">
        <span>💡 <b>Demo Notice:</b> Use code <code>{demoOtp}</code> to verify.</span>
      </div>

      <form onSubmit={handleSubmit} className="otp-form">
        <div className="otp-inputs-wrapper" onPaste={handlePaste}>
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={inputRefs[idx]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`otp-digit-input ${error ? "input-error" : ""} ${success ? "input-success" : ""}`}
              disabled={isVerifying || success}
              autoFocus={idx === 0}
            />
          ))}
        </div>

        {error && (
          <div className="error-message">
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="success-message">
            <CheckCircle size={16} />
            <span>Verification successful! Accessing dashboard...</span>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-block btn-loading-container"
          disabled={isVerifying || success}
        >
          {isVerifying ? (
            <span className="spinner-wrapper">
              <span className="spinner"></span> Verifying Code...
            </span>
          ) : (
            "Verify & Continue"
          )}
        </button>
      </form>

      <div className="otp-resend">
        <p>Didn't receive the code?</p>
        <button
          type="button"
          onClick={handleResendClick}
          className={`btn-link ${timer > 0 ? "disabled" : ""}`}
          disabled={timer > 0}
        >
          {timer > 0 ? `Resend Code in ${timer}s` : "Resend Code"}
        </button>
      </div>
    </div>
  );
}
