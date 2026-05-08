'use client';

import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const { signIn, signUp, user } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
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
            {/* Header */}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">
                {mode === "login" ? "Entrar na sua conta" : "Criar nova conta"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {mode === "login"
                  ? "Acesse seus pedidos e informações de entrega"
                  : "Crie sua conta para começar a comprar"}
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

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
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

              <AnimatePresence mode="wait">
                {mode === "register" && (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
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
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                className="w-full h-11 rounded-xl font-semibold mt-2"
                disabled={loading}
              >
                {loading ? "Carregando..." : (mode === "login" ? "Entrar" : "Criar conta")}
              </Button>
            </form>

            {/* Toggle */}
            <div className="text-center text-sm border-t border-border pt-5">
              <span className="text-muted-foreground">
                {mode === "login" ? "Não tem conta? " : "Já tem conta? "}
              </span>
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-primary font-semibold hover:underline"
                disabled={loading}
              >
                {mode === "login" ? "Cadastre-se grátis" : "Faça login"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
