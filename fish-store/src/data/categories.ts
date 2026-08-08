import type { Category } from "../types";

export const categories: Category[] = [
  {
    id: "sea",
    name: "דגי ים טריים",
    description: "התפוסה הטרייה של היום, ישר מהסירה",
    icon: "fish",
  },
  {
    id: "freshwater",
    name: "דגי בריכה",
    description: "אמנון, קרפיון ופורל במשקל",
    icon: "wave",
  },
  {
    id: "fillets",
    name: "פילטים נקיים",
    description: "מנוקה, מפולט ומוכן לבישול",
    icon: "fillet",
  },
  {
    id: "seafood",
    name: "פירות ים",
    description: "קלמארי, שרימפס ותמנון",
    icon: "shrimp",
  },
  {
    id: "smoked",
    name: "דגים מעושנים",
    description: "עישון עדין בשיטה ביתית",
    icon: "smoke",
  },
  {
    id: "bundles",
    name: "מארזים ומבצעים",
    description: "מארזים משתלמים למשפחה ולאירוח",
    icon: "gift",
  },
];
