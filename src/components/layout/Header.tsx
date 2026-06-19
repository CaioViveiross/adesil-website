'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart, Menu, X, User, LogOut, Package, MapPin, LayoutDashboard, ChevronDown, Search, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useRef, useEffect } from "react";
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const [bannerText, setBannerText]   = useState<string | null>(null);
  const [bannerColor, setBannerColor] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("banner-dismissed") === "true";
    if (dismissed) { setBannerDismissed(true); return; }
    fetch("/api/settings/public")
      .then((r) => r.json())
      .then((d) => {
        if (d.banner_active && d.banner_text) {
          setBannerText(d.banner_text);
          setBannerColor(d.banner_color ?? null);
        }
      })
      .catch(() => {});
  }, []);

  const navLinks = [
    { label: "Produtos", href: "/categoria/todos" },
    { label: "Sobre Nós", href: "/sobre" },
    { label: "Contato", href: "/contato" },
  ];

  const handleSignOut = async () => {
    await signOut();
    setMobileOpen(false);
  };

  const handleSearchOpen = () => {
    setSearchOpen(true);
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  const handleSearchClose = () => {
    setSearchOpen(false);
    setSearchValue("");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchValue.trim();
    if (q) {
      router.push(`/categoria/todos?q=${encodeURIComponent(q)}`);
    }
    handleSearchClose();
  };

  const handleDismissBanner = () => {
    sessionStorage.setItem("banner-dismissed", "true");
    setBannerDismissed(true);
  };

  const bannerTextColor = bannerColor
    ? (() => {
        const r = parseInt(bannerColor.slice(1, 3), 16);
        const g = parseInt(bannerColor.slice(3, 5), 16);
        const b = parseInt(bannerColor.slice(5, 7), 16);
        return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? "#000000" : "#ffffff";
      })()
    : undefined;

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/60">
      {/* Announcement banner */}
      <AnimatePresence>
        {bannerText && !bannerDismissed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div
              className={`text-xs font-medium py-2 px-10 relative flex items-center justify-center gap-2 ${!bannerColor ? "bg-primary text-primary-foreground" : ""}`}
              style={bannerColor ? { backgroundColor: bannerColor, color: bannerTextColor } : undefined}
            >
              <Megaphone className="h-3.5 w-3.5 shrink-0" />
              <span className="text-center">{bannerText}</span>
              <button
                onClick={handleDismissBanner}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity"
                aria-label="Fechar aviso"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="container flex items-center justify-between h-24">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/images/adesil_logo.svg"
            alt="Adesil Print"
            width={80}
            height={40}
            className="h-12 w-auto"
          />
        </Link>

        {/* Desktop Nav or Search bar */}
        <AnimatePresence mode="wait">
          {searchOpen ? (
            <motion.form
              key="search"
              initial={{ opacity: 0, width: "60%" }}
              animate={{ opacity: 1, width: "100%" }}
              exit={{ opacity: 0, width: "60%" }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onSubmit={handleSearchSubmit}
              className="hidden md:flex items-center gap-2 mx-6"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && handleSearchClose()}
                  placeholder="Buscar produtos..."
                  className="w-full h-10 pl-9 pr-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <Button type="submit" size="sm" className="h-10 rounded-xl px-4 font-semibold shrink-0">
                Buscar
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-xl shrink-0" onClick={handleSearchClose}>
                <X className="h-4 w-4" />
              </Button>
            </motion.form>
          ) : (
            <motion.nav
              key="nav"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="hidden md:flex items-center gap-1"
            >
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
            </motion.nav>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Search icon (desktop) */}
          {!searchOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex h-9 w-9 rounded-lg"
              onClick={handleSearchOpen}
              aria-label="Buscar produtos"
            >
              <Search className="h-4 w-4" />
            </Button>
          )}

          {!loading && (
            user ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button className="hidden md:flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/50 transition-all duration-200 group">
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <span className="text-primary-foreground text-[11px] font-bold leading-none select-none">
                        {user.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-foreground max-w-[100px] truncate">
                      {user.name?.split(" ")[0]}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform duration-200" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5 shadow-lg border border-border">
                  <div className="px-3 py-2.5 mb-1">
                    <p className="text-sm font-semibold text-foreground leading-none">{user.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{user.email}</p>
                  </div>

                  <DropdownMenuSeparator className="my-1" />

                  <DropdownMenuItem asChild className="rounded-lg gap-2.5 cursor-pointer">
                    <Link href="/meus-pedidos">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      Meus Pedidos
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="rounded-lg gap-2.5 cursor-pointer">
                    <Link href="/meu-endereco">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      Meu Endereço
                    </Link>
                  </DropdownMenuItem>

                  {user.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator className="my-1" />
                      <DropdownMenuItem asChild className="rounded-lg gap-2.5 cursor-pointer">
                        <Link href="/admin">
                          <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                          Painel Admin
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator className="my-1" />

                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="rounded-lg gap-2.5 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/8"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair da conta
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth" className="hidden md:flex">
                <Button variant="ghost" size="sm" className="h-9 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground gap-1.5">
                  <User className="h-4 w-4" />
                  Entrar
                </Button>
              </Link>
            )
          )}

          {/* Cart */}
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

          {/* Mobile hamburger */}
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

      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 top-16 md:hidden z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full left-0 right-0 md:hidden border-t border-border/60 bg-background shadow-xl z-50 overflow-hidden"
          >
            <nav className="container py-3 flex flex-col gap-1">
              {/* Mobile search */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = searchValue.trim();
                  if (q) router.push(`/categoria/todos?q=${encodeURIComponent(q)}`);
                  setMobileOpen(false);
                  setSearchValue("");
                }}
                className="flex gap-2 mb-1"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Buscar produtos..."
                    className="w-full h-9 pl-8 pr-3 border border-border rounded-xl text-sm bg-muted/40 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <Button type="submit" size="sm" className="h-9 rounded-xl px-3 shrink-0">
                  <Search className="h-3.5 w-3.5" />
                </Button>
              </form>

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
                    <div className="flex items-center gap-3 px-3 py-2 mb-1">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <span className="text-primary-foreground text-xs font-bold">
                          {user.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>

                    <Link
                      href="/meus-pedidos"
                      className="flex items-center gap-3 text-sm font-medium px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Package className="h-4 w-4 text-muted-foreground" />
                      Meus Pedidos
                    </Link>
                    <Link
                      href="/meu-endereco"
                      className="flex items-center gap-3 text-sm font-medium px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      Meu Endereço
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-3 text-sm font-medium px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
                        onClick={() => setMobileOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                        Painel Admin
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 text-sm font-medium px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/5 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair da conta
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/auth"
                    className="flex items-center justify-center gap-2 text-sm font-semibold px-3 py-2.5 rounded-lg bg-primary text-primary-foreground mt-2"
                    onClick={() => setMobileOpen(false)}
                  >
                    <User className="h-4 w-4" />
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
