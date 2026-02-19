const adjectives = [
  "Happy", "Brave", "Clever", "Gentle", "Swift", "Calm", "Bold", "Bright",
  "Cozy", "Daring", "Eager", "Fancy", "Giddy", "Jolly", "Kind", "Lively",
  "Merry", "Noble", "Perky", "Quick", "Rosy", "Snappy", "Sunny", "Witty",
  "Zesty", "Plucky", "Chirpy", "Fuzzy", "Peppy", "Spry",
];

const animals = [
  "Koala", "Quokka", "Wombat", "Platypus", "Kookaburra", "Echidna",
  "Cockatoo", "Wallaby", "Possum", "Bilby", "Numbat", "Bandicoot",
  "Lorikeet", "Galah", "Penguin", "Otter", "Panda", "Dolphin",
  "Hedgehog", "Owl", "Fox", "Rabbit", "Seal", "Puffin",
  "Toucan", "Sloth", "Capybara", "Axolotl", "Flamingo", "Chameleon",
];

/**
 * Generate a deterministic friendly name from a string (e.g. cookieId).
 * Same input always produces the same name.
 */
export function generateAnimalName(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  // Make positive
  hash = Math.abs(hash);
  const adj = adjectives[hash % adjectives.length];
  const animal = animals[Math.floor(hash / adjectives.length) % animals.length];
  return `${adj} ${animal}`;
}
