import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { matricNumber, otp } = req.body;

  if (!matricNumber || !otp) {
    return res
      .status(400)
      .json({ error: "Matric number and OTP are required." });
  }

  try {
    // 1. Fetch the voter's OTP data from Supabase
    const { data: voter, error: fetchError } = await supabase
      .from("voters")
      .select("current_otp, otp_expiry, has_voted")
      .eq("matric_number", matricNumber)
      .single();

    if (fetchError || !voter) {
      return res.status(404).json({ error: "Voter not found." });
    }

    // 2. Check if they have already voted
    if (voter.has_voted) {
      return res
        .status(403)
        .json({
          error: "A vote has already been cast for this matric number.",
        });
    }

    // 3. Verify OTP Match
    if (voter.current_otp !== otp) {
      return res
        .status(401)
        .json({ error: "Invalid OTP. Please check the code and try again." });
    }

    // 4. Check if OTP is Expired
    const now = new Date().getTime();
    const expiryTime = new Date(voter.otp_expiry).getTime();

    if (now > expiryTime) {
      return res
        .status(401)
        .json({ error: "This OTP has expired. Please request a new one." });
    }

    // 5. OTP is valid! Clear it from the database so it can NEVER be reused
    await supabase
      .from("voters")
      .update({ current_otp: null, otp_expiry: null })
      .eq("matric_number", matricNumber);

    // 6. Create a secure JSON Web Token (JWT) valid for 15 minutes
    const token = jwt.sign(
      { matricNumber: matricNumber },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }, // They have 15 mins to fill out the ballot
    );

    // 7. Set the JWT in an HTTP-Only Cookie
    // HTTP-Only means hackers cannot steal the token using JavaScript (XSS attacks)
    const cookie = serialize("voter_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use HTTPS in production
      sameSite: "strict",
      maxAge: 60 * 15, // 15 minutes in seconds
      path: "/",
    });

    res.setHeader("Set-Cookie", cookie);

    // 8. Return success
    return res
      .status(200)
      .json({ success: true, message: "Authentication successful." });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return res
      .status(500)
      .json({ error: "An internal server error occurred." });
  }
}
