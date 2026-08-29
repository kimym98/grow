"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoadingState } from "@/components/common/loading-state";
import { useAuth } from "@/providers/auth-provider";

const PUBLIC_ROUTES = ["/login"];

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { session, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  // 프로덕션 export는 trailingSlash: true라 pathname이 "/login/"처럼 슬래시로
  // 끝난다. PUBLIC_ROUTES와 정확히 일치시키려면 끝 슬래시를 정규화해야 한다.
  const normalizedPathname =
    pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  const isPublicRoute = PUBLIC_ROUTES.includes(normalizedPathname);

  useEffect(() => {
    if (isLoading) return;

    if (!session && !isPublicRoute) {
      router.replace("/login");
      return;
    }

    if (session && isPublicRoute) {
      router.replace("/");
    }
  }, [isLoading, session, isPublicRoute, router]);

  if (isPublicRoute) {
    return children;
  }

  if (isLoading || !session) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <LoadingState variant="detail" />
      </div>
    );
  }

  return children;
}
