# Archive documentaire Minitel et BBS

## Origine

Ce dossier accueille, **en local uniquement**, un instantané de l'archive
[Goto10 — (French) BBS and Minitel Archives](https://www.goto10.fr/), tenue par
Frédéric Cambus : documents BBS, Fidonet, logiciels et ressources Minitel. La page
d'accueil de Goto10 propose aussi l'archive complète (`allfiles.tar.gz`).

Inventaire vérifié le 13 octobre 2026 : 6 623 fichiers, 489 953 069 octets. Le
`README` d'origine indique une mise à jour au 30 juin 2026. Le corpus comprend des
exécutables DOS `.exe`/`.com` et un dossier `virus/` : conservés à titre documentaire,
ils ne doivent pas être lancés.

## Ce qui est publié

Seul ce `README` est versionné (`.gitignore` : `docs/archive_minitel/*`, sauf
`README.md`). Le corpus complet reste sur le poste, pour trois raisons :

- c'est l'œuvre de tiers, sans licence de réutilisation affichée par Goto10 ;
  seule la sélection ci-dessous est publiée, avec l'accord de son auteur ;
- environ 490 Mo, qui resteraient pour toujours dans l'historique Git ;
- des exécutables et des virus DOS, que GitHub encadre dans un dépôt public.

Le site n'en sert rien directement : `docs/` n'entre pas dans le build Vite.

## Consultation depuis les terminaux : le 3615 GOTO10

Demande de l'utilisateur (13 et 14 octobre 2026) : rendre ces documents
consultables depuis les terminaux Vidéotex du musée. **Accord de Frédéric
Cambus** pour cette sélection : déclaré par l'utilisateur le 14 octobre 2026
(l'échange n'a pas été vu par l'agent).

Goto10 ne renvoie pas d'en-tête CORS : une page du musée ne peut pas lire ses
fichiers en direct. Le musée publie donc une **sélection** préparée par
`tools/build_goto10.mjs` dans `public/goto10/` (environ 2,4 Mo) :

- 28 écrans Vidéotex d'origine (`.vdt`, octet pour octet) : serveur Pinky
  (accueil, sommaire, forums de 1988), Ellis, guide Télétel 1992, photos RTE et
  AFP du Vidéotex photographique, flashcode et QR code ;
- une centaine de documents texte (articles, annuaire des services Télétel,
  Gigantex, aide sur la norme Vidéotex, ProTrans), décodés (CP437 ou Latin-1)
  et coupés en lignes de 40 colonnes.

Rien d'autre : ni exécutables, ni virus, ni archives, ni images hors Vidéotex.
Le service `src/goto10/service.ts` les affiche sur l'écran des terminaux
(touche 4 du sommaire de 3615 LEMEGETON, ou le code `GOTO10` puis Envoi) ;
le décodeur `src/videotex/decoder.ts` lit les écrans comme un Minitel, photos
JPEG du Vidéotex photographique comprises. Les caractères DRCS (redéfinis par
un service) restent approchés : des hachures grises.

Pour refaire la sélection après une mise à jour de l'archive :
`node tools/build_goto10.mjs`, puis relancer le serveur de développement
(empreintes des fichiers de `public/`).
