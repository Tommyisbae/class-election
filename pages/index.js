import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import VoterLogin from "../components/VoterLogin";
import VotingBallot from "../components/VotingBallot";
import { createClient } from "@supabase/supabase-js";

// ==========================================
// 1. SERVER SIDE (Runs once on Vercel)
// ==========================================
export async function getStaticProps() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { data: candidates } = await supabaseAdmin
    .from('candidates')
    .select('*')
    .order('name', { ascending: true });

  return {
    props: {
      initialCandidates: candidates || [],
    },
    revalidate: 60,
  };
}

// ==========================================
// 2. CLIENT SIDE (Runs in User's Browser)
// ==========================================
export default function Home({ initialCandidates }) {
  const [candidates] = useState(initialCandidates);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [matricNumber, setMatricNumber] = useState('');
  const [timeStatus, setTimeStatus] = useState('open');

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const start = new Date(process.env.NEXT_PUBLIC_ELECTION_START);
      const end = new Date(process.env.NEXT_PUBLIC_ELECTION_END);

      if (now < start) setTimeStatus('early');
      else if (now > end) setTimeStatus('closed');
      else setTimeStatus('open');
    };

    checkTime();
    const timer = setInterval(checkTime, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleLoginSuccess = (loggedInMatricNumber) => {
    setMatricNumber(loggedInMatricNumber);
    setIsAuthenticated(true);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#0B0F19] selection:bg-indigo-500/30">
      <Head>
        <title>Senatorial Election 2026</title>
      </Head>

      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <header className="flex justify-between items-center p-6 max-w-5xl mx-auto w-full z-10 border-b border-white/5 bg-[#0B0F19]/50 backdrop-blur-md">
        <div className="font-bold tracking-tight text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 uppercase">
          Senate '26
        </div>
        <Link
          href="/results"
          className="text-sm font-medium text-slate-400 hover:text-white transition-colors uppercase tracking-wider"
        >
          Live Results &rarr;
        </Link>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-4 z-10 w-full relative">
        {timeStatus === "early" ? (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl p-12 text-center max-w-md w-full rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
              Voting Closed
            </h2>
            <p className="mb-8 text-slate-300">
              The election portal opens strictly at 8:00 AM.
            </p>
            <div className="inline-block px-6 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold tracking-wide shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              Starts: 8:00 AM (WAT)
            </div>
          </div>
        ) : timeStatus === "closed" ? (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl p-12 text-center max-w-md w-full rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            <h2 className="text-3xl font-bold mb-4 text-white">
              Election Concluded
            </h2>
            <p className="mb-8 text-slate-300">
              The voting period ended at 10:00 AM.
            </p>
            <Link
              href="/results"
              className="w-full block py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold tracking-wide hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all hover:-translate-y-0.5"
            >
              View Final Results
            </Link>
          </div>
        ) : isAuthenticated ? (
          <VotingBallot matricNumber={matricNumber} candidates={candidates} />
        ) : (
          <VoterLogin onLoginSuccess={handleLoginSuccess} />
        )}
      </main>

      <footer className="p-6 text-center z-10">
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
          Secured by End-to-End Cryptography • Electoral Committee 2026
        </p>
      </footer>
    </div>
  );
}
