"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  Clock,
  ShoppingBag,
  Flame,
  Leaf,
  Sparkles,
  Award,
  UtensilsCrossed,
  X,
  Star,
  Plus,
  Bike,
  Lock,
} from "lucide-react";
import type {
  MenuCategory,
  MenuDeliveryZone,
  MenuProduct,
  MenuRestaurant,
} from "@/types/menu";
import {
  useCartStore,
  getCartSubtotalCents,
  getCartTotalItems,
} from "@/stores/cart-store";
import { formatCurrency, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ProductModal } from "./product-modal";
import { CartDrawer } from "./cart-drawer";
import { CheckoutModal } from "./checkout-modal";

interface MenuClientProps {
  restaurant: MenuRestaurant;
  categories: MenuCategory[];
  deliveryZones: MenuDeliveryZone[];
  tableNumber?: number | null;
}

const BADGE_CONFIG: Record<
  string,
  { label: string; variant: "brand" | "vegan" | "spicy" | "new"; icon: typeof Flame }
> = {
  "mais-pedido": { label: "Mais pedido", variant: "brand", icon: Award },
  vegano: { label: "Vegano", variant: "vegan", icon: Leaf },
  picante: { label: "Picante", variant: "spicy", icon: Flame },
  novo: { label: "Novo", variant: "new", icon: Sparkles },
};

export function MenuClient({
  restaurant,
  categories,
  deliveryZones,
  tableNumber = null,
}: MenuClientProps) {
  const { items, setContext, openCart } = useCartStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    categories[0]?.id ?? ""
  );
  const [selectedProduct, setSelectedProduct] = useState<MenuProduct | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    setContext(restaurant.slug, tableNumber);
  }, [restaurant.slug, tableNumber, setContext]);

  // Destaques ("mais-pedido") para o carrossel superior
  const featuredProducts = useMemo(() => {
    const all = categories.flatMap((c) => c.products);
    return all.filter((p) => p.isAvailable && p.badges.includes("mais-pedido")).slice(0, 6);
  }, [categories]);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categories;
    return categories
      .map((cat) => ({
        ...cat,
        products: cat.products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.description ?? "").toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.products.length > 0);
  }, [categories, searchQuery]);

  // Atualiza categoria ativa automaticamente durante o scroll
  useEffect(() => {
    if (searchQuery.trim()) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace("cat-", "");
            setActiveCategoryId(id);
            break;
          }
        }
      },
      { rootMargin: "-140px 0px -65% 0px", threshold: 0.05 }
    );

    for (const cat of categories) {
      const el = document.getElementById(`cat-${cat.id}`);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [categories, searchQuery]);

  const totalItems = getCartTotalItems(items);
  const subtotalCents = getCartSubtotalCents(items);

  const scrollToCategory = (catId: string) => {
    setActiveCategoryId(catId);
    const el = document.getElementById(`cat-${catId}`);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 135;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f5] pb-28 text-zinc-900">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 border-b border-zinc-900/10 bg-zinc-950/95 text-white backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-md shadow-orange-600/30">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-sm font-extrabold tracking-tight sm:text-base">
                {restaurant.name}
              </span>
              <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                <span>{restaurant.city} - {restaurant.state}</span>
                <span>•</span>
                <span className={restaurant.isOpen ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
                  {restaurant.isOpen ? "Aberto agora" : "Fechado"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {tableNumber && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                <UtensilsCrossed className="h-3.5 w-3.5" />
                Mesa {tableNumber}
              </span>
            )}

            <button
              type="button"
              onClick={openCart}
              aria-label="Abrir sacola"
              className="group flex h-10 items-center gap-2.5 rounded-full border border-white/15 bg-white/10 px-4 text-xs font-bold text-white transition hover:bg-orange-600 hover:border-orange-500 cursor-pointer"
            >
              <ShoppingBag className="h-4 w-4 text-orange-400 group-hover:text-white transition-colors" />
              <span className="hidden sm:inline">
                {totalItems > 0 ? formatCurrency(subtotalCents) : "Sacola"}
              </span>
              {totalItems > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[11px] font-extrabold text-white group-hover:bg-white group-hover:text-orange-600">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Editorial */}
      <header className="mx-auto max-w-6xl px-4 pt-5 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-zinc-950 text-white shadow-xl">
          <div className="relative h-48 w-full sm:h-64">
            {restaurant.bannerUrl && (
              <img
                src={restaurant.bannerUrl}
                alt={`Ambiente ${restaurant.name}`}
                className="h-full w-full object-cover opacity-50"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/40 to-transparent" />
          </div>

          <div className="relative -mt-20 px-5 pb-6 sm:-mt-24 sm:px-8 sm:pb-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                {restaurant.logoUrl && (
                  <img
                    src={restaurant.logoUrl}
                    alt={restaurant.name}
                    className="h-20 w-20 rounded-2xl border-4 border-zinc-900 object-cover shadow-2xl sm:h-24 sm:w-24"
                  />
                )}
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-300 border border-amber-400/25">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      4.9 <span className="text-amber-200/70 font-normal">(340+)</span>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-zinc-200">
                      <Bike className="h-3.5 w-3.5 text-orange-400" />
                      25–35 min
                    </span>
                  </div>

                  <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-4xl">
                    {restaurant.name}
                  </h1>

                  {restaurant.description && (
                    <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-zinc-300 sm:text-sm">
                      {restaurant.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-4 text-xs text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                {restaurant.address}
              </span>
              {restaurant.openingInfo && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                  {restaurant.openingInfo}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Destaques "Mais Pedidos" */}
      {featuredProducts.length > 0 && !searchQuery && (
        <section className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
          <div className="mb-3.5 flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-extrabold tracking-tight text-zinc-900">
              Os Mais Pedidos da Brasa
            </h2>
          </div>

          <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
            {featuredProducts.map((product) => (
              <motion.button
                key={`feat-${product.id}`}
                whileHover={{ y: -3 }}
                type="button"
                onClick={() => setSelectedProduct(product)}
                className="group flex w-60 shrink-0 flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white text-left shadow-xs transition hover:border-orange-300 hover:shadow-md cursor-pointer"
              >
                <div className="relative h-32 w-full overflow-hidden bg-zinc-100">
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-zinc-950/80 px-2.5 py-1 text-[10px] font-bold text-amber-300 backdrop-blur-xs">
                    <Award className="h-3 w-3" />
                    Mais pedido
                  </span>
                </div>
                <div className="flex flex-1 flex-col justify-between p-3.5">
                  <div>
                    <h3 className="line-clamp-1 text-sm font-bold text-zinc-900 group-hover:text-orange-600">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                        {product.description}
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-extrabold text-zinc-900">
                      {formatCurrency(product.priceCents)}
                    </span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-50 text-orange-600 transition group-hover:bg-orange-600 group-hover:text-white">
                      <Plus className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {/* Barra Fixa de Busca + Categorias */}
      <div className="sticky top-16 z-30 mt-6 border-y border-zinc-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <nav
            aria-label="Categorias do cardápio"
            className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5"
          >
            {categories.map((cat) => {
              const active = activeCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => scrollToCategory(cat.id)}
                  className={cn(
                    "relative shrink-0 rounded-full px-4 py-2 text-xs font-bold transition cursor-pointer",
                    active
                      ? "text-white"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200/80"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="active-cat-pill"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      className="absolute inset-0 rounded-full bg-orange-600 shadow-sm shadow-orange-600/25"
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {cat.name}
                    <span
                      className={cn(
                        "text-[10px]",
                        active ? "text-orange-100" : "text-zinc-400"
                      )}
                    >
                      {cat.products.length}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="relative w-full lg:w-72 shrink-0">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              aria-label="Buscar no cardápio"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar burger, porção, bebida..."
              className="h-9 w-full rounded-full border border-zinc-200 bg-zinc-50 pr-9 pl-10 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => setSearchQuery("")}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lista de Produtos por Categoria */}
      <main className="mx-auto max-w-6xl space-y-10 px-4 pt-8 sm:px-6">
        {filteredCategories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-12 text-center">
            <p className="text-base font-bold text-zinc-800">
              Nenhum item encontrado para &ldquo;{searchQuery}&rdquo;
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Tente buscar por outro termo ou limpe o filtro.
            </p>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <section
              key={category.id}
              id={`cat-${category.id}`}
              aria-labelledby={`heading-${category.id}`}
              className="space-y-4"
            >
              <div className="flex items-baseline justify-between border-b border-zinc-200/80 pb-2.5">
                <div>
                  <h2
                    id={`heading-${category.id}`}
                    className="text-xl font-extrabold tracking-tight text-zinc-900"
                  >
                    {category.name}
                  </h2>
                  {category.description && (
                    <p className="mt-0.5 text-xs text-zinc-500 sm:text-sm">
                      {category.description}
                    </p>
                  )}
                </div>
                <span className="text-xs font-semibold text-zinc-400">
                  {category.products.length}{" "}
                  {category.products.length === 1 ? "item" : "itens"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {category.products.map((product) => (
                  <motion.article
                    key={product.id}
                    whileHover={{ y: -2 }}
                    onClick={() => product.isAvailable && setSelectedProduct(product)}
                    className={cn(
                      "group relative flex gap-4 rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-xs transition hover:border-orange-300 hover:shadow-lg hover:shadow-orange-950/5",
                      product.isAvailable
                        ? "cursor-pointer"
                        : "opacity-60 cursor-not-allowed"
                    )}
                  >
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        {product.badges.length > 0 && (
                          <div className="mb-2 flex flex-wrap gap-1.5">
                            {product.badges.map((b) => {
                              const cfg = BADGE_CONFIG[b];
                              if (!cfg) return null;
                              const Icon = cfg.icon;
                              return (
                                <Badge key={b} variant={cfg.variant}>
                                  <Icon className="h-3 w-3" />
                                  {cfg.label}
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                        <h3 className="text-base font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">
                          {product.name}
                        </h3>
                        {product.description && (
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500 sm:text-[13px]">
                            {product.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          {product.variants.length > 0 && (
                            <span className="block text-[10px] font-medium text-zinc-400">
                              A partir de
                            </span>
                          )}
                          <span className="text-base font-extrabold text-zinc-900">
                            {formatCurrency(product.priceCents)}
                          </span>
                        </div>

                        {!product.isAvailable ? (
                          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                            Esgotado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700 transition group-hover:bg-orange-600 group-hover:text-white">
                            <Plus className="h-3.5 w-3.5" />
                            Adicionar
                          </span>
                        )}
                      </div>
                    </div>

                    {product.imageUrl && (
                      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-zinc-100 sm:h-32 sm:w-32">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}
                  </motion.article>
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {/* Rodapé discreto com acesso ao painel */}
      <footer className="mx-auto mt-16 max-w-6xl border-t border-zinc-200 px-4 py-8 text-center text-xs text-zinc-500 sm:px-6">
        <p className="font-semibold text-zinc-700">
          {restaurant.name} • {restaurant.address}
        </p>
        <p className="mt-1">
          Pedidos online com pagamento Pix instantâneo ou na entrega.
        </p>
        <Link
          href="/admin"
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-[11px] font-semibold text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
        >
          <Lock className="h-3 w-3" />
          Painel Administrativo (Demo)
        </Link>
      </footer>

      {/* Barra Flutuante da Sacola */}
      {totalItems > 0 && (
        <div className="fixed right-4 bottom-4 left-4 z-40 mx-auto max-w-lg">
          <motion.button
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            type="button"
            onClick={openCart}
            className="flex w-full items-center justify-between rounded-2xl bg-zinc-950 px-5 py-3.5 text-white shadow-2xl shadow-zinc-950/30 ring-1 ring-white/10 transition hover:bg-orange-600 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-600 text-xs font-extrabold text-white">
                {totalItems}
              </span>
              <span className="text-sm font-bold">Ver minha sacola</span>
            </div>
            <span className="text-base font-extrabold">
              {formatCurrency(subtotalCents)}
            </span>
          </motion.button>
        </div>
      )}

      {/* Modais */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      <CartDrawer onCheckout={() => setCheckoutOpen(true)} />

      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        restaurant={restaurant}
        deliveryZones={deliveryZones}
        initialTableNumber={tableNumber}
      />
    </div>
  );
}
