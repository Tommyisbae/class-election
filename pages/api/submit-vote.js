import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import crypto from "crypto"; // <--- ADD THIS MISSING IMPORT
import { serialize } from "cookie"; // <--- ADD THIS IMPORT

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // ==========================================
  // SECURITY UPDATE: Read the HTTP-Only Cookie
  // ==========================================
  const token = req.cookies?.voter_session;

  if (!token) {
    return res
      .status(401)
      .json({ error: "Unauthorized. Your session has expired or is missing." });
  }

  let matricNumber;
  try {
    // Verify the token using your secret key. If it's expired or tampered with, this throws an error.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    matricNumber = decoded.matricNumber; // Extracted securely from the backend cookie!
  } catch (err) {
    return res.status(401).json({
      error: "Invalid or expired session. Please refresh and log in again.",
    });
  }

  // We no longer need matricNumber from req.body, only the candidateIds!
  const { candidateIds } = req.body;

  // 1. Array Validation (Exactly 5 & Unique Check)
  if (!candidateIds || candidateIds.length !== 5) {
    return res
      .status(400)
      .json({ error: "You must select exactly 5 candidates." });
  }

  // Remove duplicates just in case someone tried to pass [ID_1, ID_1, ID_1]
  const uniqueCandidates = [...new Set(candidateIds)];
  if (uniqueCandidates.length !== candidateIds.length) {
    return res.status(400).json({ error: "Duplicate candidates detected." });
  }

  // 2. Generate the Anonymous Receipt Hash (e.g., VOTE-A7K9M)
  const receiptHash = `VOTE-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  // 3. Fetch candidate names for the receipt
  const { data: candidateRows, error: candidateError } = await supabase
    .from("candidates")
    .select("candidate_id, name")
    .in("candidate_id", uniqueCandidates);

  if (candidateError) {
    return res.status(500).json({ error: "Failed to verify candidates." });
  }

  if (candidateRows.length !== uniqueCandidates.length) {
    return res.status(400).json({ error: "One or more invalid candidate IDs." });
  }

  // 4. Execute the Atomic Transaction via Supabase RPC
  const { error } = await supabase.rpc("cast_senatorial_vote", {
    p_matric_number: matricNumber,
    p_receipt_hash: receiptHash,
    p_candidate_ids: uniqueCandidates,
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  // ==========================================
  // SECURITY UPDATE: DESTROY SESSION ON VOTE
  // ==========================================
  const expiredCookie = serialize("voter_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: -1, // Expire immediately
    path: "/",
  });
  res.setHeader("Set-Cookie", expiredCookie);

  // 5. Return the hash and candidate names
  const votedNames = candidateRows
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => c.name);
  return res.status(200).json({ success: true, receiptHash, candidates: votedNames });
}
