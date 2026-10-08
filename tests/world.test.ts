import { describe, expect, it } from "vitest";
import { catalog } from "../src/demo/catalog";
import { ERAS, allStations, buildWorld, chronological, findStation } from "../src/world/rooms";
import {
  MAX_TRAVEL,
  MIN_TRAVEL,
  areNeighbours,
  easeInOutCubic,
  linksFrom,
  targetOf,
  travelDuration,
  travelPath,
} from "../src/world/rails";
import { CLOCK_PEAK, SEQUENCE_DURATION, PASSAGE_DURATION, counterText, doorSequence } from "../src/world/sequence";
import { currentStation, initialState, navigate, type NavEvent, type NavState } from "../src/world/navigation";
import { CORRIDOR_ENTRY, paramsForStation, stationFromParams } from "../src/world/url";
import { FADE_DURATION } from "../src/world/rails";
import { viewOf, placeOf } from "../src/world/pose";
import { catmullRom } from "../src/world/curve";

const world = buildWorld(catalog);
const tv = "salle:televiseur-1950";

/** Runs events, then advances time until the camera stands at a station. */
function run(state: NavState, events: NavEvent[], options = {}) {
  let next = state;
  for (const event of events) next = navigate(world, next, event, options);
  for (let i = 0; i < 400 && next.mode !== "poste"; i++)
    next = navigate(world, next, { type: "AVANCER", dt: 1 / 60 }, options);
  return next;
}

describe("monde : salles et couloir dérivés du catalogue", () => {
  it("une salle et une porte par terminal, dans l'ordre chronologique", () => {
    for (const entry of catalog) expect(ERAS[entry.id], entry.id).toBeDefined();
    expect(world.rooms.map((room) => room.id)).toEqual(["televiseur-1950", "minitel-1", "terminatel-255"]);
    expect(world.corridor.doors.map((slot) => slot.door.year)).toEqual(["1950", "1982", "198?"]);
    expect(world.corridor.doors.map((slot) => slot.side)).toEqual(["gauche", "droite", "gauche"]);
  });

  it("« 198? » se range après 1982", () => {
    const ids = chronological([{ id: "terminatel-255", label: "T" }, { id: "minitel-1", label: "M" }]).map((e) => e.id);
    expect(ids).toEqual(["minitel-1", "terminatel-255"]);
  });

  it("postes uniques, couloir entrée → portes → fond", () => {
    const ids = allStations(world).map((station) => station.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(world.corridor.stations.map((s) => s.id)).toEqual([
      "couloir:entree",
      "couloir:porte-televiseur-1950",
      "couloir:porte-minitel-1",
      "couloir:porte-terminatel-255",
      "couloir:fond",
    ]);
    for (const slot of world.corridor.doors) expect(findStation(world, slot.approach)).toBeDefined();
    for (const room of world.rooms) expect(findStation(world, room.terminalStation)?.inspect).toBe(true);
  });
});

describe("rails", () => {
  it("liens de chaque poste", () => {
    expect(linksFrom(world, "couloir:entree")).toEqual([{ kind: "aller", to: "couloir:porte-televiseur-1950" }]);
    const atDoor = linksFrom(world, "couloir:porte-minitel-1");
    expect(atDoor.map((link) => link.kind)).toEqual(["porte", "aller", "aller"]);
    expect(targetOf(world, atDoor[0])).toBe("salle:minitel-1:entree");
    const inRoom = linksFrom(world, `${tv}:entree`);
    expect(inRoom.map((link) => link.kind)).toEqual(["aller", "sortie"]);
    expect(targetOf(world, inRoom[1])).toBe("couloir:porte-televiseur-1950");
    expect(linksFrom(world, `${tv}:terminal`)).toEqual([{ kind: "aller", to: `${tv}:entree` }]);
  });

  it("le graphe est symétrique pour les déplacements simples", () => {
    for (const station of allStations(world))
      for (const link of linksFrom(world, station.id))
        if (link.kind === "aller") expect(areNeighbours(world, link.to, station.id), `${link.to} -> ${station.id}`).toBe(true);
  });

  it("durées bornées, accélération douce, trajet en trois points", () => {
    const a = findStation(world, "couloir:entree")!;
    const b = findStation(world, "couloir:porte-televiseur-1950")!;
    expect(travelDuration(a, b)).toBe(MAX_TRAVEL);
    expect(travelDuration(a, a)).toBe(MIN_TRAVEL);
    expect([0, 0.5, 1].map(easeInOutCubic)).toEqual([0, 0.5, 1]);
    for (let t = 0; t < 1; t += 0.05) expect(easeInOutCubic(t + 0.05)).toBeGreaterThanOrEqual(easeInOutCubic(t));
    const middle = a.position.map((v, i) => (v + b.position[i]) / 2);
    expect(travelPath(a, b)).toEqual([a.position, middle, b.position]);
  });
});

describe("séquence de la porte temporelle", () => {
  it("fermée au départ, ouverte à la fin, compteur sur l'année cible", () => {
    const start = doorSequence(0, "19??", "1982");
    expect([start.handle, start.leaf, start.glow]).toEqual([0, 0, 0]);
    expect(counterText(start.counter)).toBe("19??");
    const end = doorSequence(SEQUENCE_DURATION, "19??", "1982");
    expect(end.leaf).toBe(1);
    expect(end.glow).toBe(1);
    expect(end.done).toBe(true);
    expect(counterText(end.counter)).toBe("1982");
    expect(counterText(doorSequence(SEQUENCE_DURATION, "19??", "198?").counter)).toBe("198?");
  });

  it("rouleaux de droite à gauche, chiffres inchangés immobiles", () => {
    const mid = doorSequence(0.7, "19??", "1950").counter;
    expect(mid[0].progress).toBe(1);
    expect(mid[1].progress).toBe(1);
    expect(mid[3].progress).toBeGreaterThan(mid[2].progress);
  });

  it("aiguilles emballées puis calmées, retour à l'envers", () => {
    expect(doorSequence(0, "19??", "1950").clockSpeed).toBe(1);
    expect(doorSequence(1.1, "19??", "1950").clockSpeed).toBeCloseTo(CLOCK_PEAK, 0);
    // Two minute-hand turns a second at the peak : visible.
    expect((CLOCK_PEAK / 3600) * 1).toBe(2);
    expect(doorSequence(2, "19??", "1950").clockSpeed).toBeCloseTo(1, 3);
    expect(counterText(doorSequence(SEQUENCE_DURATION, "1950", "19??").counter)).toBe("19??");
  });
});

describe("navigation sur les rails", () => {
  it("couloir → porte → salle → terminal, puis retour", () => {
    let state = run(initialState(CORRIDOR_ENTRY), [{ type: "ALLER", to: "couloir:porte-televiseur-1950" }]);
    expect(state).toMatchObject({ mode: "poste", station: "couloir:porte-televiseur-1950", history: [CORRIDOR_ENTRY] });
    state = navigate(world, state, { type: "PORTE" });
    expect(state.mode).toBe("ouverture");
    state = navigate(world, state, { type: "AVANCER", dt: SEQUENCE_DURATION });
    expect(state.mode).toBe("passage");
    state = navigate(world, state, { type: "AVANCER", dt: PASSAGE_DURATION });
    expect(state).toMatchObject({ mode: "poste", station: `${tv}:entree` });
    state = run(state, [{ type: "ALLER", to: `${tv}:terminal` }]);
    expect(currentStation(state)).toBe(`${tv}:terminal`);
    state = run(state, [{ type: "ALLER", to: `${tv}:entree` }, { type: "SORTIE" }]);
    expect(state).toMatchObject({ mode: "poste", station: `${tv}:entree` });
    state = navigate(world, state, { type: "SORTIE" });
    expect(state.mode).toBe("retour");
    state = run(state, []);
    expect(state).toMatchObject({ mode: "poste", station: "couloir:porte-televiseur-1950" });
  });

  it("commandes ignorées en mouvement et vers un poste non voisin", () => {
    const start = initialState(CORRIDOR_ENTRY);
    expect(navigate(world, start, { type: "ALLER", to: "couloir:fond" })).toBe(start);
    expect(navigate(world, start, { type: "PORTE" })).toBe(start);
    const moving = navigate(world, start, { type: "ALLER", to: "couloir:porte-televiseur-1950" });
    expect(navigate(world, moving, { type: "ALLER", to: CORRIDOR_ENTRY })).toBe(moving);
  });

  it("mouvement réduit : des fondus à la place des trajets et de la séquence", () => {
    const options = { reducedMotion: true };
    let state = navigate(world, initialState("couloir:porte-minitel-1"), { type: "PORTE" }, options);
    expect(state.mode).toBe("fondu");
    state = navigate(world, state, { type: "AVANCER", dt: FADE_DURATION }, options);
    expect(state).toMatchObject({ mode: "poste", station: "salle:minitel-1:entree" });
    expect(navigate(world, state, { type: "ALLER", to: "salle:minitel-1:terminal" }, options).mode).toBe("fondu");
  });

  it("précédent : trajet si voisin, fondu sinon ; saut", () => {
    let state = run(initialState(CORRIDOR_ENTRY), [{ type: "ALLER", to: "couloir:porte-televiseur-1950" }]);
    const back = navigate(world, state, { type: "PRECEDENT" });
    expect(back).toMatchObject({ mode: "trajet", to: CORRIDOR_ENTRY, back: true });
    expect(run(back, [])).toMatchObject({ mode: "poste", station: CORRIDOR_ENTRY, history: [] });
    state = run(state, [{ type: "SAUT", to: "salle:minitel-1:terminal" }]);
    expect(state).toMatchObject({ station: "salle:minitel-1:terminal" });
    expect(navigate(world, state, { type: "PRECEDENT" })).toMatchObject({ mode: "fondu", to: "couloir:porte-televiseur-1950" });
    expect(navigate(world, state, { type: "SAUT", to: "salle:inconnue:entree" })).toBe(state);
  });
});

describe("adresse de la page", () => {
  const at = (query: string) => stationFromParams(world, new URLSearchParams(query));
  it("couloir par défaut, salle, poste, compatibilité ?modele=", () => {
    expect(at("")).toBe(CORRIDOR_ENTRY);
    expect(at("salle=minitel-1")).toBe("salle:minitel-1:entree");
    expect(at("salle=minitel-1&poste=terminal")).toBe("salle:minitel-1:terminal");
    expect(at("modele=terminatel-255")).toBe("salle:terminatel-255:terminal");
    expect(at("poste=fond")).toBe("couloir:fond");
    expect(at("salle=inconnue")).toBe(CORRIDOR_ENTRY);
  });

  it("aller-retour pour chaque poste", () => {
    for (const station of allStations(world)) {
      const params = new URLSearchParams();
      for (const [name, value] of Object.entries(paramsForStation(station.id))) if (value !== null) params.set(name, value);
      expect(stationFromParams(world, params), station.id).toBe(station.id);
    }
  });
});


describe("vue : ce que montre chaque état de navigation", () => {
  it("à un poste : la caméra du poste, sans fondu", () => {
    const view = viewOf(world, initialState("couloir:porte-minitel-1"));
    const station = findStation(world, "couloir:porte-minitel-1")!;
    expect(view).toMatchObject({ place: "couloir", position: station.position, lookAt: station.lookAt, fov: 60, fade: 0 });
  });

  it("trajet : départ, arrivée, et la courbe passe par ses points", () => {
    const start = initialState(CORRIDOR_ENTRY);
    const moving = navigate(world, start, { type: "ALLER", to: "couloir:porte-televiseur-1950" });
    const a = findStation(world, CORRIDOR_ENTRY)!;
    const b = findStation(world, "couloir:porte-televiseur-1950")!;
    expect(viewOf(world, moving).position).toEqual(a.position);
    if (moving.mode !== "trajet") throw new Error("trajet attendu");
    const end = viewOf(world, { ...moving, t: moving.duration });
    end.position.forEach((v, i) => expect(v).toBeCloseTo(b.position[i], 6));
    const points = travelPath(a, b);
    catmullRom(points, 0.5).forEach((v, i) => expect(v).toBeCloseTo(points[1][i], 6));
  });

  it("porte : ouverture sur place, passage vers le seuil puis noir, retour par le couloir", () => {
    let state = navigate(world, initialState("couloir:porte-minitel-1"), { type: "PORTE" });
    expect(viewOf(world, state).door?.state.leaf).toBe(0);
    state = navigate(world, state, { type: "AVANCER", dt: SEQUENCE_DURATION });
    const passageStart = viewOf(world, state);
    expect(passageStart.door?.state.leaf).toBe(1);
    expect(passageStart.fade).toBe(0);
    const passageEnd = viewOf(world, { ...state, t: PASSAGE_DURATION } as typeof state);
    expect(passageEnd.fade).toBe(1);
    // The camera went towards the wall of the door (right side, x > 0).
    expect(passageEnd.position[0]).toBeGreaterThan(passageStart.position[0]);
    state = navigate(world, state, { type: "AVANCER", dt: PASSAGE_DURATION });
    expect(placeOf(world, (state as { station: string }).station)).toBe("minitel-1");
    // Back : fade out in the room, then the door closes, seen from the corridor.
    const back = navigate(world, state, { type: "SORTIE" });
    expect(viewOf(world, back).place).toBe("minitel-1");
    const late = viewOf(world, { ...back, t: 2.8 } as typeof back);
    expect(late.place).toBe("couloir");
    expect(late.door?.state.leaf).toBeLessThan(0.1);
  });

  it("précédent depuis l'entrée d'une salle : la porte se rejoue", () => {
    const inRoom = run(initialState("couloir:porte-minitel-1"), [{ type: "PORTE" }]);
    const back = navigate(world, inRoom, { type: "PRECEDENT" });
    expect(back).toMatchObject({ mode: "retour", back: true });
    expect(run(back, [])).toMatchObject({ mode: "poste", station: "couloir:porte-minitel-1", history: [] });
  });

  it("fondu : noir au milieu, change de lieu à mi-chemin", () => {
    const fade = navigate(world, initialState(CORRIDOR_ENTRY), { type: "SAUT", to: "salle:minitel-1:terminal" });
    if (fade.mode !== "fondu") throw new Error("fondu attendu");
    expect(viewOf(world, { ...fade, t: FADE_DURATION * 0.49 }).place).toBe("couloir");
    expect(viewOf(world, { ...fade, t: FADE_DURATION * 0.51 }).place).toBe("minitel-1");
    expect(viewOf(world, { ...fade, t: FADE_DURATION / 2 }).fade).toBeCloseTo(1, 6);
  });
});
