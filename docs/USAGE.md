# Guide d'utilisation et d'intégration

Composant 3D interactif et ecran dynamique, avec une demonstration narrative
3615 LEMEGETON. L'application occupe la racine du depot ; les sources Blender
et les rigs historiques du personnage restent hors du depot.

## Lancement

A la racine du depot :

```powershell
npm ci
npm run dev
```

Ouvrir http://127.0.0.1:5174/. Le port 5173 etait deja utilise lors de la preparation.
Node 22.12+ ou 24 recommande ; developpement verifie avec Node 24.19.0.
`npm run build` produit `dist/`, puis `npm run preview -- --port 4174` permet
de verifier ce build. Ne pas ouvrir `index.html` directement depuis le disque.
Les polices et textures sont locales : aucun CDN n'est requis pour le rendu.

Le modele est fourni : aucune coque procedurale ne remplace l'asset original.
Rotation/toucher et zoom agissent sur la camera. Les touches du modele, le
clavier physique, le clavier virtuel et les commandes DOM pilotent le meme terminal.
Le bouton de lecture donne acces au contenu hors WebGL ; sans WebGL, ce mode
est affiche automatiquement et reste navigable.

## Architecture

- `src/minitel/` : chargement GLB, adaptation du profil, surface dynamique, anchors et API exportee dans `index.ts`.
- `src/videotex/` : grille 40 x 25, palette de huit couleurs, mosaïques 2 x 3, curseur, clignotement, rendu Canvas 800 x 600 et controleur generique.
- `src/demo/LemegetonTerminal.ts` : pages fictives et navigation ; seul ce module definit le contenu narratif.
- `src/hooks/` : abonnement React au terminal et preference de mouvement reduit.
- `src/scene/` : lumiere, ombres, camera tactile, suivi de contexte WebGL et fallback d'erreur.
- `src/components/AccessibleTerminal.tsx` : contenu textuel et actions DOM synchronises.
- `src/App.tsx` : demonstration, commandes, reglages et inspection de developpement.
- `public/models/minitel.glb` : copie preparee pour le Web, environ 3,6 Mo et 22 000 triangles.

Stack : React, TypeScript strict, Vite, Three.js, React Three Fiber et drei.
Pas de moteur physique, de serveur applicatif ni de postprocessing lourd.

## Reutiliser le composant

`Minitel` est un composant R3F, a placer **dans un Canvas**. Le moteur ne depend
ni de la demonstration, ni d'un DOM transforme en texture par capture d'ecran.

```tsx
import { Canvas } from "@react-three/fiber";
import { Minitel, suppliedProfile, useMinitel } from "./src/minitel";
import { createLemegetonTerminal } from "./src/demo/LemegetonTerminal";
import { useMemo } from "react";

function Example() {
  const terminal = useMemo(createLemegetonTerminal, []);
  const { frame } = useMinitel(terminal);
  return (
    <Canvas camera={{ position: [4, 3.2, 7.3] }}>
      <ambientLight intensity={2} />
      <Minitel
        model="/models/minitel.glb"
        profile={suppliedProfile}
        screenSource={{ kind: "videotex", frame }}
        onKey={terminal.sendKey}
      />
    </Canvas>
  );
}
```

Pour retrouver camera orbitale, cadrage responsive et eclairage de la demo,
reutiliser `Scene` ou ses composants separes. Dans un autre site, integrer
egalement une representation DOM du contenu et les actions accessibles ;
`AccessibleTerminal` est fourni pour cela. Le composant 3D seul ne remplace pas
ces elements d'accessibilite.

## Sources d'ecran

`ScreenSource` est une union TypeScript explicite :

```tsx
{ kind: 'videotex', frame }
{ kind: 'canvas', canvas: myCanvas, revision: 12, accessibleText: 'Mon contenu' }
{ kind: 'texture', texture: myThreeTexture, accessibleText: 'Mon contenu' }
```

- La source Vidéotex utilise le renderer Canvas fourni et applique les effets CRT.
- Une source Canvas prend un vrai `HTMLCanvasElement` ; incrementer `revision` apres un dessin, ou activer `continuous` pour un flux.
- Une source texture peut etre une image chargee, une `VideoTexture`, une texture WebGL ou de render target ; l'appelant garde la propriete et la responsabilite de la liberer.
- Pour les UV glTF de cette copie, fournir les textures externes avec `flipY=false` et le bon espace couleur (`SRGBColorSpace` pour une image couleur).
- Courbure visuelle disponible pour toutes les sources ; scanlines/phosphore/vignette sont dessines par le renderer Vidéotex, pas automatiquement appliques aux medias externes.
- `accessibleText` est le contrat d'accessibilite pour une source externe : le site integrateur doit l'afficher dans sa representation DOM. La demo traite les frames Vidéotex directement.

La version initiale rend un flux continu a cadence reduite ; un vrai lecteur
video haute cadence reste une integration a mesurer. Les branches Canvas et
texture sont disponibles dans l'API ; les tests de bout en bout portent sur
le terminal Vidéotex fourni, pas sur tous les decodeurs video.

## Ajouter une page Vidéotex

Creer une fonction qui retourne une nouvelle frame, sans modifier une frame
deja publiee. Enregistrer la page dans le tableau fourni au controleur `Terminal`.

```ts
import { Terminal, createScreen, text } from "./src/minitel";
const pages = [
  {
    id: "home",
    render: () => {
      const frame = createScreen("MON SERVICE");
      text(frame, 4, 6, "3615 MON SERVICE", 3);
      frame.actions = [{ key: "1", label: "OUVRIR", target: "detail" }];
      return frame;
    },
  },
  {
    id: "detail",
    render: () => {
      const frame = createScreen("DETAIL");
      text(frame, 4, 8, "Bonjour depuis le reseau.", 2);
      frame.actions = [{ key: "0", label: "RETOUR", target: "home" }];
      return frame;
    },
  },
];
const terminal = new Terminal(pages, "home");
```

Une cellule peut recevoir `mosaic: 0..63` ou `blink: true`. Les actions par chiffre
naviguent directement ; `Envoi` est traduit en `Enter`, Sommaire/Echap reviennent
a l'accueil. Le champ de commande n'exerce pas un shell ni un eval JavaScript.

## Catalogue de modeles et finitions

Le selecteur en haut de page liste les entrees de `src/demo/catalog.ts`. Le
choix est conserve dans l'URL (`?modele=terminatel-255`, `minitel-1`,
`televiseur-1950`) ; `?model=<url>` charge toujours un GLB quelconque avec le
profil generique. Chaque entree declare son fichier, son `ModelProfile`, sa
legende et son credit, affiche en pied de page.

Une entree peut ajouter une finition sans modifier le GLB. Le prop `finish` de
`<Minitel>` est une fonction `(mesh, material, role) => void` ; `role` vaut
`"key"` pour les touches du profil et `"body"` pour le reste. Elle est appelee
sur des materiaux clones, jamais sur l'ecran. Il faut la declarer au niveau du
module, car elle fait partie de la cle de memoisation. L'entree Terminatel 255
s'en sert pour poser le marbre procedural sur la coque et assombrir les touches.

Pour ajouter un modele :
1. preparer une copie Web, avec par exemple un script Blender sur le modele de
   `tools/prepare_television.py` ;
2. declarer un profil dans `src/minitel/profiles.ts` ;
3. ajouter l'entree au catalogue, avec un credit complet ;
4. completer `public/models/ATTRIBUTION.md` et `docs/ASSETS.md`.

## Table, inventaire et eclairage

- **Mobilier** : une entree du catalogue avec `onTable: true` pose le terminal sur une
  piece au choix (Reglages CRT > Mobilier, ou `?table=`). Les choix sont `table-tiroir`
  (par defaut), `chevet-haut`, `meuble-niche`, `table-basse` et `sol`, decrits dans
  `src/scene/furniture.ts`. Le terminal reste a l'origine : la piece est descendue de
  la hauteur de son plateau et avancee pour porter le clavier. La camera passe alors au cadrage `desk` de
  `src/scene/framing.ts`, et le televiseur garde le cadrage `floor`.
- **Camera** : elle vise toujours le centre de l'ecran du modele (`screenCenter` du
  `ModelProfile`, ou a defaut `screenFallback.position`). Les vues trois quarts, face,
  profil et dos sont des decalages depuis ce point.
- **Inventaire** : les cartes du bas (`src/components/ModelInventory.tsx`) forment
  un groupe radio, au clic comme aux fleches. L'effet 3D est purement CSS (perspective,
  transformations) et se fige avec `prefers-reduced-motion`. Les miniatures detourees
  `public/inventaire/*.png` sont produites par `tools/capture_views.mjs`, avec
  `?capture=1&transparent=1`.
- **Eclairage** : la lumiere est chaude et les reflets faibles, avec un environnement
  a `environmentIntensity` 0,4 et des finitions mates. Une lampe lointaine ambree
  respire, a cote d'un halo CSS accorde. Pour rester econome, elle demande des
  images a 20 Hz et s'arrete en mouvement reduit.

## Yeux de Lemegeton (ecran Videotex)

Reglages CRT, groupe **Ecran** : *3615 Lemegeton*, ou *Yeux de Lemegeton*. Les yeux
sont ceux de l'overlay OBS de nitro-clicker (`obs-lemegeton.html`). Ils ont deux rendus :

- **Mosaique Videotex** : formes reprises de **minitel-face**, detaillees ci-dessous.
- **Classique (lisse)** : `src/eyes/SmoothEyes.ts` reprend l'aspect de l'overlay : ovales
  verticaux en degrade c1 -> c2 -> c3 avec halo, aux couleurs de ses `COLOR_PRESETS`.
  Les paupieres changent selon l'humeur (inclinees en colere, en arc pour la joie,
  en coeur pour l'amour, mi-closes pour la fatigue, clin d'oeil), avec des transitions
  douces et des micro-mouvements (coupes en mouvement reduit). Le rendu dessine dans
  son propre canvas, televerse a environ 30 i/s comme source continue.

La **taille des yeux** se regle avec un curseur, de x0,6 jusqu'a la plus grande taille
qui tient dans l'ecran (environ x1,9 pour Zyra, x1,6 pour LibEyes, x1,7 en rendu
classique). Le parametre d'URL est `?taille=1.5`. En mosaique, l'agrandissement passe
par la grille des sextants, au plus proche voisin (`src/videotex/scale.ts`). Il part du
cadre des yeux ouverts au repos, si bien que la taille ne saute pas d'une humeur a
l'autre. A x1, le dessin reste celui de minitel-face, a l'identique.

Rendu mosaique, a partir du travail deja fait dans **minitel-face** :

- `src/eyes/libZyraEyes.ts`, style par defaut : portage des yeux de `LibZyra`/`LibZyraEyes`.
  Ce sont des capsules continues de 7 x 3 cellules, aux coins arrondis, avec une pupille creusee.
- `src/eyes/libEyes.ts`, style *Barres* : portage de `LibEyes`, qui transpose deja
  Web-Eye-Animation (CyberAgentAILab, MIT), la librairie des yeux de l'overlay.
  On y trouve les formes par humeur et les sequences (`blink`, `joy`, `look_around`, `fall_asleep`...).
- `src/eyes/EyesController.ts` : le moteur de `FaceRenderer`, avec les sequences et le
  mode autonome (clignements de 1 a 6 s dont 40 % doubles, regard de 2,2 a 5,2 s,
  reactions de 9 a 16 s). Le mode autonome est coupe en mouvement reduit.
- Palettes reprises des `COLOR_PRESETS` de l'overlay et ramenees aux 8 couleurs
  Videotex (cyan, phosphore, ambre, rouge, nitro, blanc). *Auto* reprend les couleurs
  d'humeur de Zyra.

URL : `?ecran=yeux&rendu=classique&couleur=phosphore&taille=1.4`, ou pour la mosaique
`?ecran=yeux&yeux=libeyes`, a la maniere des parametres de l'overlay. Les touches suivent le README de minitel-face :

| Touche | Effet |
| --- | --- |
| Envoi | joie |
| Retour | neutre, ou reveil apres endormissement |
| Repetition | regard circulaire |
| Guide | surprise |
| Sommaire | endormissement |
| Correction (Retour arriere) | fatigue |
| Annulation (Suppr) | colere |
| Suite | clin d'oeil |
| Connexion/Fin | retour au 3615 |

Pont avec minitel-face : `src/videotex/mosaic.ts` peint directement les rangees
`[ligne, colonne, couleur, octets G1]` de ses librairies, avec `g1ToMosaic`, qui suit
le meme ordre de bits que le terminal. Une rangee calculee ici est donc aussi valide
pour le Minitel physique. Les mosaiques sont dessinees *continues*, comme sur le
Minitel ; une cellule peut demander le mode *separe* (`separated`).

### Ecran bombe et effets CRT

L'ecran d'un modele plat est remplace par une dalle bombee, comme le verre d'un tube
cathodique : `ModelProfile.screenBulge`, applique par `src/minitel/bulge.ts`. Le shader
y ajoute un reflet qui suit la courbure et des bords plus sombres. Ce rendu du verre
est **toujours actif**. Le televiseur a deja un ecran courbe dans son modele.

Les effets CRT (lignes de balayage, phosphore, vignettage, scintillement, distorsion
de l'image) restent reglables un par un. L'interrupteur *Effets CRT* les coupe ou les
retablit tous a la fois. Ils s'appliquent aux deux rendus des yeux comme au 3615
(`applyCrtEffects` dans `src/videotex/renderer.ts`).

## Remplacer le modele

Lire [MODEL_PREPARATION.md](MODEL_PREPARATION.md).
Deposer le nouveau GLB dans `public/models/`, puis passer son URL et un profil
adapte au composant. La demo accepte aussi `?model=/models/autre.glb` : elle
utilise alors le profil generique, normalise la hauteur et recherche un ecran
par noms configurables ou par `userData.role='screen'`.

Remplacer directement `public/models/minitel.glb` est possible, mais cette URL
selectionne le profil de la copie fournie : changer aussi ce profil si echelle,
UV, ecran, touches ou anchors changent. Sans mesh d'ecran reconnu, un overlay
calibre par `screenFallback` est cree, sans pretendre identifier automatiquement
une surface de scan fusionnee. Une erreur de chargement conserve le terminal DOM.

## Ajouter un accessoire

Les anchors sont dans `ModelProfile.anchors`, independamment des noms de meshes.
Les offsets sont exprimes dans le repere de presentation du modele.

```tsx
<Minitel
  model="/models/minitel.glb"
  profile={suppliedProfile}
  screenSource={{ kind: "videotex", frame }}
>
  <MinitelAttachment anchor="top" position={[0.55, 0.06, -0.25]}>
    <mesh position={[0, 0.3, 0]}>
      <cylinderGeometry args={[0.02, 0.02, 0.6, 12]} />
      <meshStandardMaterial color="#647366" />
    </mesh>
  </MinitelAttachment>
</Minitel>
```

Importer `MinitelAttachment` depuis `src/minitel`. La case d'antenne de la demo
utilise ce mecanisme ; aucun couplage au modele de personnage Lemegéton.

## Inspection et verification

En developpement seulement, le bouton d'inspection expose axes, wireframe,
bounding boxes, noms, liste et selection des meshes, position camera, triangles,
textures, appels de rendu et cadence. Selectionner un mesh encadre sa geometrie.
La cadence est celle des rendus a la demande, pas un benchmark de FPS maximal.
Ces controles sont absents du build de production.

```powershell
npm run typecheck
npm run lint
npm test
npm run build
# Avec le serveur dev sur 5174 et Edge installe :
npm run test:browser
```

Les tests navigateur utilisent Edge headless. Adapter `channel` dans
`playwright.config.ts` pour un autre navigateur installe. Les captures sont
dans `docs/verification/`. Le fallback WebGL est teste par simulation de
l'indisponibilite de contexte ; les tests mobiles emulent des viewports/toucher,
ils ne constituent pas un essai sur telephone physique.

## Limites et suite

Le [rapport de verification](VERIFICATION.md) recense les tests passes,
les viewports, le cout du build et les niveaux de preuve.

- Il s'agit d'un renderer a cellules credible, pas d'une emulation exacte du protocole Vidéotex ou du jeu de glyphes historique. Mosaïques et couleurs sont gerees ; pas de decodeur de flux VDT.
- Le modele conserve les textures photographiques fournies (aspect gris marque), pas un nouveau plastique beige reconstruit. Son CRT prepare est geometriquement plat, avec distorsion visuelle subtile activable.
- Connexion/identification sont des pages fictives manuelles, pas une connexion reseau ni une authentification.
- Les touches sont cliquables ; leur enfoncement mecanique et le son restent a ajouter.
- Pas de compression Draco/KTX2 imposee. DPR limite a 1,5, geometrie moderee, ombres 1024, rendu a la demande et mise a jour terminal a 8 Hz. Le bundle Three.js reste un cout a mesurer sur les sites cibles.
- La permanence de phosphore temporelle n'est pas simulee ; glow faible, scanlines, vignette, courbure et scintillement sont independants et desactivables. Mouvement reduit neutralise clignotement/curseur anime et scintillement.
- Evolution prevue : un monde explorable (couloir, portes temporelles, une salle par terminal), voir [MONDE_EXPLORABLE.md](MONDE_EXPLORABLE.md).
- Priorites suivantes : validation sur appareils physiques, consolidation des materiaux et touches, couleur plastique selon references, texture CRT encore plus lisible ; puis decodeur VDT ou adaptation WebSocket suivant le projet integrateur.

## Provenance

Asset utilise : **Minitel 1982-France**, **okotaru**,
[source Sketchfab](https://sketchfab.com/3d-models/minitel-1982-france-864f54ce4e1f41abab0688b88a45babf),
licence **CC BY 4.0** indiquee dans les metadonnees du GLB fourni.
Modifications : orientation, centrage, echelle de presentation, separation des
deux faces CRT et nouvelles UV ; pas de modification de l'original.
Voir [ATTRIBUTION.md](../public/models/ATTRIBUTION.md) et [ASSETS.md](ASSETS.md). Les autres
modeles de `lemegeton/06_MODEL` ne sont ni versionnes ni distribues : leurs licences restent a verifier.
