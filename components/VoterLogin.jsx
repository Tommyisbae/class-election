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
    <div className="max-w-md mx-auto p-10 bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl mt-12 w-full rounded-3xl relative overflow-hidden">
      {/* Subtle top highlight for the glass card */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

      <div className="text-left mb-10 border-b border-white/10 pb-6">
        <h2 className="text-3xl font-bold uppercase tracking-wide text-white">
          Voter Login
        </h2>
        <p className="font-medium tracking-wide text-sm text-indigo-300 mt-2">
          Secure Authentication Platform
        </p>
      </div>

      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-8 font-medium text-sm tracking-wide">
          Error: {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl mb-8 font-medium text-sm tracking-wide">
          {successMessage}
        </div>
      )}

      {step === "matric" && (
        <form onSubmit={handleSendOTP} className="space-y-8 relative z-10">
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-slate-400 mb-3">
              Matriculation Number
            </label>
            <input
              type="text"
              placeholder="E.G. 19/1234"
              value={matricNumber}
              onChange={(e) => setMatricNumber(e.target.value)}
              className="w-full px-4 py-4 bg-black/20 border border-white/10 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white outline-none transition-all uppercase font-medium placeholder-slate-600 shadow-inner"
              disabled={isLoading}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !matricNumber}
            className={`w-full py-4 px-6 rounded-xl text-white font-bold tracking-wider uppercase transition-all shadow-lg ${isLoading || !matricNumber
              ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
              : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:-translate-y-0.5"
              }`}
          >
            {isLoading ? "Authenticating..." : "Send Secure OTP"}
          </button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerifyOTP} className="space-y-8 relative z-10">
          <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-medium">
            Secure code sent to: <br />
            <strong className="text-white mt-1 block">{maskedEmail}</strong>
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-slate-400 mb-3">
              Enter 6-Digit Code
            </label>
            <input
              type="text"
              maxLength="6"
              placeholder="••••••"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="w-full px-4 py-4 bg-black/40 border border-white/10 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white outline-none transition-all text-center tracking-[1em] text-2xl font-mono placeholder-slate-700 shadow-inner"
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className={`w-full py-4 px-6 rounded-xl text-white font-bold tracking-wider uppercase transition-all shadow-lg ${isLoading || otp.length !== 6
              ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
              : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:-translate-y-0.5"
              }`}
          >
            {isLoading ? "Verifying..." : "Verify & Access Ballot"}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep("matric");
              setOtp("");
              setErrorMessage("");
              setSuccessMessage("");
            }}
            className="w-full text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-white transition-colors text-center"
            disabled={isLoading}
          >
            Wrong Matric Number?
          </button>
        </form>
      )}
    </div>
  );
}
