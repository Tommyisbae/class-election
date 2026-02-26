import { useState } from "react";

export default function VotingBallot({ candidates }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [receiptHash, setReceiptHash] = useState(null);

  const handleToggle = (candidateId) => {
    setErrorMessage("");

    if (selectedIds.includes(candidateId)) {
      setSelectedIds(selectedIds.filter((id) => id !== candidateId));
    } else {
      if (selectedIds.length < 5) {
        setSelectedIds([...selectedIds, candidateId]);
      } else {
        setErrorMessage("Maximum 5 candidates allowed.");
      }
    }
  };

  const handleLogout = async () => {
    window.location.reload();
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      setErrorMessage("Select at least 1 candidate.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          candidateIds: selectedIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit vote.");
      }

      setReceiptHash(data.receiptHash);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (receiptHash) {
    return (
      <div className="max-w-lg mx-auto p-12 bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl text-center mt-10 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
        <h2 className="text-4xl font-bold uppercase tracking-wide mb-4 text-white">
          Vote Cast
        </h2>
        <p className="text-sm font-semibold tracking-wider uppercase text-emerald-400 mb-8">
          Securely Recorded
        </p>

        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 mb-8 shadow-inner">
          <p className="text-xs font-semibold tracking-wider uppercase mb-2 text-slate-500">
            Receipt Hash
          </p>
          <p className="text-xl font-mono tracking-wider break-all text-indigo-300">
            {receiptHash}
          </p>
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-wider mb-8 border border-dashed border-white/20 text-slate-400 p-4 rounded-xl">
          Screenshot this receipt for verification.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="w-full py-4 rounded-xl bg-white/10 border border-white/20 text-white font-bold uppercase tracking-wider hover:bg-white/20 transition-colors"
        >
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-6 w-full pb-32">
      <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-4xl font-bold uppercase tracking-wide text-white">
            Ballot
          </h2>
          <p className="font-semibold tracking-wider uppercase text-xs mt-2 text-slate-400">
            Select up to <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-1 ml-1 rounded-full text-[10px] tracking-widest shadow-lg shadow-indigo-500/20">5 candidates</span>
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10"
        >
          Cancel & Log Out
        </button>
      </div>

      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-8 font-medium text-sm tracking-wide">
          Error: {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        {candidates.map((candidate) => {
          const cId = candidate.id || candidate.candidate_id;
          const isSelected = selectedIds.includes(cId);
          const isDisabled = !isSelected && selectedIds.length >= 5;

          return (
            <label
              key={cId}
              className={`flex items-start p-6 rounded-2xl border cursor-pointer transition-all duration-300 ${isSelected
                  ? "bg-indigo-500/10 ring-1 ring-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:-translate-y-1"
                  : "bg-white/5 border-white/10 hover:border-indigo-500/50 hover:bg-white/10 hover:-translate-y-1"
                } ${isDisabled ? "opacity-30 cursor-not-allowed hover:translate-y-0" : ""}`}
            >
              <div className="relative flex items-center mt-1">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={() => handleToggle(cId)}
                />
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                    ? "bg-gradient-to-br from-blue-400 to-indigo-500 border-transparent shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                    : "border-slate-600 bg-black/20"
                    }`}
                >
                  {isSelected && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>

              <div className="ml-6 flex-1">
                <p className="text-2xl font-bold uppercase tracking-wide text-white">
                  {candidate.name}
                </p>
                <p className="text-xs tracking-wider uppercase font-semibold text-indigo-300 mt-1">
                  {candidate.post || "Senatorial Candidate"}
                </p>
              </div>
            </label>
          );
        })}
      </div>

      {/* Floating Glassmorphic Bottom Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-sm sm:max-w-md md:max-w-2xl px-4 z-50">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-full p-2 pl-8 flex justify-between items-center shadow-[0_20px_40px_rgba(0,0,0,0.5)] border-t border-white/20">
          <span className="font-bold text-2xl text-white">
            {selectedIds.length} <span className="text-slate-500 text-lg">/ 5</span>
          </span>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedIds.length === 0}
            className={`py-3 px-8 rounded-full text-white font-bold text-sm tracking-wider uppercase transition-all ${isSubmitting || selectedIds.length === 0
              ? "bg-white/5 text-slate-500 cursor-not-allowed border border-white/10"
              : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:-translate-y-0.5 border border-indigo-400/30"
              }`}
          >
            {isSubmitting ? "Submitting..." : "Cast Vote"}
          </button>
        </div>
      </div>
    </div>
  );
}
