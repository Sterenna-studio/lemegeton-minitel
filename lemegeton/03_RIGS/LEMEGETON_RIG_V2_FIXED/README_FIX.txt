Correction V2
- L'erreur JS `Cannot create property onclick on boolean false` est corrigée : le viewer utilise maintenant des références DOM explicites.
- Le GLB V2 a été ré-encodé avec des bufferViews glTF compactes sans byteStride problématique.
- Le nouveau viewer charge `LEMEGETON_RIGGED_V2.glb`.
- Utiliser START_VIEWER.bat, pas file://.
