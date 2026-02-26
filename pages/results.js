import { useState, useEffect } from "react";
import Head from "next/head";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export default function Results() {
  const [results, setResults] = useState([]);
  const [totalVotesCast, setTotalVotesCast] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  const fetchResults = async () => {
    setIsRefreshing(true);
    const { data, error } = await supabase.rpc("get_live_results");

    if (data) {
      setResults(data);
      const total = data.reduce(
        (sum, item) => sum + Number(item.vote_count),
        0,
      );
      setTotalVotesCast(total);

      const now = new Date();
      setLastUpdated(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    } else if (error) {
      console.error("Error fetching results:", error);
    }
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchResults();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white py-12 px-4 sm:px-6 relative overflow-hidden selection:bg-indigo-500/30">
      <Head>
        <title>Live Election Results</title>
      </Head>

      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="mb-12 text-center flex flex-col items-center">
          <h1 className="text-4xl font-bold tracking-tight uppercase mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
            Command Center
          </h1>
          <p className="text-lg font-semibold tracking-wider uppercase text-slate-400 mb-8">
            Live Election Results
          </p>

          <div className="flex flex-col items-center gap-4 w-full max-w-sm">
            <button
              onClick={fetchResults}
              disabled={isRefreshing}
              className={`w-full py-4 rounded-xl flex items-center justify-center font-bold uppercase tracking-wider transition-all shadow-lg ${isRefreshing
                ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] border border-indigo-400/30 text-white hover:-translate-y-0.5"
                }`}
            >
              {isRefreshing ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Syncing Data...
                </>
              ) : (
                "Refresh Dashboard"
              )}
            </button>
            <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">
              Last sync: <span className="text-indigo-300">{lastUpdated || "Processing..."}</span>
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {results.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl p-12 text-center rounded-3xl">
              <p className="tracking-wider uppercase font-semibold text-slate-400">
                Awaiting incoming ballots...
              </p>
            </div>
          ) : (
            results.map((candidate, index) => {
              const percentage =
                totalVotesCast === 0
                  ? 0
                  : (Number(candidate.vote_count) / totalVotesCast) * 100;

              return (
                <div
                  key={candidate.candidate_id}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl relative block p-6 rounded-2xl hover:bg-white/10 transition-colors border-white/5 hover:border-white/20"
                >
                  <div className="flex justify-between items-end mb-4">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-slate-500 w-4">
                        {index + 1}.
                      </span>
                      <span className="text-xl font-bold uppercase tracking-wide text-white">
                        {candidate.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                        {candidate.vote_count}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-black/40 rounded-full h-2 shadow-inner overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)] rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-12 text-left border-t border-white/10 pt-6 flex justify-between items-center bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl p-6 rounded-2xl">
          <p className="text-xs tracking-wider uppercase font-semibold text-slate-400">
            Total Valid Votes System-Wide
          </p>
          <p className="text-3xl font-bold text-white">{totalVotesCast}</p>
        </div>
      </div>
    </div>
  );
}
