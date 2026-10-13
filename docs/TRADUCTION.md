# Traduction du site

Le site existe en **français** (langue de référence) et en **anglais**. Décision du
12 octobre 2026 : une version anglaise au minimum, et une structure qui facilite
l'ajout d'autres langues, par un traducteur humain ou un outil.

## Comment la langue est choisie

1. `?lang=fr` ou `?lang=en` dans l'adresse ;
2. sinon le dernier choix du visiteur (enregistré dans le navigateur) ;
3. sinon la langue du navigateur : français pour un navigateur français, anglais
   pour tous les autres.

Le bouton **EN** / **FR** des en-têtes (version simple, mode 3D+, Documentation)
change de langue sans recharger la page. Il nomme l'autre langue dans cette langue
(« English version », « Version française »), écrit `?lang=` dans l'adresse pour
qu'elle se partage, et met à jour `<html lang>`. `index.html` déclare les deux
versions aux moteurs de recherche (`hreflang`).

## Où sont les textes

| Fichier | Contenu |
| --- | --- |
| `src/i18n/locales/fr.json` | textes de l'interface, en français (**référence**) |
| `src/i18n/locales/en.json` | les mêmes clés, en anglais |
| `src/documentation/content.fr.ts`, `content.en.ts` | contenu de la page Documentation (fiches, mode 3D+, documents, projets liés) |
| `src/i18n/index.ts` | choix de la langue, `t("clé", { paramètre })`, `useLang()` |

Les catalogues sont des fichiers JSON **plats** : une clé stable, une valeur à
traduire. Les valeurs peuvent contenir des emplacements entre accolades (`{year}`,
`{label}`, `{count}`), à recopier tels quels. Une clé absente d'une langue retombe
sur le français.

Le contenu de la Documentation est en TypeScript typé (`DocContent`) : il manque
une rubrique à une traduction, et la compilation échoue.

Les textes calculés (catalogue des terminaux, mobilier, options des yeux) ont des
clés construites à partir de leur identifiant (`catalog.<id>.label`,
`furniture.<id>`, `eyes.style.<id>`…) et passent par `tFor`.

## Ajouter une langue

1. Copier `src/i18n/locales/en.json` en `src/i18n/locales/<code>.json` (par exemple
   `de.json`) et traduire les **valeurs** (jamais les clés ni les `{emplacements}`).
   Un outil de traduction automatique peut traiter ce fichier tel quel.
2. Copier `src/documentation/content.en.ts` en `content.<code>.ts` et traduire les
   textes.
3. Déclarer la langue dans `src/i18n/index.ts` (`LANGS`, `LANG_NAMES`, import du
   catalogue) et dans `docContent` (`src/documentation/content.ts`).
4. Ajouter son `hreflang` dans `index.html`, et une ligne `lang.other.*` adaptée :
   avec plus de deux langues, le bouton deviendra une liste.
5. `npm test` : `tests/langues.test.ts` vérifie que chaque catalogue a les mêmes
   clés et les mêmes emplacements que le français, et que la Documentation a les
   mêmes rubriques.

## Ce qui reste en français, et pourquoi

- **Les pages 3615 affichées sur l'écran Vidéotex** (`src/demo/LemegetonTerminal.ts`) :
  c'est un service Minitel français d'époque, dessiné dans l'écran. Leur
  **lecture accessible** (bouton Lecture) est du texte de la page : un traducteur
  de navigateur peut la traduire.
- **Les objets d'époque** : calendrier d'octobre 1982, plaque du Terminatel, noms des
  touches du Minitel (Sommaire, Envoi, Correction…), marqués `translate="no"`.
- **L'Atelier** (`/atelier/`), page de travail des briques du monde.
- **Les descriptions des photos de référence** (`src/documentation/references.ts`),
  visibles seulement en local.
- **La documentation du dépôt** (`docs/`, README) : la page Documentation l'indique
  en anglais (« in French »).

## Traducteurs de navigateur

Pour qu'un traducteur automatique (Google Traduction, Edge, Safari) donne un bon
résultat sur les deux versions :
- `<html lang>` suit la langue affichée ;
- les noms propres et les marques sont marqués `translate="no"` : MINITEL, 3615
  LEMEGETON, noms des terminaux, titres et auteurs des modèles, noms des dépôts,
  touches du Minitel ;
- les textes de l'interface sont du texte de la page (pas d'image), y compris la
  lecture accessible du terminal.
