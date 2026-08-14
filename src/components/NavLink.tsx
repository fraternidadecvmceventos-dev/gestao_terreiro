"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  const ativo = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <Link href={href} className={ativo ? "on" : undefined}>
      {children}
    </Link>
  );
}
