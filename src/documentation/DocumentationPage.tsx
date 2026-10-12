import { useState } from "react";
import { assetUrl } from "../assets";
import { ArrowLeft, ArrowUpRight, Monitor } from "lucide-react";
import { catalog, creditChanges } from "../demo/catalog";
import { t, useLang } from "../i18n";
import { LanguageSwitch } from "../components/LanguageSwitch";
import { docContent, sources, type DocContent, type Fact, type ModelDoc, type WorldDoc } from "./content";
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

function ModelSection({ doc, index, views }: { doc: ModelDoc; index: number; views: DocContent["views"] }) {
  const [view, setView] = useState<string>(views[0].id);
  const entry = catalog.find((item) => item.id === doc.id);
  const image = (id: string) => assetUrl(`documentation/vues/${doc.id}-${id}.jpg`);
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
            alt={t("doc.view.alt", { title: doc.title, view: current.label.toLowerCase() })}
            width={1200}
            height={900}
          />
          <figcaption>
            {t("doc.view.caption", { view: current.label.toLowerCase() }).replace(/^./, (c) => c.toUpperCase())}
          </figcaption>
          <div className="thumbs" role="group" aria-label={t("doc.views", { title: doc.title })}>
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
          <h3>{t("doc.characteristics")}</h3>
          <Facts items={doc.facts} />
          <h3>{t("doc.model3d")}</h3>
          <Facts items={doc.asset} />
          {entry && (
            <p className="credit">
              <a href={entry.credit.source} target="_blank" rel="noreferrer" translate="no">
                {entry.credit.title}
              </a>{" "}
              {t("doc.credit.by")} <span translate="no">{entry.credit.author}</span>, {t("doc.credit.license")}{" "}
              <a href={entry.credit.licenseUrl} target="_blank" rel="noreferrer">
                {entry.credit.license}
              </a>
              , {creditChanges(entry)}.
            </p>
          )}
          <div className="open-links">
            <a className="open-3d" href={`${base}?modele=${doc.id}`}>
              {t("doc.open3d")} <ArrowUpRight size={16} />
            </a>
            <a className="open-3d open-world" href={`${base}?mode=3d&salle=${doc.id}`}>
              {t("doc.openRoom")} <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function World({ worldDoc }: { worldDoc: WorldDoc }) {
  return (
    <section className="model-doc world-doc" id="monde" aria-labelledby="monde-title">
      <header>
        <span className="kicker">{worldDoc.kicker}</span>
        <h2 id="monde-title">{worldDoc.title}</h2>
      </header>
      <div className="model-text">
        {worldDoc.intro.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
        <h3>{t("doc.world.route")}</h3>
        <Facts items={worldDoc.facts} />
        <h3>{t("doc.world.rooms")}</h3>
        <ul className="world-rooms">
          {worldDoc.rooms.map((room) => (
            <li key={room.id}>
              <a href={`${base}?mode=3d&salle=${room.id}`}>
                <strong>{room.label}</strong>
                <span>{room.description}</span>
              </a>
            </li>
          ))}
        </ul>
        <h3>{t("doc.world.assets")}</h3>
        <Facts items={worldDoc.assets} />
        <div className="open-links">
          <a className="open-3d open-world" href={`${base}?mode=3d`}>
            {t("doc.world.enter")} <ArrowUpRight size={16} />
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
        <span className="kicker">{t("doc.references.kicker")}</span>
        <h2 id="references-title">{t("doc.references.title")}</h2>
      </header>
      <p>
        {t("doc.references.intro", { count: referencePhotos.length })}{" "}
        {local ? t("doc.references.local") : t("doc.references.published")}
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
  const lang = useLang();
  const { views, modelDocs, worldDoc, projectDocs, related } = docContent(lang);
  return (
    <div className="doc-page">
      <header className="doc-masthead">
        <a href={base} className="brand" aria-label={t("doc.backLabel")}>
          <Monitor size={26} />
          <span className="doc-brand">
            <bdi translate="no">MINITEL</bdi>
            <span>{t("doc.brand")}</span>
          </span>
        </a>
        <div className="doc-tools">
          <LanguageSwitch className="back-link" />
          <a href={base} className="back-link">
            <ArrowLeft size={16} /> {t("doc.back")}
          </a>
        </div>
      </header>
      <main id="contenu">
        <section className="doc-intro">
          <h1>{t("doc.title")}</h1>
          <p>{t("doc.intro")}</p>
          <nav aria-label={t("doc.nav")} className="doc-nav">
            {modelDocs.map((doc) => (
              <a key={doc.id} href={`#${doc.id}`}>
                {doc.title}
              </a>
            ))}
            <a href="#monde">{t("doc.nav.world")}</a>
            <a href="#references">{t("doc.nav.references")}</a>
            <a href="#projet">{t("doc.nav.project")}</a>
            <a href="#lies">{t("doc.nav.related")}</a>
            <a href="#sources">{t("doc.nav.sources")}</a>
          </nav>
        </section>
        {modelDocs.map((doc, index) => (
          <ModelSection key={`${lang}-${doc.id}`} doc={doc} index={index} views={views} />
        ))}
        <World worldDoc={worldDoc} />
        <References />
        <section className="project-docs" id="projet" aria-labelledby="projet-title">
          <header>
            <span className="kicker">{t("doc.project.kicker")}</span>
            <h2 id="projet-title">{t("doc.project.title")}</h2>
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
        <section className="project-docs" id="lies" aria-labelledby="lies-title">
          <header>
            <span className="kicker">{t("doc.related.kicker")}</span>
            <h2 id="lies-title">{t("doc.related.title")}</h2>
          </header>
          <ul>
            {related.map((project) => (
              <li key={project.name}>
                <a href={project.url} target="_blank" rel="noreferrer">
                  <strong translate="no">{project.name}</strong>
                  <span>{project.description}</span>
                  <code translate="no">{project.url.replace("https://github.com/", "")}</code>
                </a>
              </li>
            ))}
          </ul>
        </section>
        <section className="sources" id="sources" aria-labelledby="sources-title">
          <h2 id="sources-title">{t("doc.sources.title")}</h2>
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
        {t("doc.footer")} <a href={`${base}models/ATTRIBUTION.md`}>{t("doc.footer.all")}</a>.
      </footer>
    </div>
  );
}
