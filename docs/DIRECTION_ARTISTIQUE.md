# Direction artistique du monde explorable

Cette fiche complète [MONDE_EXPLORABLE.md](MONDE_EXPLORABLE.md). Elle décrit
l'aspect du couloir, des portes temporelles et des trois salles.

Les ambiances ont été validées le 6 octobre 2026. Les teintes, matériaux et
intensités ci-dessous en sont la traduction proposée, à régler en atelier ; une
fois réglées, les valeurs retenues remplacent celles-ci.

## Principe

**Le couloir est hors du temps, chaque salle est datée.**

- **Couloir** : rétro mystérieux des années 1920 à 1960, chaud et feutré, plutôt sombre. C'est un lieu de passage : on doit sentir que quelqu'un y a vécu, sans pouvoir le dater précisément.
- **Portes** : elles font le lien. Chacune laisse filtrer la lumière de son époque avant même d'être ouverte.
- **Salles** : chacune est fidèle à l'époque de son terminal, qui en est le centre. Elle est cadrée et éclairée pour lui.

Ce qu'on évite :
- le low-poly et les couleurs saturées ;
- le néon cyberpunk, qui va contre le cadrage du projet ;
- les logos et marques réelles dans le décor, que ce soit sur les affiches, les plaques ou les écrans ;
- toute personne réelle reconnaissable sur les portraits.

## Interface (existante)

Les jetons de `src/styles.css` restent la référence de l'interface : panneaux,
inventaire, réglages.

| Jeton | Valeur | Usage |
| --- | --- | --- |
| `--page` | `#0c0b0a` | fond |
| `--surface` / `--raised` | `#151311` / `#1d1a17` | panneaux |
| `--line` | `#3a332b` | filets |
| `--cream` | `#ece4d2` | texte |
| `--muted` | `#a69d8d` | texte secondaire |
| `--gold` | `#c9a56b` | laiton, accents |
| `--sage` | `#93ad7c` | état actif, « en ligne » |
| `--marble` | procédural (`src/demo/marble.ts`) | fond marbre noir |

Polices : IBM Plex Sans et IBM Plex Mono, sous licence SIL OFL 1.1, copiées dans
`public/licenses/`. Elles servent aussi **dans le monde**, pour les chiffres du
compteur et les plaques, rendues en texture canvas. On n'ajoute pas de nouvelle
police sans licence OFL ou équivalente.

## Couloir

| Élément | Proposition |
| --- | --- |
| Murs | lambris de noyer sombre jusqu'à 1 m, puis plâtre vieilli ou papier peint vert bouteille à motif discret |
| Sol | parquet usé à chevrons ou à lames, avec un tapis de passage usé au centre |
| Plafond | plâtre, avec moulure et corniche |
| Métal | laiton oxydé : poignées, appliques, plaques, plinthes métalliques |
| Petits objets | cadres (portraits et plans générés), porte-manteau, valise, horloge murale |
| Lumière | appliques à 2 200–2 700 K, en flaques lumineuses entre des zones d'ombre ; ambiance très basse |
| Profondeur | léger brouillard chaud (`FogExp2`, faible densité) pour que le fond se perde |

| Couleur | Valeur | Rôle |
| --- | --- | --- |
| Noyer sombre | `#3b2a1e` | lambris, portes |
| Bois patiné | `#5c4330` | parquet |
| Vert bouteille | `#24302a` | papier peint |
| Plâtre vieilli | `#cfc3a8` | murs hauts, plafond |
| Laiton oxydé | `#b08d57` | métal (proche de `--gold`) |
| Lumière d'applique | `#ffb46b` | 2 400 K environ |

## Porte temporelle

Une seule porte, en noyer, avec poignée, plaque et compteur en laiton.
- **Compteur à rouleaux** : chiffres crème `#ece4d2` sur fond noir `#0c0b0a`, en IBM Plex Mono, avec un léger relief cylindrique. Le dernier rouleau sait afficher `?` pour « 198? ».
- **Horloge** : cadran crème, aiguilles en laiton noirci, placée au-dessus du chambranle.
- **Plaque** : nom du terminal gravé, par exemple « Téléviseur 1950 ».

Chaque porte a une **teinte d'époque**, qui filtre sous la porte puis par
l'entrebâillement :

| Porte | Teinte | Valeur | Justification |
| --- | --- | --- | --- |
| 1950 | phosphore bleu-vert | `#8fd1c4` | lueur d'un tube de télévision noir et blanc |
| 1982 | blanc tiède de bureau | `#e8e2c8` | néon de bureau et écran du Minitel |
| 198? | ambre profond | `#ff9a4d` | la lampe lointaine actuelle (`Lighting.tsx`) |

**Effet temporel** pendant le passage :
- grain, aberration chromatique légère et flou radial bref ;
- ces effets sont de la même famille que les effets CRT de l'écran, et on les règle avec la même retenue ;
- aucun flash plein écran ;
- en mouvement réduit, un simple fondu les remplace.

## Salles

### `televiseur-1950` : salon des années 50

- **Mobilier** : buffet ou meuble télé en teck, fauteuil club ou fauteuil à accoudoirs, lampadaire, guéridon, tapis à motif.
- **Murs** : papier peint à motif géométrique ou floral pâle, tons sable.
- **Lumière** : lampadaire chaud à 2 700 K, plus la lueur bleu-vert de l'écran comme accent.
- **Objets** : radio, vase, journaux pliés, cendrier, cadres.

| Couleur | Valeur |
| --- | --- |
| Sable | `#c9b48a` |
| Teck | `#6b4f35` |
| Vert sauge | `#8a9a7a` |
| Crème | `#d8cfb8` |
| Accent écran | `#8fd1c4` |

### `minitel-1` : bureau des années 80

- **Mobilier** : bureau stratifié ou bois clair, l'une des tables actuelles sous le terminal, chaise de bureau, classeur métallique, lampe de bureau articulée.
- **Murs et sol** : murs beige ou gris clair, moquette grise.
- **Lumière** : néon de plafond neutre (3 500–4 000 K) et lampe de bureau chaude. C'est la seule salle à lumière plus froide.
- **Objets** : téléphone à touches, annuaire, bloc-notes, porte-documents, calendrier, plante verte.

| Couleur | Valeur |
| --- | --- |
| Beige | `#d6cbb3` |
| Gris | `#8c8c84` |
| Brun | `#5a4636` |
| Accent orangé | `#c8692c` |
| Lumière | `#e8e2c8` |

### `terminatel-255` : la DA actuelle

C'est la page d'aujourd'hui, mise en pièce.
- **Murs** : marbre noir procédural (`src/demo/marble.ts`), avec la même graine que la finition du terminal.
- **Mobilier** : tables actuelles. Plinthes et appliques en laiton.
- **Lumière** : le preset actuel de `Lighting.tsx` (lumières chaudes et mates, lampe ambrée lointaine qui respire), à l'identique.
- **Ambiance** : très sombre, feutrée, presque un écrin. Le terminal est le seul objet vraiment éclairé.

Couleurs : `--page`, `--gold`, `--cream`, et `#ff9a4d` pour la lampe.

## Visuels 2D générés

Les portraits, lettres, journaux, cartes, plans, affiches et étiquettes peuvent être
générés pour être propres à l'univers, puis appliqués en texture.

Règles :
- aucune personne réelle reconnaissable ;
- aucune marque ni aucun logo existant ;
- aucun texte lisible qui imiterait un document officiel réel ;
- on garde la **provenance** : outil, date et consigne, dans `docs/asset-audit/visuels.json` au moment de l'ajout ;
- on vérifie les conditions d'utilisation de l'outil employé ;
- les textures sont légères (1024² au plus, en général 512²) et embarquées dans les GLB.

## Son

Le son est **coupé par défaut**, avec un bouton pour l'activer (décision du
7 octobre 2026, [MONDE_EXPLORABLE.md](MONDE_EXPLORABLE.md#1-décisions)).

| Lieu ou action | Sons |
| --- | --- |
| Couloir | ton de pièce, craquements de parquet, horloge lointaine |
| Porte | poignée, tic-tac qui accélère, souffle, grincement |
| Salon 1950 | crépitement de vinyle, ronronnement du tube |
| Bureau 1982 | bourdonnement du néon, bip de connexion du Minitel |
| Terminatel | silence feutré, ronronnement de l'écran |

Les sources et licences sont décrites dans
[ASSETS.md](ASSETS.md#monde-explorable--sources-et-règles).
