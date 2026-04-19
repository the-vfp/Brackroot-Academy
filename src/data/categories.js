export const DEFAULT_CATEGORIES = [
  { id: 'groceries',     name: 'Groceries',        icon: '\u{1F96C}' },
  { id: 'food_delivery', name: 'Food Delivery',    icon: '\u{1F989}' },
  { id: 'dining',        name: 'Dining Out',       icon: '\u{1F377}' },
  { id: 'coffee',        name: 'Coffee & Tea',     icon: '\u2615' },
  { id: 'stationery',    name: 'Stationery',       icon: '\u{1F58B}\uFE0F' },
  { id: 'shopping',      name: 'Shopping',         icon: '\u{1F6CD}\uFE0F' },
  { id: 'gaming',        name: 'Gaming',           icon: '\u{1F3B2}' },
  { id: 'subscriptions', name: 'Subscriptions',    icon: '\u{1F4EE}' },
  { id: 'transport',     name: 'Transport',        icon: '\u{1F6E4}\uFE0F' },
  { id: 'theatre',       name: 'Theatre & Ent.',   icon: '\u{1F3AD}' },
  { id: 'health',        name: 'Health',           icon: '\u{1F33F}' },
  { id: 'bills',         name: 'Bills & Utilities', icon: '\u{1F3DB}\uFE0F' },
];

export function getCategoryById(id) {
  return DEFAULT_CATEGORIES.find(c => c.id === id);
}

export function getCategoryName(id) {
  return getCategoryById(id)?.name ?? id;
}

export function getCategoryIcon(id) {
  return getCategoryById(id)?.icon ?? '\u{1F4E6}';
}
