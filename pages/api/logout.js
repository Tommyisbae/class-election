import { serialize } from "cookie";

export default async function handler(req, res) {
  // Clear the cookie
  const cookie = serialize("voter_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: -1,
    path: "/",
  });

  res.setHeader("Set-Cookie", cookie);
  res.status(200).json({ success: true });
}
