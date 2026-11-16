// Príbeh hry „Sviečky a kľúče“ / "Candles and Keys"
// Postavy sú fiktívne. Udalosti, dátumy a miesta sú skutočné (pozri historické karty).
//
// Uzol dialógu:
//   { who, sk, en, next?, choices?, fx?, flag?, sfx?, branch?(state)=>id }
// Voľba:
//   { sk, en, next, fx?, flag? }  – text voľby vysloví hráč (Jano)

export const CAST = {
  player:   { name: { sk: 'Jano', en: 'Jano' }, voice: { g: 'm', pitch: 1.0, rate: 1.0 } },
  narrator: { name: { sk: 'Rozprávač', en: 'Narrator' }, voice: { g: 'm', pitch: 0.85, rate: 0.95 } },
};

export const CHAPTERS = [
  // ───────────────────────────── PROLÓG ─────────────────────────────
  {
    id: 'candle',
    action: 'raid',
    brief: { sk: "Je krátko po šiestej večer. Vodné delá sa rozbehli a autá vchádzajú medzi ľudí. Nikto neuteká. Drž sviečku a vydrž.", en: "It is just after six in the evening. The water cannons start and cars drive in among the people. Nobody runs. Hold your candle and endure." },
    scene: 'candle',
    date: { sk: '25. marca 1988, 18:00', en: '25 March 1988, 6 pm' },
    place: { sk: 'Hviezdoslavovo námestie, Bratislava', en: 'Hviezdoslav Square, Bratislava' },
    title: { sk: 'Sviečková manifestácia', en: 'The Candle Demonstration' },
    intro: {
      sk: 'Volám sa Ján Mráz, mám devätnásť a študujem na Filozofickej fakulte. Spolužiačka Katka mi pošepla, že dnes večer sa ľudia stretnú so sviečkami pred divadlom. Vraj len budú stáť a modliť sa. Prší a mesto je plné policajtov.',
      en: 'My name is Ján Mráz, I am nineteen and I study at the Faculty of Arts. My classmate Katka whispered that tonight people would gather with candles in front of the theatre. Just to stand and pray, she said. It is raining and the city is full of police.',
    },
    objective: {
      sk: 'Nájdi Katku pri soche Hviezdoslava. Cestou sa porozprávaj s ľuďmi.',
      en: 'Find Katka by the Hviezdoslav statue. Talk to people on the way.',
    },
    spawn: [0, 36],
    items: [{ id: 'box', kind: 'box', pos: [13.2, 31.5], after: 'vlado', flag: 'candlesBox', name: { sk: 'Škatuľa sviečok', en: 'Box of candles' }, text: { sk: 'Máš škatuľu sviečok. Zanes ju pánovi Vladimírovi.', en: 'You have the box of candles. Take it to Mr Vladimír.' } }],
    npcs: [
      {
        id: 'anna', name: { sk: 'Pani Anna', en: 'Mrs Anna' }, pos: [3.5, 20],
        look: { model: 'Business_Female_03', coat: 0x3b3550, pants: 0x2a2a2a, hair: 0xb8b8b8, hat: 'scarf', hatColor: 0x6b2a3a, candle: true },
        voice: { g: 'f', pitch: 0.95, rate: 0.88 }, start: 'a1', after: 'a_after', required: true,
      },
      {
        id: 'vb', name: { sk: 'Príslušník VB', en: 'Police officer' }, pos: [-10.5, 26],
        look: { model: 'Police_Male_03', coat: 0x4a5a3e, pants: 0x3a4632, hat: 'police', hatColor: 0x3d4a33 },
        voice: { g: 'm', pitch: 0.75, rate: 1.05 }, start: 'p1', after: 'p_after', required: true,
      },
      {
        id: 'vlado', name: { sk: 'Pán Vladimír', en: 'Mr Vladimír' }, pos: [-5, 12],
        look: { model: 'Male_Adult_13', coat: 0x33302c, pants: 0x26262a, hat: 'cap', hatColor: 0x2a2a2a, scarf: 0x5a5a4a, candle: true },
        voice: { g: 'm', pitch: 0.85, rate: 0.93 }, required: true, after: 'v_after',
        quest: { need: 'candlesBox', ask: 'v1', wait: 'v_wait', done: 'v3', hint: { sk: 'Dones pánovi Vladimírovi škatuľu sviečok – je pod lampou pri bielom aute na konci námestia.', en: 'Bring Mr Vladimír the box of candles – it is under the lamp by the white car at the end of the square.' } },
      },
      {
        id: 'katka', name: { sk: 'Katka', en: 'Katka' }, pos: [2.6, -7],
        look: { model: 'Female_Adult_04', coat: 0x8a4b2a, pants: 0x2b2b3a, hair: 0x5a3018, hat: 'beret', hatColor: 0x1d2a4a, candle: true },
        voice: { g: 'f', pitch: 1.15, rate: 1.0 }, start: 'k1', wait: 'k_wait', after: 'k_after', final: true,
      },
    ],
    nodes: {
      v1: { who: 'vlado', sk: "Mladý muž, máte voľné ruky? Sviečok je málo a ľudí stále pribúda. Pri aute na konci námestia mám škatuľu. Doniesli by ste ju?", en: "Young man, are your hands free? We are short of candles and people keep coming. I left a box by the car at the end of the square. Would you bring it?", choices: [{ sk: 'Donesiem ju.', en: 'I will bring it.', fx: { trust: 1 }, next: 'v2' }, { sk: 'A nie je to nebezpečné?', en: "Isn't that dangerous?", next: 'v1b' }] },
      v1b: { who: 'vlado', sk: "Je. Preto to robíme spolu. Jeden človek so sviečkou je výtržník. Päťtisíc ľudí so sviečkami je už otázka, na ktorú musia odpovedať.", en: "It is. That is why we do it together. One man with a candle is a troublemaker. Five thousand people with candles are a question they have to answer.", next: 'v2' },
      v2: { who: 'vlado', sk: "Je pod lampou, hneď vedľa bieleho auta. A nenápadne. Tí v civile sa pozerajú.", en: "It is under the lamp, right next to the white car. And be discreet. The plain-clothes men are watching." },
      v_wait: { who: 'vlado', sk: "Škatuľa je pri bielom aute pod lampou. Počkám tu.", en: "The box is by the white car under the lamp. I will wait here." },
      v3: { who: 'vlado', sk: "Výborne. Vidíte tie tváre? Petíciu za náboženskú slobodu podpísalo vyše pol milióna ľudí. Dnes prvý raz stoja vedľa seba.", en: "Well done. Do you see those faces? More than half a million people signed the petition for religious freedom. Tonight, for the first time, they stand side by side.", fx: { courage: 1 }, next: 'v4' },
      v4: { who: 'vlado', sk: "Vezmite jednu aj tomu dievčaťu pri soche. A keby sa niečo začalo, neutekajte. Stojte.", en: "Take one for that girl by the statue, too. And if anything starts, do not run. Stand." },
      v_after: { who: 'vlado', sk: "Neutekajte. Stojte.", en: "Do not run. Stand." },
      a1: { who: 'anna', sk: 'Synku, nemáš sviečku? Na, vezmi si. Nič zlé nerobíme – len tu stojíme a modlíme sa.', en: "Son, haven't you got a candle? Here, take one. We're doing nothing wrong – we're just standing here and praying.",
        choices: [
          { sk: 'Prečo ste sem prišli?', en: 'Why did you come here?', next: 'a2' },
          { sk: 'Nebojíte sa?', en: 'Aren\'t you afraid?', next: 'a3' },
        ] },
      a2: { who: 'anna', sk: 'Vnuka mi nechceli vziať na gymnázium, lebo miništruje. Nechceme veľa – len aby sa človek nemusel báť veriť a povedať, čo si myslí.', en: "They wouldn't let my grandson into grammar school because he serves at the altar. We don't ask for much – just not to be afraid to believe, and to say what we think.", next: 'a4' },
      a3: { who: 'anna', sk: 'Bojím sa. Ale strach som mala celý život. Dnes ho nechám stáť tu na daždi.', en: "I am afraid. But I've been afraid my whole life. Tonight I'll leave my fear standing out here in the rain.", fx: { courage: 1 }, next: 'a4' },
      a4: { who: 'anna', sk: 'Tvoja priateľka je pri soche. Videla som ju. Choď, a drž sviečku tak, aby nezhasla.', en: "Your friend is by the statue. I saw her. Go – and hold the candle so it doesn't go out." },
      a_after: { who: 'anna', sk: 'Drž tú sviečku, synku. Pokojne.', en: 'Hold that candle, son. Calmly.' },

      p1: { who: 'vb', sk: 'Občan! Toto zhromaždenie nie je povolené. Rozíďte sa!', en: 'Citizen! This gathering is not permitted. Disperse!',
        choices: [
          { sk: 'Stojím tu len so sviečkou.', en: "I'm only standing here with a candle.", next: 'p2', fx: { courage: 1 } },
          { sk: 'Už idem, súdruh.', en: "I'm going, comrade.", next: 'p3' },
        ] },
      p2: { who: 'vb', sk: 'So sviečkou… Vidíte tie autá s vodnými delami? Keď prídu rozkazy, nebudem sa nikoho nič pýtať. Choďte domov, chlapče.', en: "With a candle… See those water-cannon trucks? When the orders come, I won't be asking anyone anything. Go home, boy." },
      p3: { who: 'vb', sk: 'Rozumný chlapec. Zmiznite, kým sa to tu nezačne.', en: 'Sensible boy. Disappear before things start here.', fx: { courage: -1 } },
      p_after: { who: 'vb', sk: 'Ešte stále ste tu? Rozíďte sa!', en: 'Still here? Move along!' },

      k_wait: { who: 'katka', sk: 'Jano! Konečne. Počkaj… najprv sa poobzeraj, porozprávaj sa s ľuďmi. Chcem, aby si videl, kto všetko prišiel.', en: "Jano! Finally. Wait… look around first, talk to people. I want you to see who came." },
      k1: { who: 'katka', sk: 'Jano, si tu! Myslela som, že neprídeš. Pozri sa okolo – tisíce sviečok. Babky, študenti, robotníci.', en: "Jano, you came! I thought you wouldn't. Look around – thousands of candles. Grandmothers, students, workers.", next: 'k2' },
      k2: { who: 'katka', sk: 'Ľudia kľačia v daždi a spievajú. A na kraji námestia čakajú autá s vodnými delami.', en: 'People are kneeling in the rain and singing. And at the edge of the square, the water-cannon trucks are waiting.', sfx: 'hymn',
        choices: [
          { sk: 'Zostanem s tebou.', en: "I'll stay with you.", next: 'k3', fx: { courage: 1, trust: 1 } },
          { sk: 'Mali by sme ísť, Katka. Je to nebezpečné.', en: "We should go, Katka. It's dangerous.", next: 'k4' },
        ] },
      k3: { who: 'katka', sk: 'Ďakujem. Raz si na tento večer spomenieme ako na začiatok.', en: "Thank you. One day we'll remember tonight as the beginning.", next: 'k5' },
      k4: { who: 'katka', sk: 'Možno máš pravdu. Ale niekto musí stáť prvý. Dnes sme to my.', en: "Maybe you're right. But somebody has to stand first. Tonight it's us.", next: 'k5' },
      k5: { who: 'narrator', sk: 'Krátko po šiestej sa rozbehnú vodné delá. Ľudia neutekajú. Kľačia a modlia sa ďalej, kým ich policajti nerozoženú.', en: 'Shortly after six the water cannons start. People do not run. They keep kneeling and praying until the police drive them apart.', sfx: 'water' },
      k_after: { who: 'katka', sk: 'Drž sa pri mne.', en: 'Stay close to me.' },
    },
    history: {
      sk: '25. marca 1988 sa na Hviezdoslavovom námestí v Bratislave konalo pokojné zhromaždenie za náboženskú slobodu a dodržiavanie ľudských práv. Iniciátorom bol exilový aktivista Marián Šťastný, doma ho podporila tajná cirkev (napr. František Mikloško, Vladimír Jukl, Silvester Krčméry). Prišlo niekoľko tisíc ľudí so sviečkami. Režim nasadil Verejnú bezpečnosť, vodné delá a obušky; desiatky ľudí zadržali. Sviečková manifestácia sa považuje za jeden z najvýznamnejších protestov proti komunistickému režimu pred Nežnou revolúciou.',
      en: 'On 25 March 1988, a peaceful gathering for religious freedom and human rights took place on Hviezdoslav Square in Bratislava. It was initiated by exiled activist Marián Šťastný and supported at home by the underground church (e.g. František Mikloško, Vladimír Jukl, Silvester Krčméry). Several thousand people came with candles. The regime deployed the police, water cannons and batons; dozens were detained. The Candle Demonstration is considered one of the most important protests against the communist regime before the Velvet Revolution.',
    },
  },

  // ───────────────────────────── KAPITOLA 1 ─────────────────────────────
  {
    id: 'students',
    action: 'chase',
    brief: { sk: "Katka ti strčí do ruky zväzok letákov. Rozdaj ich, kým si ťa muž v koženom kabáte nenájde.", en: "Katka presses a bundle of leaflets into your hand. Hand them out before the man in the leather coat finds you." },
    scene: 'students',
    date: { sk: '16. novembra 1989, popoludnie', en: '16 November 1989, afternoon' },
    place: { sk: 'Pred univerzitou, Bratislava', en: 'Outside the university, Bratislava' },
    title: { sk: 'Študenti', en: 'The Students' },
    intro: {
      sk: 'Prešiel rok a pol. V Berlíne padol múr, v Poľsku a Maďarsku sa veci hýbu. U nás je zatiaľ ticho – až dnes. Bratislavskí vysokoškoláci sa rozhodli vyjsť do ulíc. Deň pred Prahou.',
      en: 'A year and a half has passed. The Berlin Wall has fallen; Poland and Hungary are on the move. Here it has been quiet – until today. Bratislava\'s university students have decided to march. One day before Prague.',
    },
    objective: {
      sk: 'Pridaj sa k študentom. Pozor na mužov v koženom kabáte.',
      en: 'Join the students. Watch out for men in leather coats.',
    },
    spawn: [0, 32],
    items: [{ id: 'banner', kind: 'roll', pos: [13.0, 30.6], after: 'zuzana', flag: 'banner', name: { sk: 'Zrolovaný transparent', en: 'Rolled-up banner' }, text: { sk: 'Máš transparent. Zanes ho Zuzane.', en: 'You have the banner. Take it to Zuzana.' } }],
    npcs: [
      {
        id: 'peto', name: { sk: 'Peťo', en: 'Peťo' }, pos: [5, 8],
        look: { model: 'Male_Adult_12', coat: 0x2f4f6f, pants: 0x3a3a3a, hair: 0x1a1a1a, hat: 'none', scarf: 0xb22222 },
        voice: { g: 'm', pitch: 1.15, rate: 1.08 }, start: 's1', after: 's_after', required: true,
      },
      {
        id: 'kollar', name: { sk: 'Muž v koženom kabáte', en: 'Man in a leather coat' }, pos: [-14, 18],
        look: { model: 'Business_Male_03', coat: 0x1c1a18, pants: 0x262626, hair: 0x2a2a2a, hat: 'fedora', hatColor: 0x222222 },
        voice: { g: 'm', pitch: 0.7, rate: 0.92 }, start: 'e1', after: 'e_after', required: true,
      },
      {
        id: 'zuzana', name: { sk: 'Zuzana, medička', en: 'Zuzana, medical student' }, pos: [-6, 10],
        look: { model: 'Female_Adult_09', coat: 0x4a3540, pants: 0x25252b, hat: 'none', scarf: 0xd8c690 },
        voice: { g: 'f', pitch: 1.1, rate: 1.04 }, required: true, after: 'z_after',
        quest: { need: 'banner', ask: 'z1', wait: 'z_wait', done: 'z3', hint: { sk: 'Prines Zuzane zrolovaný transparent – je pri múre za červeným autom.', en: 'Bring Zuzana the rolled-up banner – it is by the wall behind the red car.' } },
      },
      {
        id: 'katka', name: { sk: 'Katka', en: 'Katka' }, pos: [0, -6],
        look: { model: 'Female_Adult_04', coat: 0x8a4b2a, pants: 0x2b2b3a, hair: 0x5a3018, hat: 'beret', hatColor: 0x1d2a4a, scarf: 0xe8e8e8 },
        voice: { g: 'f', pitch: 1.15, rate: 1.0 }, start: 'k1', wait: 'k_wait', after: 'k_after', final: true,
      },
    ],
    nodes: {
      z1: { who: 'zuzana', sk: "Ahoj, ty si od Katky? Super. Niesli sme transparent, ale keď sa objavili eštebáci, chalani ho schovali pri červenom aute. Sama ho neunesiem.", en: "Hi, are you with Katka? Great. We were carrying a banner, but when the secret police showed up, the boys hid it by the red car. I cannot carry it alone.", choices: [{ sk: 'Idem poň.', en: 'I will get it.', fx: { trust: 1 }, next: 'z2' }, { sk: 'Čo je na ňom napísané?', en: 'What does it say?', next: 'z1b' }] },
      z1b: { who: 'zuzana', sk: "Dve slová: Chceme slobodu. Dnes to stačí na vyhodenie zo školy.", en: "Two words: We want freedom. Today that is enough to get you expelled.", next: 'z2' },
      z2: { who: 'zuzana', sk: "Je zrolovaný pri múre, hneď za červeným autom. Rýchlo, kým si ho nevšimnú.", en: "It is rolled up by the wall, right behind the red car. Quick, before they notice it." },
      z_wait: { who: 'zuzana', sk: "Transparent je za červeným autom pri múre.", en: "The banner is behind the red car by the wall." },
      z3: { who: 'zuzana', sk: "Máš ho! Zajtra je Medzinárodný deň študentstva. V tridsiatom deviatom nacisti zavreli české vysoké školy a študentov odvliekli do lágrov. Preto ideme do ulíc práve teraz.", en: "You got it! Tomorrow is International Students' Day. In 1939 the Nazis closed the Czech universities and dragged students off to the camps. That is why we march right now.", fx: { courage: 1 }, next: 'z4' },
      z4: { who: 'zuzana', sk: "Chyť druhý koniec. Nech to vidia aj tí v oknách.", en: "Grab the other end. Let the people in the windows see it too." },
      z_after: { who: 'zuzana', sk: "Drž ho vysoko!", en: "Hold it high!" },
      s1: { who: 'peto', sk: 'Jano, no konečne! Ideme k ministerstvu školstva. Chceme, aby sa s nami konečne niekto rozprával. A aby nikto neletel zo školy za to, čo si myslí.', en: "Jano, at last! We're marching to the Ministry of Education. We want someone to finally talk to us. And nobody kicked out of school for what they think.",
        choices: [
          { sk: 'Nezavrú nás?', en: "Won't they lock us up?", next: 's2' },
          { sk: 'S čím môžem pomôcť?', en: 'How can I help?', next: 's3', fx: { trust: 1 } },
        ] },
      s2: { who: 'peto', sk: 'Keď nás bude dosť, nemôžu zavrieť všetkých. A zajtra vyjdú aj pražskí študenti.', en: "If there are enough of us, they can't lock us all up. And tomorrow the students in Prague are marching too." },
      s3: { who: 'peto', sk: 'Nes s nami transparent. A hovor pokojne – žiadne násilie. Pokoj je naša najväčšia sila.', en: 'Carry a banner with us. And keep calm – no violence. Calm is our greatest strength.' },
      s_after: { who: 'peto', sk: 'Ideme už o chvíľu!', en: "We're moving in a minute!" },

      e1: { who: 'kollar', sk: 'Ján Mráz, však? Tretí ročník, filozofická fakulta. Otec pracuje v chemickom závode. Vidíte, všetko o vás vieme.', en: "Ján Mráz, isn't it? Third year, Faculty of Arts. Your father works at the chemical plant. You see, we know everything about you.", next: 'e2' },
      e2: { who: 'kollar', sk: 'Mohli by sme si navzájom pomôcť. Napíšete nám, kto tieto… akcie organizuje. A štúdium dokončíte bez problémov. Aj otec bude mať pokoj.', en: "We could help each other. You'll write down who organises these… events. And you'll finish your studies without trouble. Your father will be left in peace too.",
        choices: [
          { sk: 'Nie. Nebudem udávať priateľov.', en: "No. I won't inform on my friends.", next: 'e3', fx: { courage: 2 }, flag: 'refused' },
          { sk: 'Musím si to premyslieť.', en: 'I need to think about it.', next: 'e4', flag: 'hesitated' },
        ] },
      e3: { who: 'kollar', sk: 'Škoda. Zapamätáme si to, Mráz. My si pamätáme všetko.', en: 'Pity. We will remember this, Mráz. We remember everything.' },
      e4: { who: 'kollar', sk: 'Premýšľajte. Tu je moje číslo. Ozvem sa sám.', en: "Think it over. Here's my number. I'll be in touch." },
      e_after: { who: 'kollar', sk: '…', en: '…' },

      k_wait: { who: 'katka', sk: 'Jano, ešte chvíľu. Porozprávaj sa s Peťom, vie, kadiaľ pôjdeme.', en: 'Jano, just a moment. Talk to Peťo, he knows the route.' },
      k1: { who: 'katka', sk: 'Ten chlap v koženom kabáte… rozprával sa s tebou. Čo chcel?', en: 'That man in the leather coat… he was talking to you. What did he want?',
        branch: (st) => (st.flags.refused ? 'k2a' : 'k2b') },
      k2a: { who: 'player', sk: 'Chcel, aby som udával. Odmietol som ho.', en: 'He wanted me to inform. I refused.', next: 'k3a' },
      k3a: { who: 'katka', sk: 'Si odvážnejší, než si myslíš. Takých ľudí teraz potrebujeme.', en: "You're braver than you think. That's the kind of people we need now.", fx: { trust: 1 }, next: 'k5' },
      k2b: { who: 'player', sk: 'Chcel, aby som pre nich písal. Povedal som, že si to premyslím.', en: 'He wanted me to write for them. I said I would think about it.', next: 'k3b' },
      k3b: { who: 'katka', sk: 'Jano… nikdy im nič nepodpisuj. Nikdy. Sľúb mi to.', en: 'Jano… never sign anything for them. Never. Promise me.',
        choices: [
          { sk: 'Sľubujem.', en: 'I promise.', next: 'k4b', fx: { trust: 1 }, flag: 'promised' },
          { sk: 'Ty nevieš, ako sa mi vyhrážal.', en: "You don't know how he threatened me.", next: 'k4c' },
        ] },
      k4b: { who: 'katka', sk: 'Verím ti.', en: 'I believe you.', next: 'k5' },
      k4c: { who: 'katka', sk: 'Viem. Vyhrážajú sa všetkým. Práve preto sme dnes tu.', en: "I know. They threaten everyone. That's exactly why we're here today.", next: 'k5' },
      k5: { who: 'katka', sk: 'Poďme. Pôjdeme pokojne – s kvetmi, nie s kameňmi.', en: "Let's go. We'll walk peacefully – with flowers, not stones.", sfx: 'crowd' },
      k_after: { who: 'katka', sk: 'Drž sa pri mne.', en: 'Stay close.' },
    },
    history: {
      sk: '16. novembra 1989, deň pred udalosťami na pražskej Národnej triede, sa v Bratislave konal pokojný pochod vysokoškolských študentov, ktorý smeroval k budove Ministerstva školstva. Študenti žiadali najmä slobodnejšie podmienky štúdia a dialóg. Na druhý deň, 17. novembra, zasiahla v Prahe pohotovostná polícia brutálne proti študentskému sprievodu – to spustilo Nežnú revolúciu. Štátna bezpečnosť (ŠtB) mala rozsiahlu sieť spolupracovníkov a nátlak na ich získavanie, aj medzi študentmi, bol bežný.',
      en: 'On 16 November 1989, the day before the events on Národní třída in Prague, university students in Bratislava held a peaceful march towards the Ministry of Education. They demanded mainly freer conditions of study and dialogue. The next day, 17 November, riot police in Prague brutally attacked a student procession – which triggered the Velvet Revolution. The State Security (ŠtB) ran an extensive network of informers, and pressure to recruit them, including among students, was common.',
    },
  },

  // ───────────────────────────── KAPITOLA 2 ─────────────────────────────
  {
    id: 'square',
    action: 'keys',
    brief: { sk: "Státisíce rúk vyťahujú z vreciek kľúče. Pridaj sa. Odzvoňte im.", en: "Hundreds of thousands of hands pull keys from their pockets. Join in. Ring them out." },
    scene: 'square',
    date: { sk: 'Koniec novembra 1989, večer', en: 'Late November 1989, evening' },
    place: { sk: 'Námestie SNP, Bratislava', en: 'SNP Square, Bratislava' },
    title: { sk: 'Námestie', en: 'The Square' },
    intro: {
      sk: 'Po 17. novembri sa všetko zmenilo. Študenti štrajkujú, divadlá štrajkujú. V Umeleckej besede vznikla Verejnosť proti násiliu. Každý večer sa Námestie SNP zapĺňa desaťtisícami ľudí. Sneží.',
      en: 'After 17 November everything changed. Students are on strike, theatres are on strike. Public Against Violence was founded at the Umelecká beseda. Every evening SNP Square fills with tens of thousands of people. It is snowing.',
    },
    objective: {
      sk: 'Prebij sa davom k tribúne, kde čaká Katka.',
      en: 'Make your way through the crowd to the stage where Katka is waiting.',
    },
    spawn: [0, 34],
    items: [{ id: 'cable', kind: 'drum', pos: [-22.4, 31], after: 'milan', flag: 'cable', name: { sk: 'Bubon s káblom', en: 'Cable drum' }, text: { sk: 'Máš kábel. Zanes ho Milanovi k tribúne.', en: 'You have the cable. Take it to Milan by the stage.' } }],
    npcs: [
      { // príde len vtedy, ak jej hráč v prológu pomohol vstať
        id: 'anna', name: { sk: 'Pani Anna', en: 'Mrs Anna' }, pos: [-3, 27], cond: (st) => !!st.flags.helpedAnna,
        look: { model: 'Business_Female_03', coat: 0x3b3550, pants: 0x2a2a2a, hair: 0xb8b8b8, hat: 'scarf', hatColor: 0x6b2a3a },
        voice: { g: 'f', pitch: 0.9, rate: 0.9 }, start: 'an1', after: 'an_after',
      },
      {
        id: 'igor', name: { sk: 'Herec Igor', en: 'Igor, actor' }, pos: [-7, 22],
        look: { model: 'Male_Adult_07', coat: 0x5b2a2a, pants: 0x222222, hair: 0x6b5a4a, hat: 'none', scarf: 0x1f5faa },
        voice: { g: 'm', pitch: 0.95, rate: 0.98 }, start: 'i1', after: 'i_after', required: true,
      },
      {
        id: 'otec', name: { sk: 'Otec', en: 'Dad' }, pos: [8, 18],
        look: { model: 'Male_Adult_03', coat: 0x46413a, pants: 0x2a2a2a, hair: 0x6a6a6a, hat: 'cap', hatColor: 0x353535 },
        voice: { g: 'm', pitch: 0.8, rate: 0.95 }, start: 'o1', after: 'o_after', required: true,
      },
      {
        id: 'milan', name: { sk: 'Zvukár Milan', en: 'Milan, sound man' }, pos: [14, -27],
        look: { model: 'Male_Adult_04', coat: 0x2f3b33, pants: 0x222226, hat: 'beret', hatColor: 0x2a2a2a },
        voice: { g: 'm', pitch: 1.0, rate: 1.06 }, required: true, after: 'm_after',
        quest: { need: 'cable', ask: 'm1', wait: 'm_wait', done: 'm3', hint: { sk: 'Nájdi bubon s káblom – ostal pri lampe vzadu na kraji námestia – a zanes ho zvukárovi Milanovi pri tribúne.', en: 'Find the cable drum – it was left by the lamp at the back edge of the square – and take it to Milan by the stage.' } },
      },
      {
        id: 'katka', name: { sk: 'Katka', en: 'Katka' }, pos: [3, -24],
        look: { model: 'Female_Adult_04', coat: 0x8a4b2a, pants: 0x2b2b3a, hair: 0x5a3018, hat: 'beret', hatColor: 0x1d2a4a, scarf: 0xe8e8e8 },
        voice: { g: 'f', pitch: 1.15, rate: 1.0 }, start: 'k1', wait: 'k_wait', after: 'k_after', final: true,
      },
    ],
    nodes: {
      m1: { who: 'milan', sk: "Hej, ty! Nevidel si niekde kábel? Mikrofón na tribúne onemel a o chvíľu má hovoriť Kňažko. Bez zvuku nás počuje prvých päť radov.", en: "Hey, you! Have you seen a cable anywhere? The microphone on the stage went dead and Kňažko is due to speak in a minute. Without sound only the first five rows can hear us.", choices: [{ sk: 'Pohľadám ho.', en: 'I will look for it.', fx: { trust: 1 }, next: 'm2' }, { sk: 'Kde si ho videl naposledy?', en: 'Where did you last see it?', next: 'm2' }] },
      m2: { who: 'milan', sk: "Bubon s káblom ostal pri lampe na kraji námestia, tam vzadu, odkiaľ si prišiel. Stotisíc ľudí čaká na jeden kábel.", en: "The cable drum was left by the lamp at the edge of the square, back there where you came from. A hundred thousand people are waiting for one cable." },
      m_wait: { who: 'milan', sk: "Bubon s káblom. Pri lampe vzadu na kraji námestia.", en: "The cable drum. By the lamp at the back edge of the square." },
      m3: { who: 'milan', sk: "To je on! Sekundu… Skúška, skúška. Ide to. Vieš, čo je na tom najkrajšie? Prvý raz po štyridsiatich rokoch sa tu do mikrofónu hovorí bez povolenia.", en: "That is it! One second… Testing, testing. It works. Do you know the best part? For the first time in forty years, somebody speaks into a microphone here without a permit.", fx: { courage: 1 }, sfx: 'mic', next: 'm4' },
      m4: { who: 'milan', sk: "Choď za tribúnu, tvoje dievča ťa tam hľadá.", en: "Go behind the stage, your girl is looking for you there." },
      m_after: { who: 'milan', sk: "Ide to. Počuť nás až na druhý koniec námestia.", en: "It works. They can hear us all the way across the square." },
      i1: { who: 'igor', sk: 'Dnes sa nehrá, mladý muž. Divadlá štrajkujú. Namiesto predstavení sa večer čo večer rozprávame s ľuďmi. Najväčšie predstavenie môjho života – a nikto v ňom nehrá.', en: "No show tonight, young man. The theatres are on strike. Instead of performing, we talk with people, night after night. The greatest show of my life – and nobody is acting.",
        choices: [
          { sk: 'Čo je Verejnosť proti násiliu?', en: 'What is Public Against Violence?', next: 'i2' },
          { sk: 'Prečo ľudia štrngajú kľúčmi?', en: 'Why are people jingling their keys?', next: 'i3' },
        ] },
      i2: { who: 'igor', sk: 'Vznikla pred pár dňami v Umeleckej besede. Herci, vedci, výtvarníci, študenti. Žiadne zbrane, žiadna nenávisť. Len verejnosť.', en: 'It was founded a few days ago at the Umelecká beseda. Actors, scientists, artists, students. No weapons, no hatred. Just the public.', next: 'i4' },
      i3: { who: 'igor', sk: 'To je zvonenie na rozlúčku. Súdruhovia, odzvonilo vám. Môžete ísť domov.', en: "It's the closing bell. Comrades, the bell has rung for you – you may go home.", sfx: 'keys', next: 'i4' },
      i4: { who: 'igor', sk: 'Katka je pri tribúne. Choď, len choď – a nestrácaj humor. Ten nám nemôžu zakázať.', en: "Katka is by the stage. Go on – and don't lose your sense of humour. That's one thing they can't ban." },
      an1: { who: 'anna', sk: 'Synku! To si ty, čo si ma vtedy v marci zdvihol zo zeme. Vidíš? Vtedy nás bolo pár tisíc. Dnes je nás plné námestie.', en: 'Son! You are the one who lifted me off the ground back in March. See? There were a few thousand of us then. Today the whole square is full.', fx: { trust: 1 } },
      an_after: { who: 'anna', sk: 'Nech ťa Pán Boh ochraňuje, synku.', en: 'God keep you, son.' },
      i_after: { who: 'igor', sk: 'Tribúna je rovno pred tebou!', en: 'The stage is straight ahead!' },

      o1: { who: 'otec', sk: 'Jano. Neboj sa, neprišiel som ťa ťahať domov.', en: "Jano. Don't worry, I didn't come to drag you home.", next: 'o2' },
      o2: { who: 'otec', sk: 'V šesťdesiatom ôsmom som videl tanky pri univerzite. Odvtedy som dvadsať rokov mlčal. Už nemôžem sedieť doma pri televízore.', en: "In sixty-eight I saw tanks by the university. For twenty years after that I kept quiet. I can't sit at home in front of the TV any more.",
        choices: [
          { sk: 'Som rád, že si tu, oci.', en: "I'm glad you're here, Dad.", next: 'o3', fx: { trust: 1 } },
          { sk: 'Nebojíš sa o prácu?', en: "Aren't you worried about your job?", next: 'o4' },
        ] },
      o3: { who: 'otec', sk: 'Mama ti posiela čaj v termoske. A odkazuje, že si máš dať čiapku.', en: 'Mum sent you tea in a thermos. And she says you should put your hat on.', next: 'o5' },
      o4: { who: 'otec', sk: 'Bojím sa. Ale v pondelok je generálny štrajk. Ak sa pridá celý závod, nemôžu vyhodiť všetkých.', en: "I am. But on Monday there's a general strike. If the whole plant joins, they can't fire everyone.", next: 'o5' },
      o5: { who: 'otec', sk: 'Choď za Katkou. Ja tu postojím s chlapmi z dielne.', en: "Go and find Katka. I'll stand here with the lads from the workshop." },
      o_after: { who: 'otec', sk: 'Daj na seba pozor, synak.', en: 'Take care of yourself, son.' },

      k_wait: { who: 'katka', sk: 'Jano! Videla som tvojho otca v dave – choď mu povedať ahoj. A Igor ťa hľadal.', en: 'Jano! I saw your dad in the crowd – go say hello. And Igor was looking for you.' },
      k1: { who: 'katka', sk: 'Si tu! Študenti dostali na dve minúty mikrofón. Chcem, aby si hovoril ty.', en: 'You made it! The students have the microphone for two minutes. I want you to speak.',
        choices: [
          { sk: 'Budem hovoriť o strachu.', en: "I'll talk about fear.", next: 'k2a', fx: { courage: 1 } },
          { sk: 'Budem hovoriť o slobode.', en: "I'll talk about freedom.", next: 'k2b', fx: { courage: 1 } },
          { sk: 'Nie, hovor ty, Katka. Ty to vieš lepšie.', en: 'No, you speak, Katka. You do it better.', next: 'k2c', fx: { trust: 1 } },
        ] },
      k2a: { who: 'player', sk: 'Dlhé roky sme sa báli. Báli sme sa na schôdzach, v škole, aj doma pri stole. Dnes večer sme strach nechali doma!', en: 'For years we were afraid. Afraid at meetings, at school, even at our own kitchen tables. Tonight we left our fear at home!', next: 'k3' },
      k2b: { who: 'player', sk: 'Nechceme nič viac, než čo patrí každému človeku: hovoriť pravdu, cestovať, voliť. Slobodné voľby!', en: 'We want nothing more than what belongs to every human being: to speak the truth, to travel, to vote. Free elections!', next: 'k3' },
      k2c: { who: 'katka', sk: 'Dobre. Ale stoj pri mne. – Priatelia! Nie sme tu proti nikomu. Sme tu za niečo. Za slobodu a za pravdu!', en: "All right. But stand by me. – Friends! We are not here against anyone. We are here for something. For freedom and for truth!", next: 'k3' },
      k3: { who: 'narrator', sk: 'Námestím sa nesie štrngot desaťtisícov kľúčov. Znie ako zvony.', en: 'The jingling of tens of thousands of keys fills the square. It sounds like bells.', sfx: 'keys', next: 'k4' },
      k4: { who: 'katka', sk: 'Počuješ to, Jano? Toto už nikto nezastaví.', en: "Do you hear that, Jano? Nobody can stop this now." },
      k_after: { who: 'katka', sk: 'Bol si skvelý.', en: 'You were great.' },
    },
    history: {
      sk: '19. novembra 1989 vznikla v bratislavskej Umeleckej besede Verejnosť proti násiliu (VPN) – slovenský náprotivok pražského Občianskeho fóra. Medzi jej zakladateľmi boli umelci, vedci a aktivisti. Od 20. novembra sa na Námestí SNP konali každodenné mítingy, na ktoré prichádzali desaťtisíce ľudí. Štrnganie kľúčmi sa stalo symbolom revolúcie – „zvonením“ ľudia dávali najavo, že komunistickej moci odzvonilo. Študenti a divadlá vstúpili do štrajku.',
      en: 'On 19 November 1989, Public Against Violence (VPN) was founded at the Umelecká beseda in Bratislava – the Slovak counterpart of Prague\'s Civic Forum. Its founders included artists, scientists and activists. From 20 November onwards, daily rallies took place on SNP Square, attended by tens of thousands of people. Jingling keys became a symbol of the revolution – a “ringing bell” telling the communist rulers that their time was up. Students and theatres went on strike.',
    },
  },

  // ───────────────────────────── KAPITOLA 3 ─────────────────────────────
  {
    id: 'strike',
    action: 'siren',
    brief: { sk: "O chvíľu je poludnie. Niekto musí spustiť sirénu, aby celý závod vedel, že štrajk sa začal.", en: "It is almost noon. Somebody has to sound the siren so the whole plant knows the strike has begun." },
    scene: 'strike',
    date: { sk: '27. novembra 1989, 11:50', en: '27 November 1989, 11:50 am' },
    place: { sk: 'Chemický závod na okraji Bratislavy', en: 'A chemical plant on the edge of Bratislava' },
    title: { sk: 'Generálny štrajk', en: 'The General Strike' },
    intro: {
      sk: 'Študenti chodia po fabrikách a vysvetľujú, čo sa stalo v Prahe. Dnes o dvanástej má začať dvojhodinový generálny štrajk. Režim tvrdí, že robotníci sú na jeho strane. Prišiel som do závodu, kde pracuje otec.',
      en: 'Students are going from factory to factory explaining what happened in Prague. Today at noon a two-hour general strike is due to begin. The regime claims the workers are on its side. I have come to the plant where my father works.',
    },
    objective: {
      sk: 'Presvedč robotníkov. O dvanástej nájdi otca pri hale.',
      en: 'Win over the workers. At noon, find your father by the hall.',
    },
    spawn: [0, 24],
    items: [{ id: 'ribbons', kind: 'box', pos: [-19.6, 13.6], after: 'jozef', flag: 'ribbons', name: { sk: 'Krabica s trikolórami', en: 'Box of tricolour ribbons' }, text: { sk: 'Máš trikolóry. Zanes ich vrátnikovi Jozefovi.', en: 'You have the ribbons. Take them to Jozef.' } }],
    npcs: [
      {
        id: 'ondrej', name: { sk: 'Majster Ondrej', en: 'Foreman Ondrej' }, pos: [-9, 4],
        look: { model: 'Construction_Male_02', coat: 0x2b3f63, pants: 0x2b3f63, hair: 0x555555, hat: 'cap', hatColor: 0x2b3f63 },
        voice: { g: 'm', pitch: 0.72, rate: 0.95 }, start: 'n1', after: 'n_after', required: true,
      },
      {
        id: 'zuzka', name: { sk: 'Zuzka z dielne', en: 'Zuzka from the workshop' }, pos: [9, 0],
        look: { model: 'Female_Adult_15', coat: 0x7a8a9a, pants: 0x3a4a5a, hair: 0x8a5a2a, hat: 'scarf', hatColor: 0xc0392b },
        voice: { g: 'f', pitch: 1.05, rate: 1.05 }, start: 'z1', after: 'z_after', required: true,
      },
      {
        id: 'jozef', name: { sk: 'Vrátnik Jozef', en: 'Jozef, gatekeeper' }, pos: [13, 10],
        look: { model: 'Construction_Male_03', coat: 0x3a4a5a, pants: 0x2b3038 },
        voice: { g: 'm', pitch: 0.82, rate: 0.92 }, required: true, after: 'j_after',
        quest: { need: 'ribbons', ask: 'j1', wait: 'j_wait', done: 'j3', hint: { sk: 'Dones vrátnikovi Jozefovi krabicu s trikolórami – je pri modrom nákladnom aute.', en: 'Bring gatekeeper Jozef the box of tricolour ribbons – it is by the blue lorry.' } },
      },
      {
        id: 'otec', name: { sk: 'Otec', en: 'Dad' }, pos: [0, -15],
        look: { model: 'Male_Adult_03', coat: 0x2b3f63, pants: 0x2b3f63, hair: 0x6a6a6a, hat: 'cap', hatColor: 0x353535 },
        voice: { g: 'm', pitch: 0.8, rate: 0.95 }, start: 'o1', wait: 'o_wait', after: 'o_after', final: true,
      },
    ],
    nodes: {
      j1: { who: 'jozef', sk: "Stoj, mladý. Vieš, koľko rokov tu otváram bránu? Tridsaťjeden. A ani raz som nevidel, aby robotníci vyšli na dvor sami od seba.", en: "Hold on, young man. Do you know how many years I have been opening this gate? Thirty-one. And not once have I seen the workers walk out into the yard of their own accord.", next: 'j2' },
      j2: { who: 'jozef', sk: "Ženy z expedície nastrihali trikolóry. Krabica ostala pri modrom nákladnom aute. Dones ju, nech má každý na kabáte, za čo tu stojí.", en: "The women from dispatch cut tricolour ribbons. The box was left by the blue lorry. Bring it, so everyone can wear on their coat what they stand here for." },
      j_wait: { who: 'jozef', sk: "Krabica s trikolórami je pri modrom nákladiaku.", en: "The box of ribbons is by the blue lorry." },
      j3: { who: 'jozef', sk: "Tak. Pripni si aj ty. Hovorili nám, že študenti sú chuligáni a robotník s nimi nejde. Dnes na poludnie uvidia, s kým robotník ide.", en: "There. Pin one on yourself, too. They told us the students were hooligans and that the workers were not with them. At noon today they will see who the workers are with.", fx: { courage: 1 } },
      j_after: { who: 'jozef', sk: "O dvanástej zatvorím bránu. Zvnútra.", en: "At twelve I will close the gate. From the inside." },
      n1: { who: 'ondrej', sk: 'Ďalší študentík z mesta. Vy ste si to začali a my máme prísť o prácu? Mám tri deti.', en: "Another student from town. You started this, and now we're supposed to lose our jobs? I've got three kids.",
        choices: [
          { sk: 'Nikto nechce, aby ste prišli o prácu. Chceme, aby ste sa mohli slobodne rozhodovať.', en: "Nobody wants you to lose your job. We want you to be free to decide for yourselves.", next: 'n2', fx: { trust: 1 } },
          { sk: 'Ak sa nepridáte, zostane všetko po starom. Aj pre vaše deti.', en: "If you don't join, everything stays the way it was. For your kids too.", next: 'n3', fx: { courage: 1 } },
        ] },
      n2: { who: 'ondrej', sk: 'Slobodne… To slovo som roky nahlas nepočul. Dobre. O dvanástej vypnem linku. Ale len na dve hodiny!', en: "Freely… I haven't heard that word said out loud in years. All right. At noon I'll shut down the line. But only for two hours!", flag: 'ondrej' },
      n3: { who: 'ondrej', sk: 'Po starom… aspoň viem, čo ma čaká. Ale moje deti… Hm. Uvidíme, čo urobia chlapi.', en: "The old way… at least I know what to expect. But my kids… Hm. We'll see what the lads do.", flag: 'ondrej' },
      n_after: { who: 'ondrej', sk: 'Ešte desať minút.', en: 'Ten more minutes.' },

      z1: { who: 'zuzka', sk: 'Ty si Michalov syn? Celá naša zmena ide o dvanástej von! Ušila som trikolóru z obrusov z jedálne.', en: "You're Michal's son? Our whole shift is walking out at noon! I sewed a tricolour out of the canteen tablecloths.",
        choices: [
          { sk: 'Prečo štrajkujete?', en: 'Why are you striking?', next: 'z2' },
          { sk: 'Neboja sa ostatní?', en: "Aren't the others afraid?", next: 'z3' },
        ] },
      z2: { who: 'zuzka', sk: 'Moja dcéra študuje v Prahe. Sedemnásteho bola na Národnej. Mohli ju zbiť. Dnes nebudem stáť pri stroji.', en: "My daughter studies in Prague. On the seventeenth she was on Národní. They could have beaten her. Today I won't be standing at my machine.", fx: { trust: 1 } },
      z3: { who: 'zuzka', sk: 'Boja sa. Riaditeľ ráno hovoril, že štrajk je nezákonný. Ale keď pôjdeme všetci, nebude mať koho potrestať.', en: "They are. This morning the director said the strike is illegal. But if we all go, there'll be nobody left to punish." },
      z_after: { who: 'zuzka', sk: 'O dvanástej, nezabudni!', en: "Noon, don't forget!" },

      o_wait: { who: 'otec', sk: 'Jano, čo tu robíš? Chlapi ešte váhajú. Porozprávaj sa s Ondrejom – jeho budú počúvať.', en: "Jano, what are you doing here? The lads are still hesitating. Talk to Ondrej – they'll listen to him." },
      o1: { who: 'otec', sk: 'O chvíľu je dvanásť. Chlapi čakajú na znamenie.', en: "It's almost noon. The lads are waiting for the signal.", next: 'o2' },
      o2: { who: 'otec', sk: 'Závodnú sirénu však nemá kto spustiť – majster, čo ju mal na starosti, ostal doma. Presne o dvanástej ju treba pustiť ručne. Ani skôr, ani neskôr.', en: 'But there is nobody to sound the plant siren – the foreman in charge of it stayed at home. It has to be set off by hand at exactly twelve. Not sooner, not later.',
        branch: (st) => (st.stats.trust >= 3 ? 'o3a' : 'o3b') },
      o3a: { who: 'otec', sk: 'Aj Ondrej sa pridá. Pozri – celá zmena čaká. Si dobrý chlapec, Jano. Mama bude hrdá.', en: "Even Ondrej will join. Look – the whole shift is waiting. You're a good lad, Jano. Your mum will be proud.", next: 'o4' },
      o3b: { who: 'otec', sk: 'Nie všetci sa pridajú. Niektorí sa ešte boja. Ale je nás viac, než som čakal.', en: "Not everyone will join. Some are still scared. But there are more of us than I expected.", next: 'o4' },
      o4: { who: 'otec', sk: 'Dvadsať rokov som mlčal. Dnes zmĺkne fabrika – a bude to najhlasnejšie, čo som kedy počul. Bež k siréne, Jano.', en: "I kept quiet for twenty years. Today the factory falls silent – and it will be the loudest thing I've ever heard. Run to the siren, Jano." },
      o_after: { who: 'otec', sk: 'Dve hodiny. Potom ideme späť k strojom – ale už ako slobodní ľudia.', en: "Two hours. Then back to the machines – but as free people." },
    },
    history: {
      sk: '27. novembra 1989 od 12:00 do 14:00 prebehol v celom Československu generálny štrajk. Zapojila sa podľa odhadov väčšina obyvateľov – továrne, úrady, školy aj obchody. Štrajk ukázal, že revolúciu nepodporujú len študenti a umelci, ale aj robotníci, na ktorých sa režim odvolával. O dva dni neskôr, 29. novembra, Federálne zhromaždenie vypustilo z ústavy článok o vedúcej úlohe Komunistickej strany.',
      en: 'On 27 November 1989, from 12:00 to 14:00, a general strike took place across Czechoslovakia. By most estimates, a majority of the population took part – factories, offices, schools and shops. The strike showed that the revolution was backed not only by students and artists but also by the workers the regime claimed to represent. Two days later, on 29 November, the Federal Assembly removed the article on the leading role of the Communist Party from the constitution.',
    },
  },

  // ───────────────────────────── KAPITOLA 4 ─────────────────────────────
  {
    id: 'border',
    action: 'wire',
    brief: { sk: "Drôt, ktorý štyridsať rokov delil Európu, je pár krokov od teba. Dnes ho už nikto nestráži. Katka ti podáva kliešte.", en: "The wire that divided Europe for forty years is a few steps away. Today nobody guards it any more. Katka hands you the cutters." },
    scene: 'border',
    date: { sk: '10. decembra 1989', en: '10 December 1989' },
    place: { sk: 'Hranica Petržalka – Berg, smer Hainburg', en: 'Petržalka – Berg border, towards Hainburg' },
    title: { sk: 'Ahoj, Európa', en: 'Hello, Europe' },
    intro: {
      sk: 'Štyridsať rokov delil Petržalku od Rakúska ostnatý drôt. Dnes je nedeľa a desaťtisíce Bratislavčanov sa vybrali pešo do rakúskeho Hainburgu. Bez povolenia na vycestovanie. Len tak – na prechádzku.',
      en: 'For forty years barbed wire separated Petržalka from Austria. Today is Sunday, and tens of thousands of people from Bratislava are walking to Hainburg in Austria. Without exit permits. Just like that – for a stroll.',
    },
    objective: {
      sk: 'Dôjdi k hranici. Katka čaká pri drôte.',
      en: 'Walk to the border. Katka is waiting by the wire.',
    },
    spawn: [0, 44],
    items: [{ id: 'photo', kind: 'paper', pos: [6.2, 25], after: 'rudolf', flag: 'photo', name: { sk: 'Stará fotografia', en: 'Old photograph' }, text: { sk: 'Našiel si fotografiu. Vráť ju pánovi Rudolfovi.', en: 'You found the photograph. Return it to Mr Rudolf.' } }],
    npcs: [
      {
        id: 'guard', name: { sk: 'Pohraničník', en: 'Border guard' }, pos: [7.5, 3.5],
        look: { model: 'Military_Male_05', coat: 0x4f5b3a, pants: 0x4f5b3a, hair: 0x3a3a3a, hat: 'ushanka', hatColor: 0x4f5b3a },
        voice: { g: 'm', pitch: 0.82, rate: 0.92 }, start: 'g1', after: 'g_after', required: true,
      },
      {
        id: 'gerti', name: { sk: 'Gerti z Hainburgu', en: 'Gerti from Hainburg' }, pos: [-0.7, -1.9],
        look: { model: 'Female_Adult_14', coat: 0x2e6b3a, pants: 0x333333, hair: 0xd8c08a, hat: 'none', scarf: 0xd8d8d8 },
        voice: { g: 'f', pitch: 1.0, rate: 1.0 }, start: 'r1', after: 'r_after', required: true,
      },
      {
        id: 'rudolf', name: { sk: 'Pán Rudolf', en: 'Mr Rudolf' }, pos: [-6.5, 22],
        look: { model: 'Business_Male_02', coat: 0x3a3632, pants: 0x2a2a2a, hat: 'fedora', hatColor: 0x2e2a26, scarf: 0x6a2a2a },
        voice: { g: 'm', pitch: 0.8, rate: 0.9 }, required: true, after: 'ru_after',
        quest: { need: 'photo', ask: 'ru1', wait: 'ru_wait', done: 'ru3', hint: { sk: 'Nájdi v snehu pri ceste fotografiu, ktorú stratil pán Rudolf.', en: 'Find the photograph Mr Rudolf lost in the snow by the road.' } },
      },
      {
        id: 'katka', name: { sk: 'Katka', en: 'Katka' }, pos: [0.7, 2.3],
        look: { model: 'Female_Adult_04', coat: 0x8a4b2a, pants: 0x2b2b3a, hair: 0x5a3018, hat: 'beret', hatColor: 0x1d2a4a, scarf: 0xe8e8e8 },
        voice: { g: 'f', pitch: 1.15, rate: 1.0 }, start: 'k1', wait: 'k_wait', after: 'k_after', final: true,
      },
    ],
    nodes: {
      ru1: { who: 'rudolf', sk: "Prepáčte, mladý muž… vypadla mi fotografia. Niekde tu v snehu pri ceste. Bez okuliarov ju nenájdem.", en: "Excuse me, young man… I dropped a photograph. Somewhere here in the snow by the road. I cannot find it without my glasses.", next: 'ru2' },
      ru2: { who: 'rudolf', sk: "Je na nej moja sestra. V štyridsiatom ôsmom ostala na druhej strane. Štyridsaťjeden rokov som ju videl len na tom papieri.", en: "It shows my sister. In 1948 she stayed on the other side. For forty-one years I have seen her only on that piece of paper." },
      ru_wait: { who: 'rudolf', sk: "Fotografia… musela mi vypadnúť pri ceste, na druhej strane.", en: "The photograph… I must have dropped it by the road, on the other side." },
      ru3: { who: 'rudolf', sk: "To je ona. Marta. Býva v Hainburgu, odtiaľto je to pár kilometrov. Pár kilometrov a štyridsaťjeden rokov.", en: "That is her. Marta. She lives in Hainburg, a few kilometres from here. A few kilometres and forty-one years.", fx: { trust: 1 }, next: 'ru4' },
      ru4: { who: 'rudolf', sk: "Dnes tam prejdem peši. Poďte, nech na to nie som sám.", en: "Today I will walk there. Come, so that I am not alone in it." },
      ru_after: { who: 'rudolf', sk: "Pár kilometrov. Dnes ich prejdem.", en: "A few kilometres. Today I will walk them." },
      g1: { who: 'guard', sk: 'Dvadsať rokov som strážil tento drôt. Mali sme rozkaz zastaviť každého, kto by chcel prejsť. Za každú cenu.', en: 'For twenty years I guarded this wire. Our orders were to stop anyone who tried to cross. At any cost.',
        choices: [
          { sk: 'Ľutujete niečo?', en: 'Do you regret anything?', next: 'g2' },
          { sk: 'A dnes?', en: 'And today?', next: 'g3' },
        ] },
      g2: { who: 'guard', sk: 'Každý deň. Pri tomto drôte zomierali ľudia. Choď, chlapče. Svet je tam – a je aj tvoj.', en: "Every day. People died at this wire. Go on, lad. The world is over there – and it's yours too." },
      g3: { who: 'guard', sk: 'Dnes len stojím a pozerám sa. Prvýkrát v živote ma nikto nenúti ani strieľať, ani mlčať.', en: "Today I just stand and watch. For the first time in my life nobody is making me shoot or keep quiet." },
      g_after: { who: 'guard', sk: 'Pokojnú cestu.', en: 'Safe journey.' },

      r1: { who: 'gerti', sk: 'Grüß Gott! Vitajte, susedia! Celý Hainburg čaká s teplým čajom. Toľko rokov sme sa na vás len pozerali cez drôt.', en: "Grüß Gott! Welcome, neighbours! All of Hainburg is waiting with hot tea. For so many years we could only look at you through the wire.",
        choices: [
          { sk: 'Ďakujeme. Je to ako sen.', en: "Thank you. It's like a dream.", next: 'r2', fx: { trust: 1 } },
          { sk: 'Ako vyzerá Viedeň?', en: 'What is Vienna like?', next: 'r3' },
        ] },
      r2: { who: 'gerti', sk: 'Nie je to sen. Sme len pár kilometrov od seba. Vždy sme boli.', en: "It's not a dream. We're only a few kilometres apart. We always were." },
      r3: { who: 'gerti', sk: 'Príďte sa pozrieť sami. Už vás nikto nezastaví. Viedeň je hodinu odtiaľto!', en: "Come and see for yourselves. Nobody will stop you now. Vienna is an hour from here!" },
      r_after: { who: 'gerti', sk: 'Willkommen! Vitajte!', en: 'Willkommen! Welcome!' },

      k_wait: { who: 'katka', sk: 'Jano! Poď sem! Ale najprv sa pozdrav s ľuďmi – dnes sa zdravíme so všetkými.', en: 'Jano! Over here! But say hello to people first – today we greet everyone.' },
      k1: { who: 'katka', sk: 'Pamätáš na sviečky na Hviezdoslavovom? Vtedy nás bolo pár tisíc a polievali nás vodou. Dnes kráča celé mesto.', en: 'Remember the candles on Hviezdoslav Square? There were a few thousand of us and they hosed us down. Today the whole city is walking.',
        branch: (st) => (st.flags.hesitated && !st.flags.promised ? 'k2h' : 'k2') },
      k2h: { who: 'katka', sk: 'A ten muž v koženom kabáte… zavolal ti ešte?', en: 'And that man in the leather coat… did he ever call you?', next: 'k2h2' },
      k2h2: { who: 'player', sk: 'Nie. Už nezavolá nikomu.', en: "No. He won't be calling anyone any more.", next: 'k2' },
      k2: { who: 'katka', sk: 'A čo teraz, Jano? Čo budeš robiť, keď už naozaj môžeš všetko?', en: 'So what now, Jano? What will you do, now that you really can do anything?',
        choices: [
          { sk: 'Pôjdem do sveta. A potom sa vrátim domov.', en: "I'll see the world. And then I'll come back home.", next: 'k3a' },
          { sk: 'Budem sa starať, aby sa sem strach už nevrátil.', en: "I'll make sure fear never comes back here.", next: 'k3b', fx: { courage: 1 } },
          { sk: 'Neviem. Ale chcem to robiť s tebou.', en: "I don't know. But I want to do it with you.", next: 'k3c', fx: { trust: 1 } },
        ] },
      k3a: { who: 'katka', sk: 'Tak sa vráť. Bude ťa tu treba.', en: "Then come back. You'll be needed here.", next: 'k4' },
      k3b: { who: 'katka', sk: 'Sloboda nie je darček, Jano. Treba ju chrániť každý deň.', en: "Freedom isn't a gift, Jano. It has to be protected every day.", next: 'k4' },
      k3c: { who: 'katka', sk: 'Tak poď. Máme pred sebou celú Európu.', en: "Then come on. We have the whole of Europe ahead of us.", next: 'k4' },
      k4: { who: 'narrator', sk: 'V ten istý deň prezident Husák vymenoval vládu národného porozumenia a abdikoval. Vykročili sme po ceste, cez ktorú bol ešte pred chvíľou natiahnutý drôt. Ahoj, Európa.', en: 'That same day President Husák appointed a government of national understanding and resigned. We set off down a road that had been strung with wire only a moment before. Hello, Europe.' },
      k_after: { who: 'katka', sk: 'Ideme ďalej?', en: 'Shall we keep going?' },
    },
    history: {
      sk: '10. decembra 1989 sa uskutočnila akcia „Ahoj, Európa“ – desaťtisíce ľudí prešli pešo z bratislavskej Petržalky cez hraničný priechod Petržalka – Berg do rakúskeho Hainburgu. Bolo to symbolické „prestrihnutie“ železnej opony, pri ktorej počas komunizmu zahynuli desiatky ľudí, ktorí sa ju pokúšali prekročiť. V ten istý deň Gustáv Husák vymenoval vládu národného porozumenia na čele s Mariánom Čalfom a vzdal sa funkcie prezidenta. 28. decembra sa Alexander Dubček stal predsedom Federálneho zhromaždenia a 29. decembra bol Václav Havel zvolený za prezidenta.',
      en: 'On 10 December 1989 the “Hello, Europe” (Ahoj, Európa) event took place – tens of thousands of people walked from Bratislava\'s Petržalka district through the Petržalka – Berg crossing to Hainburg in Austria. It was a symbolic “cutting” of the Iron Curtain, where dozens of people were killed trying to cross during communism. That same day, Gustáv Husák appointed a government of national understanding led by Marián Čalfa and resigned as president. On 28 December Alexander Dubček became chairman of the Federal Assembly, and on 29 December Václav Havel was elected president.',
    },
  },
];

export function epilogue(state, lang) {
  const { courage, trust } = state.stats;
  const f = state.flags;
  const sk = [], en = [];
  if (f.refused) {
    sk.push('Jano nikdy nič nepodpísal. Keď sa v deväťdesiatych rokoch otvorili zväzky ŠtB, našiel v nich svoje meno – ako „nespoľahlivý element“. Bol na to hrdý.');
    en.push('Jano never signed anything. When the ŠtB files were opened in the 1990s, he found his name in them – listed as an “unreliable element”. He was proud of it.');
  } else if (f.promised) {
    sk.push('Jano dodržal sľub. Číslo muža v koženom kabáte spálil v kachliach ešte v ten novembrový večer.');
    en.push('Jano kept his promise. He burned the number of the man in the leather coat in the stove that same November evening.');
  } else {
    sk.push('Číslo muža v koženom kabáte Jano dlho nosil v peňaženke. Nikdy nezavolal. Ale ten pocit, že váhal, si pamätá dodnes.');
    en.push('Jano carried the leather-coat man\'s number in his wallet for a long time. He never called. But he still remembers the feeling of having hesitated.');
  }
  if (f.helpedAnna) {
    sk.push('Pani Anna sa dožila slobody. Sviečku z toho marcového večera mala do smrti položenú na kredenci – vedľa fotky chlapca, ktorý ju zdvihol z mokrej dlažby.');
    en.push('Mrs Anna lived to see freedom. Until she died, the candle from that March evening stood on her sideboard – next to a photo of the boy who lifted her from the wet cobblestones.');
  }
  if (f.caught) {
    sk.push('V zväzku je aj záznam zo 16. novembra: „Rozširoval tlačoviny pred univerzitou.“ Dnes ho má zarámovaný.');
    en.push('The file also holds an entry from 16 November: “Distributed printed matter outside the university.” Today he keeps it framed.');
  }
  if (f.keysRang && f.sirenOnTime) {
    sk.push('Keď dnes počuje poludňajšiu sirénu alebo štrngot kľúčov, na chvíľu zastane. Vtedy tým zvukom dával takt celému námestiu.');
    en.push('When he hears a noon siren or the jingle of keys today, he stops for a moment. Back then he set the rhythm for a whole square with those sounds.');
  }
  if (f.wire) {
    sk.push('Kúsok ostnatého drôtu z Bergu má dodnes v zásuvke písacieho stola.');
    en.push('He still keeps the piece of barbed wire from Berg in his desk drawer.');
  }
  if (courage >= 4) {
    sk.push('V júni 1990 bol volebným komisárom v prvých slobodných voľbách od roku 1946.');
    en.push('In June 1990 he served on an electoral commission in the first free elections since 1946.');
  } else {
    sk.push('V júni 1990 išiel prvýkrát v živote voliť naozaj slobodne. Spolu s otcom.');
    en.push('In June 1990 he voted, truly freely, for the first time in his life. Together with his father.');
  }
  if (trust >= 4) {
    sk.push('S Katkou zostali spolu. Každý rok 17. novembra zapália sviečku – a zaštrngajú kľúčmi.');
    en.push('He and Katka stayed together. Every year on 17 November they light a candle – and jingle their keys.');
  } else {
    sk.push('Katka odišla študovať do zahraničia. Píšu si dodnes. Každý rok 17. novembra jej pošle fotku sviečky.');
    en.push('Katka went abroad to study. They still write to each other. Every year on 17 November he sends her a photo of a candle.');
  }
  sk.push('1. januára 1993 vznikla samostatná Slovenská republika. Sloboda, za ktorú stáli na námestiach, nie je samozrejmosť – treba ju chrániť každý deň.');
  en.push('On 1 January 1993 the independent Slovak Republic was born. The freedom they stood for in the squares is not to be taken for granted – it has to be protected every day.');
  return (lang === 'sk' ? sk : en).join('\n\n');
}
