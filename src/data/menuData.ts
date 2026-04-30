import classicBurger from "@/assets/menu/classic-burger.jpg";
import baconBurger from "@/assets/menu/bacon-burger.jpg";
import doubleBurger from "@/assets/menu/double-burger.jpg";
import chickenBurger from "@/assets/menu/chicken-burger.jpg";
import fishBurger from "@/assets/menu/fish-burger.jpg";
import veggieBurger from "@/assets/menu/veggie-burger.jpg";
import fries from "@/assets/menu/fries.jpg";
import onionRings from "@/assets/menu/onion-rings.jpg";
import cola from "@/assets/menu/cola.jpg";
import juice from "@/assets/menu/juice.jpg";
import milkshake from "@/assets/menu/milkshake.jpg";

export type Allergen = "Gluten" | "Laktos" | "Vegetariskt";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: "hamburgare" | "kyckling-fisk" | "vego" | "dryck-tillbehor";
  allergens: Allergen[];
  isPrep?: boolean;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  customizations?: { added: string[]; removed: string[] };
}

// Tillval (MFFO-187): samma lista för alla burgare i nuläget.
// Pris-logik avvaktas — alla tillval ingår i basen.
export const BURGER_ADD_OPTIONS: string[] = [
  "Extra ost",
  "Extra bacon",
  "Extra köttpuck",
  "Stekt lök",
  "Jalapeños",
  "Glutenfritt bröd",
];

export const BURGER_REMOVE_OPTIONS: string[] = [
  "Sallad",
  "Tomat",
  "Lök",
  "Pickles",
  "Sås",
];

// Kategorier som stödjer tillval i kiosken
export const CUSTOMIZABLE_CATEGORIES: MenuItem["category"][] = [
  "hamburgare",
  "kyckling-fisk",
  "vego",
];

export const categories = [
  { id: "hamburgare", label: "Hamburgare", emoji: "🍔" },
  { id: "kyckling-fisk", label: "Kyckling/Fisk", emoji: "🍗" },
  { id: "vego", label: "Vego", emoji: "🥬" },
  { id: "dryck-tillbehor", label: "Dryck & Tillbehör", emoji: "🥤" },
] as const;

export const menuItems: MenuItem[] = [
  {
    id: "1",
    name: "Klassisk Cheese",
    description: "Dubbel köttpuck, cheddar, sallad, tomat, lök",
    price: 109,
    image: classicBurger,
    category: "hamburgare",
    allergens: ["Gluten", "Laktos"],
  },
  {
    id: "2",
    name: "Bacon Smash",
    description: "Smashad köttpuck, crispy bacon, cheddar, BBQ-sås",
    price: 129,
    image: baconBurger,
    category: "hamburgare",
    allergens: ["Gluten", "Laktos"],
  },
  {
    id: "3",
    name: "Double Trouble",
    description: "Två köttpuckar, dubbel ost, pickles, senap",
    price: 149,
    image: doubleBurger,
    category: "hamburgare",
    allergens: ["Gluten", "Laktos"],
  },
  {
    id: "4",
    name: "Crispy Chicken",
    description: "Panerad kycklingfilé, sallad, sriracha-mayo",
    price: 119,
    image: chickenBurger,
    category: "kyckling-fisk",
    allergens: ["Gluten"],
  },
  {
    id: "5",
    name: "Fish & Crisp",
    description: "Panerad fiskfilé, remoulad, isbergssallad",
    price: 119,
    image: fishBurger,
    category: "kyckling-fisk",
    allergens: ["Gluten", "Laktos"],
  },
  {
    id: "6",
    name: "Green Garden",
    description: "Växtbaserad patty, avokado, tomat, rödlök",
    price: 109,
    image: veggieBurger,
    category: "vego",
    allergens: ["Gluten", "Vegetariskt"],
  },
  {
    id: "7",
    name: "Pommes Frites",
    description: "Krispiga pommes med havssalt",
    price: 39,
    image: fries,
    category: "dryck-tillbehor",
    allergens: [],
    isPrep: true,
  },
  {
    id: "8",
    name: "Lökringar",
    description: "Panerade lökringar med dippsås",
    price: 45,
    image: onionRings,
    category: "dryck-tillbehor",
    allergens: ["Gluten"],
    isPrep: true,
  },
  {
    id: "9",
    name: "Cola",
    description: "Iskall läsk 0.5L",
    price: 29,
    image: cola,
    category: "dryck-tillbehor",
    allergens: [],
  },
  {
    id: "10",
    name: "Apelsinjuice",
    description: "Färskpressad juice 0.4L",
    price: 35,
    image: juice,
    category: "dryck-tillbehor",
    allergens: [],
  },
  {
    id: "11",
    name: "Milkshake",
    description: "Krämig vaniljshake med grädde",
    price: 49,
    image: milkshake,
    category: "dryck-tillbehor",
    allergens: ["Laktos"],
  },
];

export const addOnItems = menuItems.filter(
  (item) => item.category === "dryck-tillbehor"
);

export const mainItems = menuItems.filter(
  (item) => item.category !== "dryck-tillbehor"
);

// Helper: a menu item is a "prep" item (cooked in kitchen) if explicitly flagged
// or if it's not in the drinks/sides category. Drinks (cola, juice, milkshake) are NOT prep.
const NON_PREP_IDS = new Set(["9", "10", "11"]);
export const isPrepItem = (item: { id: string; isPrep?: boolean; category?: string }) => {
  if (item.isPrep === true) return true;
  if (NON_PREP_IDS.has(item.id)) return false;
  return item.category !== "dryck-tillbehor";
};
