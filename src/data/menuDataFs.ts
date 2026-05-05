import sushiSmall from "@/assets/menu/sushi-small.jpg";
import sushiMedium from "@/assets/menu/sushi-medium.jpg";
import sushiLarge from "@/assets/menu/sushi-large.jpg";
import edamame from "@/assets/menu/edamame.jpg";
import misoSoup from "@/assets/menu/miso-soup.jpg";
import ramune from "@/assets/menu/ramune.jpg";
import greenTea from "@/assets/menu/green-tea.jpg";
import type { MenuItem } from "@/data/menuData";

// MFFO-216: FS-meny (3 sushi + 2 sides + 2 drinks)
export const menuItemsFs: MenuItem[] = [
  {
    id: "fs-1",
    name: "Sushi Liten",
    description: "6 bitar – lax, avokado, gurka",
    price: 99,
    image: sushiSmall,
    category: "hamburgare", // återanvänder "main"-kategori för layout
    allergens: ["Gluten"],
  },
  {
    id: "fs-2",
    name: "Sushi Mellan",
    description: "10 bitar – mix av nigiri och maki",
    price: 149,
    image: sushiMedium,
    category: "hamburgare",
    allergens: ["Gluten"],
  },
  {
    id: "fs-3",
    name: "Sushi Stor",
    description: "16 bitar – stor mix-platta",
    price: 199,
    image: sushiLarge,
    category: "hamburgare",
    allergens: ["Gluten"],
  },
  {
    id: "fs-4",
    name: "Edamame",
    description: "Ångade sojabönor med havssalt",
    price: 45,
    image: edamame,
    category: "dryck-tillbehor",
    allergens: [],
    isPrep: true,
  },
  {
    id: "fs-5",
    name: "Misosoppa",
    description: "Klassisk miso med tofu och tång",
    price: 49,
    image: misoSoup,
    category: "dryck-tillbehor",
    allergens: [],
    isPrep: true,
  },
  {
    id: "fs-6",
    name: "Ramune",
    description: "Japansk läsk 0.3L",
    price: 35,
    image: ramune,
    category: "dryck-tillbehor",
    allergens: [],
  },
  {
    id: "fs-7",
    name: "Grönt te",
    description: "Varmt matchate",
    price: 29,
    image: greenTea,
    category: "dryck-tillbehor",
    allergens: [],
  },
];

// MFFO-217: Sushi-tillval
export const SUSHI_ADD_OPTIONS: string[] = [
  "Wasabi",
  "Rostad lök",
  "Ingefära",
];

export const SUSHI_REMOVE_OPTIONS: string[] = [
  "Wasabi",
  "Rostad lök",
  "Ingefära",
];

export const categoriesFs = [
  { id: "hamburgare", label: "Sushi", emoji: "🍣" },
  { id: "dryck-tillbehor", label: "Tillbehör & Dryck", emoji: "🍵" },
] as const;
