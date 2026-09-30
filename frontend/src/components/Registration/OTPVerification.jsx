import { useEffect, useRef, useState } from "react";

const DEMO_OTP = "123456";
const OTP_TTL_SECONDS = 300;

function OTPVerification({ studentData, onVerified, onBack }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(OTP_TTL_SECONDS);
  const [resendWait, setResendWait] = useState(30);
  const inputRefs = useRef([]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft((remaining) => Math.max(0, remaining - 1));
      setResendWait((remaining) => Math.max(0, remaining - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    setError("");
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (event) => {
    const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!digits) return;
    event.preventDefault();
    setOtp(Array.from({ length: 6 }, (_, index) => digits[index] || ""));
    inputRefs.current[Math.min(digits.length, 5)]?.focus();
    setError("");
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }
    if (timeLeft === 0) {
      setError("This demo code expired. Request a new code.");
      return;
    }
    if (code !== DEMO_OTP) {
      setError("Incorrect code. Use the demo OTP shown below.");
      return;
    }
    setIsVerifying(true);
    try {
      await onVerified();
      setSuccess(true);
    } catch (verificationError) {
      setError(verificationError.message || "Could not finish creating your account. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = () => {
    if (resendWait > 0) return;
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setTimeLeft(OTP_TTL_SECONDS);
    setResendWait(30);
  };

  const time = `${String(Math.floor(timeLeft / 60)).padStart(2, "0")}:${String(timeLeft % 60).padStart(2, "0")}`;
  return (
    <div className="registration-page">
      <div className="registration-card otp-card">
        <div className="registration-header">
          <div className="logo-circle">CL</div>
          <h1>CAMPUSLINK</h1>
          <p>Verify Your Email</p>
          <span>Enter the 6-digit verification code shown below.</span>
        </div>
        <div className="progress-container">
          <div className="progress-step completed"><div className="step-number">✓</div><span>Registered</span></div>
          <div className="progress-line active-line" />
          <div className="progress-step active"><div className="step-number">2</div><span>Email OTP</span></div>
          <div className="progress-line" />
          <div className="progress-step"><div className="step-number">3</div><span>Dashboard</span></div>
        </div>
        <div className="email-info"><div className="email-icon">✉</div><div><strong>Student email</strong><p>{studentData?.email || "your email address"}</p></div></div>
        <div className="demo-otp"><strong>Frontend demo code</strong><p>OTP: <b>{DEMO_OTP}</b></p></div>
        <div className="otp-section">
          <label htmlFor="otp-0">Enter 6-digit OTP</label>
          <div className="otp-inputs" onPaste={handlePaste}>
            {otp.map((digit, index) => <input key={index} id={index === 0 ? "otp-0" : undefined} ref={(element) => { inputRefs.current[index] = element; }} type="text" inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"} aria-label={`OTP digit ${index + 1}`} maxLength="1" value={digit} onChange={(event) => handleChange(event.target.value, index)} onKeyDown={(event) => { if (event.key === "Backspace" && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus(); }} />)}
          </div>
          {error && <p className="otp-error" role="alert">{error}</p>}
          {success && <p className="otp-success">✓ Email verified. Your account is active.</p>}
        </div>
        <button className="continue-btn" onClick={handleVerify} disabled={success || isVerifying || timeLeft === 0}>{isVerifying ? "Creating account…" : success ? "Verified ✓" : <>Verify & continue →</>}</button>
        <div className="resend-section"><span>Code expires in <b>{time}</b></span><br/><span>Didn't receive the verification code?</span><button type="button" onClick={handleResend} disabled={resendWait > 0}>{resendWait > 0 ? `Resend in ${resendWait}s` : "Resend demo code"}</button></div>
        <button className="back-btn" onClick={onBack}>← Back to registration</button>
      </div>
    </div>
  );
}

export default OTPVerification;
