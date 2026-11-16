"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { DollarSign, ShoppingBag, TrendingUp, Award } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface AnalyticsDashboardProps {
  totalRevenueCents: number;
  totalOrders: number;
  averageTicketCents: number;
  dailyRevenue: Array<{ day: string; revenueReais: number; orders: number }>;
  topProducts: Array<{ name: string; quantity: number }>;
}

export function AnalyticsDashboard({
  totalRevenueCents,
  totalOrders,
  averageTicketCents,
  dailyRevenue,
  topProducts,
}: AnalyticsDashboardProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-zinc-900">
          Dashboard Analítico
        </h1>
        <p className="text-sm text-zinc-500">
          Indicadores de faturamento, ticket médio e itens mais pedidos do Brasa Viva.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">
              Faturamento Total
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-zinc-900">
            {formatCurrency(totalRevenueCents)}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">
              Total de Pedidos
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-zinc-900">
            {totalOrders}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">
              Ticket Médio
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-zinc-900">
            {formatCurrency(averageTicketCents)}
          </p>
        </div>
      </div>

      {/* Gráficos Recharts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <h2 className="mb-4 text-base font-bold text-zinc-900">
            Faturamento Diário (R$)
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Faturamento"]}
                />
                <Bar dataKey="revenueReais" fill="#ea580c" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-orange-600" />
            <h2 className="text-base font-bold text-zinc-900">
              Produtos Mais Vendidos (Unidades)
            </h2>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip formatter={(value: number) => [value, "Unidades"]} />
                <Bar dataKey="quantity" fill="#18181b" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
