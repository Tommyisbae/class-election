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

  useEffect(() => {
    const fetchResults = async () => {
      const { data, error } = await supabase.rpc("get_live_results");

      if (data) {
        setResults(data);
        const total = data.reduce(
          (sum, item) => sum + Number(item.vote_count),
          0,
        );
        setTotalVotesCast(total);
      } else if (error) {
        console.error("Error fetching results:", error);
      }
    };

    fetchResults();
    const interval = setInterval(fetchResults, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white text-black py-12 px-4 sm:px-6 selection:bg-black selection:text-white">
      <Head>
        <title>Live Election Results</title>
      </Head>

      <div className="max-w-2xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">
            Live Results
          </h1>
          <p className="text-lg font-medium tracking-widest uppercase text-gray-500">
            Senatorial Election 2026
          </p>
          <div className="mt-6 inline-flex items-center px-4 py-2 border-2 border-black tracking-widest text-xs font-bold uppercase">
            <span className="w-2 h-2 bg-black mr-3"></span>
            Live Updates Active
          </div>
        </div>

        <div className="space-y-6">
          {results.length === 0 ? (
            <div className="p-12 border-2 border-black text-center">
              <p className="tracking-widest uppercase font-medium text-gray-400">
                Waiting for votes...
              </p>
            </div>
          ) : (
            results.map((candidate, index) => {
              const percentage =
                totalVotesCast === 0
                  ? 0
                  : (Number(candidate.vote_count) / totalVotesCast) * 100;

              return (
                <div key={candidate.candidate_id} className="relative block p-6 border-b-2 border-gray-100 hover:border-black transition-colors">
                  <div className="flex justify-between items-end mb-4">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-gray-400 w-4">
                        {index + 1}.
                      </span>
                      <span className="text-xl font-bold uppercase tracking-tight">
                        {candidate.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-3xl font-black">
                        {candidate.vote_count}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-gray-100 h-2">
                    <div
                      className="bg-black h-2 transition-all duration-1000 ease-out"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-12 text-left border-t-2 border-black pt-6 flex justify-between items-center">
          <p className="text-xs tracking-widest uppercase font-bold text-gray-500">
            Total Valid Votes
          </p>
          <p className="text-2xl font-black">
            {totalVotesCast}
          </p>
        </div>
      </div>
    </div>
  );
}
