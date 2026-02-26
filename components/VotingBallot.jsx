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
      if (selectedIds.length < 5) setSelectedIds([...selectedIds, candidateId]);
      else setErrorMessage("Max 5 candidates.");
    }
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) return setErrorMessage("Select at least 1.");
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/submit-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },

        // 👇👇👇 THIS IS THE MISSING KEY. ADD IT NOW. 👇👇👇
        credentials: "include",
        // 👆👆👆 Without this, the secure cookie stays on the laptop and doesn't go to the server.

        body: JSON.stringify({ candidateIds: selectedIds }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setReceiptHash(data.receiptHash);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (receiptHash) {
    return (
      <div className="max-w-md mx-auto text-center mt-10">
        <div className="w-16 h-16 bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Vote Recorded</h2>
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded my-6">
          <p className="text-xs text-neutral-500 uppercase mb-2">
            Receipt Hash
          </p>
          <p className="text-xl font-mono text-blue-400 break-all">
            {receiptHash}
          </p>
        </div>
        <p className="text-sm text-neutral-400 mb-8">
          Please screenshot this receipt.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-sm"
        >
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div className="w-full pb-32">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold">Ballot</h2>
          <p className="text-neutral-400 text-sm">Select up to 5 candidates.</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="text-xs text-red-500 hover:text-red-400"
        >
          Cancel
        </button>
      </div>

      {errorMessage && (
        <div className="bg-red-900/50 border border-red-900 text-red-200 p-3 rounded mb-6 text-sm">
          {errorMessage}
        </div>
      )}

      <div className="space-y-3">
        {candidates.map((c) => {
          const isSelected = selectedIds.includes(c.candidate_id || c.id);
          const isDisabled = !isSelected && selectedIds.length >= 5;

          return (
            <div
              key={c.candidate_id || c.id}
              onClick={() =>
                !isDisabled && handleToggle(c.candidate_id || c.id)
              }
              className={`flex items-center p-4 rounded border cursor-pointer transition-colors ${
                isSelected
                  ? "bg-blue-900/20 border-blue-600"
                  : "bg-neutral-900 border-neutral-800 hover:border-neutral-600"
              } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div
                className={`w-5 h-5 rounded border flex items-center justify-center mr-4 ${
                  isSelected
                    ? "bg-blue-600 border-blue-600"
                    : "border-neutral-600"
                }`}
              >
                {isSelected && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              <span className="font-medium text-lg">{c.name}</span>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-neutral-950 border-t border-neutral-800 p-4">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <span className="text-neutral-400 font-medium">
            <span
              className={
                selectedIds.length === 5 ? "text-blue-500" : "text-white"
              }
            >
              {selectedIds.length}
            </span>{" "}
            / 5 Selected
          </span>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedIds.length === 0}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-bold rounded"
          >
            {isSubmitting ? "Submitting..." : "Submit Vote"}
          </button>
        </div>
      </div>
    </div>
  );
}
