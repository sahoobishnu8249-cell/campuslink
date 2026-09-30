import { useState } from "react";
import RegistrationForm from "./components/Registration/RegistrationForm";
import OTPVerification from "./components/Registration/OTPVerification";
import Dashboard from "./pages/Dashboard";
import { PublicPassportVerification } from "./components/placement/PlacementExperience";

function App() {
  const [currentStep, setCurrentStep] = useState("registration");
  const [studentData, setStudentData] = useState(null);
  const passportRoute = window.location.pathname.match(/^\/passport\/verify\/([^/]+)/);

  const startRegistration = (data) => {
    setStudentData({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      collegeId: data.collegeId,
      branch: data.branch,
    });
    setCurrentStep("otp");
  };

  const verifyOtp = () => setCurrentStep("dashboard");

  if (passportRoute) return <PublicPassportVerification passportId={passportRoute[1]} />;
  if (currentStep === "registration") return <RegistrationForm onContinue={startRegistration} />;
  if (currentStep === "otp") return <OTPVerification studentData={studentData} onVerified={verifyOtp} onBack={() => setCurrentStep("registration")} />;
  return <Dashboard studentData={studentData} />;
}

export default App;
