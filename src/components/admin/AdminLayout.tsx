'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingCart, ArrowLeft,
  Tag, Settings, Mail, Ticket, Menu, X, ChevronLeft, Users,
} from "lucide-react";

const navItems = [
  { label: "Dashboard",     href: "/admin",               icon: LayoutDashboard },
  { label: "Produtos",      href: "/admin/produtos",      icon: Package         },
  { label: "Pedidos",       href: "/admin/pedidos",       icon: ShoppingCart    },
  { label: "Categorias",    href: "/admin/categorias",    icon: Tag             },
  { label: "Cupons",        href: "/admin/cupons",        icon: Ticket          },
  { label: "Contatos",      href: "/admin/contato",       icon: Mail            },
  { label: "Usuários",      href: "/admin/usuarios",      icon: Users           },
  { label: "Configurações", href: "/admin/configuracoes", icon: Settings        },
];

function NavLinks({ collapsed, onClose }: { collapsed?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-1 flex-1">
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            title={collapsed ? item.label : undefined}
            className={`flex items-center gap-3 rounded-lg text-sm transition-all duration-200 ${
              collapsed ? "px-2 py-2.5 justify-center" : "px-4 py-2.5"
            } ${
              active
                ? "bg-background/10 text-background font-medium"
                : "text-background/50 hover:text-background hover:bg-background/5"
            }`}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed,  setCollapsed]  = useState(false);
  const pathname = usePathname();

  // Persist sidebar state across navigation
  useEffect(() => {
    const saved = localStorage.getItem("admin-sidebar-collapsed");
    if (saved !== null) setCollapsed(saved === "true");
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem("admin-sidebar-collapsed", String(next));
      return next;
    });
  };

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen flex">

      {/* ── Sidebar desktop ─────────────────────────────────────────────── */}
      <aside
        className={`hidden md:flex flex-col bg-foreground text-background/80 shrink-0 transition-all duration-300 ease-in-out ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        <div className={`flex items-center p-4 mb-2 ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2 text-background hover:opacity-80 transition-opacity text-sm">
              <ArrowLeft className="h-4 w-4 shrink-0" />
              Voltar à loja
            </Link>
          )}
          <button
            onClick={toggleCollapsed}
            className="text-background/50 hover:text-background transition-colors p-1 rounded-lg hover:bg-background/5"
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            <ChevronLeft
              className={`h-4 w-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {!collapsed && (
          <p className="font-bold text-background px-6 mb-4 text-sm">Painel Admin</p>
        )}

        <div className={`flex-1 ${collapsed ? "px-2" : "px-3"}`}>
          <NavLinks collapsed={collapsed} />
        </div>

        {collapsed && (
          <div className="px-2 pb-4">
            <Link
              href="/"
              title="Voltar à loja"
              className="flex items-center justify-center p-2 rounded-lg text-background/50 hover:text-background hover:bg-background/5 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        )}
      </aside>

      {/* ── Overlay mobile ──────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Drawer mobile ───────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 bg-foreground text-background/80 z-50 md:hidden flex flex-col transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <Link href="/" className="flex items-center gap-2 text-background hover:opacity-80 text-sm" onClick={() => setMobileOpen(false)}>
            <ArrowLeft className="h-4 w-4" />
            Voltar à loja
          </Link>
          <button onClick={() => setMobileOpen(false)} className="text-background/60 hover:text-background transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="font-bold text-background px-6 mb-4 text-sm">Painel Admin</p>
        <div className="flex-1 px-3 overflow-y-auto">
          <NavLinks onClose={() => setMobileOpen(false)} />
        </div>
      </aside>

      {/* ── Conteúdo ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar mobile */}
        <header className="md:hidden flex items-center gap-4 bg-foreground text-background px-4 py-3 sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-background/70 hover:text-background transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-bold text-sm">Painel Admin</span>
        </header>

        <main className="flex-1 bg-muted/50 p-4 md:p-10 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
