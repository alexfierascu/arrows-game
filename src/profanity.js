import LDNOOBW from "./ldnoobw.js";

// Decides whether a player name is offensive. Covers the game's eight languages, plus words
// common among players everywhere.
//
// Each entry is written in plain lowercase letters without accents:
//   word     the whole name, or one whole word of it          "ass" stops "Big Ass", not "Assassin"
//   word*    a name or word that starts with it               "pula*" stops "PulaMare", not "Popular"
//   *word*   the letters anywhere in the name                 "*fuck*" stops "xXfuckerXx"
// Prefer the narrowest form that works: many of these are innocent inside other words or in
// another language. Repeated letters ("puuula"), digits and symbols used as letters ("sh1t"),
// accents and separators ("p.u.l.a") are handled by isProfane(), so do not list such variants.

// One list per language, only to keep them readable: every name is checked against all of them.
// On top of these comes the whole "List of Dirty, Naughty, Obscene, and Otherwise Bad Words" in
// its 28 languages (src/ldnoobw.js), matched as whole names or whole words only.
const LISTS = {
  english: `
    *fuck* fck* fuk fuq fuker fuking *phuck* *fuxk* shit* *bullshit* *dipshit* *shithead* *shitface* *horseshit*
    *batshit* *eatshit* *bitch* *biatch* *cunt* *nigger* *nigga* *faggot* fag fags faggy *whore* hoe hoes
    *asshole* *arsehole* ass asses arse *asshat* *asswipe* *jackass* *dumbass* *fatass* *dickhead* dick dicks
    *dickface* *dickwad* cock cocks *cocksuck* *cockhead* *suckmydick* *suckdick* *suckcock* *suckmy* *pussy*
    *wanker* wank *tosser* *bellend* *twat* *slut* *skank* *bastard* *rapist* rape raped retard retarded tard
    cum cums *cumshot* *jizz* *dildo* *porn* sex anal anus penis vagina *blowjob* *handjob* *rimjob* tit tits
    titties boob boobs prick pricks milf dilf *hitler* nazi nazis kkk pedo pedos *pedophil* paedo* kike kikes
    spic spics chink chinks gook gooks coon coons wetback* *beaner* tranny trannies dyke dykes *shemale* mofo
    *bollock* bugger *douche* *scumbag* piss pissed *pissoff* *pisshead* *nutsack* *ballsack* *butthole* cuck
    cucks cuckold* incel incels *whitepower* kys *killyourself* *sodomy* *sodomi* *molest* *necrophil*
    *masturbat* *orgasm* boner clit clitoris *fellatio* *cunnilingus* *gangbang* *bukkake* *hentai* *queef*
    *smegma* spunk *schlong* minge slag wog wogs paki pakis nonce mong lesbo homo homos *whitetrash*
    *mongoloid* *prostitut*
    anilingus *assmunch* *apeshit* autoerotic ballgag ballsucking balllicking bangbros bareback bbw bdsm
    bestiality beastiality *zoophil* bimbo bimbos blumpkin bondage bootycall bulldyke bunghole busty buttcheeks
    cameltoe camgirl carpetmuncher circlejerk *clevelandsteamer* *coprophil* cornhole creampie cumming darkie
    daterape *deepthroat* dingleberry dirtysanchez doggystyle doggiestyle dominatrix donkeypunch
    *doublepenetration* dryhump dvda ecchi ejaculation erotic erotism fecal felch femdom fingerbang fingering
    fisting footjob fudgepacker futanari genitals goatse goatcx goddamn *goldenshower* gokkun grope gspot guro
    homoerotic honkey hooker horny humping incest intercourse jackoff jailbait jerkoff *jigaboo* *jiggaboo*
    kinbaku kinky lemonparty livesex mrhands nambla *neonazi* nignog nipple nipples nsfw nude nudity nympho
    *nymphomania* omorashi orgy panties panty pedobear pegging pikey pissing playboy poon poontang pthc pubes
    punany queaf quim raghead raping rectum rimming sadism semen sexcam sexo sexy sexual sexually sexuality
    shibari slanteye smut splooge spooge strapon stripclub suck sucks swastika teabagging threesome titty
    topless towelhead tubgirl twink twogirlsonecup upskirt viagra cialis vibrator voyeur vulva wetdream xxx
    yaoi yiffy bluewaffle dolcett`,

  spanish: `
    puta* puto* putita putitas putilla *hijodeput* *hijoput* *hijaput* *hijadeput* *hijueput* *jueput* hdp hpta
    *putamadre* *mierda* *joder* *jodete* *jodido* *gilipoll* *gilipuertas* *cabron* cono conos *conazo*
    *pendejo* *pendeja* *maricon* marica maricas zorra zorras polla pollas pollon verga vergas vergon *chinga*
    culo culos *culero* *culiao* *culiado* *culear* *culicagado* *mamada* mamon mamona mamones *mamaguevo*
    *mamahuevo* *malparid* *malnacid* *gonorrea* *carajo* *cojone* cojon *follar* *follad* *follame* *capullo*
    *capulla* perra perras pajero pajera pajillero *conchatumadre* *conchetumare* *conchesumadre* *conchudo*
    ctm lpm lptm ptm *chupapolla* *chupapija* chupala chupamela pija pijas *pijudo* pinche pinga *lameculo*
    *caraculo* *tontopolla* *tontolaba* *soplapolla* *huevon* *guevon* weon weona *bolud* *pelotud* cagar
    cagada cagon cagona *mecago* teta tetas tetona* chocho panocha cachonda cachondo ramera guarra guarro
    subnormal *retrasad* mongolo mongola mongolico sudaca negrata bollera tortillera joto jotos *careverga*
    *caremonda* cerote choto chota garcha trolo puneta punetas *mierdero* *mierdoso* *violador*
    chupada *conchadetumadre* coprofagia esperma gilipichis *hacerunapaja* *jilipoll* kapullo macizorra
    pervertido pervertida sexooral soplagaitas`,

  french: `
    *putain* pute putes *putasse* *salepute* *grossepute* *petitepute* *filsdepute* *filsdeput* *filledepute*
    *salope* salop salopard* *salaud* *connard* *connasse* *conasse* connerie conneries *encule* *enfoire*
    *merde* nique niquer niquez *niquetamere* *niquetarace* *niktamer* ntm tamere *tagueule* foutre
    *vatefairefoutre* *vatefaire* chier chie chiant *faischier* *faitchier* chiotte chiottes *couill* chatte
    chattes *branl* *batard* pede pedes tapette tapettes *tarlouze* *tafiole* *fiotte* *lopette* *gouine*
    *bougnoul* bicot bicots negre negres *negresse* *youpin* youtre boche boches *bamboula* *salearabe*
    *salenoir* *salejuif* *grossebite* *sucemabite* *mabite* suce suceur suceuse teub zob zgeg chibre nichon
    nichons *nibard* cul *trouducul* *troudeballe* *trouduc* *lechecul* *tetedecul* *facedecul* *petasse*
    *pouffiasse* *poufiasse* *grognasse* garce abruti abrutie bordel pisse baise baiseur baiseuse
    *baisetamere* *partouz* *raclure* *enflure* *violeur* *violeuse* *mongolien* trisomique attarde *crevard*
    *foufoune* schnek chnek *cramouille*
    brackmard braquemard *brouterlecresson* chiasse clito etron grogniasse palucher poussecrotte teuch
    tringler trique troncher turlute zigounette bloblos`,

  italian: `
    *cazzo* cazzi *cazzon* *cazzat* *cazzut* *incazz* *minchia* *minchion* *stronz* *vaffancul* *fancul* vaffa
    *coglion* *puttan* troia troie *troion* *troiett* *figlioditroia* *porcatroia* *madonnatroia* *merda* figa
    fighe fica *fregna* *frocio* froci finocchio *ricchion* *recchion* *culatton* *culaton* *rottinculo*
    *rottoinculo* inculare inculata inculato inculati *zoccola* *mignotta* *bagascia* *baldracca* battona
    *sgualdrina* *pompin* bocchinar* segaiolo *segaiol* *sborr* *sburr* *porcodio* *porcoddio* *diocane*
    *dioporco* *diobestia* *dioboia* *porcamadonna* *facciadiculo* *leccacul* *rompipalle* cornuto cornuta
    handicappato ritardato *negraccio* terrone terroni zingaro zingara zingari checca *lesbicona* trombare
    *trombata* scopare scopata chiavare chiavata *fott* suca *sucamelo* *succhiamelo* pirla topa *patonza*
    tette tettona culona *vaiacagare* cagare cagata piscia pisciare *porcone* maiala *mortacci* *nazist*
    stupro *stuprator* *pedofil*
    allupato ammucchiata anale arrapato arrapata arrusa arruso bagassa belino bucaiolo budiulo busone
    cagna *cazzimm* chiappa chiappe culattina ditalino figone froscio goldone guardone ingoio lecchino loffa
    *merdos* nerchia pecorina picio pippone piscio potta puppami rompiballe sbrodolata smandrappata socmel
    sorca sticchio succhiami succhione sveltina sverginare zinne bordello mussa`,

  german: `
    *scheiss* *beschiss* *arschloch* arsch* *fick* *fotze* *votze* *hurensohn* *hurenkind* *hurenbock* hure
    huren huso *nuttensohn* nutte nutten *wichs* *wixer* *wixxer* *wixen* *wixxen* *schlampe* *schwuchtel*
    *missgeburt* *spast* *spacko* *spacken* *schwanz* *pimmel* muschi *kanake* *kanacke* *drecks* *dreckschwein*
    *siegheil* titte titten bumsen poppen vogeln kacke kack* *pisser* *pissnelke* *verpiss* *leckmich*
    *vollidiot* *vollpfosten* *hackfresse* fresse *haltdiefresse* *haltsmaul* *haltdeinmaul* *mistkerl*
    *miststuck* luder *flittchen* penner behindert* mongo kruppel *schwachkopf* *sackgesicht* *hodensack*
    *hundesohn* sau *abspritzen* sperma *judensau* *judenschwein* neger negerin zigeuner *kummelturk* polacke
    polacken itaker *schlitzauge* tunte tucke transe *vergewaltig* *lutscher* *pissbirne* *pisskopf*
    *dumpfbacke* *bumsbirne* bums rammeln *blasmir* *pussi* hoden *eierkopf* *sackleck* *kotzbrocken* kotze
    kotzen *affenarsch* *duarsch* *leckarsch* *nazischwein* *untermensch* *auslanderraus* *judenraus*
    *volltrottel* behindi *lesbensau* *kampflesbe* stricher zuhalter nuttig *onanie* vergasen vergast
    *kinderschander* *padophil*
    analritter dodel mopse morgenlatte nackt nippel pimpern pissen schnackeln tittchen`,

  romanian: `
    pula* pule pulii pulic* pulifric* *pulamea* *sugipula* *sugepula* *capdepula* *inpula* *npula* *bagpula*
    *pwla* plm *pizd* pzd pzdm *muie* *muist* mue fut fute futai futut* futui *futuma* *fututi* *futemas*
    *futeti* *tefut* *vafut* *futacios* *futangiu* *futumatii* fmm *sugaci* *sugator* suge sugeo sugi *sugeti*
    cacat cacatul *cacacios* *cacanar* cac kkt curva curvele curvar curvari curvarul *curvistin* tarf*
    *bulangi* *poponar* *poponaut* poponet labar laba *labagi* *coaie* coios *gaoz* *gaoaza* cur curu curul
    *curist* *curlinge* *mortiimati* *mortiima* mortii matii dracu dracului *jidan* tigan tigani tiganu
    *tiganc* cioroi *bozgor* *boanghin* handicapat handicapata handicapati retardat retardata tampit tampita
    zdreanta panarama panarame boarfa fufa stoarfa putoare jigodie javra nenorocit nenorocita nenorocitule
    lingau pisat pisatule *pisamas* besina rahat *bagamias* *bagatias* sloboz slobozi *tzatze* *tatoasa*
    buci *fofoloanca* homalau fatalau *violator*`,

  greek: `
    *μαλακ* malaka malakas malakes malakia malakies malakismen* *remalaka* *γαμω* *γαμησ* *γαμιε* *γαμημεν*
    *γαμιολ* *γαμιασ* gamoto gamoti *gamotin* *gamisou* *gamiesai* *gamw* *gamimen* *gamiol* *πουταν*
    *poutana* *μουνι* *μουναρ* *μουνοπ* *mouni* *αρχιδ* *arxidi* *archidi* *arhidi* *πουστ* *pousti* *καριολ*
    *kariol* *καργιολ* *kargiol* *πουτσ* *poutsa* *poutso* *σκατα* *σκατο* skata* skato* *κωλο* *kwlo*
    *kolotripida* *kolopaido* *ξεκωλ* *xekol* πιπα πιπεσ τσουλα τσουλεσ tsoula βλακα βλακασ *βλαμμεν* *παπαρ*
    paparas *καυλ* kavla kavli *ψωλ* psoli pswli πεοσ βυζι βυζια *χεσε* *χεστ* xese xesto σκυλα *ξεφτιλ*
    πορνη *πορνο* *τσιμπουκ* *tsibouk* *tsimpouk* *πηδηξου* *pidixou* *σιχτιρ* *sixtir* *sihtir* *μπασταρδ*
    *λουγκρα* *lougkra* τραβελι ανωμαλοσ ανωμαλε *βρωμιαρ* *κοπριτ* *γυφτ* gyftos giftos αραπησ αραπαδεσ
    arapis *ναζι* *χιτλερ* *πατσαβουρ* *τσογλαν* *tsoglan* *ρεμαλι* *καθικ* kathiki *μπινε* mpines *πρεζακ*
    prezaki κλανια πορδη`,

  polish: `
    *kurw* *kurew* *kurva* kuzwa *qrwa* *kurfa* *chuj* huj* *pierdol* *pierdal* *jeba* *jebi* *jebn* *jebem*
    *zajeb* *wyjeb* *pojeb* *ujeb* *odjeb* *rozjeb* cipa cipka cipy cipo *cipsko* *cipecz* suka suko sucz
    *sukinsyn* *skurwiel* *dziwk* szmata szmato szmaty *szmacia* ciota cioto cioty *fiut* kutas kutasie
    *kutafon* *cwel* *gowno* *gowniar* *gowien* *zasran* srac sraj sraka *nasrac* *wysrac* dupek dupku
    *dupsko* *dupczy* *wdupie* *wdupe* *dupiarz* *ruchac* *ruchan* *wyruch* rucham *pieprzon* *spieprz*
    *odpieprz* lesba debil debilu *lachociag* *obciagar* *obciagacz* *ssijpale* cycki cyce cycek *walsie*
    *walickonia* *spermiarz* bydlak menda gnida gnoj gnoju gnojek scierwo lajza *lachudra* *lafirynda* burdel
    zdzira zdziro wywloka *lampucera* pinda *raszpla* *zboczen* *zwyrol* gwalt *gwalci* *czarnuch* *ciapat*
    brudas szwab szwaby kacap hwdp chwdp zdechnij
    burdelmama cyc dupa dupy *lizacpale* *obciagacloda* *robicloda* pieprzyc pierdziec rzygac sraczka
    syf`,

  // Common among players everywhere: Russian, Balkan, Hungarian, Turkish, Portuguese, Dutch, Nordic.
  other: `
    *blyat* *blyad* cyka *pidor* *pidar* *nahui* *nahuy* xuy *khuy* ebat *mudak* *gandon* *dolboeb* *сука*
    *блят* *бляд* *пидор* *пизд* *хуе* *хуи* *ебат* *ебан* *уеб* *заеб* *мудак* *гандон* *шлюх* *залуп*
    *siktir* *orospu* amk kurac picka *pickamater* kokot picsa geci fasz *bazdmeg* *baszdmeg* govno *caralh*
    foda fodase *buceta* cuzao viado *filhodaput* *arrombado* *punheta* *kanker* kut lul *godverdomme*
    *klootzak* hoer neuken *vittu* *perkele* fitta *knulla* javla faen
    dolboyeb ebalo mudack otsosi pedik shalava svoloch ublyudok zalupa zaebis жопа говно говнюк дерьмо
    дрочить ебарь ебло ебнуть манда мандавошка мудило мудозвон *хуя* *хую* срать ссать сиськи шалава сволочь
    ублюдок хохол *ебтво* *выеб* *наеб* *проеб* bicha boceta bosta cabrao cacete chochota colhoes cona
    esporra foder *vaitefoder* *vaitomarnocu* paneleiro porra sacanagem vadia veado xana xochota queca kloten
    klote flikker slet teef stront hufter rotzak reet`,
};
// Digits and symbols that stand in for letters.
const LOOKALIKES = { 0: "o", 1: "i", 3: "e", 4: "a", 5: "s", 7: "t", "@": "a", $: "s", "!": "i" };

/** Lowercase, no accents, look-alike characters turned into the letters they imitate. */
const normalise = (text) =>
  text.toLowerCase()
    .replace(/[013457@$!]/g, (c) => LOOKALIKES[c])
    .replace(/ł/g, "l").replace(/ß/g, "ss").replace(/ς/g, "σ")
    .normalize("NFD").replace(/\p{M}/gu, "");

/** The words of a name or phrase: lowercase letters only, look-alikes and accents resolved. */
export const wordsOf = (text) => normalise(String(text)).split(/[^\p{L}]+/u).filter(Boolean);

// Matching happens in two steps, because one expression with thousands of alternatives costs
// more processor time than a Worker request is allowed. First a cheap search with repeated
// letters collapsed on both sides ("puuula" and "pula" become the same) finds the few entries
// that could apply. Then each of those is checked exactly: every letter may be repeated, but a
// double letter in the entry stays required, so "as" is not taken for "ass".
const collapse = (word) => word.replace(/(\p{L})\1+/gu, "$1");

// LDNOOBW entries that are everyday first names or harmless words in another language. They are
// left out. Add to this list when a player's ordinary name is refused; it never overrides LISTS.
const ALLOWED = new Set(`
  peter regina anita johny mama lolita concha mona pinto martillo pau pina mose fan got pot trio gol
  hardcore pipi bobo
`.trim().split(/\s+/));
const listed = Object.values(LDNOOBW).join(" ").split(" ").filter((entry) => entry && !ALLOWED.has(entry));

const WHOLE = new Map(); // collapsed word -> the "word" entries
const PARTS = [];        // the "word*" and "*word*" entries
for (const entry of [...Object.values(LISTS).join(" ").trim().split(/\s+/), ...listed]) {
  const key = collapse(entry.replace(/\*/g, ""));
  if (!entry.endsWith("*")) WHOLE.set(key, [...(WHOLE.get(key) || []), entry]);
  else PARTS.push({ entry, key, anywhere: entry.startsWith("*") });
}

const exact = new Map(); // entry -> its regular expression, built when first needed
function matchesExactly(entry, word) {
  if (!exact.has(entry)) {
    const source = entry.replace(/\*|\p{L}/gu, (c) => (c === "*" ? "\\p{L}*" : c + "+"));
    exact.set(entry, new RegExp(`^${source}$`, "u"));
  }
  return exact.get(entry).test(word);
}

function isOffensiveWord(word) {
  const collapsed = collapse(word);
  const candidates = [
    ...(WHOLE.get(collapsed) || []),
    ...PARTS.filter((p) => (p.anywhere ? collapsed.includes(p.key) : collapsed.startsWith(p.key))).map((p) => p.entry),
  ];
  return candidates.some((entry) => matchesExactly(entry, word));
}

export function isProfane(name) {
  const words = wordsOf(name);
  // The words one by one, then all of them joined: that catches "p u l a" and "pu-la".
  return [...words, words.join("")].some(isOffensiveWord);
}
