'use client';

import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

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
          toast({
            title: "Erro",
            description: "As senhas não coincidem",
            variant: "destructive",
          });
          return;
        }

        if (!formData.name.trim()) {
          toast({
            title: "Erro",
            description: "Nome é obrigatório",
            variant: "destructive",
          });
          return;
        }

        const result = await signUp(formData.email, formData.password, formData.name);
        if (result.success) {
          toast({
            title: "Sucesso",
            description: "Conta criada com sucesso! Verifique seu e-mail para confirmar.",
          });
          router.push("/");
        } else {
          toast({
            title: "Erro",
            description: result.error || "Erro ao criar conta",
            variant: "destructive",
          });
        }
      } else {
        const result = await signIn(formData.email, formData.password);
        if (result.success) {
          toast({
            title: "Sucesso",
            description: "Login realizado com sucesso!",
          });
          // Redireciona para admin se o usuário for admin, senão para home
          if (user?.role === "admin") {
            router.push("/admin");
          } else {
            router.push("/");
          }
        } else {
          toast({
            title: "Erro",
            description: result.error || "Erro ao fazer login",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Layout>
      <div className="container py-16 max-w-md">
        <div className="bg-card rounded-2xl border p-8 space-y-6 shadow-sm">
          <div className="text-center">
            <h1 className="text-2xl font-bold">{mode === "login" ? "Entrar" : "Criar Conta"}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "login" ? "Acesse sua conta para ver seus pedidos" : "Crie sua conta para começar a comprar"}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === "register" && (
              <div>
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            )}

            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Sua senha"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {mode === "register" && (
              <div>
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirme sua senha"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            )}

            <Button variant="hero" type="submit" className="w-full" disabled={loading}>
              {loading ? "Carregando..." : (mode === "login" ? "Entrar" : "Criar Conta")}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              {mode === "login" ? "Não tem conta? " : "Já tem conta? "}
            </span>
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-primary font-medium hover:underline"
              disabled={loading}
            >
              {mode === "login" ? "Cadastre-se" : "Faça login"}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
