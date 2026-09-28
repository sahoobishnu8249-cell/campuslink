import { useState, useRef } from "react";

function OTPVerification({ studentData, onVerified, onBack }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const inputRefs = useRef([]);

  const handleChange = (value, index) => {
    // Allow only numbers
    if (!/^[0-9]?$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;

    setOtp(newOtp);
    setError("");

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Move back when Backspace is pressed
    if (
      e.key === "Backspace" &&
      !otp[index] &&
      index > 0
    ) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const enteredOtp = otp.join("");

    if (enteredOtp.length !== 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }

    // Demo OTP
    if (enteredOtp === "123456") {
      setSuccess(true);

      setTimeout(() => {
        onVerified();
      }, 1200);
    } else {
      setError("Invalid OTP. For testing, use 123456.");
    }
  };

  return (
    <div className="registration-page">
      <div className="registration-card otp-card">

        {/* Logo */}
        <div className="registration-header">

          <div className="logo-circle">
            CL
          </div>

          <h1>CAMPUSLINK</h1>

          <p>
            OTP Verification
          </p>

          <span>
            Verify your email address to complete registration
          </span>

        </div>

        {/* Progress */}
        <div className="progress-container">

          <div className="progress-step completed">
            <div className="step-number">
              ✓
            </div>

            <span>
              Registration
            </span>
          </div>

          <div className="progress-line active-line"></div>

          <div className="progress-step active">
            <div className="step-number">
              2
            </div>

            <span>
              OTP Verification
            </span>
          </div>

        </div>

        {/* Email information */}
        <div className="email-info">

          <div className="email-icon">
            ✉
          </div>

          <div>
            <strong>
              OTP sent to
            </strong>

            <p>
              {studentData?.email || "your email address"}
            </p>
          </div>

        </div>

        {/* OTP */}
        <div className="otp-section">

          <label>
            Enter 6-digit OTP
          </label>

          <div className="otp-inputs">

            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={(e) =>
                  handleChange(e.target.value, index)
                }
                onKeyDown={(e) =>
                  handleKeyDown(e, index)
                }
              />
            ))}

          </div>

          {error && (
            <p className="otp-error">
              {error}
            </p>
          )}

          {success && (
            <p className="otp-success">
              ✓ OTP verified successfully!
            </p>
          )}

        </div>

        {/* Demo information */}
        <div className="demo-otp">

          <strong>
            Demo Mode
          </strong>

          <p>
            Use OTP:
            <b> 123456</b>
          </p>

        </div>

        {/* Verify button */}
        <button
          className="continue-btn"
          onClick={handleVerify}
          disabled={success}
        >
          {success
            ? "Verified ✓"
            : "Verify OTP →"}
        </button>

        {/* Back */}
        <button
          className="back-btn"
          onClick={onBack}
        >
          ← Back to Registration
        </button>

        {/* Resend */}
        <div className="resend-section">

          <span>
            Didn't receive the OTP?
          </span>

          <button
            type="button"
            onClick={() =>
              alert("Demo OTP resent: 123456")
            }
          >
            Resend OTP
          </button>

        </div>

      </div>
    </div>
  );
}

export default OTPVerification;