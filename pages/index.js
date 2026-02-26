import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import VoterLogin from "../components/VoterLogin";
import VotingBallot from "../components/VotingBallot";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [matricNumber, setMatricNumber] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeStatus, setTimeStatus] = useState("open");

  useEffect(() => {
    const fetchCandidates = async () => {
      const { data } = await supabase
        .from("candidates")
        .select("*")
        .order("name", { ascending: true });
      if (data) setCandidates(data);
      setIsLoading(false);
    };

    const checkTime = () => {
      const now = new Date();
      const start = new Date(process.env.NEXT_PUBLIC_ELECTION_START);
      const end = new Date(process.env.NEXT_PUBLIC_ELECTION_END);

      if (now < start) setTimeStatus("early");
      else if (now > end) setTimeStatus("closed");
      else setTimeStatus("open");
    };

    fetchCandidates();
    checkTime();
    const timer = setInterval(checkTime, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleLoginSuccess = (loggedInMatricNumber) => {
    setMatricNumber(loggedInMatricNumber);
    setIsAuthenticated(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-black selection:bg-black selection:text-white">
      <Head>
        <title>Senatorial Election 2026</title>
      </Head>

      <header className="flex justify-between items-center p-6 max-w-5xl mx-auto w-full border-b border-gray-200">
        <div className="font-bold tracking-tight text-xl uppercase">
          Senate '26
        </div>
        <Link
          href="/results"
          className="text-sm font-semibold uppercase hover:underline"
        >
          Live Results &rarr;
        </Link>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-4">
        {isLoading ? (
          <div className="flex flex-col items-center">
            <div className="h-4 w-32 bg-gray-200 mb-2"></div>
            <div className="text-xs uppercase font-medium tracking-widest text-gray-500">
              Loading...
            </div>
          </div>
        ) : timeStatus === "early" ? (
          <div className="bg-white p-12 border-2 border-black text-center max-w-md w-full">
            <h2 className="text-3xl font-bold mb-4 uppercase tracking-tighter">
              Voting Closed
            </h2>
            <p className="mb-8">
              The election portal opens strictly at 8:00 AM.
            </p>
            <div className="inline-block px-6 py-3 border border-black uppercase text-xs font-bold tracking-widest">
              Starts: 8:00 AM (WAT)
            </div>
          </div>
        ) : timeStatus === "closed" ? (
          <div className="bg-white p-12 border-2 border-black text-center max-w-md w-full">
            <h2 className="text-3xl font-bold mb-4 uppercase tracking-tighter">
              Election Concluded
            </h2>
            <p className="mb-8">
              The voting period ended at 10:00 AM.
            </p>
            <Link
              href="/results"
              className="w-full block py-4 bg-black text-white font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
            >
              View Results
            </Link>
          </div>
        ) : isAuthenticated ? (
          <VotingBallot matricNumber={matricNumber} candidates={candidates} />
        ) : (
          <VoterLogin onLoginSuccess={handleLoginSuccess} />
        )}
      </main>

      <footer className="p-6 text-center border-t border-gray-200">
        <p className="text-xs font-medium uppercase tracking-widest text-gray-500">
          Electoral Committee 2026
        </p>
      </footer>
    </div>
  );
}
