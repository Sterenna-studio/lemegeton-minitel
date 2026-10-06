import { useState } from "react";
import { ArrowLeft, ArrowUpRight, Monitor } from "lucide-react";
import { catalog } from "../demo/catalog";
import { modelDocs, projectDocs, sources, views, type Fact, type ModelDoc } from "./content";
import { referencePhotos, referenceFolder } from "./references";

const base = import.meta.env.BASE_URL;

function Facts({ items }: { items: Fact[] }) {
  return (
    <dl className="facts">
      {items.map((fact) => (
        <div key={fact.label}>
          <dt>{fact.label}</dt>
          <dd>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ModelSection({ doc, index }: { doc: ModelDoc; index: number }) {
  const [view, setView] = useState<string>(views[0].id);
  const entry = catalog.find((item) => item.id === doc.id);
  const image = (id: string) => `${base}documentation/vues/${doc.id}-${id}.jpg`;
  const current = views.find((item) => item.id === view) ?? views[0];
  return (
    <section className="model-doc" id={doc.id} aria-labelledby={`${doc.id}-title`}>
      <header>
        <span className="kicker">
          {String(index + 1).padStart(2, "0")} / {doc.kicker}
        </span>
        <h2 id={`${doc.id}-title`}>{doc.title}</h2>
      </header>
      <div className="model-grid">
        <figure className="viewer">
          <img
            src={image(current.id)}
            alt={`${doc.title}, vue ${current.label.toLowerCase()}, rendu du terminal 3D`}
            width={1200}
            height={900}
          />
          <figcaption>
            Vue {current.label.toLowerCase()} · rendu du terminal 3D
          </figcaption>
          <div className="thumbs" role="group" aria-label={`Vues de ${doc.title}`}>
            {views.map((item) => (
              <button
                key={item.id}
                aria-pressed={item.id === view}
                onClick={() => setView(item.id)}
              >
                <img src={image(item.id)} alt="" width={120} height={90} loading="lazy" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </figure>
        <div className="model-text">
          {doc.intro.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
          {doc.note && <p className="note">{doc.note}</p>}
          <h3>Caracteristiques</h3>
          <Facts items={doc.facts} />
          <h3>Modele 3D</h3>
          <Facts items={doc.asset} />
          {entry && (
            <p className="credit">
              <a href={entry.credit.source} target="_blank" rel="noreferrer">
                {entry.credit.title}
              </a>{" "}
              par {entry.credit.author}, sous licence{" "}
              <a href={entry.credit.licenseUrl} target="_blank" rel="noreferrer">
                {entry.credit.license}
              </a>
              , {entry.credit.changes}.
            </p>
          )}
          <a className="open-3d" href={`${base}?modele=${doc.id}`}>
            Ouvrir dans le terminal 3D <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}

function References() {
  // Les photos (annonce eBay, droits du vendeur) ne sont pas publiees : elles
  // ne s'affichent qu'en developpement, depuis le dossier local.
  const local = import.meta.env.DEV;
  return (
    <section className="references" id="references" aria-labelledby="references-title">
      <header>
        <span className="kicker">Archives / Terminatel 255</span>
        <h2 id="references-title">Photos de reference</h2>
      </header>
      <p>
        {referencePhotos.length} vues photographiques du Terminatel 255, classees par
        element. Elles ont servi de modele pour la direction artistique.
        {local
          ? " Consultation locale : les photos s'affichent depuis le dossier du depot."
          : " Ces photos proviennent d'une annonce et appartiennent a leur auteur : elles ne sont pas publiees ici, seule leur description l'est."}
      </p>
      <ol className="reference-list">
        {referencePhotos.map((photo) => (
          <li key={photo.view}>
            {local && (
              <a href={`/${referenceFolder}/${photo.large}`} target="_blank" rel="noreferrer">
                <img src={`/${referenceFolder}/${photo.small}`} alt={photo.description} loading="lazy" />
              </a>
            )}
            <span className="ref-view">{photo.view}</span>
            <span>{photo.description}</span>
            <span className="ref-category">{photo.category}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function DocumentationPage() {
  return (
    <div className="doc-page">
      <header className="doc-masthead">
        <a href={base} className="brand" aria-label="Retour au terminal 3D">
          <Monitor size={26} />
          <span className="doc-brand">
            MINITEL<span>DOCUMENTATION</span>
          </span>
        </a>
        <a href={base} className="back-link">
          <ArrowLeft size={16} /> Terminal 3D
        </a>
      </header>
      <main id="contenu">
        <section className="doc-intro">
          <h1>Documentation des terminaux</h1>
          <p>
            Les modeles du terminal 3D, leurs caracteristiques, leur provenance
            et la documentation du projet. Les vues sont des rendus du terminal
            3D lui-meme, avec les memes finitions.
          </p>
          <nav aria-label="Sommaire de la documentation" className="doc-nav">
            {modelDocs.map((doc) => (
              <a key={doc.id} href={`#${doc.id}`}>
                {doc.title}
              </a>
            ))}
            <a href="#references">Photos de reference</a>
            <a href="#projet">Documentation du projet</a>
            <a href="#sources">Sources</a>
          </nav>
        </section>
        {modelDocs.map((doc, index) => (
          <ModelSection key={doc.id} doc={doc} index={index} />
        ))}
        <References />
        <section className="project-docs" id="projet" aria-labelledby="projet-title">
          <header>
            <span className="kicker">Depot lemegeton-minitel</span>
            <h2 id="projet-title">Documentation du projet</h2>
          </header>
          <ul>
            {projectDocs.map((doc) => (
              <li key={doc.path}>
                <a href={doc.url} target="_blank" rel="noreferrer">
                  <strong>{doc.title}</strong>
                  <span>{doc.description}</span>
                  <code>{doc.path}</code>
                </a>
              </li>
            ))}
          </ul>
        </section>
        <section className="sources" id="sources" aria-labelledby="sources-title">
          <h2 id="sources-title">Sources</h2>
          <ul>
            {sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <footer className="doc-footer">
        Modeles 3D sous licence CC BY 4.0 : Minitel 1982-France par okotaru,
        1950&apos;s Retro Television par Huuxloc, Wood Drawer &amp; Tables Set par
        brandon_grey. Marbre procedural.
      </footer>
    </div>
  );
}
