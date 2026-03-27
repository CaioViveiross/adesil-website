'use client';

import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");

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

          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert("Login simulado com sucesso!"); }}>
            {mode === "register" && (
              <input type="text" placeholder="Nome completo" className="w-full px-4 py-3 border rounded-xl bg-background" />
            )}
            <input type="email" placeholder="E-mail" className="w-full px-4 py-3 border rounded-xl bg-background" />
            <input type="password" placeholder="Senha" className="w-full px-4 py-3 border rounded-xl bg-background" />
            {mode === "register" && (
              <input type="password" placeholder="Confirmar senha" className="w-full px-4 py-3 border rounded-xl bg-background" />
            )}
            <Button variant="hero" type="submit" className="w-full">
              {mode === "login" ? "Entrar" : "Criar Conta"}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              {mode === "login" ? "Não tem conta? " : "Já tem conta? "}
            </span>
            <button
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-primary font-medium hover:underline"
            >
              {mode === "login" ? "Cadastre-se" : "Faça login"}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
