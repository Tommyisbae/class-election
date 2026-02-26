import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import VoterLogin from "../components/VoterLogin";
import VotingBallot from "../components/VotingBallot";
import { createClient } from "@supabase/supabase-js";

// SERVER SIDE
export async function getStaticProps() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
  );

  const { data: candidates } = await supabaseAdmin
    .from("candidates")
    .select("*")
    .order("name", { ascending: true });

  return {
    props: { initialCandidates: candidates || [] },
    revalidate: 60,
  };
}

// CLIENT SIDE
export default function Home({ initialCandidates }) {
  const [candidates] = useState(initialCandidates);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [matricNumber, setMatricNumber] = useState("");
  const [timeStatus, setTimeStatus] = useState("open");

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const start = new Date(process.env.NEXT_PUBLIC_ELECTION_START);
      const end = new Date(process.env.NEXT_PUBLIC_ELECTION_END);

      if (now < start) setTimeStatus("early");
      else if (now > end) setTimeStatus("closed");
      else setTimeStatus("open");
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
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto px-4">
      <Head>
        <title>Senatorial Election 2026</title>
      </Head>

      {/* Simple Header */}
      <header className="flex justify-between items-center py-6 border-b border-neutral-800 mb-8">
        <div className="font-bold text-lg tracking-tight">Senate '26</div>
        <Link
          href="/results"
          className="text-sm text-blue-500 hover:text-blue-400 font-medium"
        >
          Live Results &rarr;
        </Link>
      </header>

      <main className="flex-grow flex flex-col justify-center">
        {timeStatus === "early" ? (
          <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-lg text-center">
            <h2 className="text-xl font-bold mb-2">Voting Closed</h2>
            <p className="text-neutral-400 mb-4">Opens at 8:00 AM.</p>
          </div>
        ) : timeStatus === "closed" ? (
          <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-lg text-center">
            <h2 className="text-xl font-bold mb-2">Election Concluded</h2>
            <Link
              href="/results"
              className="block w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded mt-4"
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

      <footer className="py-8 text-center text-xs text-neutral-600">
        Electoral Committee 2026
      </footer>
    </div>
  );
}
