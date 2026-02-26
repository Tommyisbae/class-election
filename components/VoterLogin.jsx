import { useState } from "react";

export default function VoterLogin({ onLoginSuccess }) {
  const [step, setStep] = useState("matric");
  const [matricNumber, setMatricNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!matricNumber.trim()) {
      setErrorMessage("Please enter your Matric Number.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matricNumber: matricNumber.trim().toUpperCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP.");
      }

      const emailHint = data.message.split("to ")[1];
      setMaskedEmail(emailHint);
      setSuccessMessage("OTP sent successfully!");
      setStep("otp");
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setErrorMessage("Please enter the 6-digit OTP.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matricNumber: matricNumber.trim().toUpperCase(),
          otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify OTP.");
      }

      onLoginSuccess(matricNumber.trim().toUpperCase());
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-10 bg-white border-2 border-black mt-12 w-full">
      <div className="text-left mb-10 border-b-2 border-black pb-6">
        <h2 className="text-3xl font-black uppercase tracking-tighter">
          Voter Login
        </h2>
        <p className="font-bold tracking-widest uppercase text-xs text-gray-500 mt-2">
          Secure Authentication
        </p>
      </div>

      {errorMessage && (
        <div className="bg-black text-white p-4 mb-8 font-bold text-sm tracking-wide uppercase">
          Error: {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="bg-black text-white p-4 mb-8 font-bold text-sm tracking-wide uppercase">
          {successMessage}
        </div>
      )}

      {step === "matric" && (
        <form onSubmit={handleSendOTP} className="space-y-8">
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-black mb-3">
              Matriculation Number
            </label>
            <input
              type="text"
              placeholder="E.G. 19/1234"
              value={matricNumber}
              onChange={(e) => setMatricNumber(e.target.value)}
              className="w-full px-4 py-4 border-2 border-gray-200 focus:border-black outline-none transition-colors uppercase font-medium"
              disabled={isLoading}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !matricNumber}
            className={`w-full py-4 px-6 text-white font-bold tracking-widest uppercase transition-colors ${isLoading || !matricNumber
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-black hover:bg-gray-800"
              }`}
          >
            {isLoading ? "Checking..." : "Send Secure OTP"}
          </button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerifyOTP} className="space-y-8">
          <div className="p-4 border-l-4 border-black bg-gray-50 text-sm font-medium">
            Code sent to: <br /><strong>{maskedEmail}</strong>
          </div>

          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-black mb-3">
              Enter 6-Digit OTP
            </label>
            <input
              type="text"
              maxLength="6"
              placeholder="••••••"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="w-full px-4 py-4 border-2 border-gray-200 focus:border-black outline-none transition-colors text-center tracking-[1em] text-2xl font-mono"
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className={`w-full py-4 px-6 text-white font-bold tracking-widest uppercase transition-colors ${isLoading || otp.length !== 6
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-black hover:bg-gray-800"
              }`}
          >
            {isLoading ? "Verifying..." : "Verify & Access"}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep("matric");
              setOtp("");
              setErrorMessage("");
              setSuccessMessage("");
            }}
            className="w-full text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors text-center"
            disabled={isLoading}
          >
            Wrong Matric Number?
          </button>
        </form>
      )}
    </div>
  );
}
