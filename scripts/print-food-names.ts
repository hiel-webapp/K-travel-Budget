import { ALL_FOOD_ITEMS } from "../src/features/budget/catalog/food-catalog";

console.log("=== 현재 음식 명칭 목록 (120개) ===");
ALL_FOOD_ITEMS.forEach((f, idx) => {
  console.log(`${idx + 1}. [${f.id}] ${f.nameKo} || ${f.nameEn}`);
});
