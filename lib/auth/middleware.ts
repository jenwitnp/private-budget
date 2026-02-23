import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { NextApiRequest, NextApiResponse } from "next";
import { UserRole, hasPermission } from "@/lib/auth/roles";

export async function withAuth(
  req: NextApiRequest,
  res: NextApiResponse,
  requiredPermission?: string,
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (
    requiredPermission &&
    !hasPermission(session.user.role as UserRole, requiredPermission)
  ) {
    return res.status(403).json({ error: "Forbidden" });
  }

  return session;
}
