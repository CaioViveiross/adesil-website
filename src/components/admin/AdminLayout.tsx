'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Users, ArrowLeft } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Produtos", href: "/admin/produtos", icon: Package },
  { label: "Pedidos", href: "/admin/pedidos", icon: ShoppingCart },
  { label: "Clientes", href: "/admin/clientes", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-foreground text-background/80 p-6 hidden md:flex flex-col shrink-0">
        <Link href="/" className="flex items-center gap-2 mb-8 text-background hover:opacity-80">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Voltar à loja</span>
        </Link>
        <h2 className="font-bold text-lg text-background mb-6">Painel Admin</h2>
        <nav className="space-y-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                pathname === item.href
                  ? "bg-background/10 text-background font-medium"
                  : "text-background/50 hover:text-background hover:bg-background/5"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 bg-muted/50 p-6 md:p-10 overflow-auto">
        {children}
      </main>
    </div>
  );
}
