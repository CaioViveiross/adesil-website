'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Menu, X, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const { itemCount } = useCart();
  const { user, signOut, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { label: "Produtos", href: "/categoria/todos" },
    { label: "Contato", href: "/contato" },
  ];

  const handleSignOut = async () => {
    await signOut();
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/60">
      <div className="container flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/images/adesil_logo.svg"
            alt="Adesil Print"
            width={80}
            height={40}
            className="h-8 w-auto"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors group ${
                pathname === link.href
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
              <span
                className={`absolute bottom-1 left-4 right-4 h-px bg-primary transition-transform duration-200 origin-left ${
                  pathname === link.href ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                }`}
              />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          {!loading && (
            user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden md:flex h-9 w-9 rounded-lg">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-medium text-foreground">
                    Olá, {user.name}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/meus-pedidos">Meus Pedidos</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/meu-endereco">Meu Endereço</Link>
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">Painel Admin</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth" className="hidden md:flex">
                <Button variant="ghost" size="sm" className="h-9 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground">
                  Entrar
                </Button>
              </Link>
            )
          )}

          <Link href="/carrinho">
            <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg">
              <ShoppingCart className="h-4 w-4" />
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold leading-none"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9 rounded-lg"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden border-t border-border/60 bg-background overflow-hidden"
          >
            <nav className="container py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium px-3 py-2.5 rounded-lg transition-colors ${
                    pathname === link.href
                      ? "bg-secondary text-primary"
                      : "text-foreground hover:bg-muted"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              {!loading && (
                user ? (
                  <div className="border-t border-border/60 pt-3 mt-2 space-y-1">
                    <div className="text-[11px] font-semibold text-muted-foreground px-3 py-1 uppercase tracking-wider">
                      Minha conta
                    </div>
                    <Link
                      href="/meus-pedidos"
                      className="block text-sm font-medium px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      Meus Pedidos
                    </Link>
                    <Link
                      href="/meu-endereco"
                      className="block text-sm font-medium px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      Meu Endereço
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        href="/admin"
                        className="block text-sm font-medium px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
                        onClick={() => setMobileOpen(false)}
                      >
                        Painel Admin
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 text-sm font-medium px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/5 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/auth"
                    className="text-sm font-semibold px-3 py-2.5 rounded-lg bg-primary text-primary-foreground text-center mt-2 block"
                    onClick={() => setMobileOpen(false)}
                  >
                    Entre ou Cadastre-se
                  </Link>
                )
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
