# Lemegeton - reprise apres l'audit Blender

Travail du 5 octobre 2026. Les sources et la copie d'audit que tu avais
enregistree dans `04_BLENDER/00_BASE_V3/` sont conservees.

**Reprise apres redemarrage :** voir l'etape 0 de
[PIPELINE_TRAVAIL.md](PIPELINE_TRAVAIL.md) pour le diagnostic materiel et le
plan de test PartField sous Ubuntu WSL2. La video d'etude est jugee
insatisfaisante ; reprendre la separation et la reconstruction de la source
texturee avant le rig et l'animation. PartField n'a pas encore ete installe
ni teste sur le personnage.

## Fichiers a ouvrir

- `04_BLENDER/LEMEGETON_02_ATELIER_V4.blend` : modele texture a l'echelle,
  scene de studio, squelette et controles ; mesh encore fusionne.
- `04_BLENDER/LEMEGETON_03_PIECES_PROVISOIRES.blend` : atelier avec les regions
  separees en 15 objets rigides. C'est le point de depart pour corriger les raccords.
- `04_BLENDER/LEMEGETON_04_WAVE_PIECES_ETUDE.blend` : etude du salut pilotee
  par les controles, 120 images a 24 images/seconde.
- `04_BLENDER/LEMEGETON_05_EXPORT_ETUDE.blend` : copie avec le mouvement cuit
  sur le squelette, destinee a l'export de l'etude.

Avant une retouche manuelle, faire **Save As** sous un nouveau nom, par exemple
`04_BLENDER/LEMEGETON_03_PIECES_MANUEL.blend`. Les scripts regenerent leurs
fichiers de sortie et ne doivent pas ecraser un travail retouche.

## Ce que l'audit a etabli

La base V3 fournie n'etait pas utilisable comme rig de production : dans Blender,
les 24 os importes etaient superposes a l'origine et le mesh avait une echelle
incoherente avec les controles. Les matrices de liaison du GLB contiennent des
translations dans une disposition incorrecte pour glTF. La correction des tailles
de bufferViews permettait l'import, mais ne corrigeait pas ces defauts de rig.

Le master nomme `LEMEGETON_MASTER_SOURCE.glb` ne contient ni UV ni images.
`Rusty Retrobot.glb` conserve une geometrie aux memes dimensions et nombre de
triangles, avec une UV et trois images de 2048 x 2048. Les rendus face/profil/dos
et trois quarts montrent qu'il conserve l'apparence de Lemegeton : c'est la base
retenue pour cet atelier. L'autre `sample_...glb` est une generation distincte.

Le modele texture forme **une seule surface connectee**, apres rapprochement
des sommets coincidents pour l'analyse uniquement. Une separation par morceaux
non lies ne fournit donc pas les articulations attendues.

Les rapports et 12 rendus de comparaison sont dans `05_EXPORTS/AUDIT_SOURCES/`.
Le fichier `TOPOLOGY_AUDIT.json` documente l'analyse de connexite.

## Ce qui est prepare

- Modele ramene a une hauteur de 2 metres, origine centree, pieds au sol.
- Trois textures embarquees dans les `.blend`, avec UV conservees.
- Squelette de 24 os repositionne et 28 controles sans deformation propre.
- Controles FK raccordes aux os deformants, racine et corps compris.
- IK de bras experimental, desactive par defaut (`ik_arm_L/R = 0`).
- Scene avec camera fixe de trois quarts, sol et lumiere blanche neutre.
- Regions rigidifiees par poids 1 ; chaque face de la source est affectee a une region.
- Etude de salut, copie cuite et export GLB de travail.

La premiere tentative de poids rigides sur le mesh fusionne etirait les triangles
aux changements de region. L'etude `LEMEGETON_04_WAVE_ETUDE.blend` conserve ce
diagnostic ; preferer `LEMEGETON_04_WAVE_PIECES_ETUDE.blend` pour le mouvement.

## Ce qui reste a faire pour une version finale

1. **Revoir les decoupes et les pivots** sur les articulations reelles. La partition
   actuelle suit des regions spatiales estimees ; ce ne sont pas des pieces mecaniques validees.
2. **Reconstruire les raccords internes et boucher les ouvertures** aux epaules,
   coudes, poignets, cou, hanches et pieds. Les frontieres de coupe sont conservees
   pour cette correction ; un bouchage global automatique ne donne pas un resultat fiable.
3. **Separer les 3 doigts et le pouce de chaque main** et leur attribuer leurs poids.
   Les controles de doigts sont raccordes au squelette mais ne pilotent encore
   aucune geometrie : les mains de l'etude se deplacent comme un bloc.
4. **Valider les poles et les limites IK**. Pour travailler simplement en FK,
   conserver les proprietes `ik_arm_L/R` a zero.
5. **Optimiser la geometrie** apres validation des pieces. Le modele garde environ
   1,35 million de triangles ; ce n'est pas encore un asset leger pour le web.
6. Refaire le salut sur le rig corrige, puis valider rendu, export et lecture navigateur.

Dans Blender, selectionner `LEMEGETON_CONTROLES_V4`, passer en Pose Mode et
manipuler `CTRL_SHOULDER_R`, `CTRL_ELBOW_R`, `CTRL_WRIST_R`, `CTRL_HEAD`, etc.
La collection `SOURCE_REFERENCE_2M` conserve une reference sans rig ; elle est
masquee dans le viewport et dans le rendu. La geometrie fusionnee de travail
reste egalement presente et masquee dans le fichier a pieces.

## Apercus et preuves

Les rendus et rapports de l'atelier sont dans `05_EXPORTS/ATELIER_V4/`.
`VERIFICATION_ATELIER.json` mesure la rigidite, les pieds fixes et le retour au repos.
`BAKE_VERIFICATION.json` compare les poses avant et apres cuisson.
`EXPORT_VERIFICATION.json` confirme la reimportation des 15 meshes, du skin a
24 articulations, des trois textures et de l'animation de cinq secondes.
Les bornes des pieces a trois instants retrouvent celles du `.blend` avec un
ecart inferieur a un millionieme de metre, en compensant le depart glTF a t=0
(image 0 apres import dans Blender, contre image 1 dans le fichier de travail).
Les fichiers `LEMEGETON_WAVE_ETUDE.mp4` et `LEMEGETON_WAVE_ETUDE.glb` sont
des etudes : les decoupes et les doigts restent a finaliser.

La generation et les verifications utilisent Blender en arriere-plan. Les images
rendees ont ete inspectees ; la manipulation interactive et la lecture dans un
navigateur restent des validations distinctes a effectuer.

## Scripts de reprise

Depuis la racine, utiliser l'executable Blender avec `--background
--python-exit-code 1 --python` puis le chemin du script :

| Script dans `04_BLENDER/scripts/` | Fonction |
| --- | --- |
| `audit_sources.py` | Comparer et rendre les trois sources distinctes |
| `inspect_topology.py` | Analyser les surfaces connectees du modele texture |
| `build_workshop.py` | Regenerer l'atelier et ses pieces provisoires |
| `verify_workshop.py` | Verifier les pieces rigides et les pieds fixes |
| `export_wave_study.py` | Cuire, exporter et rendre les 120 images de l'etude |
| `verify_export.py` | Reimporter le GLB et comparer le mouvement au `.blend` |
| `assemble_video.py` | Assembler les PNG en MP4 avec l'encodeur integre a Blender |

Les pivots et les regles de partition se trouvent dans `build_workshop.py`.
`PIVOTS_PROVISOIRES.json` en conserve les valeurs pour l'audit ; le script ne
relit pas ce JSON comme configuration.
