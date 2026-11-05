"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ExternalLink,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  {
    href: "/admin",
    label: "Dashboard",
    description: "Métricas, pedidos e gateway",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/admin/produtos",
    label: "Produtos",
    description: "Catálogo, estoque e fotos",
    icon: Package,
    exact: false,
  },
  {
    href: "/admin/banners",
    label: "Carrossel / Banners",
    description: "Destaques da página inicial",
    icon: Images,
    exact: false,
  },
  {
    href: "/admin/configuracoes",
    label: "Configurações",
    description: "Credenciais e gateways",
    icon: Settings,
    exact: false,
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [adminEmail, setAdminEmail] = React.useState<string>("admin@bbbshopbrasil.com.br");
  const [loggingOut, setLoggingOut] = React.useState(false);

  const isLoginPage = pathname === "/admin/login" || pathname?.startsWith("/admin/login/");

  React.useEffect(() => {
    if (isLoginPage) return;
    let active = true;
    fetch("/api/admin/auth")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data?.email) {
          setAdminEmail(data.email);
        }
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      active = false;
    };
  }, [isLoginPage]);

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
        {children}
      </div>
    );
  }

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
    } finally {
      router.push("/admin/login");
      router.refresh();
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800">
      {/* Barra Superior Mobile */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu administrativo"
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="BBB Shop Brasil"
              width={110}
              height={36}
              className="h-8 w-auto object-contain"
            />
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              Admin
            </span>
          </div>
        </div>
        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          <span>Ver Loja</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </header>

      {/* Backdrop Mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Lateral */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="BBB Shop Brasil"
              width={120}
              height={40}
              className="h-9 w-auto object-contain"
            />
            <div>
              <p className="text-sm font-bold tracking-tight text-slate-900">
                BBB Shop
              </p>
              <p className="text-[11px] font-medium text-slate-500">
                Gestão do E-commerce
              </p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Menu Principal
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname?.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center gap-3.5 rounded-xl px-3.5 py-3 transition-all ${
                  active
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                }`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 ${
                    active
                      ? "text-amber-400"
                      : "text-slate-400 group-hover:text-slate-700"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.label}</p>
                  <p
                    className={`truncate text-xs ${
                      active ? "text-slate-300" : "text-slate-400"
                    }`}
                  >
                    {item.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="mb-3 flex items-center gap-2.5 rounded-xl bg-[#F8FAFC] px-3.5 py-2.5 border border-slate-200/70">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-800">
                Sessão Autenticada
              </p>
              <p className="truncate text-[11px] text-slate-500">{adminEmail}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/"
              target="_blank"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <span>Ver Loja</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/60 px-3 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{loggingOut ? "Saindo..." : "Sair"}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Área Principal de Conteúdo */}
      <div className="lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}

