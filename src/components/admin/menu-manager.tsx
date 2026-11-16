"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AdminCategory {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface AdminProduct {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  badges: string[];
  isAvailable: boolean;
  sortOrder: number;
  categoryId: string;
  category: { id: string; name: string };
}

interface MenuManagerProps {
  initialCategories: AdminCategory[];
  initialProducts: AdminProduct[];
}

export function MenuManager({
  initialCategories,
  initialProducts,
}: MenuManagerProps) {
  const [categories, setCategories] = useState<AdminCategory[]>(initialCategories);
  const [products, setProducts] = useState<AdminProduct[]>(initialProducts);

  // Form Categoria
  const [newCatName, setNewCatName] = useState("");
  const [catLoading, setCatLoading] = useState(false);

  // Form Produto (novo ou edição)
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodName, setProdName] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodPriceReais, setProdPriceReais] = useState("39.90");
  const [prodCategoryId, setProdCategoryId] = useState(initialCategories[0]?.id ?? "");
  const [prodImageUrl, setProdImageUrl] = useState("");
  const [prodAvailable, setProdAvailable] = useState(true);
  const [prodLoading, setProdLoading] = useState(false);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCatName.trim().length < 2) return;
    setCatLoading(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCatName.trim(),
          sortOrder: categories.length + 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Erro ao criar categoria.");
        return;
      }
      setCategories((prev) => [...prev, data.category]);
      if (!prodCategoryId) setProdCategoryId(data.category.id);
      setNewCatName("");
      toast.success("Categoria criada!");
    } finally {
      setCatLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Não foi possível excluir a categoria.");
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setProducts((prev) => prev.filter((p) => p.categoryId !== id));
    toast.success("Categoria removida.");
  };

  const openEditProduct = (p: AdminProduct) => {
    setEditingProductId(p.id);
    setProdName(p.name);
    setProdDesc(p.description ?? "");
    setProdPriceReais((p.priceCents / 100).toFixed(2));
    setProdCategoryId(p.categoryId);
    setProdImageUrl(p.imageUrl ?? "");
    setProdAvailable(p.isAvailable);
    setShowProductForm(true);
  };

  const openNewProduct = () => {
    setEditingProductId(null);
    setProdName("");
    setProdDesc("");
    setProdPriceReais("36.90");
    setProdCategoryId(categories[0]?.id ?? "");
    setProdImageUrl("");
    setProdAvailable(true);
    setShowProductForm(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedReais = parseFloat(prodPriceReais.replace(",", "."));
    if (!Number.isFinite(parsedReais) || parsedReais < 1) {
      toast.error("Informe um preço válido (mínimo R$ 1,00).");
      return;
    }
    const priceCents = Math.round(parsedReais * 100);

    setProdLoading(true);
    try {
      const payload = {
        name: prodName.trim(),
        description: prodDesc.trim() || null,
        priceCents,
        categoryId: prodCategoryId,
        imageUrl: prodImageUrl.trim() || null,
        isAvailable: prodAvailable,
      };

      const url = editingProductId
        ? `/api/admin/products/${editingProductId}`
        : "/api/admin/products";
      const method = editingProductId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Erro ao salvar produto.");
        return;
      }

      if (editingProductId) {
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProductId ? data.product : p))
        );
        toast.success("Produto atualizado!");
      } else {
        setProducts((prev) => [...prev, data.product]);
        toast.success("Produto adicionado ao cardápio!");
      }
      setShowProductForm(false);
    } finally {
      setProdLoading(false);
    }
  };

  const toggleProductAvailability = async (p: AdminProduct) => {
    const res = await fetch(`/api/admin/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !p.isAvailable }),
    });
    if (!res.ok) {
      toast.error("Erro ao atualizar disponibilidade.");
      return;
    }
    const data = await res.json();
    setProducts((prev) => prev.map((item) => (item.id === p.id ? data.product : item)));
    toast.success(
      data.product.isAvailable ? "Produto marcado como disponível." : "Produto pausado."
    );
  };

  const handleDeleteProduct = async (id: string) => {
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Não é possível excluir produto que já possui pedidos vinculados.");
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Produto excluído.");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900">
            Gestão de Cardápio
          </h1>
          <p className="text-sm text-zinc-500">
            Crie categorias, ajuste preços em tempo real e pause itens esgotados.
          </p>
        </div>

        <Button type="button" onClick={openNewProduct}>
          <Plus className="h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      {/* Categorias */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-zinc-900">Categorias</h2>

        <form onSubmit={handleCreateCategory} className="flex gap-2 max-w-md">
          <Input
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="Nova categoria (ex: Combos Especiais)"
          />
          <Button type="submit" disabled={catLoading}>
            Adicionar
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm font-semibold text-zinc-800"
            >
              <span>{cat.name}</span>
              <button
                type="button"
                aria-label={`Excluir categoria ${cat.name}`}
                onClick={() => handleDeleteCategory(cat.id)}
                className="text-zinc-400 hover:text-red-600 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Modal/Formulário de Produto */}
      {showProductForm && (
        <section className="rounded-2xl border border-orange-200 bg-white p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900">
              {editingProductId ? "Editar Produto" : "Novo Produto"}
            </h2>
            <button
              type="button"
              onClick={() => setShowProductForm(false)}
              className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSaveProduct} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="prod-name">Nome do Produto</Label>
              <Input
                id="prod-name"
                required
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prod-price">Preço (R$)</Label>
              <Input
                id="prod-price"
                required
                value={prodPriceReais}
                onChange={(e) => setProdPriceReais(e.target.value)}
                placeholder="36.90"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prod-cat">Categoria</Label>
              <select
                id="prod-cat"
                value={prodCategoryId}
                onChange={(e) => setProdCategoryId(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prod-img">URL da Imagem (Unsplash)</Label>
              <Input
                id="prod-img"
                value={prodImageUrl}
                onChange={(e) => setProdImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="prod-desc">Descrição</Label>
              <Input
                id="prod-desc"
                value={prodDesc}
                onChange={(e) => setProdDesc(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 md:col-span-2">
              <input
                id="prod-avail"
                type="checkbox"
                checked={prodAvailable}
                onChange={(e) => setProdAvailable(e.target.checked)}
                className="h-4 w-4 accent-orange-600"
              />
              <Label htmlFor="prod-avail">Disponível no cardápio público</Label>
            </div>

            <div className="flex justify-end gap-2 md:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowProductForm(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={prodLoading}>
                <Check className="h-4 w-4" />
                Salvar Produto
              </Button>
            </div>
          </form>
        </section>
      )}

      {/* Tabela de Produtos */}
      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-bold uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Preço</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50/70">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.imageUrl && (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <p className="font-bold text-zinc-900">{p.name}</p>
                        {p.description && (
                          <p className="max-w-xs truncate text-xs text-zinc-500">
                            {p.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{p.category.name}</td>
                  <td className="px-4 py-3 font-bold text-zinc-900">
                    {formatCurrency(p.priceCents)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleProductAvailability(p)}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-bold cursor-pointer",
                        p.isAvailable
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-zinc-200 text-zinc-600"
                      )}
                    >
                      {p.isAvailable ? "Ativo" : "Pausado"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        aria-label={`Editar ${p.name}`}
                        onClick={() => openEditProduct(p)}
                        className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Excluir ${p.name}`}
                        onClick={() => handleDeleteProduct(p.id)}
                        className="rounded-lg p-2 text-zinc-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
