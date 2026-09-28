import { useState } from "react";
import "./Registration.css";

function RegistrationForm({ onContinue }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    collegeId: "",
    branch: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    setErrors({
      ...errors,
      [name]: "",
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = "Enter a valid 10-digit phone number";
    }

    if (!formData.collegeId.trim()) {
      newErrors.collegeId = "College ID is required";
    }

    if (!formData.branch) {
      newErrors.branch = "Please select your branch";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      onContinue(formData);
    }
  };

  return (
    <div className="registration-page">
      <div className="registration-card">

        {/* Header */}
        <div className="registration-header">
          <div className="logo-circle">
            CL
          </div>

          <h1>CAMPUSLINK</h1>

          <p>
            Student Registration
          </p>

          <span>
            Create your student account to get started
          </span>
        </div>

        {/* Progress */}
        <div className="progress-container">
          <div className="progress-step active">
            <div className="step-number">1</div>
            <span>Registration</span>
          </div>

          <div className="progress-line"></div>

          <div className="progress-step">
            <div className="step-number">2</div>
            <span>OTP Verification</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>

          <div className="form-grid">

            {/* Full Name */}
            <div className="form-group full-width">
              <label>Full Name</label>

              <input
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
              />

              {errors.fullName && (
                <small className="error">
                  {errors.fullName}
                </small>
              )}
            </div>

            {/* Email */}
            <div className="form-group">
              <label>Email Address</label>

              <input
                type="email"
                name="email"
                placeholder="student@example.com"
                value={formData.email}
                onChange={handleChange}
              />

              {errors.email && (
                <small className="error">
                  {errors.email}
                </small>
              )}
            </div>

            {/* Phone */}
            <div className="form-group">
              <label>Phone Number</label>

              <input
                type="tel"
                name="phone"
                placeholder="10-digit mobile number"
                value={formData.phone}
                onChange={handleChange}
              />

              {errors.phone && (
                <small className="error">
                  {errors.phone}
                </small>
              )}
            </div>

            {/* College ID */}
            <div className="form-group">
              <label>College ID</label>

              <input
                type="text"
                name="collegeId"
                placeholder="Enter college ID"
                value={formData.collegeId}
                onChange={handleChange}
              />

              {errors.collegeId && (
                <small className="error">
                  {errors.collegeId}
                </small>
              )}
            </div>

            {/* Branch */}
            <div className="form-group">
              <label>Branch</label>

              <select
                name="branch"
                value={formData.branch}
                onChange={handleChange}
              >
                <option value="">
                  Select your branch
                </option>

                <option value="Computer Science">
                  Computer Science
                </option>

                <option value="Information Technology">
                  Information Technology
                </option>

                <option value="Electronics">
                  Electronics
                </option>

                <option value="Electrical">
                  Electrical
                </option>

                <option value="Mechanical">
                  Mechanical
                </option>

                <option value="Civil">
                  Civil
                </option>

                <option value="Other">
                  Other
                </option>
              </select>

              {errors.branch && (
                <small className="error">
                  {errors.branch}
                </small>
              )}
            </div>

          </div>

          {/* Info */}
          <div className="otp-info">
            <span>🔐</span>

            <div>
              <strong>OTP Verification</strong>

              <p>
                After submitting your details, an OTP will be
                sent to your registered email address.
              </p>
            </div>
          </div>

          {/* Button */}
          <button
            type="submit"
            className="continue-btn"
          >
            Continue to OTP
            <span>→</span>
          </button>

        </form>

        <div className="login-text">
          Already registered?
          <button type="button">
            Login
          </button>
        </div>

      </div>
    </div>
  );
}

export default RegistrationForm;