import {
  menuItems as menuItemsBb,
  categories as categoriesBb,
  BURGER_ADD_OPTIONS,
  BURGER_REMOVE_OPTIONS,
  CUSTOMIZABLE_CATEGORIES,
  type MenuItem,
} from "@/data/menuData";
import {
  menuItemsFs,
  categoriesFs,
  SUSHI_ADD_OPTIONS,
  SUSHI_REMOVE_OPTIONS,
} from "@/data/menuDataFs";
import bbLogo from "@/assets/butcher-burgers-logo.png";
import fsLogo from "@/assets/fishy-sushi-logo.png";
import type { Concept } from "@/store/orderStore";

export interface ConceptConfig {
  id: Concept;
  name: string;
  logo: string;
  menuItems: MenuItem[];
  categories: ReadonlyArray<{ id: string; label: string; emoji: string }>;
  addOptions: string[];
  removeOptions: string[];
  customizableCategories: MenuItem["category"][];
}

export const CONCEPTS: Record<Concept, ConceptConfig> = {
  bb: {
    id: "bb",
    name: "Butchers Burgers",
    logo: bbLogo,
    menuItems: menuItemsBb,
    categories: categoriesBb,
    addOptions: BURGER_ADD_OPTIONS,
    removeOptions: BURGER_REMOVE_OPTIONS,
    customizableCategories: CUSTOMIZABLE_CATEGORIES,
  },
  fs: {
    id: "fs",
    name: "Fishy Sushi",
    logo: fsLogo,
    menuItems: menuItemsFs,
    categories: categoriesFs,
    addOptions: SUSHI_ADD_OPTIONS,
    removeOptions: SUSHI_REMOVE_OPTIONS,
    // Sushi-huvudrätter ligger i "hamburgare"-kategorin för layout-återanvändning
    customizableCategories: ["hamburgare"],
  },
};

export const getConceptConfig = (concept: Concept | null): ConceptConfig =>
  CONCEPTS[concept ?? "bb"];
