import contextBridge from "../../assets/practice/practice-context-bridge.png";
import memoryGrove from "../../assets/practice/practice-memory-grove.png";
import mistakeMine from "../../assets/practice/practice-mistake-mine.png";
import northernTrail from "../../assets/practice/practice-northern-trail.png";
import phraseFalls from "../../assets/practice/practice-phrase-falls.png";
import recallSummit from "../../assets/practice/practice-recall-summit.png";
import wordForge from "../../assets/practice/practice-word-forge.png";

/**
 * Canonical Practice artwork map.
 *
 * Keeping asset imports in one place prevents individual screens from inventing
 * filenames or reaching into the assets directory directly. Stage 2+ screens should
 * consume this object so replacing/compressing an artwork later is a one-line change.
 */
export const PRACTICE_ARTWORK = Object.freeze({
  northernTrail,
  memoryGrove,
  wordForge,
  contextBridge,
  phraseFalls,
  mistakeMine,
  recallSummit
});
