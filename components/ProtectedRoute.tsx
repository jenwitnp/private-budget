import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { UserRole } from "@/lib/auth/roles";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
  requiredPermission?: string;
}

export function ProtectedRoute({
  children,
  requiredRoles,
  requiredPermission,
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (requiredRoles && session?.user?.role) {
      if (!requiredRoles.includes(session.user.role as UserRole)) {
        router.push("/unauthorized");
        return;
      }
    }

    if (requiredPermission && session?.user?.role) {
      const { hasPermission } = require("@/lib/auth/roles");
      if (!hasPermission(session.user.role, requiredPermission)) {
        router.push("/unauthorized");
        return;
      }
    }
  }, [status, session, requiredRoles, requiredPermission, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin">
          <i className="fa-solid fa-spinner text-4xl text-emerald-500"></i>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return <>{children}</>;
}
