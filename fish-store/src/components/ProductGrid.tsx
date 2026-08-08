import { categories } from "../data/categories";
import { products } from "../data/products";
import { ProductCard } from "./ProductCard";
import { categoryIcons } from "./ui/Icons";

export function ProductGrid() {
  return (
    <div className="mx-auto max-w-6xl space-y-14 px-4 py-10 sm:px-6">
      {categories.map((category) => {
        const categoryProducts = products.filter((p) => p.categoryId === category.id);
        if (categoryProducts.length === 0) return null;
        const Icon = categoryIcons[category.icon];

        return (
          <section key={category.id} id={category.id} className="scroll-mt-32">
            <div className="mb-5 flex items-center gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-light))" }}
              >
                <Icon className="h-5.5 w-5.5" />
              </span>
              <div>
                <h2 className="font-display text-xl font-extrabold text-[var(--text-primary)] sm:text-2xl">
                  {category.name}
                </h2>
                <p className="text-sm text-[var(--text-muted)]">{category.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categoryProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
