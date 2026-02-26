import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, // Updated to use the public URL var you likely have
  process.env.SUPABASE_SERVICE_KEY, // MUST be the Service Role key to update the DB
);

// Configure Nodemailer with Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // ==========================================
  // 1. TIME CHECK (Election Window)
  // ==========================================
  const now = new Date();
  const startTime = new Date(process.env.NEXT_PUBLIC_ELECTION_START);
  const endTime = new Date(process.env.NEXT_PUBLIC_ELECTION_END);

  // Check if the date variables are valid to prevent server crashes
  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    console.error(
      "Election start/end times are not configured correctly in .env.local",
    );
    return res
      .status(500)
      .json({ error: "Election configuration error. Contact Admin." });
  }

  if (now < startTime) {
    return res.status(403).json({
      error: `Voting has not started yet. It opens on ${startTime.toLocaleString()}.`,
    });
  }

  if (now > endTime) {
    return res.status(403).json({
      error: "Voting is closed. The election has ended.",
    });
  }

  // ==========================================
  // 2. Validate Input
  // ==========================================
  const { matricNumber } = req.body;

  // 1. GET USER IP ADDRESS
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  // 2. RATE LIMIT CHECK: "The 3-Strike Rule"
  // Count how many DIFFERENT matric numbers this IP has requested
  const { count: distinctiveRequests, error: ipError } = await supabase
    .from("ip_tracking")
    .select("matric_requested", { count: "exact", head: true })
    .eq("ip_address", ip);

  // If they have requested OTPs for 5 different people, BLOCK THEM.
  if (distinctiveRequests >= 5) {
    return res.status(429).json({
      error: "Suspicious activity detected. Your IP has been blocked.",
    });
  }

  // 3. LOG THIS REQUEST (Silently fail if duplicate to save performance)
  await supabase
    .from("ip_tracking")
    .insert({
      ip_address: ip,
      matric_requested: matricNumber,
    })
    .select();

  if (!matricNumber) {
    return res.status(400).json({ error: "Matric number is required." });
  }

  try {
    // 3. Fetch the voter from Supabase
    const { data: voter, error: fetchError } = await supabase
      .from("voters")
      .select("email, has_voted, otp_expiry")
      .eq("matric_number", matricNumber)
      .single();

    if (fetchError || !voter) {
      return res
        .status(404)
        .json({ error: "Matric number not found in the electoral roll." });
    }

    // 4. Check if they have already voted
    if (voter.has_voted) {
      return res.status(403).json({
        error:
          "Access Denied. A vote has already been cast for this matric number.",
      });
    }

    // 5. Spam Protection (2-Minute Cooldown)
    // If the existing OTP expires more than 8 minutes from now, it means it was requested < 2 mins ago.
    if (voter.otp_expiry) {
      const expiryTime = new Date(voter.otp_expiry).getTime();
      const currentTime = new Date().getTime();
      const timeRemaining = expiryTime - currentTime;

      // 8 minutes = 480,000 milliseconds
      if (timeRemaining > 480000) {
        return res.status(429).json({
          error:
            "Please wait at least 2 minutes before requesting another OTP.",
        });
      }
    }

    // 6. Generate a secure 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // 7. Calculate Expiry (10 minutes from now)
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + 10);

    // 8. Save OTP to database
    const { error: updateError } = await supabase
      .from("voters")
      .update({
        current_otp: otp,
        otp_expiry: expiryDate.toISOString(),
      })
      .eq("matric_number", matricNumber);

    if (updateError) throw new Error("Failed to save OTP to database.");

    // 9. Send the Email
    const mailOptions = {
      from: `"Class Electoral Committee" <${process.env.GMAIL_USER}>`,
      to: voter.email,
      subject: "Your Voting OTP - Senatorial Election",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #2563eb;">Senatorial Election 2026</h2>
          <p>Hello,</p>
          <p>You requested access to the voting portal. Your One-Time Password (OTP) is:</p>
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
            <strong style="font-size: 24px; letter-spacing: 5px; color: #1f2937;">${otp}</strong>
          </div>
          <p style="color: #dc2626; font-size: 14px;"><strong>Note:</strong> This OTP will expire in exactly 10 minutes. Do not share this code with anyone.</p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280;">If you did not request this, please ignore this email or contact the electoral admin immediately.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    // 10. Return Success
    const maskedEmail = voter.email.replace(
      /(.{2})(.*)(?=@)/,
      (match, p1, p2) => p1 + "*".repeat(p2.length),
    );

    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to ${maskedEmail}`,
    });
  } catch (error) {
    console.error("OTP Error:", error);
    return res.status(500).json({
      error: "An internal server error occurred while sending the OTP.",
    });
  }
}
