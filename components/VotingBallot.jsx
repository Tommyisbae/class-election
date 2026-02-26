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
      <div className="max-w-lg mx-auto p-12 bg-white border-4 border-black text-center mt-10">
        <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">
          Vote Cast
        </h2>
        <p className="text-sm font-bold tracking-widest uppercase text-gray-500 mb-8">
          Securely Recorded
        </p>

        <div className="bg-black text-white p-6 mb-8">
          <p className="text-xs font-bold tracking-widest uppercase mb-2 text-gray-400">
            Receipt Hash
          </p>
          <p className="text-2xl font-mono tracking-wider break-all">
            {receiptHash}
          </p>
        </div>

        <p className="mt-6 text-sm font-bold uppercase tracking-widest mb-8 border-2 border-dashed border-black p-4">
          Screenshot this receipt.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="w-full py-4 bg-white border-2 border-black text-black font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
        >
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-6 w-full">
      <div className="flex justify-between items-end mb-8 border-b-2 border-black pb-4">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter">
            Ballot
          </h2>
          <p className="font-bold tracking-widest uppercase text-xs mt-2">
            Select up to <span className="bg-black text-white px-2 py-1 ml-1 rounded-none">5 candidates</span>
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors"
        >
          Cancel & Log Out
        </button>
      </div>

      {errorMessage && (
        <div className="bg-black text-white p-4 mb-8 font-bold text-sm tracking-wide uppercase">
          Error: {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-32">
        {candidates.map((candidate) => {
          const cId = candidate.id || candidate.candidate_id;
          const isSelected = selectedIds.includes(cId);
          const isDisabled = !isSelected && selectedIds.length >= 5;

          return (
            <label
              key={cId}
              className={`flex items-start p-6 border-2 cursor-pointer transition-colors ${isSelected
                  ? "border-black bg-gray-50 ring-2 ring-black ring-offset-2"
                  : "border-gray-200 hover:border-black bg-white"
                } ${isDisabled ? "opacity-30 cursor-not-allowed" : ""}`}
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
                  className={`w-6 h-6 border-2 flex items-center justify-center transition-colors ${isSelected
                      ? "bg-black border-black"
                      : "border-gray-300 bg-white"
                    }`}
                >
                  {isSelected && (
                    <div className="w-3 h-3 bg-white"></div>
                  )}
                </div>
              </div>

              <div className="ml-6">
                <p className="text-2xl font-bold uppercase tracking-tight">
                  {candidate.name}
                </p>
                <p className="text-xs tracking-widest uppercase font-bold text-gray-500 mt-1">
                  {candidate.post || "Senatorial Candidate"}
                </p>
              </div>
            </label>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-black p-6 z-10">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <span className="font-black text-2xl">
            {selectedIds.length} <span className="text-gray-400 text-lg">/ 5</span>
          </span>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedIds.length === 0}
            className={`py-4 px-10 text-white font-bold text-sm tracking-widest uppercase transition-colors ${isSubmitting || selectedIds.length === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-black hover:bg-gray-800"
              }`}
          >
            {isSubmitting ? "Submitting..." : "Cast Vote"}
          </button>
        </div>
      </div>
    </div>
  );
}
