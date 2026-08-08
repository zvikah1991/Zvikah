import { FishIcon, FilletIcon, GiftIcon, ShrimpIcon, SmokeIcon, WaveIcon } from "./Icons";
import type { CategoryId } from "../../types";

const gradients: Record<CategoryId, string> = {
  sea: "linear-gradient(145deg, #0b3d5c, #14638c)",
  freshwater: "linear-gradient(145deg, #0e7c86, #1aa3ad)",
  fillets: "linear-gradient(145deg, #0b5c63, #148f8f)",
  seafood: "linear-gradient(145deg, #1a4a6b, #2c7396)",
  smoked: "linear-gradient(145deg, #6b4423, #a9702f)",
  bundles: "linear-gradient(145deg, #b8842a, #d9a441)",
};

const categoryIdIcons: Record<CategoryId, typeof FishIcon> = {
  sea: FishIcon,
  freshwater: WaveIcon,
  fillets: FilletIcon,
  seafood: ShrimpIcon,
  smoked: SmokeIcon,
  bundles: GiftIcon,
};

export function ProductImage({ categoryId, className }: { categoryId: CategoryId; className?: string }) {
  const Icon = categoryIdIcons[categoryId];
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className ?? ""}`}
      style={{ background: gradients[categoryId] }}
    >
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, white 0, transparent 45%), radial-gradient(circle at 80% 75%, white 0, transparent 40%)",
        }}
      />
      <Icon className="relative h-12 w-12 text-white/90 drop-shadow-sm" strokeWidth={1.3} />
      <span className="absolute bottom-2 left-2 rounded-full bg-black/25 px-2 py-0.5 text-[9px] font-medium text-white/80 backdrop-blur-sm">
        תמונה להמחשה
      </span>
    </div>
  );
}
