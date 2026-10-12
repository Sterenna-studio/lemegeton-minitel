import { describe, expect, it } from "vitest";
import { LANGS, catalogOf, detectLang, t } from "../src/i18n";
import { docContent } from "../src/documentation/content";
import { catalog } from "../src/demo/catalog";
import { buildWorld, findStation } from "../src/world/rooms";

// Languages of the site (docs/TRADUCTION.md) : every catalog has the keys of
// the French one, with the same {placeholders} ; the documentation has the
// same sections in every language.

const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();

describe("catalogues de textes", () => {
  const fr = catalogOf("fr");
  for (const lang of LANGS.filter((code) => code !== "fr")) {
    it(`${lang} : les mêmes clés et les mêmes emplacements que le français`, () => {
      const other = catalogOf(lang);
      expect(Object.keys(other).sort()).toEqual(Object.keys(fr).sort());
      for (const [key, text] of Object.entries(fr)) expect(placeholders(other[key as keyof typeof other] ?? ""), key).toEqual(placeholders(text ?? ""));
    });
  }

  it("emplacements remplis, langue demandée", () => {
    expect(t("world.link.open", { year: "1982" }, "fr")).toBe("Ouvrir la porte 1982");
    expect(t("world.link.open", { year: "1982" }, "en")).toBe("Open the 1982 door");
  });
});

describe("choix de la langue", () => {
  it("?lang= d'abord, puis le choix enregistré, puis le navigateur", () => {
    expect(detectLang("?lang=en", "fr", ["fr-FR"])).toBe("en");
    expect(detectLang("", "en", ["fr-FR"])).toBe("en");
    expect(detectLang("", null, ["fr-FR", "en"])).toBe("fr");
    expect(detectLang("", null, ["de-DE", "en-GB"])).toBe("en");
    // A language the site does not have : English, the international one.
    expect(detectLang("", null, ["de-DE"])).toBe("en");
    expect(detectLang("?lang=xx", "zz", [])).toBe("fr");
  });
});

describe("documentation dans chaque langue", () => {
  const fr = docContent("fr");
  it("les mêmes rubriques, dans le même ordre", () => {
    for (const lang of LANGS) {
      const doc = docContent(lang);
      expect(doc.modelDocs.map((m) => m.id)).toEqual(fr.modelDocs.map((m) => m.id));
      expect(doc.modelDocs.map((m) => [m.facts.length, m.asset.length, m.intro.length, !!m.note])).toEqual(
        fr.modelDocs.map((m) => [m.facts.length, m.asset.length, m.intro.length, !!m.note]),
      );
      expect(doc.views.map((v) => v.id)).toEqual(fr.views.map((v) => v.id));
      expect(doc.worldDoc.rooms.map((r) => r.id)).toEqual(fr.worldDoc.rooms.map((r) => r.id));
      expect(doc.projectDocs.map((p) => p.url)).toEqual(fr.projectDocs.map((p) => p.url));
      expect(doc.related.map((p) => p.url)).toEqual(fr.related.map((p) => p.url));
    }
  });
});

describe("le monde dans une autre langue", () => {
  it("les mêmes postes, les libellés traduits", () => {
    const french = buildWorld(catalog);
    const english = buildWorld(catalog, {
      corridorEntry: "Corridor entrance",
      corridorEnd: "End of the corridor",
      door: (year) => `${year} door`,
      doorOf: (year, terminal) => `${year} door — ${terminal}`,
      closedDoor: (n) => `Closed door ${n}`,
      roomEntry: (terminal) => `Entrance — ${terminal}`,
      futurePlaque: "Coming soon",
    });
    expect(english.corridor.stations.map((s) => s.id)).toEqual(french.corridor.stations.map((s) => s.id));
    expect(findStation(english, "couloir:entree")?.label).toBe("Corridor entrance");
    expect(findStation(english, "couloir:porte-televiseur-1950")?.label).toBe("1950 door");
    expect(english.corridor.doors.at(-1)?.door.plaque).toBe("Coming soon");
  });
});
