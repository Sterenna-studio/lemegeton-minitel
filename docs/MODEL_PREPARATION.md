# Preparation d'un modele Minitel

## Source et convention de presentation

Conserver le fichier original et travailler par Save As dans une copie Blender.
Le modele source est `lemegeton/06_MODEL/minitel_1982-france.glb`, present
localement mais non versionne. La preparation est reproductible depuis la racine du depot :

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --python-exit-code 1 --python .\tools\prepare_model.py
```

Un autre GLB source peut etre passe apres `--`.
`tools/audit_model.py` s'utilise de la meme facon et regenere les rendus de `docs/asset-audit/`.
Avec Blender 5.2, la sortie est identique a l'octet pres a `public/models/minitel.glb`.

Le televiseur se prepare de la meme facon avec `tools/prepare_television.py`,
qui ecrit `public/models/television-1950.glb` et `docs/asset-audit/television-1950.json`.

Cette commande remplace seulement `public/models/minitel.glb` et
le rapport `docs/asset-audit/normalized.json`. Archiver une copie retouchee avant
de la relancer. Ce script est **specifique a l'asset fourni**, pas un detecteur
universel d'ecran. Il transforme ses objets, tourne de -110 degres autour du Z
Blender, centre la coque et ramene sa hauteur a 2,4 unites de presentation.
Cette echelle n'est pas une mesure physique du Minitel.

Pour une nouvelle source, utiliser des dimensions physiques documentees en
metres dans Blender si disponibles, appliquer rotation/scale, poser la base au
sol et centrer l'origine au milieu de la coque. Blender : Z vertical, face vers
-Y. Apres export glTF Y-up : Y vertical, face vers +Z. Le profil generique
normalise la hauteur a 2,4 unites ; les anchors et l'overlay utilisent ce repere.
Ne pas utiliser ces unites normalisees pour fabriquer une piece mecanique.

## Objets et geometrie

- `Minitel_Body` : coque rigide.
- `Minitel_Bezel` : cadre CRT et raccords.
- `Minitel_Screen` : surface uniquement emissive, independante.
- `Minitel_Keyboard` : support des touches.
- `Key_0` ... `Key_9`, `Key_A` ... `Key_Z`, `Key_Envoi`, `Key_Sommaire`, `Key_Correction`, `Key_ConnexionFin` : touches individuelles.
- Accessoires, antenne et cables : objets distincts si animation ou remplacement prevus.

Ces noms facilitent la preparation, mais l'application utilise un profil et
peut reconnaitre les extras glTF `role: screen` et `key: Envoi`.
Un nom quelconque ne permet pas de deviner automatiquement sa fonction.
En cas de mesh fusionne, selectionner les faces pertinentes puis Separate >
Selection ; reconstruire les raccords caches et verifier les normales.
By Loose Parts separe la connexite, pas les fonctions mecaniques.

Pour la copie actuelle, les deux plus grandes faces de `Object_73` sont le
rectangle photographie de l'ecran. Elles sont retirees de la geometrie du
cadre et exportees comme `Minitel_Screen`. Les touches etaient deja separees ;
leurs noms `Object_...` sont conserves et leurs evenements sont calibres dans
`suppliedProfile.keys`. Le clavier numerique est ainsi reellement cliquable.
Pour des touches animees, placer chaque origine au centre de sa course,
nommer les objets et definir un axe d'enfoncement local.

## UV et materiaux

L'ecran doit avoir une UV continue couvrant [0,1] x [0,1], gauche a droite,
bas a haut dans Blender ; verifier avec une mire asymetrique et du texte apres
export, car glTF et Canvas ont des conventions verticales differentes.
La copie preparee recoit des UV planaires ; les CanvasTextures Web y utilisent
`flipY=false`. L'ecran runtime remplace son materiau sans modifier la coque.

Conserver les UV de la coque et des touches. Eviter d'utiliser leur atlas pour
le contenu dynamique. Limiter les materiaux identiques et consolider les
textures de coque si une optimisation est necessaire ; ne pas fusionner les
touches interactives par erreur. Plastique : metallique 0, roughness plutot
elevee ; le runtime actuel conserve les textures et ajuste roughness a 0,8.
Utiliser des images sRGB pour la couleur, des donnees lineaires pour normales,
roughness et metallic. Eviter une emission forte qui brule l'ecran.

Un CRT bombe peut etre prepare en subdivisant moderement la surface et en
ajoutant une faible convexite, avec UV coherentes. La version actuelle emploie
un plan et une distorsion shader faible : la vitre n'est pas un volume physique.

## Export et remplacement

Exporter les objets utiles seulement, format GLB, Y-up et materiaux embarques.
Exclure lampes, cameras, collections de reference et geometrie masquee inutile.
Verifier la reimportation dans une scene neuve puis dans le navigateur.
Pour animer des parties, exporter les clips et cuire les contraintes non glTF.

Deposer le resultat dans `public/models/`. Mettre a jour `ModelProfile` :

```ts
const profile = {
  normalize: true,
  screenNames: ["MonCRT"],
  screenFallback: { position: [0, 1.28, 0.75], size: [1.91, 1.56] },
  anchors: { top: { position: [0, 2.4, 0] } },
  keys: { MaTouche1: "1", MaToucheVerte: "Enter" },
};
```

Annoter ce literal avec `ModelProfile` pour verifier les tuples TypeScript.
Sans ecran reconnu, l'overlay de secours est place **dans le repere de
presentation**, pas arbitrairement dans le repere d'un mesh importe. Ajuster
position/rotation/taille avec la camera de face, puis de trois quarts ; eviter
z-fighting et penetration du cadre. C'est un repli temporaire documente, pas
une segmentation automatique.

## Performance et validation

La source choisie contient 70 meshes, 21 943 triangles et 11 images (1024 au
maximum). La copie separe le CRT : 71 meshes, nombre de triangles conserve.
Les 200 OBJ TELETEL, le fichier Table + Minitel et les autres GLB restent des
sources possibles mais ne sont pas charges par cette application.

Ne pas imposer une decimation sur cette source deja raisonnable. Mesurer d'abord
draw calls, memoire des textures et fluidite sur les appareils cibles. Eventuellement
dedupliquer les materiaux et reduire les atlas ; tester Meshopt/Draco et KTX2
seulement avec les decodeurs correspondants configures dans le chargeur.
Le chargeur actuel ne promet pas de prendre en charge ces compressions sans configuration.

Checklist de livraison : silhouette et clavier complets, texte dans le bon
sens, ecran non occulte, clic sur 1/Envoi, zoom/orbite, UV et couleurs preservees,
anchors coherents, tests mobile/tablette, fallback accessible et attribution.
Garder la licence, le nom de l'auteur, la source et la liste des modifications
avec chaque nouveau modele ; ne pas supposer que tous les assets ont la meme licence.
