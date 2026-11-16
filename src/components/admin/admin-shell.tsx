"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Flame,
  LayoutDashboard,
  Utensils,
  QrCode,
  BarChart3,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminShellProps {
  children: React.ReactNode;
  userName: string;
  restaurantSlug: string;
}

const NAV_ITEMS = [
  { href: "/admin", label: "Pedidos (Kanban)", icon: LayoutDashboard },
  { href: "/admin/cardapio", label: "Cardápio", icon: Utensils },
  { href: "/admin/mesas", label: "Mesas & QR Codes", icon: QrCode },
  { href: "/admin/dashboard", label: "Analytics", icon: BarChart3 },
];

export function AdminShell({ children, userName, restaurantSlug }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 lg:flex-row">
      {/* Sidebar Desktop / Header Mobile */}
      <aside className="no-print flex w-full flex-col justify-between border-b border-zinc-800 bg-zinc-950 text-white lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0">
        <div>
          <div className="flex items-center justify-between px-5 py-5">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-600 text-white">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold leading-none">Brasa Viva</p>
                <p className="mt-1 text-[11px] text-zinc-400">Fortaleza • CE</p>
              </div>
            </Link>
          </div>

          <nav
            aria-label="Navegação do painel"
            className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:pb-0"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition",
                    active
                      ? "bg-orange-600 text-white"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden border-t border-zinc-800 p-4 lg:block space-y-3">
          <Link
            href={`/r/${restaurantSlug}`}
            target="_blank"
            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 hover:border-zinc-700 hover:text-white"
          >
            <span>Ver Cardápio Público</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>

          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="truncate text-xs font-bold text-white">{userName}</p>
              <p className="text-[11px] text-zinc-500">Conectado</p>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              title="Sair do painel"
              aria-label="Sair do painel"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-red-400 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
