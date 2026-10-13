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
`README.md`). Le corpus reste sur le poste, pour trois raisons :

- c'est l'œuvre de tiers, sans licence de réutilisation affichée par Goto10 ;
  le dépôt public la redistribuerait ;
- environ 490 Mo, qui resteraient pour toujours dans l'historique Git ;
- des exécutables et des virus DOS, que GitHub encadre dans un dépôt public.

Le site n'en sert rien : `docs/` n'entre pas dans le build Vite.

## Demande : consulter Goto10 depuis les terminaux du musée

Demande de l'utilisateur (13 et 14 octobre 2026) : rendre ces documents
consultables depuis les terminaux Vidéotex du musée, de préférence en consultant
**Goto10 lui-même** plutôt qu'une copie.

Constat du 14 octobre 2026 : Goto10 ne renvoie pas d'en-tête CORS, une page du
musée ne peut donc pas lire ses fichiers directement depuis le navigateur. Pistes,
de la plus simple à la plus complète :

1. **Rubrique de renvoi** dans le 3615 du musée (page ARCHIVES) : les grandes
   sections de Goto10 (BBS, Fidonet, Minitel, fichiers texte…) avec, pour chacune,
   un lien qui ouvre la page de Goto10. Aucun contenu copié.
2. **Lecture à la demande par un relais** sur l'hébergement OVH du site : le relais
   lit une page texte de Goto10, le terminal l'affiche en Vidéotex (40 colonnes,
   pages suivantes avec SUITE). Contenu non stocké, mais trafic vers Goto10 et
   source citée sur chaque page ; à faire avec l'accord de Frédéric Cambus.
3. **Sélection convertie en pages Vidéotex** et publiée dans le musée : textes
   choisis, sans exécutables, provenance sur chaque page. Redistribution : seulement
   avec l'accord écrit de l'auteur de Goto10.

Rien de cela n'est encore fait ; le choix reste à arrêter.
