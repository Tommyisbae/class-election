import { useState, useEffect } from "react";
import Head from "next/head";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export default function Results() {
  const [results, setResults] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchResults = async () => {
    setIsRefreshing(true);
    const { data } = await supabase.rpc("get_live_results");
    if (data) {
      setResults(data);
      setTotalVotes(
        data.reduce((sum, item) => sum + Number(item.vote_count), 0),
      );
    }
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchResults();
  }, []);

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-8">
      <Head>
        <title>Results</title>
      </Head>

      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold">Live Results</h1>
          <p className="text-neutral-500 text-sm">Senatorial Election</p>
        </div>
        <button
          onClick={fetchResults}
          disabled={isRefreshing}
          className="text-sm text-blue-500 hover:text-blue-400 font-medium disabled:opacity-50"
        >
          {isRefreshing ? "Syncing..." : "Refresh"}
        </button>
      </div>

      <div className="space-y-6">
        {results.map((c, i) => {
          const percent =
            totalVotes === 0 ? 0 : (c.vote_count / totalVotes) * 100;
          return (
            <div key={i}>
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span>
                  {i + 1}. {c.name}
                </span>
                <span>{c.vote_count}</span>
              </div>
              <div className="w-full bg-neutral-800 h-2 rounded overflow-hidden">
                <div
                  className="bg-blue-600 h-2"
                  style={{ width: `${percent}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
