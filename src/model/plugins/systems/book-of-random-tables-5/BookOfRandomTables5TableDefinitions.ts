export const BOOK_OF_RANDOM_TABLES_5_SOURCE_ID = "book-of-random-tables-5";
export const BOOK_OF_RANDOM_TABLES_5_SOURCE_TITLE = "The Book of Random Tables 5";
export const BOOK_OF_RANDOM_TABLES_5_AUTHOR = "Matt Davids";

export interface BookOfRandomTables5TableDefinition {
  id: string;
  title: string;
  category: string[];
  printedStartPage: number;
  printedEndPage: number;
  tags: string[];
}

export const bookOfRandomTables5TableDefinitions: BookOfRandomTables5TableDefinition[] = [
  table("dragon-names", "Dragon Names", "Names", 7, 7, ["names", "dragon", "dragons"]),
  table("fantasy-country-names-1", "Fantasy Country Names #1", "Names", 8, 8, ["names", "country", "countries", "fantasy"]),
  table("fantasy-country-names-2", "Fantasy Country Names #2", "Names", 9, 9, ["names", "country", "countries", "fantasy"]),
  table("fantasy-country-names-3", "Fantasy Country Names #3", "Names", 10, 10, ["names", "country", "countries", "fantasy"]),
  table("gang-names", "Gang Names", "Names", 11, 11, ["names", "gang", "gangs"]),
  table("pirate-ship-names", "Pirate Ship Names", "Names", 12, 12, ["names", "pirate", "ship", "ships"]),
  table("ship-names", "Ship Names", "Names", 13, 13, ["names", "ship", "ships"]),
  table("troll-names", "Troll Names", "Names", 14, 14, ["names", "troll", "trolls"]),
  table("carousing", "Carousing", "Carousing & Encounters", 16, 18, ["carousing", "downtime", "encounters"]),
  table("night-encounters", "Night Encounters", "Carousing & Encounters", 20, 22, ["encounters", "night", "travel"]),
  table("fey-touched-carnival-prizes", "Fey-Touched Carnival Prizes", "Items & Things", 24, 25, [
    "fey",
    "carnival",
    "prizes",
    "items"
  ]),
  table("items-in-a-fishing-boat", "Items in a Fishing Boat", "Items & Things", 26, 26, [
    "items",
    "fishing",
    "boat"
  ]),
  table("items-in-a-goblin-den", "Items in a Goblin Den", "Items & Things", 27, 27, [
    "items",
    "goblin",
    "den"
  ]),
  table("items-in-a-hermits-cave", "Items in a Hermit's Cave", "Items & Things", 28, 28, [
    "items",
    "hermit",
    "cave"
  ]),
  table("items-in-an-inn-room", "Items in an Inn Room", "Items & Things", 29, 29, ["items", "inn", "room"]),
  table("items-on-a-battlefield", "Items on a Battlefield", "Items & Things", 30, 30, [
    "items",
    "battlefield"
  ]),
  table("profit-loss-5-250gp", "Profit/Loss 5-250gp", "Business Profit & Loss", 32, 32, [
    "business",
    "profit",
    "loss",
    "gold"
  ]),
  table("profit-loss-255-500gp", "Profit/Loss 255-500gp", "Business Profit & Loss", 33, 33, [
    "business",
    "profit",
    "loss",
    "gold"
  ]),
  table("profit-loss-505-750gp", "Profit/Loss 505-750gp", "Business Profit & Loss", 34, 34, [
    "business",
    "profit",
    "loss",
    "gold"
  ]),
  table("key-backstory-moments", "Key Backstory Moments", "People & Characters", 36, 37, [
    "backstory",
    "characters",
    "history"
  ]),
  table("npc-developments", "NPC Developments", "People & Characters", 38, 39, ["npc", "development", "characters"]),
  table("npc-quirks", "NPC Quirks", "People & Characters", 40, 41, ["npc", "quirks", "characters"]),
  table("phobias", "Phobias", "People & Characters", 42, 43, ["phobias", "fear", "characters"]),
  table("resurrection-side-effects", "Resurrection Side Effects", "People & Characters", 44, 45, [
    "resurrection",
    "side effects",
    "magic"
  ]),
  table("town-happenings", "Town Happenings", "People & Characters", 46, 48, [
    "town",
    "events",
    "happenings",
    "settlement"
  ])
];

function table(
  slug: string,
  title: string,
  category: string,
  printedStartPage: number,
  printedEndPage: number,
  tags: string[]
): BookOfRandomTables5TableDefinition {
  return {
    id: `${BOOK_OF_RANDOM_TABLES_5_SOURCE_ID}-${slug}`,
    title,
    category: [category],
    printedStartPage,
    printedEndPage,
    tags: uniqueTags([...titleTags(title), ...categoryTags(category), ...tags])
  };
}

function titleTags(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/#\d+/g, "")
    .replace(/[^a-z0-9/ -]/g, " ")
    .split(/[\s/-]+/)
    .filter((word) => word.length > 1 && word !== "in" && word !== "a" && word !== "an" && word !== "on");
}

function categoryTags(category: string): string[] {
  return category.toLowerCase().split(/\s*&\s*|\s+/).filter((word) => word.length > 1);
}

function uniqueTags(tags: string[]): string[] {
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter((tag) => tag !== ""))];
}
