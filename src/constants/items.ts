export interface DefaultItem {
  slug: string;
  displayName: string;
  emoji: string;
  unit: string;
  maxQuantity: number;
}

export const DEFAULT_ITEMS: DefaultItem[] = [
  { slug: "piwo", displayName: "Piwo", emoji: "\u{1F37A}", unit: "puszka/butelka 0.5l", maxQuantity: 80 },
  { slug: "wodka", displayName: "Wodka", emoji: "\u{1F378}", unit: "butelka", maxQuantity: 15 },
  { slug: "special-alkohol", displayName: "Whiskey/Rum/Wino/Domowe", emoji: "\u{1F943}", unit: "butelka", maxQuantity: 0 },
  { slug: "kielbasa", displayName: "Kielbasa na ognisko", emoji: "\u{1F32D}", unit: "paczka (6 szt)", maxQuantity: 10 },
  { slug: "chleb", displayName: "Chleb", emoji: "\u{1F35E}", unit: "bochenek", maxQuantity: 5 },
  { slug: "halloumi", displayName: "Halloumi", emoji: "\u{1F9C0}", unit: "opakowanie", maxQuantity: 10 },
  { slug: "keczup", displayName: "Keczup", emoji: "\u{1F345}", unit: "sztuka", maxQuantity: 3 },
  { slug: "musztarda", displayName: "Musztarda", emoji: "\u{1F7E1}", unit: "sztuka", maxQuantity: 3 },
  { slug: "zupki-chinskie", displayName: "Zupki chinskie", emoji: "\u{1F35C}", unit: "sztuka", maxQuantity: 50 },
  { slug: "chipsy", displayName: "Chipsy/Chrupki", emoji: "\u{1F35F}", unit: "paczka", maxQuantity: 30 },
  { slug: "chleb-tostowy", displayName: "Chleb tostowy", emoji: "\u{1F35E}", unit: "bochenek", maxQuantity: 10 },
  { slug: "ser", displayName: "Ser", emoji: "\u{1F9C0}", unit: "opakowanie", maxQuantity: 10 },
  { slug: "szynka", displayName: "Szynka", emoji: "\u{1F969}", unit: "opakowanie", maxQuantity: 10 },
  { slug: "tostery", displayName: "Tostery", emoji: "\u{1F525}", unit: "sztuka", maxQuantity: 3 },
  { slug: "talerzyki", displayName: "Talerzyki papierowe", emoji: "\u{1F37D}\uFE0F", unit: "opakowanie (ok. 10 szt)", maxQuantity: 8 },
  { slug: "kubeczki", displayName: "Kubeczki", emoji: "\u{1F964}", unit: "opakowanie (ok. 10 szt)", maxQuantity: 8 },
  { slug: "sztucce", displayName: "Sztucce jednorazowe", emoji: "\u{1F944}", unit: "opakowanie (ok. 10 szt)", maxQuantity: 8 },
  { slug: "woda", displayName: "Woda", emoji: "\u{1F4A7}", unit: "litr", maxQuantity: 20 },
  { slug: "popita", displayName: "Popita", emoji: "\u{1F9C3}", unit: "litr", maxQuantity: 40 },
  { slug: "przekaski-slone", displayName: "Przekaski slone", emoji: "\u{1F95C}", unit: "paczka", maxQuantity: 40 },
  { slug: "przekaski-slodkie", displayName: "Przekaski slodkie", emoji: "\u{1F36C}", unit: "paczka", maxQuantity: 40 },
  { slug: "karty-gry", displayName: "Karty/Gry", emoji: "\u{1F0CF}", unit: "sztuka", maxQuantity: 5 },
  { slug: "opaski-swiecace", displayName: "Opaski swiecace", emoji: "\u2728", unit: "paczka", maxQuantity: 4 },
];
