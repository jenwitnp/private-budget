import type { NextApiRequest, NextApiResponse } from "next";
import {
  getAllComplaints,
  getComplaintStats,
} from "@/server/complaints.server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get query parameters
    const { status, category } = req.query;

    // Fetch complaints
    const result = await getAllComplaints(
      status as string | undefined,
      category as string | undefined,
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[API] Error fetching complaints:", errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
}
