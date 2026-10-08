import { describe, expect, it } from "vitest";
import { catalog, findEntry } from "../src/demo/catalog";
import { framings } from "../src/scene/framing";
import { findFurniture } from "../src/scene/furniture";
import { buildWorld } from "../src/world/rooms";
import { initialState } from "../src/world/navigation";
import { PORTRAIT_ASPECT, fittedFov, viewOf } from "../src/world/pose";
import { STAND_TOP, terminalLayout } from "../src/world/terminalView";
import { modeOf, switchedUrl } from "../src/siteMode";

// Lot E (rooms, portrait framing) and the two modes of the site.

const deg = (x: number) => (x * Math.PI) / 180;

describe("cadrage en portrait", () => {
  it("garde le champ en paysage, l'élargit en portrait sans dépasser 100°", () => {
    expect(fittedFov(60, 16 / 9)).toBe(60);
    expect(fittedFov(60, PORTRAIT_ASPECT)).toBe(60);
    const phone = fittedFov(60, 0.46);
    expect(phone).toBeGreaterThan(60);
    expect(phone).toBeLessThanOrEqual(100);
    // Under the cap, the horizontal field stays the one at PORTRAIT_ASPECT.
    const tablet = fittedFov(40, 0.8);
    expect(Math.tan(deg(tablet) / 2) * 0.8).toBeCloseTo(Math.tan(deg(20)) * PORTRAIT_ASPECT, 6);
    expect(fittedFov(40, 0.8, 0)).toBe(40);
  });

  it("les postes du couloir s'élargissent, le poste du terminal non (vue de la version simple)", () => {
    const world = buildWorld(catalog);
    expect(viewOf(world, initialState("couloir:entree")).fit).toBe(1);
    expect(viewOf(world, initialState("salle:minitel-1:entree")).fit).toBe(1);
    expect(viewOf(world, initialState("salle:minitel-1:terminal")).fit).toBe(0);
  });
});

describe("terminal dans sa salle", () => {
  const tv = findEntry("televiseur-1950");
  const minitel = findEntry("minitel-1");

  it("le téléviseur repose sur le meuble de la salle, le Minitel sur sa table", () => {
    const onStand = terminalLayout(tv);
    expect(onStand).toMatchObject({ lift: STAND_TOP, stand: true });
    const onTable = terminalLayout(minitel, findFurniture("table-basse"));
    expect(onTable).toMatchObject({ lift: findFurniture("table-basse").top, stand: false });
    expect(terminalLayout(minitel, findFurniture("sol"))).toMatchObject({ lift: 0, stand: false });
  });

  it("le poste du terminal reprend la vue par défaut, large ou étroite", () => {
    const wide = terminalLayout(minitel);
    const narrow = terminalLayout(minitel, undefined, true);
    const offset = (layout: typeof wide) => layout.view.position.map((v, i) => v - layout.target[i]);
    expect(offset(wide).map((v) => +v.toFixed(6))).toEqual(framings.desk.reset.wide);
    expect(offset(narrow).map((v) => +v.toFixed(6))).toEqual(framings.desk.reset.narrow);
  });
});

describe("modes du site", () => {
  it("la version simple par défaut, 3D+ avec ?mode=3d", () => {
    expect(modeOf("")).toBe("simple");
    expect(modeOf("?modele=minitel-1")).toBe("simple");
    expect(modeOf("?mode=3d&salle=minitel-1")).toBe("3d");
  });

  it("vers 3D+ : le couloir, sans les réglages de la version simple ; le mobilier suit", () => {
    const url = switchedUrl("https://sterenna.fr/minitel/?modele=minitel-1&ecran=yeux&table=table-basse", "3d");
    expect(url.search).toBe("?table=table-basse&mode=3d");
  });

  it("vers la version simple : le terminal de la salle où l'on était", () => {
    const url = switchedUrl("https://sterenna.fr/minitel/?mode=3d&salle=televiseur-1950&poste=terminal", "simple", "televiseur-1950");
    expect(url.search).toBe("?modele=televiseur-1950");
    expect(switchedUrl("https://sterenna.fr/minitel/?mode=3d&poste=fond", "simple").search).toBe("");
  });
});
