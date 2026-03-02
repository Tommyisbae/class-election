import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export default function Verify() {
  const [hash, setHash] = useState("");
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    const trimmed = hash.trim().toUpperCase();
    if (!trimmed) return;

    setIsLoading(true);
    setError("");
    setResults(null);

    const { data, error: rpcError } = await supabase.rpc("verify_receipt", {
      p_receipt_hash: trimmed,
    });

    if (rpcError) {
      setError("Something went wrong. Please try again.");
    } else if (!data || data.length === 0) {
      setError("No vote found for this receipt hash.");
    } else {
      setResults(data.map((r) => r.candidate_name));
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-8">
      <Head>
        <title>Verify Vote</title>
      </Head>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Verify Your Vote</h1>
          <p className="text-neutral-500 text-sm">
            Enter your receipt hash to confirm your vote.
          </p>
        </div>
        <Link
          href="/"
          className="text-sm text-blue-500 hover:text-blue-400 font-medium"
        >
          &larr; Home
        </Link>
      </div>

      <form onSubmit={handleVerify} className="flex gap-3 mb-8">
        <input
          type="text"
          value={hash}
          onChange={(e) => setHash(e.target.value)}
          placeholder="VOTE-XXXXXXXX"
          className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-4 py-3 text-white font-mono placeholder:text-neutral-600 focus:outline-none focus:border-blue-600"
        />
        <button
          type="submit"
          disabled={isLoading || !hash.trim()}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-bold rounded"
        >
          {isLoading ? "Checking..." : "Verify"}
        </button>
      </form>

      {error && (
        <div className="bg-red-900/50 border border-red-900 text-red-200 p-4 rounded text-sm">
          {error}
        </div>
      )}

      {results && (
        <div className="bg-neutral-900 border border-neutral-800 rounded p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-900/30 text-green-500 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <p className="font-bold text-white">Vote Confirmed</p>
              <p className="text-xs text-neutral-500 font-mono">
                {hash.trim().toUpperCase()}
              </p>
            </div>
          </div>
          <p className="text-xs text-neutral-500 uppercase mb-3">
            Candidates voted for
          </p>
          <ul className="space-y-2">
            {results.map((name, i) => (
              <li
                key={i}
                className="text-sm text-neutral-200 flex items-center gap-2"
              >
                <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
