"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Plus, Download, Printer, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AdminTable {
  id: string;
  number: number;
  label: string | null;
  seats: number;
}

interface TablesQrManagerProps {
  restaurantSlug: string;
  restaurantName: string;
  initialTables: AdminTable[];
}

export function TablesQrManager({
  restaurantSlug,
  restaurantName,
  initialTables,
}: TablesQrManagerProps) {
  const [tables, setTables] = useState<AdminTable[]>(initialTables);
  const [qrMap, setQrMap] = useState<Record<number, string>>({});
  const [newNumber, setNewNumber] = useState(
    String((initialTables[initialTables.length - 1]?.number ?? 0) + 1)
  );
  const [creating, setCreating] = useState(false);

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  useEffect(() => {
    let active = true;
    async function generateAll() {
      const entries: Record<number, string> = {};
      for (const table of tables) {
        const url = `${origin}/r/${restaurantSlug}/mesa/${table.number}`;
        entries[table.number] = await QRCode.toDataURL(url, {
          width: 300,
          margin: 2,
          color: { dark: "#18181b", light: "#ffffff" },
        });
      }
      if (active) setQrMap(entries);
    }
    generateAll();
    return () => {
      active = false;
    };
  }, [tables, origin, restaurantSlug]);

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(newNumber, 10);
    if (!num || num < 1) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: num }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Erro ao criar mesa.");
        return;
      }
      setTables((prev) =>
        [...prev, data.table].sort((a, b) => a.number - b.number)
      );
      setNewNumber(String(num + 1));
      toast.success(`Mesa ${num} criada!`);
    } finally {
      setCreating(false);
    }
  };

  const handleDownloadPng = (tableNumber: number) => {
    const dataUrl = qrMap[tableNumber];
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `qrcode-mesa-${tableNumber}-${restaurantSlug}.png`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900">
            Mesas & QR Codes
          </h1>
          <p className="text-sm text-zinc-500">
            Gere QR Codes exclusivos para cada mesa do salão e imprima em PDF ou PNG.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <form onSubmit={handleAddTable} className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              className="w-24"
              aria-label="Número da nova mesa"
            />
            <Button type="submit" disabled={creating}>
              <Plus className="h-4 w-4" />
              Nova Mesa
            </Button>
          </form>

          <Button type="button" variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Imprimir / PDF
          </Button>
        </div>
      </div>

      {/* Grid de QR Codes */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {tables.map((table) => {
          const tableUrl = `/r/${restaurantSlug}/mesa/${table.number}`;
          const qrSrc = qrMap[table.number];

          return (
            <div
              key={table.id}
              className="flex flex-col items-center rounded-2xl border border-zinc-200 bg-white p-5 text-center shadow-xs break-inside-avoid"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
                {restaurantName}
              </p>
              <h2 className="mt-0.5 text-lg font-extrabold text-zinc-900">
                Mesa {table.number}
              </h2>
              {table.label && (
                <p className="text-xs text-zinc-500">{table.label}</p>
              )}

              <div className="my-4 flex h-44 w-44 items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50 p-2">
                {qrSrc ? (
                  <img
                    src={qrSrc}
                    alt={`QR Code Mesa ${table.number}`}
                    className="h-full w-full"
                  />
                ) : (
                  <span className="text-xs text-zinc-400">Gerando...</span>
                )}
              </div>

              <p className="text-[11px] font-medium text-zinc-500">
                Aponte a câmera para pedir direto da mesa
              </p>

              <div className="no-print mt-4 flex w-full gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadPng(table.number)}
                  className="flex-1"
                >
                  <Download className="h-3.5 w-3.5" />
                  PNG
                </Button>
                <Button type="button" size="sm" variant="secondary" asChild>
                  <a href={tableUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Abrir
                  </a>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
