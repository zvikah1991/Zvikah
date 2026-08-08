export type CategoryId = "sea" | "freshwater" | "fillets" | "seafood" | "smoked" | "bundles";

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
  icon: "fish" | "wave" | "fillet" | "shrimp" | "smoke" | "gift";
}

export type Unit = "kg" | "unit" | "tray";

export interface Product {
  id: string;
  categoryId: CategoryId;
  name: string;
  description: string;
  unit: Unit;
  price: number;
  originalPrice?: number;
  tags?: Array<"new" | "popular" | "sale" | "premium">;
  minWeightKg?: number;
}

export interface CartLine {
  productId: string;
  quantity: number;
}

export interface CustomerDetails {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes?: string;
  fulfillment: "delivery" | "pickup";
}
