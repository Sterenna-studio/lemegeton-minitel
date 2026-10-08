import { ArrowLeft, DoorOpen, FileText, Monitor } from "lucide-react";
import { bricks, findBrick } from "./bricks";
import { DoorWorkshop } from "./DoorWorkshop";
import { CorridorWorkshop } from "./CorridorWorkshop";

const base = import.meta.env.BASE_URL;

/**
 * Workshop of the explorable world : each brick is built and checked alone
 * before being assembled (docs/MONDE_EXPLORABLE.md, §9). The door (lot B) and
 * the corridor (lot C) are ready ; the rooms arrive with lot E.
 */
export function AtelierPage() {
  const selected = findBrick(new URLSearchParams(window.location.search).get("brique"));
  return (
    <div className="atelier-page">
      <header className="atelier-masthead">
        <a className="atelier-brand" href={`${base}atelier/`}>
          <DoorOpen size={24} />
          <span>
            Atelier<small>monde explorable</small>
          </span>
        </a>
        <nav aria-label="Autres pages">
          <a href={`${base}parcours/`}>
            <DoorOpen size={14} /> Parcours
          </a>
          <a href={`${base}simple/`}>
            <Monitor size={14} /> Version simple
          </a>
          <a href={`${base}documentation/`}>
            <FileText size={14} /> Documentation
          </a>
        </nav>
      </header>
      <main>
        {selected ? (
          <section className="atelier-brick" aria-labelledby="brique-titre">
            <a className="atelier-back" href={`${base}atelier/`}>
              <ArrowLeft size={14} /> Toutes les briques
            </a>
            <h1 id="brique-titre">{selected.title}</h1>
            <p>{selected.summary}</p>
            {selected.id === "porte" ? (
              <DoorWorkshop />
            ) : selected.id === "couloir" ? (
              <CorridorWorkshop />
            ) : (
              <p className="atelier-pending" role="status">
                {selected.ready ? "Disponible." : `En préparation : lot ${selected.lot}.`}
              </p>
            )}
          </section>
        ) : (
          <>
            <h1>Briques du monde</h1>
            <p className="atelier-intro">
              Chaque brique du couloir se construit et se vérifie seule, avant d'être
              assemblée par des données.
            </p>
            <ul className="atelier-grid">
              {bricks.map((brick) => (
                <li key={brick.id}>
                  <a href={`${base}atelier/?brique=${brick.id}`}>
                    <span className="atelier-lot">Lot {brick.lot}</span>
                    <strong>{brick.title}</strong>
                    <span>{brick.summary}</span>
                    <em>{brick.ready ? "Disponible" : "En préparation"}</em>
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}
