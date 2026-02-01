import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireApproval?: boolean;
  allowedRoles?: Array<"sdr" | "consultor" | "gestor" | "master">;
}

export function ProtectedRoute({
  children,
  requireApproval = true,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, profile, loading, isApproved } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Logged in but not approved
  if (requireApproval && !isApproved) {
    return <Navigate to="/acesso-pendente" replace />;
  }

  // Check role permissions - Master always has access
  if (allowedRoles && profile) {
    const userRole = profile.role as "sdr" | "consultor" | "gestor" | "master";
    if (userRole !== "master" && !allowedRoles.includes(userRole)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
