import { useState } from "react";

export default function VoterLogin({ onLoginSuccess }) {
  const [step, setStep] = useState("matric");
  const [matricNumber, setMatricNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!matricNumber.trim()) return;

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matricNumber: matricNumber.trim().toUpperCase(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setMaskedEmail(data.message.split("to ")[1]);
      setStep("otp");
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return;

    setIsLoading(true);
    setErrorMessage("");

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
      if (!response.ok) throw new Error(data.error);

      onLoginSuccess(matricNumber.trim().toUpperCase());
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Voter Login</h2>
        <p className="text-neutral-400 text-sm">Authentication required.</p>
      </div>

      {errorMessage && (
        <div className="bg-red-900/50 border border-red-900 text-red-200 p-3 rounded mb-6 text-sm">
          {errorMessage}
        </div>
      )}

      {step === "matric" && (
        <form onSubmit={handleSendOTP} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">
              Matric Number
            </label>
            <input
              type="text"
              placeholder="19/1234"
              value={matricNumber}
              onChange={(e) => setMatricNumber(e.target.value)}
              className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded focus:border-blue-500 focus:outline-none text-white placeholder-neutral-700"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !matricNumber}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-semibold rounded transition-colors"
          >
            {isLoading ? "Checking..." : "Continue"}
          </button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded text-sm text-neutral-300">
            Code sent to{" "}
            <span className="text-white font-mono">{maskedEmail}</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">
              6-Digit Code
            </label>
            <input
              type="text"
              maxLength="6"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded focus:border-blue-500 focus:outline-none text-white text-center font-mono text-xl tracking-widest"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-semibold rounded transition-colors"
          >
            {isLoading ? "Verifying..." : "Access Ballot"}
          </button>

          <button
            type="button"
            onClick={() => setStep("matric")}
            className="w-full text-sm text-neutral-500 hover:text-white mt-2"
          >
            Change Matric Number
          </button>
        </form>
      )}
    </div>
  );
}
