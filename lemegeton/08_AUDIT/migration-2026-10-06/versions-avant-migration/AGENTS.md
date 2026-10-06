# Instructions pour les prochains agents

Commencer par `PASSATION_AGENTS.md`, `08_AUDIT/AUDIT_GLOBAL.md`, puis le README
du sous-projet concerne. Ce dossier n'est pas un depot Git actuellement.
Ne pas supposer un historique Git, une publication ou une sauvegarde distante.

## Preservation

- Sources originales dans `01_REFERENCES`, `02_SOURCES_3D`, `03_RIGS`, `06_MODEL` : ne pas ecraser, deplacer ni supprimer sans demande explicite.
- `TRI_MANIFEST.csv` contient les SHA-256 des 51 fichiers initiaux. Les nouveaux assets sont inventories dans `07_WEB_MINITEL/docs/asset-audit/inventory.json`.
- Conserver les scenes Blender retouchees par l'utilisateur, leurs `.blend1` et les anciennes etudes. Faire Save As avant toute regeneration.
- Les builders remplacent leurs sorties : lire le script et identifier les chemins avant lancement. Ne pas lancer un builder dans une scene interactive non sauvegardee.
- Les sauvegardes dans `09_SAUVEGARDES` sont locales, sur le meme disque. Ne pas les publier ni les supprimer automatiquement.
- Ne pas modifier les memoires externes de l'utilisateur. Les documents de passation dans ce projet sont le contexte durable.

## Frontieres

- Personnage Lemegeton : partition et rig experimentaux, pas de production validee. La video actuelle a ete rejetee. Geometrie, doigts et pivots avant animation.
- PartField : faisabilite examinee, GPU WSL2 verifie au 5 octobre ; aucune installation/inference encore validee. Refaire les controles materiels avant essai.
- Web Minitel : application React/TS autonome dans `07_WEB_MINITEL`, source texturee fournie, moteur generique dans `src/videotex`. Garder Lemegéton dans `src/demo`.
- `white_mesh.glb` est un nouvel asset non valide. Ne pas remplacer automatiquement le GLB actif par ce fichier.

## Validation Web

Depuis `07_WEB_MINITEL` : `npm ci`, `npm run typecheck`, `npm run lint`,
`npm test`, `npm run build`. Pour les tests navigateur : serveur dev sur 5174,
puis `npm run test:browser` (Edge installe). `node tools/verify_production.mjs`
cree puis arrete son propre serveur de preview sur un port libre.
Ne pas arreter le serveur d'un autre projet : 5173 etait deja occupe.

Reutiliser les outils locaux et le lockfile. Dans cet environnement Windows,
esbuild et Edge peuvent necessiter l'autorisation de sortir du bac a sable ;
ne pas confondre un refus de permission avec un bug applicatif.
Modifier manuellement avec apply_patch, ne pas utiliser de contournements `any`.
Limiter les changements au sujet choisi et ajouter des tests de regression.

Mettre a jour preuves et passation apres une session. Distinguer tests unitaires,
Blender batch, navigateur reel, viewport mobile emule et appareil physique.
Ne pas annoncer un test de flux VDT, de serveur, de protocole, de materiel ou une
validation artistique sans preuve correspondante. Aucune publication sans accord.
