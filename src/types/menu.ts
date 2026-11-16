export interface MenuAddonOption {
  id: string;
  name: string;
  priceCents: number;
  isAvailable: boolean;
}

export interface MenuAddonGroup {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  isRequired: boolean;
  options: MenuAddonOption[];
}

export interface MenuProductVariant {
  id: string;
  name: string;
  priceCents: number;
  isDefault: boolean;
}

export interface MenuProduct {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  badges: string[];
  isAvailable: boolean;
  categoryId: string;
  variants: MenuProductVariant[];
  addonGroups: MenuAddonGroup[];
}

export interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  products: MenuProduct[];
}

export interface MenuDeliveryZone {
  id: string;
  neighborhood: string;
  feeCents: number;
  estimatedMinutes: number;
}

export interface MenuRestaurant {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string;
  address: string;
  city: string;
  state: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  isOpen: boolean;
  openingInfo: string | null;
}
