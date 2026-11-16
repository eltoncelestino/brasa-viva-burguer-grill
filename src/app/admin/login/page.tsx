"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Flame, Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@brasaviva.com.br");
  const [password, setPassword] = useState("BrasaViva@2026");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("E-mail ou senha inválidos.");
        return;
      }

      toast.success("Bem-vindo ao painel Brasa Viva!");
      router.push("/admin");
      router.refresh();
    } catch {
      toast.error("Erro ao realizar login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-white shadow-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-lg shadow-orange-600/30">
            <Flame className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">
            Brasa Viva Admin
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Painel de Gestão & Cozinha em Tempo Real
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-zinc-200">
              E-mail
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-zinc-700 bg-zinc-800 pl-10 text-white placeholder:text-zinc-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-zinc-200">
              Senha
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-zinc-700 bg-zinc-800 pl-10 text-white placeholder:text-zinc-500"
              />
            </div>
          </div>

          <Button type="submit" size="lg" disabled={loading} className="w-full mt-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              "Acessar Painel"
            )}
          </Button>
        </form>

        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3.5 text-xs text-zinc-400">
          <p className="font-semibold text-zinc-300">Acesso Demonstração (Fortaleza-CE):</p>
          <p className="mt-1">E-mail: admin@brasaviva.com.br</p>
          <p>Senha: BrasaViva@2026</p>
        </div>
      </div>
    </div>
  );
}
