import hero01 from "../../../assets/grammar/headers/grammar-hero-01-stone_bridge_mountains.png";
import hero02 from "../../../assets/grammar/headers/grammar-hero-02-alpine_village_bridge.png";
import hero03 from "../../../assets/grammar/headers/grammar-hero-03-meadow_path_mountains.png";
import hero04 from "../../../assets/grammar/headers/grammar-hero-04-bridge_ruins_lake.png";
import hero05 from "../../../assets/grammar/headers/grammar-hero-05-viaduct_wildflowers.png";
import hero06 from "../../../assets/grammar/headers/grammar-hero-06-cliffside_castle_lake.png";
import hero07 from "../../../assets/grammar/headers/grammar-hero-07-forest_stream_bridge.png";
import hero08 from "../../../assets/grammar/headers/grammar-hero-08-hilltop_chapel_valley.png";
import hero09 from "../../../assets/grammar/headers/grammar-hero-09-alpine_lake_pier.png";
import hero10 from "../../../assets/grammar/headers/grammar-hero-10-valley_bridge_town.png";

const GRAMMAR_HERO_ARTWORK = Object.freeze([
  hero01,
  hero02,
  hero03,
  hero04,
  hero05,
  hero06,
  hero07,
  hero08,
  hero09,
  hero10
]);

const PINNED_ARTWORK: Readonly<Record<string, number>> = Object.freeze({
  "present-perfect": 7
});

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function getGrammarLessonArtwork(lessonId: string): string {
  const pinned = PINNED_ARTWORK[lessonId];
  const index = pinned ?? stableHash(lessonId) % GRAMMAR_HERO_ARTWORK.length;
  return GRAMMAR_HERO_ARTWORK[index] ?? GRAMMAR_HERO_ARTWORK[0];
}

export const GRAMMAR_HERO_ARTWORK_COUNT = GRAMMAR_HERO_ARTWORK.length;
