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

  // 1. Array Validation (The "Max 5" & "Unique" Check)
  if (!candidateIds || candidateIds.length === 0) {
    return res
      .status(400)
      .json({ error: "You must select at least 1 candidate." });
  }

  if (candidateIds.length > 5) {
    return res
      .status(400)
      .json({ error: "You cannot select more than 5 candidates." });
  }

  // Remove duplicates just in case someone tried to pass [ID_1, ID_1, ID_1]
  const uniqueCandidates = [...new Set(candidateIds)];
  if (uniqueCandidates.length !== candidateIds.length) {
    return res.status(400).json({ error: "Duplicate candidates detected." });
  }

  // 2. Generate the Anonymous Receipt Hash (e.g., VOTE-A7K9M)
  const receiptHash = `VOTE-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  // 3. Execute the Atomic Transaction via Supabase RPC
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

  // 4. Return the hash
  return res.status(200).json({ success: true, receiptHash });
}
