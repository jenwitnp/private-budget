import { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/auth/middleware";
import bcryptjs from "bcryptjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await withAuth(req, res, "create_user");
  if (!session) return;

  try {
    const { email, name, password, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!["user", "admin", "owner"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // In a real application, you would save this to the database
    // For now, we'll just return success
    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name,
      role,
      status: "active",
      createdAt: new Date().toISOString().split("T")[0],
      createdBy: session.user.id,
    };

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        status: newUser.status,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
