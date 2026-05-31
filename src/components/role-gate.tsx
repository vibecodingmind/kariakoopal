'use client';

import { useAuthStore } from '@/lib/stores/auth-store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface RoleGateProps {
  children: React.ReactNode;
  roles: Array<'seeker' | 'guide' | 'admin'>;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * RoleGate component - conditionally renders children based on user role.
 * If the user doesn't have the required role, it shows the fallback or redirects.
 * 
 * Usage:
 * <RoleGate roles={['admin']}>
 *   <AdminOnlyContent />
 * </RoleGate>
 * 
 * <RoleGate roles={['seeker', 'guide']} fallback={<UnauthorizedMessage />}>
 *   <SharedContent />
 * </RoleGate>
 */
export function RoleGate({ children, roles, fallback, redirectTo }: RoleGateProps) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated && redirectTo) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, redirectTo, router]);

  // Not authenticated
  if (!isAuthenticated || !user) {
    if (redirectTo) return null;
    return fallback ? <>{fallback}</> : null;
  }

  // Check role
  if (!roles.includes(user.role)) {
    if (redirectTo) {
      // Will redirect via effect if needed
      return null;
    }
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

/**
 * Convenience components for common role gates
 */
export function SeekerOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return <RoleGate roles={['seeker']} fallback={fallback}>{children}</RoleGate>;
}

export function GuideOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return <RoleGate roles={['guide']} fallback={fallback}>{children}</RoleGate>;
}

export function AdminOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return <RoleGate roles={['admin']} fallback={fallback}>{children}</RoleGate>;
}
