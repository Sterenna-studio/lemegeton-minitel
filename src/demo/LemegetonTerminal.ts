import { Terminal, type TerminalPage } from '../videotex/terminal';
import { createScreen, text, COLS, type TerminalAction } from '../videotex/screen';
function page(title: string, lines: string[], actions: TerminalAction[], home = false) {
  const s=createScreen(title);
  text(s,2,1,'TELETEL',6); text(s,29,1,'CONNECTE',2);
  text(s,2,3,'------------------------------------',2);
  text(s,4,6,home ? '3615 LEMEGETON' : title,3);
  text(s,4,8,home ? 'LE TERMINAL DES POSSIBLES' : 'RESEAU DES ARCHIVES / 1982',6);
  lines.forEach((line,index)=>text(s,4,11+index,line,7));
  actions.forEach((action,index)=>text(s,4,16+index,`${action.key}  ${action.label}`,index===0?3:7));
  text(s,2,24,'LEMEGETON                 SOMMAIRE',6);
  for (let x=2;x<38;x++) s.cells[4*COLS+x]={char:' ',fg:2,bg:0,mosaic:x%3===0?63:3};
  s.actions=actions; return s;
}
const back: TerminalAction={key:'0',label:'RETOUR AU SOMMAIRE',target:'home'};
export const lemegetonPages: TerminalPage[]=[
  {id:'home',render:()=>page('3615 LEMEGETON',['Une presence attend de l\'autre cote.','Choisissez votre destination.'],[
    {key:'1',label:'ENTRER',target:'connection'},{key:'2',label:'ARCHIVES',target:'archives'},{key:'3',label:'MESSAGES',target:'messages'}],true)},
  {id:'connection',render:()=>{
    const s=page('CONNEXION...',['Liaison etablie.','Identification du terminal en cours.'],[{key:'Enter',label:'ENVOI / IDENTIFIER',target:'identity'},back]);
    text(s,4,14,'1200 BAUDS / LIAISON ACTIVE',2,true); return s;
  }},
  {id:'identity',render:()=>page('IDENTIFICATION DU TERMINAL',['TERMINAL : LMGT-1982','> ACCES AUTORISE','Un signal. Une memoire. Une presence.'],[
    {key:'1',label:'LEMEGETON',target:'lemegeton'},{key:'2',label:'ARCHIVES',target:'archives'},back])},
  {id:'lemegeton',render:()=>page('LEMEGETON',['Je suis une machine qui se souvient.','Les touches ouvrent des passages.','Certains n\'ont pas encore de nom.'],[back])},
  {id:'archives',render:()=>page('ARCHIVES',['DOSSIER 001 / PREMIER SIGNAL','1982 : le reseau prend forme.','Une coque, un ecran, mille histoires.','Document fictif / collection LMGT.'],[back])},
  {id:'messages',render:()=>page('MESSAGES',['01  RESEAU     Vous etes attendu.','02  INCONNU   Gardez la ligne ouverte.','03  LMGT      Le silence a une forme.'],[back])},
];
export function createLemegetonTerminal(): Terminal { return new Terminal(lemegetonPages,'home'); }
