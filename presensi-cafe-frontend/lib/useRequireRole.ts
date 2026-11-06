"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, } from "./auth-context";
import type { Role } from "./api";

export function useRequireRole(allowedRole: Role) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role !== allowedRole) {
      const tujuan = user.role === "super_admin" ? "/super-admin" : user.role === "admin" ? "/admin" : "/pegawai";
      router.replace(tujuan);
    }
  }, [user, isLoading, allowedRole, router]);

  return { user, isLoading };
}
