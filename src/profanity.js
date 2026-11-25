// Decides whether a player name is offensive. Covers the game's eight languages, plus a few
// words common among players everywhere.
//
// Each entry is written in plain lowercase letters without accents:
//   word     the whole name, or one whole word of it          "ass" stops "Big Ass", not "Assassin"
//   word*    a name or word that starts with it               "pula*" stops "PulaMare", not "Popular"
//   *word*   the letters anywhere in the name                 "*fuck*" stops "xXfuckerXx"
// Prefer the narrowest form that works: many of these are innocent inside other words or in
// another language. Repeated letters ("puuula"), digits and symbols used as letters ("sh1t"),
// accents and separators ("p.u.l.a") are handled by isProfane(), so do not list such variants.

const WORDS = `
  *fuck* fck* fuk fuq *phuck* shit* *bullshit* *dipshit* *bitch* *cunt* *nigger* *nigga* *faggot* fag fags
  *whore* *asshole* *arsehole* ass asses arse *dickhead* dick dicks cock cocks *cocksuck* *pussy* *wanker* wank
  *slut* *bastard* *rapist* rape retard retarded cum *jizz* *dildo* *porn* sex anal anus penis vagina
  *blowjob* *handjob* tits boobs twat prick milf *hitler* nazi nazis kkk pedo pedophile* paedo* kike spic chink
  tranny dyke

  puta* puto* *hijodeput* *hijoput* *mierda* *joder* *gilipoll* *cabron* cono *pendejo* *pendeja* *maricon*
  marica zorra polla pollas verga vergas *chinga* culo culos *culero* *mamada* *malparid* *gonorrea* *carajo*
  *cojone* *follar* *capullo* perra pajero pajillero *conchatumadre* *conchetumare*

  *putain* pute putes *salope* *salaud* *connard* *connasse* *encule* *enfoire* *merde* nique niquer
  *niquetamere* *couill* chatte *branleur* *batard* pede pedes tapette *bougnoul* fdp *tagueule* foutre
  *vatefairefoutre* chier

  *cazzo* cazzi *cazzon* *minchia* *stronz* *vaffancul* *fancul* *coglion* *puttan* troia troie *merda* figa
  fica *frocio* *ricchion* *zoccola* *mignotta* *pompin* *porcodio* *porcoddio* *diocane* *dioporco*
  *porcamadonna* *sborr* bocchinar*

  *scheiss* *arschloch* arsch* *fick* *fotze* *hurensohn* hure huren *wichser* *wixxer* *wixer* *schlampe*
  *schwuchtel* *missgeburt* *spast* schwanz *schwanzlutsch* nutte nutten *pimmel* muschi *kanake* *drecksau*
  *siegheil* titten bumsen kacke kack*

  pula* pule pulii pulic* *pulamea* *sugipula* *sugepula* *capdepula* *pizd* *muie* *muist* fut fute futai
  futut* futui *futuma* *fututi* *futemas* *sugaci* suge sugeo sugi cacat cacatul kkt curva curvele tarfa
  tarfe *bulangiu* *poponar* labar *labagi* *coaie* *gaoz* cur curu curul *mortiimati* *jidan* tigan tigani
  tiganu tiganca

  *μαλακ* malaka malakas malakes malakia malakies *remalaka* *γαμω* *γαμησ* *γαμιε* *γαμημεν* gamoto
  *gamisou* *gamiesai* *gamw* *πουταν* *poutana* *μουνι* *mouni* *αρχιδ* *arxidi* *archidi* *πουστ* *pousti*
  *καριολ* *kariol* *πουτσ* *poutsa* *σκατα* skata *κωλο* *ξεκωλ* πιπα τσουλα

  *kurw* *kurew* *chuj* huj* *pierdol* *pierdal* *jeba* cipa cipka cipy suka suko *dziwk* szmata ciota
  *fiut* kutas kutasie *cwel* *gowno* *gowniar* *zasran* dupek

  *blyat* cyka *pidor* *pidar* *сука* *блят* *блядь* *пидор*
`.trim().split(/\s+/);

// Digits and symbols that stand in for letters.
const LOOKALIKES = { 0: "o", 1: "i", 3: "e", 4: "a", 5: "s", 7: "t", "@": "a", $: "s", "!": "i" };

/** Lowercase, no accents, look-alike characters turned into the letters they imitate. */
const normalise = (text) =>
  text.toLowerCase()
    .replace(/[013457@$!]/g, (c) => LOOKALIKES[c])
    .replace(/ł/g, "l").replace(/ß/g, "ss").replace(/ς/g, "σ")
    .normalize("NFD").replace(/\p{M}/gu, "");

/** One entry of WORDS as a regular expression source. Every letter may be repeated. */
const toPattern = (word) => word.replace(/\*|\p{L}/gu, (c) => (c === "*" ? "\\p{L}*" : c + "+"));

const PROFANE = new RegExp(`^(?:${WORDS.map(toPattern).join("|")})$`, "u");

export function isProfane(name) {
  const words = normalise(String(name)).split(/[^\p{L}]+/u).filter(Boolean);
  // The words one by one, then all of them joined: that catches "p u l a" and "pu-la".
  return [...words, words.join("")].some((word) => PROFANE.test(word));
}
