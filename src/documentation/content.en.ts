import type { DocContent, Fact } from "./content";

// English content of the Documentation page (translated from content.fr.ts,
// the reference ; keep the same order and the same ids).

const minitelAsset: Fact[] = [
  { label: "File", value: "models/minitel.glb · 0.86 MB (KTX2 + meshopt)" },
  { label: "Geometry", value: "71 meshes · 21,943 triangles" },
  { label: "Textures", value: "11 original images (32 to 1024 px), compressed to KTX2" },
  { label: "Source model", value: "Minitel 1982-France, okotaru · CC BY 4.0" },
  { label: "Preparation", value: "tools/prepare_model.py: orientation, scale, extracted screen" },
  { label: "Display", value: "set on a side table (Wood Drawer & Tables Set, brandon_grey · CC BY 4.0)" },
];

export const contentEn: DocContent = {
  views: [
    { id: "trois-quarts", label: "Three-quarter" },
    { id: "face", label: "Front" },
    { id: "profil", label: "Side" },
    { id: "dos", label: "Back" },
  ],
  modelDocs: [
    {
      id: "terminatel-255",
      title: "Terminatel 255",
      kicker: "Telic Alcatel · limited black marble series",
      intro: [
        "A Telic Alcatel Videotex terminal, in a black marble finish veined with gold and grey. The reference photos show a cathode-ray screen in its own case, with a separate keyboard. A telephone handset rests on that keyboard.",
        "In the 3D terminal, this finish is interpreted on the Minitel 1 geometry: procedural marble on the case, charcoal keys. The shape remains the Minitel 1's: no 3D model of the Terminatel is available.",
      ],
      facts: [
        { label: "Markings", value: "TERMINATEL 255 (front), TELIC ALCATEL (keyboard and case)" },
        { label: "Finish", value: "black marble, sand-gold and grey veins" },
        { label: "Keyboard", value: "separate, charcoal keys with cream legends, handset rest" },
        { label: "Connections", value: "cables at the back, blue box" },
      ],
      asset: [
        ...minitelAsset.slice(0, 3),
        { label: "3D finish", value: "matte procedural marble (src/demo/marble.ts), no photograph used" },
        minitelAsset[5],
        minitelAsset[3],
      ],
      note: "No public source was found on this model (search of 6 October 2026). This information comes only from the reference photos and remains to be confirmed.",
    },
    {
      id: "minitel-1",
      title: "Minitel 1",
      kicker: "Videotex terminal · France, 1982",
      intro: [
        "The Minitel gave access to the Teletel services over the telephone line. After trials in Saint-Malo and then in Ille-et-Vilaine in 1980 and 1981, it was handed out to subscribers from 1982.",
        "Three manufacturers made it: Matra, La Radiotechnique (Philips) and Telic-Alcatel. The service closed on 30 June 2012.",
      ],
      facts: [
        { label: "Display", value: "Videotex, 25 rows of 40 columns" },
        { label: "Built-in modem", value: "1,200 bit/s receive, 75 bit/s send" },
        { label: "Network", value: "Teletel services over Transpac (X.25)" },
        { label: "Manufacturers", value: "Matra, La Radiotechnique (Philips), Telic-Alcatel" },
        { label: "End of service", value: "30 June 2012" },
      ],
      asset: minitelAsset,
    },
    {
      id: "televiseur-1950",
      title: "1950 Television",
      kicker: "Cathode-ray receiver · splayed-leg cabinet",
      intro: [
        "A 1950s television cabinet, with a curved cathode-ray screen, side speakers and splayed legs.",
        "Here it serves as another display: the 3615 Lemegeton Videotex screen shows on its tube, with the same CRT effects as on the Minitel.",
      ],
      facts: [
        { label: "Screen", value: "curved cathode-ray tube, planar UVs for the Videotex" },
        { label: "Cabinet", value: "wood, two speaker grilles, splayed legs" },
      ],
      asset: [
        { label: "File", value: "models/television-1950.glb · 0.32 MB (KTX2 + meshopt)" },
        { label: "Geometry", value: "5 meshes · 5,718 triangles" },
        { label: "Textures", value: "4 original images (1k variant), compressed to KTX2" },
        { label: "Source model", value: "1950's Retro Television, Huuxloc · CC BY 4.0" },
        { label: "Preparation", value: "tools/prepare_television.py: scale, names, Minitel_Screen screen" },
      ],
    },
    {
      id: "minitel-nfz-300",
      title: "Minitel 1 NFZ 300",
      kicker: "Radiotechnique · beige one-piece",
      intro: [
        "A Minitel 1 by La Radiotechnique, reference 9 NFZ 300/2, kept by the ACONIT association in Grenoble. Its PATSTEC record presents it as one of the very first Minitel models, already fitted with an AZERTY keyboard: the very first one, with an alphabetical keyboard, had been rejected by its users.",
        "It is a one-piece unit in beige plastic, developed within the Philips France group: the 1200/75 baud modem comes from the TRT subsidiary, the tube and assembly from Radiotechnique. In the 3D terminal, it is interpreted on the Minitel 1 geometry, tinted beige.",
      ],
      facts: [
        { label: "Reference", value: "Minitel 9 NFZ 300/2 (PATSTEC record, ACONIT)" },
        { label: "Manufacturer", value: "La Radiotechnique, Philips France group (modem: TRT)" },
        { label: "Appearance", value: "one-piece beige plastic, cathode-ray screen, AZERTY keyboard" },
        { label: "Function keys", value: "Connexion/Fin, Repetition, Sommaire, Guide, Annulation, Correction, Retour, Suite, Envoi" },
        { label: "Back", value: "220 V power socket and telephone socket" },
      ],
      asset: [
        ...minitelAsset.slice(0, 3),
        { label: "3D finish", value: "beige tint over the original Minitel 1 textures (interpretation)" },
        minitelAsset[5],
        minitelAsset[3],
      ],
      note: "No 3D model of the NFZ 300 is used: the one found on Cults is for private use only and forbidden to AI tools. The shape remains the Minitel 1's.",
    },
  ],
  worldDoc: {
    kicker: "3D+ mode · explorable world",
    title: "The corridor out of time",
    intro: [
      "The 3D+ mode button, at the top of the terminal page, opens a corridor out of time. It holds one temporal door per terminal, in chronological order. In front of a door, its counter rolls through the years to the room's era, then the door opens.",
      "Each room belongs to its era and shows its terminal. In front of it, you find the 3615, Lemegeton's eyes and the settings of the simple version. Simple mode goes back to the terminal page, on the terminal of the room you left.",
    ],
    facts: [
      { label: "Moving", value: "on rails, from station to station: buttons, keyboard (arrows, Esc), click on a door" },
      { label: "Shortcut", value: "the inventory cards lead to a room, with a fade" },
      { label: "Address", value: "?mode=3d, then &salle= and &poste=: every station has its address, the Back button retraces the way" },
      { label: "Reduced motion", value: "short fades instead of travels, no parallax" },
      { label: "Sound", value: "off by default; synthesised ticking and breath, no sound file" },
    ],
    rooms: [
      { id: "televiseur-1950", label: "1950 living room", description: "teak TV cabinet, cocktail armchairs, boomerang rug, sideboard, sunburst clock, floor lamp" },
      { id: "minitel-1", label: "1982 office", description: "suspended ceiling and fluorescent panels, venetian blinds, filing cabinet, swivel chair, October 1982 calendar" },
      { id: "minitel-nfz-300", label: "1982 living room", description: "the Minitel comes home: banded wallpaper, carpet, velvet sofa, wall unit and television, rotary telephone" },
      { id: "terminatel-255", label: "Terminatel 255 room", description: "black marble, brass, engraved plate, ropes around the terminal" },
    ],
    assets: [
      { label: "Temporal door", value: "Door_Wooden_Old, Mehdi Shahsavan · CC BY 4.0 (placeholder model)" },
      { label: "Clocks", value: "Mantel Clock 01, Vintage Grandfather Clock 01, Poly Haven · CC0" },
      { label: "Materials", value: "Dark Paneled Wood, Decrepit Wallpaper, Herringbone Parquet, Poly Haven · CC0" },
      { label: "Room decor", value: "built in code and drawn on canvas, no other asset" },
    ],
  },
  projectDocs: [
    { title: "README", path: "README.md", description: "Vision, setup, deployment and status of the project (in French)" },
    { title: "User guide", path: "docs/USAGE.md", description: "Minitel component, screen sources, catalogue, accessories (in French)" },
    { title: "Assets and licences", path: "docs/ASSETS.md", description: "Models kept, credits, models set aside and why (in French)" },
    { title: "Model preparation", path: "docs/MODEL_PREPARATION.md", description: "Blender scripts, conventions, screen UVs, export (in French)" },
    { title: "Project brief", path: "docs/3D_WEB_PROJECT.md", description: "Goals, phases and art direction decisions (in French)" },
    { title: "Explorable world", path: "docs/MONDE_EXPLORABLE.md", description: "3D+ mode: decisions, architecture, rails, doors, rooms, budgets, stages (in French)" },
    { title: "Art direction", path: "docs/DIRECTION_ARTISTIQUE.md", description: "Moods of the corridor and rooms, palettes, light (in French)" },
    { title: "Translation", path: "docs/TRADUCTION.md", description: "Languages of the site, text catalogues, adding a language (in French)" },
    { title: "Verification", path: "docs/VERIFICATION.md", description: "Test report and screenshots (in French)" },
  ],
  related: [
    {
      name: "lemegeton-core",
      url: "https://github.com/Sterenna-studio/lemegeton-core",
      description: "The creative core of Lemegeton: references, modelling, rigs and animation of the character. The museum was born from the wish for a working 3D Minitel for its body.",
    },
    {
      name: "3615-gateways",
      url: "https://github.com/Sterenna-studio/3615-gateways",
      description: "Minitel gateway on ESP32: Telnet and WebSocket hub, and integration with the Nitro portal.",
    },
  ],
};
