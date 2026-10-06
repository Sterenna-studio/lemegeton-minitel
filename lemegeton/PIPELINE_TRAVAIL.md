# Lemegeton - pipeline de travail

## Branche Web Minitel - 6 octobre 2026

Une application independante est ajoutee dans
[07_WEB_MINITEL](../docs/USAGE.md), avec une copie preparee du GLB
Minitel de `06_MODEL`. Le moteur d'ecran est generique ; Lemegéton n'est que
la premiere demonstration. Cette branche ne remplace ni la segmentation
PartField prevue ci-dessous, ni la correction du personnage.

Ordre de cette branche : audit asset -> copie orientee et CRT separe ->
terminal Canvas/Videotex -> camera/clavier/anchors -> accessibilite/fallback ->
validation navigateur et build -> preparation d'un modele ameliore.
Lancement : `cd 07_WEB_MINITEL`, `npm ci`, `npm run dev`, port 5174.
Instructions de modele, nouvel ecran et accessoire dans le README de l'application.

Premiere version verifiee : compilation, lint, TypeScript, 6 tests unitaires,
10 tests navigateur et deux essais du build de production. Les captures et
limites sont dans [VERIFICATION.md](../docs/VERIFICATION.md).
Ces essais ne constituent pas une validation artistique ou sur telephone physique.

- [ ] Valider artistiquement la copie texturee fournie et sa teinte de plastique.
- [ ] Essayer sur appareils mobiles physiques, puis mesurer textures et draw calls.
- [ ] Preparer une coque/CRT amelioree selon [MODEL_PREPARATION.md](../docs/MODEL_PREPARATION.md), avec profil d'ecran et anchors adaptes.
- [ ] Choisir ensuite une integration reseau/VDT ou narrative sans coupler le moteur au personnage.

## Branche personnage - reprise du 5 octobre 2026

Feuille de route du 5 octobre 2026. Les cases ci-dessous portent sur la version
finale ; les etudes preparees et verifiees sont recensees dans le tableau suivant.
L'avancement Blender et les limites observees sont detailles dans
[AUDIT_ET_SUITE.md](AUDIT_ET_SUITE.md). La V4 d'atelier utilise la source texturee
`Rusty Retrobot.glb` et fournit une partition provisoire ; la geometrie mecanique,
les doigts et le rig de production restent a finaliser.

| Etape | Avancement actuel |
| --- | --- |
| Preparation et import | Fait : copie V3 corrigee, atelier V4 genere |
| Comparaison des sources | Fait : trois sources distinctes, 12 rendus, rapport de topologie |
| Separation des pieces | 15 objets rigides provisoires ; raccords ouverts a reconstruire |
| Rig et controles | 24 os repositionnes, 28 controles ; FK raccorde, doigts et IK a finaliser |
| Salut de 5 secondes | Etude animee disponible, mains encore traitees comme des blocs |
| Rendu | MP4 d'etude, 120 images a 24 i/s, 720 x 720 |
| Export | GLB d'etude cuit, une animation de 5 secondes, reimportation Blender verifiee |
| Viewer final | A faire ; lecture dans un navigateur non testee |

**Priorite apres redemarrage : essai PartField, puis separation et reconstruction
des pieces avant le rig et l'animation.** La video actuelle est jugee
insatisfaisante par le porteur du projet : elle reste un diagnostic technique,
pas un livrable valide. Les tests de rigidite et d'export ne valident pas la qualite visuelle.

Point de reprise manuel : `04_BLENDER/LEMEGETON_02_ATELIER_V4.blend`
(source texturee fusionnee a l'echelle ; le rig provisoire n'est pas a conserver obligatoirement).
Comparatif des decoupes : `04_BLENDER/LEMEGETON_03_PIECES_PROVISOIRES.blend`.
Pour examiner le mouvement : `04_BLENDER/LEMEGETON_04_WAVE_PIECES_ETUDE.blend`.
Faire Save As sous un nouveau nom avant les retouches manuelles.
Base : fichiers locaux, scripts V1/V2/V3 et
[conversation originale](ChatGPT-Animer%20ce%20mod%C3%A8le-20261005-0242.md),
notamment les passages sur la DA finale, le salut de 5 secondes et l'audit V2.
Les annonces de l'ancienne conversation ne remplacent pas les tests dans Blender.

## Objectif du premier livrable

Une animation de **5 secondes** : Lemegeton regarde la camera, leve un bras,
fait un petit coucou et revient au repos, dans un environnement simple.

- Conserver les proportions chibi, la silhouette Minitel et les materiaux de reference.
- Ecran CRT bombe, noir et eteint pendant ce premier plan ; aucun visage lumineux.
- Exactement **3 doigts + 1 pouce opposable par main**.
- Aucun cable entre tete et corps ; tete et antenne independantes.
- Epaule boule, coude articule, anneau de poignet rotatif, pieces mecaniques rigides.
- Pieds poses au sol, sans marche ni glissement pendant le salut.
- Camera fixe de trois quarts face, personnage entier visible.
- Lumiere blanche neutre/froide, autour de 6000 K comme dans le brief.

Le bras extensible spirale, les expressions CRT, le clavier anime et la marche
sont des extensions ulterieures, apres validation du premier salut.

## Etat de depart et points a corriger

Plusieurs `.blend` de travail sont maintenant presents. L'executable
`C:\Program Files\Blender Foundation\Blender 5.2\blender.exe` a servi aux
tests avec Blender 5.2.2. Les etapes 1 a 3 documentent la preparation historique :
ne pas regenerer la V3 pour reprendre. Son rig n'est pas valide pour la production.
Il n'est pas necessaire d'executer V1 puis V2 avant V3 : la V3 importe sa propre base GLB.

Mise a jour apres le premier lancement : la copie de travail dans
`04_BLENDER/00_BASE_V3/` a ete corrigee et son `.blend` genere avec Blender 5.2.2.
Utiliser cette copie existante pour la suite ; ne pas la remplacer par le package archive.

| Element | Ce que les fichiers actuels permettent de dire | Travail restant |
| --- | --- | --- |
| Source | Master GLB preserve dans `02_SOURCES_3D/` | Comparer visuellement les generations et confirmer le choix |
| Squelette de base | Rig V1 decrit avec 24 os et poids attribues par zones | Verifier les noms, poids et pivots sur le modele importe |
| Bras V3 | Script : IK sur `WRIST_L/R`, chaine de 2 os, poles de coude | Verifier quels os la chaine couvre et ajuster cibles, poles et axes |
| Jambes V3 | Script : IK sur `FOOT_L/R`, chaine de 1 os | Verifier la mobilite de la jambe ; adapter la chaine au squelette reel |
| Tete V3 | Contrainte Copy Rotation depuis `CTRL_HEAD` | Verifier espaces de rotation, axe et pose neutre |
| Doigts V3 | Os `CTRL_FINGER*` et `CTRL_THUMB*` crees | Aucun raccordement aux os deformants dans le script : a ajouter |
| Corps, racine, pieds | `CTRL_BODY`, `CTRL_ROOT`, `CTRL_FOOT_L/R` crees | Aucun pilotage direct des os correspondants configure : a raccorder |
| Ecran et cables | Proprietes `screen=OFF` et `head_cables=False` | Ces etiquettes ne modifient ni la geometrie ni les materiaux |
| Vue eclatee | Viewer deplace les objets mesh trouves | Separer les pieces et definir leurs directions ; un mesh unique ne devient pas un eclate mecanique |
| Animation | Le script V3 ne cree aucune action animee | Animer, cuire les mouvements et verifier l'export |

Les positions des controles sont codees en dur dans le script. Ne pas supposer
qu'elles correspondent a l'echelle et aux articulations du mesh importe.

## 0. Reprise apres redemarrage et essai PartField

### Diagnostic verifie le 5 octobre 2026

| Element | Observation locale | Consequence |
| --- | --- | --- |
| PC | SALOMON, Acer Nitro AN517-41, Windows 11 Famille | Privilegier Ubuntu WSL2 deja present |
| GPU | RTX 3070 Laptop, 8 192 MiB de VRAM, pilote 617.14 | Inference locale envisageable, non garantie pour toute entree |
| VRAM libre | Environ 5,8 Gio pendant le diagnostic | Fermer Blender et les autres applications GPU |
| CPU | Ryzen 7 5800H, 8 coeurs / 16 threads | Pretraitement et clustering locaux ; duree a mesurer |
| RAM | 32 Go installes, environ 10,5 Gio libres pendant le diagnostic | Liberer de la RAM avant le test |
| Disque C: | Environ 51 Gio libres pendant le diagnostic | Surveiller poids, caches et disque virtuel WSL |
| WSL | Ubuntu version 2 ; `nvidia-smi` fonctionne dans Ubuntu | Acces au GPU confirme ; PyTorch CUDA reste a tester |

Ces ressources libres sont des valeurs ponctuelles, a relever apres redemarrage.
Les 955 Go disponibles annonces dans Ubuntu concernent son disque virtuel :
ce n'est pas une preuve de 955 Go physiques disponibles sur C:.

**Estimation : test raisonnable sur ce PC, pas encore confirme par une inference.**
Le README ne donne pas de minimum officiel de VRAM. Ne pas presenter 8 Go
comme une exigence officielle, ni promettre un temps de calcul.
Aucun environnement PartField, poids ou resultat de segmentation n'a ete
installe/telecharge/produit lors de ce diagnostic.

### Installation et essai a effectuer

- [ ] Enregistrer les scenes ouvertes avant le redemarrage ; conserver les sources originales intactes.
- [ ] Apres redemarrage, fermer les applications gourmandes et relever RAM, VRAM et espace disque.
- [ ] Verifier WSL et son GPU : `wsl -l -v`, puis `wsl -d Ubuntu -- nvidia-smi`.
- [ ] Installer le depot dans un environnement Linux isole, sans modifier Python de Blender ni le Python systeme.
- [ ] Suivre le README officiel : Python 3.10, PyTorch 2.4, CUDA 12.4 et dependances ; noter le commit, les versions et chemins installes.
- [ ] Telecharger le modele preentraine Objaverse pour l'inference seulement ; aucun entrainement prevu.
- [ ] Tester `torch.cuda.is_available()` et une operation CUDA avant de charger le modele.
- [ ] Executer un exemple officiel pour distinguer probleme d'installation et probleme propre au personnage.
- [ ] Preparer une copie de `02_SOURCES_3D/Rusty Retrobot.glb`, sans rig ni animation et avec transformations coherentes.
- [ ] Simplifier une copie a **50 000-100 000 triangles** pour le premier essai : estimation prudente, pas une exigence officielle.
- [ ] Garder la haute definition, les UV et textures comme reference ; proteger silhouette, doigts et articulations lors de la simplification.
- [ ] Extraire les features puis effectuer le clustering avec les commandes du depot ; comparer plusieurs niveaux de decomposition.
- [ ] En cas de manque de VRAM, essayer `n_point_per_face=500`, comme propose dans le README, puis une entree plus legere si necessaire.
- [ ] Consigner taille d'entree, parametres, duree, pic RAM/VRAM et erreurs, separement pour inference et clustering.
- [ ] Importer les resultats dans une scene Blender dediee ; comparer face/profil/dos/trois quarts a la source.

Dossiers proposes, a creer lors du test : `04_BLENDER/PARTFIELD_TEST/` pour les
copies Blender et `05_EXPORTS/PARTFIELD_TEST/` pour entrees simplifiees, sorties,
captures et journal. Garder depot, environnement et poids hors des sources
originales ; documenter le stockage choisi et ses chemins reels.

### Validation et suite dans Blender

Ordre obligatoire : **separation -> reconstruction des raccords -> validation
des pieces/pivots -> rig -> animation -> rendu/export -> viewer**.
PartField aide a segmenter : il ne fournit pas a lui seul les surfaces cachees,
les bons pivots mecaniques ou un rig utilisable.

- [ ] Verifier que tete, corps, bras, avant-bras, mains, jambes et pieds sont lisibles et corrigibles sans degrader la silhouette.
- [ ] Verifier les 3 doigts et le pouce de chaque main : une segmentation globale satisfaisante ne suffit pas.
- [ ] Conserver un comparatif source/resultat et decider si l'assistance fait reellement gagner du travail.
- [ ] Si utile, corriger les selections, separer les pieces puis reconstruire les raccords dans Blender (etape 4).
- [ ] Pour reporter les regions de la copie simplifiee sur le master, definir et verifier un transfert de labels ; il n'est pas encore implemente.
- [ ] Si les frontieres sont mauvaises ou les ressources insuffisantes, reprendre la separation manuelle sur la source texturee.
- [ ] Ne pas creer automatiquement un os par region : definir d'abord articulations, axes, pivots et amplitudes.
- [ ] Valider les ouvertures reconstruites, UV/materiaux, intersections et mouvements independants avant de poursuivre aux etapes 5 a 8.

La source garde environ **1,35 million de triangles** et une seule surface
connectee. `Separate > By Loose Parts` n'isole donc pas les pieces fonctionnelles.
Les 15 objets existants sont une partition spatiale provisoire, avec raccords
ouverts et mains en blocs, pas une decomposition mecanique validee.
Ne pas poursuivre l'animation tant que geometrie, doigts et pivots ne sont pas valides.

### Depots candidats et references

- [PartField - nv-tlabs](https://github.com/nv-tlabs/PartField) : premier essai pour assister la segmentation ; versions et repli d'echantillonnage dans le README.
- [Hunyuan3D-Part - Tencent](https://github.com/Tencent-Hunyuan/Hunyuan3D-Part) : piste segmentation P3-SAM / completion X-Part ; ressources et fidelite au design a evaluer separement.
- [HoloPart - VAST](https://github.com/VAST-AI-Research/HoloPart) : piste de completion des pieces presegmentees, pas de rig automatique.
- [mesh_segmentation - kugelrund](https://github.com/kugelrund/mesh_segmentation) : segmentation spectrale dans Blender ; dependances et compatibilite Blender 5.2 non testees.

Aucun de ces outils n'est valide localement sur Lemegeton. PartField est un
depot de recherche, pas un plugin Blender deja configure. Preferer Linux :
l'environnement fourni est Linux et un probleme NCCL sous Windows natif est
signale dans [l'issue 13](https://github.com/nv-tlabs/PartField/issues/13).

## 1. Preparer un espace Blender de travail

Ces preparations historiques sont deja effectuees ; reprendre d'abord l'etape 0.

- [ ] Garder `02_SOURCES_3D/` et `03_RIGS/` comme bases conservees.
- [ ] Copier le package V3 complet vers `04_BLENDER/00_BASE_V3/`.
- [ ] Prevoir `05_EXPORTS/` pour les GLB animes et rendus valides.

Depuis PowerShell, a la racine du projet, pour la premiere preparation :

```powershell
New-Item -ItemType Directory -Path .\04_BLENDER -ErrorAction Stop
Copy-Item -LiteralPath .\03_RIGS\LEMEGETON_RIG_V3 -Destination .\04_BLENDER\00_BASE_V3 -Recurse -ErrorAction Stop
New-Item -ItemType Directory -Path .\05_EXPORTS -ErrorAction Stop
```

Ces commandes sont a executer une seule fois, sur des destinations absentes.
Si ces dossiers existent deja, verifier leur contenu et reprendre la copie
de travail existante. Conserver les GLB a cote du script dans la copie.

## 2. Generer et ouvrir le Blender V3

Le `.blend` est maintenant disponible dans `04_BLENDER/00_BASE_V3/`.
La commande ci-dessous permet de le regenerer, mais n'est plus necessaire
pour commencer l'inspection. Elle remplacerait ce fichier.

- [ ] Lancer la construction depuis PowerShell avec le Python integre de Blender.

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --python-exit-code 1 --python '.\04_BLENDER\00_BASE_V3\BLENDER_BUILD_RIG_V3.py'
```

Le script remet la scene a zero, importe `LEMEGETON_RIGGED_V3_BASE.glb`,
cree les controles et enregistre a cote de lui `LEMEGETON_RIG_V3.blend`.
Une nouvelle execution remplace ce fichier : sauvegarder les retouches sous
un autre nom avant de relancer. Ne pas lancer le builder dans une scene en cours de travail.

### Corrections appliquees dans la copie de travail

- Le GLB original declare des bufferViews de 1 261 536 octets pour les attributs
  JOINTS_0 et WEIGHTS_0, alors que chacun exige 5 046 144 octets. Cela provoque
  `ValueError: buffer is smaller than requested size` pendant l'import Blender.
- `repair_v3_glb.py`, appele par le builder, genere
  `LEMEGETON_RIGGED_V3_BASE_IMPORT_FIXED.glb` en corrigeant uniquement ces deux
  tailles. Le contenu binaire, la geometrie, les poids et les autres metadonnees
  sont conserves ; un rapport `.repair.json` accompagne ce fichier.
- L'appel invalide `bpy.ops.armature_add(...)` a ete remplace par
  `bpy.ops.object.armature_add(...)` dans le builder de travail.

Les fichiers historiques dans `03_RIGS/` restent inchanges. L'erreur generale
`script failed` se lit avec le traceback qui la precede dans le terminal.

- [ ] Verifier la fin du journal : message `Saved`, absence de traceback et code de sortie 0.
- [ ] Ouvrir `04_BLENDER/00_BASE_V3/LEMEGETON_RIG_V3.blend` dans Blender.
- [ ] Faire immediatement **Save As** vers `04_BLENDER/LEMEGETON_01_AUDIT.blend`.

Pour inspecter manuellement sans executer le builder : dans une scene neuve,
utiliser **File > Import > glTF 2.0** et choisir le GLB de base V3. Cela importe
le modele et son squelette, mais ne construit pas les controles Blender.

Eviter de copier le script dans un bloc texte anonyme : il utilise `__file__`
pour trouver ses ressources. Le lancement ci-dessus fournit son chemin reel.
Les [options de lancement Blender](https://docs.blender.org/manual/en/4.0/advanced/command_line/arguments.html)
documentent `--python` et `--python-exit-code`.

## 3. Auditer le modele et le rig avant toute animation

- [ ] Comparer face, profil, dos et trois quarts aux images de `01_REFERENCES/`.
- [ ] Verifier textures, ecran noir, nombre de doigts, absence de cables et symetrie.
- [ ] Inspecter l'echelle, l'orientation, les transformations et la densite du mesh.
- [ ] Verifier les objets `LEMEGETON_RIG_V3` et `LEMEGETON_ANIM_CONTROLS` dans l'Outliner.
- [ ] Sur le rig deformant, controler le modificateur Armature et les groupes de sommets.
- [ ] Relever les pivots et poids incorrects, avec captures de face et profil.

Pour tester les controles : selectionner **LEMEGETON_ANIM_CONTROLS**, passer
en **Pose Mode**, puis selectionner l'os `CTRL_...` voulu. Les os `CTRL_...`
appartiennent a cette armature distincte, pas a `LEMEGETON_RIG_V3`.

| Test | Geste | Resultat a verifier |
| --- | --- | --- |
| Tete | Petite rotation de `CTRL_HEAD` | Tete seule, cou en place, corps intact |
| Bras | Petit deplacement de `CTRL_ARM_L_IK`, puis R | Chaine anatomique correcte, main attachee, aucune torsion du corps |
| Coude | Deplacer `CTRL_ELBOW_L_POLE`, puis R | Flexion stable, pas de retournement |
| Jambe | Petit deplacement de `CTRL_LEG_L_IK`, puis R | Jambe et pied suivent de facon coherente |
| Doigt | Rotation de chaque `CTRL_FINGER*` et `CTRL_THUMB*` | Echec attendu tant que le raccordement manque : noter puis corriger |
| Racine et corps | Deplacer `CTRL_ROOT` et `CTRL_BODY` | Verifier si le personnage suit ; ajouter le pilotage manquant |
| Pied | Rotation de `CTRL_FOOT_L/R` | Ajouter le raccordement si le pied ne suit pas |

Revenir a la pose neutre entre les essais (effacer les transformations de pose
des os testes). Ne pas passer a l'animation si la pose de repos est deja deformee.

**Livrable :** `LEMEGETON_01_AUDIT.blend` et une liste de corrections observees.

## 4. Nettoyer et separer les pieces mecaniques

- [ ] Travailler dans `04_BLENDER/LEMEGETON_02_GEOMETRIE.blend`.
- [ ] Separer tete/CRT, antenne, corps/clavier, bras, avant-bras, mains et doigts, jambes et pieds.
- [ ] En Edit Mode, utiliser la selection de geometrie liee puis **Separate > Selection** quand les pieces sont identifiables.
- [ ] Si des articulations sont fusionnees, nettoyer ou reconstruire localement la geometrie.
- [ ] Corriger normales, intersections et trous ; conserver les UV et materiaux utilisables.
- [ ] Alleger les pieces trop denses ou faire une retopologie, en protegeant doigts, articulations et silhouette.
- [ ] Garder le master haute definition comme reference pour les textures et details.

Ne pas assimiler **Separate > By Loose Parts** a une separation par fonction :
cela peut produire des fragments ou laisser des pieces fusionnees.
Les os existants ne creent pas un doigt manquant dans la geometrie.

**Validation :** chaque piece prevue tourne sans entrainer des sommets du voisin.

## 5. Finaliser les pivots, poids et controles

- [ ] Enregistrer `04_BLENDER/LEMEGETON_03_RIG_VALIDE.blend`.
- [ ] Placer les pivots sur les vraies articulations ; verifier axes et orientation des os.
- [ ] Pour chaque piece rigide, attribuer ses sommets a l'os correspondant avec poids 1 et retirer les influences parasites.
- [ ] Replacer les cibles IK et poles selon la geometrie reelle, puis verifier longueurs de chaine et angles de pole.
- [ ] Raccorder racine, corps, pieds, doigts et pouces a leurs controles avec des contraintes adaptees.
- [ ] Regler espaces local/pose, decalages et limites mecaniques ; garder une pose de repos stable.
- [ ] Controler l'antenne independamment ; ajouter son controle si necessaire.
- [ ] Desactiver la deformation des os de controle qui ne doivent pas influencer le mesh.
- [ ] Refaire tous les tests de l'etape 3 sur les deux cotes et verifier le retour au repos.

Ne pas relancer le builder pour conserver les corrections manuelles : repartir
du `.blend` valide pour la suite. Une vue eclatee demandera des groupes de pieces
et un pilotage dedie ; `exploded_amount` seul ne fournit aucun mouvement dans Blender.

**Validation :** mains a quatre doigts independants, pas de deformation elastique,
aucun decrochage et controles utilisables sur toute l'amplitude du salut.

## 6. Animer le coucou de 5 secondes

- [ ] Creer `04_BLENDER/LEMEGETON_04_WAVE.blend` depuis le rig valide.
- [ ] Regler 24 images/seconde et la plage de rendu 1 a 120 (120 images = 5 secondes).
- [ ] Creer une action nommee `wave` sur les controles ; poser les cles de mouvement.

| Images indicatives | Mouvement |
| --- | --- |
| 1-12 | Pose calme, leger regard vers la camera |
| 13-36 | Lever le bras et plier le coude |
| 37-84 | Deux petits mouvements de salut au poignet, doigts lisibles |
| 85-108 | Baisser doucement le bras |
| 109-120 | Retour au repos |

- [ ] Garder les pieds fixes et le corps rigide ; verifier les contacts et intersections.
- [ ] Ajuster les courbes pour une inertie mecanique douce, sans gestes brusques.
- [ ] Faire un apercu de toute la sequence avant de lancer le rendu final.
- [ ] Ajouter ensuite, dans des actions separees, `idle` et `head_look` si utile.

## 7. Rendre et exporter

- [ ] Creer une scene simple : sol, ombres douces, camera fixe de trois quarts, cadrage entier.
- [ ] Garder l'ecran eteint et verifier les reflets sans emission lumineuse.
- [ ] Rendre d'abord quelques images tests, puis les 120 images vers `05_EXPORTS/WAVE_FRAMES/`.
- [ ] Assembler la sequence en `05_EXPORTS/LEMEGETON_WAVE_5S.mp4`.
- [ ] Sauvegarder une copie `04_BLENDER/LEMEGETON_05_EXPORT.blend` pour le bake.
- [ ] Cuire les transformations visuelles sur les os deformants a chaque image, puis verifier le resultat sans dependance aux controles.
- [ ] Exporter mesh, materiaux, squelette deformant et action `wave` en `05_EXPORTS/LEMEGETON_WAVE.glb`.
- [ ] Verifier les options d'animation et d'echantillonnage de l'exporteur de la version installee.

Conserver les contraintes et controles dans le fichier de travail. Dans la
copie d'export, les mouvements cuits doivent pouvoir se rejouer sans eux.
L'export glTF conserve les mouvements echantillonnes ; le pilotage IK Blender
doit etre traduit en animation. La [documentation glTF Blender](https://docs.blender.org/manual/en/5.3/addons/scene_gltf2.html)
detaille les options de bake/export ; les libelles peuvent varier selon la version.

## 8. Verifier les livrables et preparer le viewer final

- [ ] Reimporter le GLB exporte dans une scene Blender neuve.
- [ ] Verifier l'action `wave`, sa duree, textures, quatre doigts, pieds fixes et pose finale.
- [ ] Tester dans un lecteur glTF capable de lire les animations et relever les erreurs de console.
- [ ] Comparer le mouvement exporte au `.blend` et au rendu video.
- [ ] Tester aussi les viewers existants via leur `WEB_VIEWER/START_VIEWER.bat`, un a la fois (port 8000).
- [ ] Pour le viewer final, creer une copie dediee et charger le nouvel export.
- [ ] Ajouter la lecture des clips avec `AnimationMixer` : le viewer V3 actuel ne lit aucune animation.
- [ ] Ajouter une vraie vue eclatee par pieces, puis tester bureau et mobile.

Le viewer actuel utilise le GLB de base fourni ; il ne recharge pas les modifications
du `.blend`. Ses boutons tournent directement des os, sans executer les contraintes
IK Blender. Son message de chargement affiche un nombre d'os fixe : verifier la
structure reelle du GLB avant de le prendre comme preuve.

**Termine quand :** `.blend` de travail valide, GLB anime reimporte sans regression,
video de 5 secondes conforme au brief et verification visuelle des livrables.

## 9. Extensions apres le premier salut

- [ ] Variante de bras spirale extensible, sans changer le design de base.
- [ ] Ecran/visage anime independamment, dans une version distincte du brief ecran OFF.
- [ ] Touches du clavier et boutons independants.
- [ ] Cycle de marche avec contacts au sol, puis reactions et autres poses.
- [ ] Optimisation et integration temps reel selon la cible retenue (web ou moteur).

## Journal de session

Passation du 6 octobre : lire [PASSATION_AGENTS.md](PASSATION_AGENTS.md) et
[AUDIT_GLOBAL.md](08_AUDIT/AUDIT_GLOBAL.md). Neuf controles techniques passes,
51 sources historiques intactes ; 6 tests unitaires et 12 tests navigateur Web.
Les nouvelles preuves ne valident pas artistiquement la video du personnage.
Le ZIP verifie et son manifeste sont references dans `09_SAUVEGARDES/LATEST.json`.

A remplir apres les essais, pour garder les validations distinctes des intentions.

| Date | Fichier / etape | Test effectue | Resultat observe | Suite |
| --- | --- | --- | --- | --- |
| 2026-10-05 | Generation Blender V3 corrigee | Execution du builder dans Blender 5.2.2, puis reouverture du fichier | Code de sortie 0 ; 24 os deformants, 19 controles, 5 contraintes ; mesh de 1 261 536 sommets et 1 354 718 triangles | Faire Save As puis commencer l'audit visuel, etape 3 |
| 2026-10-05 | Audit des sources | Rendus face/profil/dos/trois quarts et analyse de connexite | Rusty Retrobot conserve les trois textures ; une surface fusionnee ; os V3 superposes | Repartir de la source texturee dans l'atelier V4 |
| 2026-10-05 | Atelier a pieces V4 | Rigidite, pieds fixes et retour au repos testes | 15 objets ; erreur de longueur des aretes inferieure a 0,000001 m ; pieds fixes | Corriger les frontieres de coupe et segmenter les doigts |
| 2026-10-05 | Etude wave et export | Cuisson puis reimportation GLB a trois instants | Une animation de 5 s ; 15 meshes, 24 articulations, 3 textures ; ecart de bornes inferieur a 0,000001 m | Valider les articulations et preparer le viewer final |
| 2026-10-05 | Video d'etude | Assemblage des PNG et relecture du MP4 avec Blender | 120 images, 24 i/s, 720 x 720 ; cinq secondes | Examiner les raccords avant un rendu final |
| 2026-10-05 | Retour sur la video | Avis du porteur du projet | Video insatisfaisante ; aucune validation artistique | Reprendre la geometrie avant le rig et l'animation |
| 2026-10-05 | Faisabilite PartField | Diagnostic materiel et acces GPU WSL2, lecture du depot | RTX 3070 Laptop 8 Go, RAM 32 Go, Ubuntu WSL2 GPU fonctionnel ; aucune inference | Apres redemarrage, suivre l'etape 0 sur une copie simplifiee |

Ces tests utilisent Blender en arriere-plan et des rendus inspectes visuellement.
Les frontieres des pieces, les pivots, les doigts et le mode IK restent a valider
pour une version finale ; la manipulation interactive et la lecture navigateur
ne sont pas encore testees.
