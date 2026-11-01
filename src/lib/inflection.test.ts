import assert from "node:assert/strict";
import { test } from "node:test";
import { splitHighlight } from "./text";

// Each case is a real example sentence from data/word-atlas.json whose headword
// appears only in an inflected form the IRREGULAR list was missing, so the cloze /
// highlight could not find it (gap() returned null, no blank was shown).
test("highlights irregular forms used in the dataset's own examples", () => {
  assert.equal(splitHighlight("Placing healthy snacks on shelves at eye level helps.", "shelf")?.[1], "shelves");
  assert.equal(splitHighlight("Wetlands provide feeding grounds for wild geese.", "goose")?.[1], "geese");
  assert.equal(splitHighlight("Supporting local craftsmen preserves traditional skills.", "craftsman")?.[1], "craftsmen");
  assert.equal(splitHighlight("Campaigns discourage people from spitting in shared spaces.", "spit")?.[1], "spitting");
});

test("still ignores unrelated look-alike words", () => {
  assert.equal(splitHighlight("The goose down was warm.", "good"), null);
  assert.equal(splitHighlight("He took the lift.", "shelf"), null);
});
