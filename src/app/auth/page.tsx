'use client';

import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

type Mode = "login" | "register" | "forgot";

function AuthContent() {
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "oauth_failed") {
      toast({ title: "Erro", description: "Falha ao autenticar com Google. Tente novamente.", variant: "destructive" });
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "forgot") {
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email }),
        });
        if (res.ok) {
          setResetSent(true);
        } else {
          const data = await res.json().catch(() => ({}));
          toast({ title: "Erro", description: data.error || "Erro ao enviar e-mail de redefinição", variant: "destructive" });
        }
        return;
      }

      if (mode === "register") {
        if (formData.password !== formData.confirmPassword) {
          toast({ title: "Erro", description: "As senhas não coincidem", variant: "destructive" });
          return;
        }
        if (!formData.name.trim()) {
          toast({ title: "Erro", description: "Nome é obrigatório", variant: "destructive" });
          return;
        }
        const result = await signUp(formData.email, formData.password, formData.name);
        if (result.success) {
          toast({ title: "Conta criada!", description: "Verifique seu e-mail para confirmar o cadastro." });
          router.push("/");
        } else {
          toast({ title: "Erro", description: result.error || "Erro ao criar conta", variant: "destructive" });
        }
      } else {
        const result = await signIn(formData.email, formData.password);
        if (result.success) {
          toast({ title: "Bem-vindo de volta!", description: "Login realizado com sucesso." });
          if (user?.role === "admin") {
            router.push("/admin");
          } else {
            router.push("/");
          }
        } else {
          toast({ title: "Erro", description: result.error || "Erro ao fazer login", variant: "destructive" });
        }
      }
    } catch {
      toast({ title: "Erro", description: "Ocorreu um erro inesperado", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setResetSent(false);
    setFormData({ name: "", email: "", password: "", confirmPassword: "" });
  };

  return (
    <Layout>
      <div className="container flex items-center justify-center py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-7">

            {/* Forgot password — success state */}
            {mode === "forgot" && resetSent ? (
              <div className="flex flex-col items-center text-center gap-4 py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-bold">E-mail enviado!</h2>
                  <p className="text-muted-foreground text-sm">
                    Se o endereço <strong>{formData.email}</strong> estiver cadastrado, você receberá um link para redefinir sua senha.
                  </p>
                </div>
                <Button variant="outline" className="h-10 rounded-xl w-full" onClick={() => switchMode("login")}>
                  Voltar ao login
                </Button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold tracking-tight">
                    {mode === "login" ? "Entrar na sua conta" : mode === "register" ? "Criar nova conta" : "Redefinir senha"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {mode === "login"
                      ? "Acesse seus pedidos e informações de entrega"
                      : mode === "register"
                      ? "Crie sua conta para começar a comprar"
                      : "Informe seu e-mail para receber o link de redefinição"}
                  </p>
                </div>

                {/* Form */}
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <AnimatePresence mode="wait">
                    {mode === "register" && (
                      <motion.div
                        key="name"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1.5">
                          <Label htmlFor="name" className="text-sm font-medium">Nome completo</Label>
                          <Input
                            id="name"
                            type="text"
                            placeholder="Seu nome completo"
                            value={formData.name}
                            onChange={(e) => handleInputChange("name", e.target.value)}
                            required
                            disabled={loading}
                            className="h-11 rounded-xl"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                      disabled={loading}
                      className="h-11 rounded-xl"
                    />
                  </div>

                  <AnimatePresence mode="wait">
                    {mode !== "forgot" && (
                      <motion.div
                        key="password-fields"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden space-y-4"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                            {mode === "login" && (
                              <button
                                type="button"
                                onClick={() => switchMode("forgot")}
                                className="text-xs text-primary hover:underline font-medium"
                                disabled={loading}
                              >
                                Esqueci minha senha
                              </button>
                            )}
                          </div>
                          <Input
                            id="password"
                            type="password"
                            placeholder="Sua senha"
                            value={formData.password}
                            onChange={(e) => handleInputChange("password", e.target.value)}
                            required
                            disabled={loading}
                            className="h-11 rounded-xl"
                          />
                        </div>

                        {mode === "register" && (
                          <div className="space-y-1.5">
                            <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar senha</Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              placeholder="Confirme sua senha"
                              value={formData.confirmPassword}
                              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                              required
                              disabled={loading}
                              className="h-11 rounded-xl"
                            />
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl font-semibold mt-2"
                    disabled={loading || googleLoading}
                  >
                    {loading
                      ? "Carregando..."
                      : mode === "login"
                      ? "Entrar"
                      : mode === "register"
                      ? "Criar conta"
                      : "Enviar link de redefinição"}
                  </Button>
                </form>

                {/* OAuth — only on login/register */}
                {mode !== "forgot" && (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-card px-3 text-xs text-muted-foreground">ou continue com</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11 rounded-xl font-medium gap-3"
                      disabled={loading || googleLoading}
                      onClick={async () => {
                        setGoogleLoading(true);
                        await signInWithGoogle();
                      }}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      {googleLoading ? "Redirecionando…" : "Entrar com Google"}
                    </Button>
                  </>
                )}

                {/* Toggle */}
                <div className="text-center text-sm border-t border-border pt-5">
                  {mode === "forgot" ? (
                    <button
                      type="button"
                      onClick={() => switchMode("login")}
                      className="text-primary font-semibold hover:underline"
                    >
                      ← Voltar ao login
                    </button>
                  ) : (
                    <>
                      <span className="text-muted-foreground">
                        {mode === "login" ? "Não tem conta? " : "Já tem conta? "}
                      </span>
                      <button
                        type="button"
                        onClick={() => switchMode(mode === "login" ? "register" : "login")}
                        className="text-primary font-semibold hover:underline"
                        disabled={loading}
                      >
                        {mode === "login" ? "Cadastre-se grátis" : "Faça login"}
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthContent />
    </Suspense>
  );
}
