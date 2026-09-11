// ---------------------------------------------------------------------------
// TB GAME — PART 1: FINDING OUT (the cough, the doctor, the test, the house)
// ---------------------------------------------------------------------------
// Every screen of the game lives here as one Scene. The wording follows the
// tb.care "Simplified Hindi" text and the tb.care module list as closely as a
// spoken game line can — see docs/tb-game.md for which module each scene comes
// from, and for the statistics behind the numbers in `effect`.
//
// House rules for writing a scene:
//   * one idea per scene, said in one short spoken line
//   * 2-4 options, each with its own picture, so the game reads without letters
//   * every option teaches one TRUE fact (`result.factHi`) — right or wrong
//   * the medically correct choice must also be the winning choice
// ---------------------------------------------------------------------------

import type { Scene } from "../types";

export const SCENES_DIAGNOSIS: Scene[] = [
  // -- Chapter 1: the cough that will not go -------------------------------
  {
    id: "s_cough",
    art: "cough",
    hi: "दो हफ़्ते हो गए। खाँसी जा ही नहीं रही। रात में पसीना आता है।",
    subHi: "क्या करें?",
    options: [
      {
        id: "wait",
        hi: "कुछ नहीं — अपने आप ठीक हो जाएगी",
        icon: "wait",
        effect: { health: -1, exposeAll: 10 },
        result: {
          tone: "bad",
          hi: "एक महीना और निकल गया। खाँसी बढ़ गई और वज़न घटने लगा।",
          factHi:
            "दो हफ़्ते से ज़्यादा खाँसी, बुखार, रात में पसीना या वज़न कम होना — इनमें से कोई भी हो तो टीबी हो सकती है। इंतज़ार करने से टीबी अपने आप नहीं जाती।",
          icon: "wait",
        },
        next: "s_cough2",
      },
      {
        id: "syrup",
        hi: "दवा दुकान से खाँसी का सिरप ले लो",
        icon: "chemist",
        effect: { health: -1, money: -1, exposeAll: 10 },
        result: {
          tone: "bad",
          hi: "सिरप से दो दिन आराम मिला, फिर खाँसी वापस आ गई। पैसे भी गए।",
          factHi:
            "खाँसी के सिरप और बुखार की दवा से थोड़ा आराम लगता है, पर टीबी के कीटाणु नहीं मरते। टीबी सिर्फ़ पूरी टीबी दवा से ठीक होती है।",
          icon: "chemist",
        },
        next: "s_cough2",
      },
      {
        id: "clinic",
        hi: "सरकारी अस्पताल में डॉक्टर को दिखाओ",
        icon: "clinic",
        effect: { health: 1 },
        result: {
          tone: "good",
          hi: "आप सरकारी अस्पताल पहुँच गए। डॉक्टर ने आपकी बात ध्यान से सुनी।",
          factHi:
            "सरकारी अस्पताल में टीबी की जाँच और इलाज पूरी तरह मुफ़्त है। जितनी जल्दी जाँच, उतनी जल्दी ठीक।",
          icon: "clinic",
        },
        next: "s_ask",
      },
    ],
  },

  {
    id: "s_ask",
    art: "clinic",
    hi: "डॉक्टर के सामने आपका नंबर आ गया है।",
    subHi: "आप क्या कहेंगे?",
    options: [
      {
        id: "askTb",
        hi: "पूछो — “क्या यह टीबी हो सकती है?”",
        icon: "talk",
        effect: { setFlags: ["askedTb"] },
        result: {
          tone: "good",
          hi: "डॉक्टर ने कहा — अच्छा किया जो पूछा। बलगम की जाँच करवाते हैं।",
          factHi:
            "डॉक्टर को दिखाएँ तो ज़रूर पूछिए “क्या यह टीबी हो सकती है?”। यह एक सवाल महीनों की देरी बचा सकता है।",
          icon: "talk",
        },
        next: "s_sputum",
      },
      {
        id: "onlyFever",
        hi: "सिर्फ़ बुखार-खाँसी की दवा माँगो",
        icon: "pill",
        effect: { health: -1, exposeAll: 8 },
        result: {
          tone: "mixed",
          hi: "दवा मिल गई। तीन हफ़्ते बाद खाँसी और तेज़ हो गई।",
          factHi:
            "बुखार और खाँसी की दवा लक्षण दबा देती है, पर टीबी अंदर बढ़ती रहती है और हवा से दूसरों तक जाती रहती है।",
          icon: "pill",
        },
        next: "s_cough2",
      },
      {
        id: "shy",
        hi: "शरमा कर चुप रहो",
        icon: "hide",
        effect: { health: -1, exposeAll: 8 },
        result: {
          tone: "bad",
          hi: "आप बिना कुछ कहे लौट आए। खाँसी चलती रही।",
          factHi:
            "टीबी किसी को भी हो सकती है — अमीर, गरीब, बच्चा, बूढ़ा। इसमें शर्म की कोई बात नहीं। हम सब साँस लेते हैं, इसलिए हम सबको टीबी हो सकती है।",
          icon: "hide",
        },
        next: "s_cough2",
      },
    ],
  },

  {
    id: "s_cough2",
    art: "coughBlood",
    hi: "अब खाँसी में खून आ रहा है। कपड़े ढीले हो गए हैं।",
    subHi: "अब कहाँ जाएँ?",
    options: [
      {
        id: "quack",
        hi: "गाँव वाले “डॉक्टर” से इंजेक्शन लगवाओ",
        icon: "quack",
        effect: { health: -1, money: -2, exposeAll: 10 },
        result: {
          tone: "bad",
          hi: "तीन इंजेक्शन लगे, पैसे लगे, पर खाँसी वहीं की वहीं।",
          factHi:
            "बिना डिग्री वाले “डॉक्टर” के इंजेक्शन से टीबी नहीं जाती। टीबी की जाँच बलगम से होती है और इलाज गोलियों से।",
          icon: "quack",
        },
        next: "s_cough3",
      },
      {
        id: "private",
        hi: "प्राइवेट अस्पताल जाओ",
        icon: "privateClinic",
        effect: { money: -3, setFlags: ["privateCare"] },
        result: {
          tone: "mixed",
          hi: "जाँच हुई और टीबी निकली — पर जाँच और दवा का बिल भारी है।",
          factHi:
            "प्राइवेट में वही टीबी की दवा हज़ारों रुपये की पड़ती है। सरकारी अस्पताल और डॉट्स सेंटर में वही जाँच और वही दवा मुफ़्त मिलती है।",
          icon: "money",
        },
        next: "s_result",
      },
      {
        id: "clinic",
        hi: "सरकारी अस्पताल जाओ",
        icon: "clinic",
        effect: {},
        result: {
          tone: "good",
          hi: "डॉक्टर ने कहा — बलगम की जाँच करवाइए, यह टीबी हो सकती है।",
          factHi:
            "देर हो चुकी है, पर अब भी इलाज से टीबी पूरी तरह ठीक हो सकती है। जाँच और दवा मुफ़्त है।",
          icon: "clinic",
        },
        next: "s_sputum",
      },
    ],
  },

  {
    id: "s_cough3",
    art: "weak",
    hi: "अब चलने में भी साँस फूलती है। काम पर जाना बंद हो गया।",
    subHi: "यह आख़िरी मौका है।",
    options: [
      {
        id: "clinic",
        hi: "सरकारी अस्पताल जाओ",
        icon: "clinic",
        effect: { health: -1 },
        result: {
          tone: "good",
          hi: "घरवाले आपको अस्पताल ले गए। डॉक्टर ने तुरंत बलगम की जाँच लिखी।",
          factHi:
            "देर से इलाज शुरू होने पर पूरी तरह ठीक होना मुश्किल हो जाता है — पर इलाज न करने से तो जान ही चली जाती है।",
          icon: "clinic",
        },
        next: "s_sputum",
      },
      {
        id: "home",
        hi: "घर पर ही पड़े रहो",
        icon: "rest",
        effect: { health: -4, exposeAll: 25 },
        result: {
          tone: "bad",
          hi: "हालत रोज़ बिगड़ती गई। घर के लोग भी खाँसने लगे।",
          factHi:
            "बिना इलाज की फेफड़ों की टीबी से हर तीन में से लगभग दो लोग मर जाते हैं, और एक मरीज़ साल भर में दस-पंद्रह लोगों तक टीबी पहुँचा सकता है।",
          icon: "no",
        },
        next: "e_spreading",
      },
    ],
  },

  // -- Chapter 2: the test -------------------------------------------------
  {
    id: "s_sputum",
    art: "labTest",
    hi: "जाँच के लिए बलगम का नमूना देना है। एक प्लास्टिक की डिब्बी मिली है।",
    subHi: "नमूना कैसे देंगे?",
    options: [
      {
        id: "good",
        hi: "गहरी साँस लो, रोको, ज़ोर से खाँसो — फिर डिब्बी में थूको",
        icon: "spit",
        effect: {},
        result: {
          tone: "good",
          hi: "अच्छा नमूना गया। मशीन ने बलगम में टीबी के कीटाणु पकड़ लिए।",
          factHi:
            "बलगम फेफड़ों से आना चाहिए, मुँह की लार नहीं। आम तौर पर दो नमूने देने होते हैं। यही नमूना बताता है कि टीबी है या नहीं।",
          icon: "spit",
        },
        next: "s_result",
      },
      {
        id: "saliva",
        hi: "मुँह की लार डिब्बी में डाल दो",
        icon: "no",
        effect: { health: -1, exposeAll: 6 },
        result: {
          tone: "mixed",
          hi: "जाँच “नेगेटिव” ⊖ आई। खाँसी बनी रही, तो डॉक्टर ने दोबारा नमूना माँगा — दस दिन और निकल गए।",
          factHi:
            "लार से जाँच धोखा दे जाती है। रिपोर्ट नेगेटिव आए पर लक्षण चलते रहें, तो दोबारा जाँच ज़रूर करवाएँ।",
          icon: "spit",
        },
        next: "s_sputum2",
      },
      {
        id: "leave",
        hi: "शरम आ रही है — डिब्बी लेकर घर चले जाओ",
        icon: "hide",
        effect: { health: -2, exposeAll: 12 },
        result: {
          tone: "bad",
          hi: "डिब्बी घर में पड़ी रह गई। एक महीना और बीत गया।",
          factHi:
            "बलगम की जाँच के बिना पता ही नहीं चलेगा कि टीबी है या नहीं। जाँच मुफ़्त है और उसी दिन हो जाती है।",
          icon: "no",
        },
        next: "s_cough3",
      },
    ],
  },

  {
    id: "s_sputum2",
    art: "labTest",
    hi: "इस बार ठीक से नमूना दिया — फेफड़ों से गहरी खाँसी के साथ।",
    options: [
      {
        id: "ok",
        hi: "रिपोर्ट का इंतज़ार करो",
        icon: "yes",
        effect: {},
        result: {
          tone: "good",
          hi: "मशीन ने बलगम में टीबी पकड़ ली।",
          factHi:
            "सी०बी०नैट (CBNAAT) मशीन एक ही जाँच में यह भी बता देती है कि आम टीबी दवाएँ इस टीबी पर काम करेंगी या नहीं।",
          icon: "spit",
        },
        next: "s_result",
      },
    ],
  },

  {
    id: "s_result",
    art: "badNews",
    hi: "रिपोर्ट “पॉज़िटिव” ⊕ है — आपको फेफड़ों की टीबी है।",
    subHi: "डॉक्टर कहते हैं — घबराइए मत, यह पूरी तरह ठीक हो जाती है।",
    options: [
      {
        id: "startNow",
        hi: "आज ही इलाज शुरू करो",
        icon: "yes",
        effect: { health: 1, setFlags: ["diagnosed"] },
        result: {
          tone: "good",
          hi: "डॉक्टर ने परचा बना दिया — डॉट्स सेंटर से दवा लेनी है।",
          factHi:
            "टीबी का पता चलते ही इलाज शुरू कर देना चाहिए। पूरा इलाज करने वाले दस में से नौ लोग ठीक हो जाते हैं।",
          icon: "pill",
        },
        next: "s_comorbid",
      },
      {
        id: "thinkAbout",
        hi: "सोचने के लिए घर जाओ",
        icon: "wait",
        effect: { health: -2, exposeAll: 12, setFlags: ["diagnosed"] },
        result: {
          tone: "bad",
          hi: "दो हफ़्ते सोचते-सोचते निकल गए। कमज़ोरी और बढ़ गई।",
          factHi:
            "टीबी हर दिन फेफड़ों को और खराब करती है और साँस के साथ दूसरों तक जाती रहती है। देर का कोई फ़ायदा नहीं।",
          icon: "wait",
        },
        next: "s_comorbid",
      },
    ],
  },

  {
    id: "s_comorbid",
    art: "labTest",
    hi: "डॉक्टर कहते हैं — हर टीबी मरीज़ की शुगर और एच०आई०वी० की जाँच भी की जाती है।",
    subHi: "दोनों जाँच मुफ़्त हैं और रिपोर्ट गुप्त रहती है।",
    options: [
      {
        id: "bothTests",
        hi: "दोनों जाँच करवा लो",
        icon: "yes",
        effect: { health: 1, setFlags: ["comorbidTested"] },
        result: {
          tone: "good",
          hi: "जाँच हो गई। डॉक्टर को अब पता है कि आपके शरीर में और क्या चल रहा है।",
          factHi:
            "शुगर की बीमारी वालों को टीबी होने का खतरा दो-तीन गुना होता है, और शुगर काबू में न हो तो टीबी देर से ठीक होती है। एच०आई०वी० हो तो उसकी दवा टीबी की दवा के साथ ही शुरू करनी पड़ती है — दोनों जाँच सरकारी अस्पताल में मुफ़्त हैं।",
          icon: "doctor",
        },
        next: "s_docs",
      },
      {
        id: "sugarOnly",
        hi: "सिर्फ़ शुगर की जाँच करवाओ",
        icon: "spit",
        effect: {},
        result: {
          tone: "mixed",
          hi: "शुगर की जाँच हो गई, एच०आई०वी० की नहीं।",
          factHi:
            "एच०आई०वी० की जाँच की रिपोर्ट पूरी तरह गुप्त रहती है। पता चल जाए तो उसकी दवा से टीबी और एच०आई०वी० — दोनों का इलाज साथ हो जाता है।",
          icon: "doctor",
        },
        next: "s_docs",
      },
      {
        id: "noTests",
        hi: "कोई और जाँच नहीं — बस टीबी की दवा दो",
        icon: "no",
        effect: { health: -1 },
        result: {
          tone: "bad",
          hi: "सिर्फ़ टीबी की दवा शुरू हुई। शरीर की बाकी कमज़ोरियाँ छुपी रह गईं।",
          factHi:
            "टीबी के साथ शुगर, एच०आई०वी०, कमज़ोरी, बीड़ी या शराब — इनमें से कुछ भी हो तो टीबी ठीक होने में ज़्यादा वक़्त लगता है और खतरा बढ़ जाता है। इसीलिए ये जाँचें की जाती हैं।",
          icon: "no",
        },
        next: "s_docs",
      },
    ],
  },

  {
    id: "s_docs",
    art: "clinic",
    hi: "डॉट्स सेंटर से पहली बार दवा लेने के लिए तीन चीज़ें चाहिए।",
    subHi: "क्या ले जाएँगे?",
    options: [
      {
        id: "threeDocs",
        hi: "डॉक्टर का परचा, आधार कार्ड और बैंक पासबुक — तीनों की फोटोकॉपी",
        icon: "doctor",
        effect: { money: 1, setFlags: ["onDots", "nikshay"] },
        result: {
          tone: "good",
          hi: "निक्षय में नाम दर्ज हो गया, निक्षय आई-डी मिल गई, और छह महीने की दवा मुफ़्त।",
          factHi:
            "निक्षय पोषण योजना से इलाज के दौरान हर महीने खाते में पैसे आते हैं, ताकि दवा के साथ अच्छा खाना भी मिल सके। निक्षय आई-डी सँभाल कर लिख लें।",
          icon: "money",
        },
        next: "s_tell",
      },
      {
        id: "justGo",
        hi: "बस ऐसे ही चले जाओ",
        icon: "wait",
        effect: { health: -1 },
        result: {
          tone: "mixed",
          hi: "दवा तो मिल गई, पर कागज़ न होने से निक्षय में नाम दर्ज नहीं हुआ — पैसा नहीं आएगा।",
          factHi:
            "आधार कार्ड और बैंक पासबुक की फोटोकॉपी डॉट्स सेंटर में दे दें, तभी निक्षय पोषण योजना के पैसे खाते में आते हैं।",
          icon: "money",
        },
        next: "s_tell",
      },
      {
        id: "privateBuy",
        hi: "बाज़ार से दवा खरीद लो, सेंटर के चक्कर कौन लगाए",
        icon: "money",
        effect: { money: -3, setFlags: ["privateCare"] },
        result: {
          tone: "bad",
          hi: "एक महीने की दवा में ही जेब खाली हो गई।",
          factHi:
            "वही चार दवाएँ डॉट्स सेंटर में मुफ़्त मिलती हैं। टीबी पर घर का पैसा खत्म कर देना सबसे बड़ी गलतियों में से एक है।",
          icon: "money",
        },
        next: "s_tell",
      },
    ],
  },

  // -- Chapter 3: the house ------------------------------------------------
  {
    id: "s_tell",
    art: "family",
    hi: "घर पहुँचे। सब पूछ रहे हैं — डॉक्टर ने क्या कहा?",
    options: [
      {
        id: "tell",
        hi: "सबको सच बता दो",
        icon: "talk",
        effect: { health: 1, setFlags: ["toldFamily"] },
        result: {
          tone: "good",
          hi: "घरवाले साथ खड़े हो गए — कोई दवा याद दिलाएगा, कोई सेंटर साथ जाएगा।",
          factHi:
            "टीबी के मरीज़ को परिवार के साथ की सबसे ज़्यादा ज़रूरत होती है। जिनका परिवार साथ देता है, वे इलाज पूरा कर पाते हैं।",
          icon: "talk",
        },
        next: "s_home",
      },
      {
        id: "hide",
        hi: "छुपा लो — लोग क्या कहेंगे",
        icon: "hide",
        effect: { health: -1, exposeAll: 10 },
        result: {
          tone: "bad",
          hi: "आप चोरी-छिपे दवा खाते रहे। घर में कोई एहतियात नहीं हुआ।",
          factHi:
            "छुपाने से घर के लोग बचाव नहीं कर पाते और उन्हें जाँच के लिए भी नहीं ले जाया जाता। टीबी छुपाने की नहीं, इलाज की बीमारी है।",
          icon: "hide",
        },
        next: "s_home",
      },
    ],
  },

  {
    id: "s_home",
    art: "smallHome",
    hi: "घर छोटा है और सब एक ही कमरे में सोते हैं।",
    subHi: "घरवालों को बचाने के लिए क्या करेंगे?",
    options: [
      {
        id: "airMask",
        hi: "खिड़की-दरवाज़ा खोलो, बाहर बैठो, खाँसते समय मुँह ढको",
        icon: "window",
        effect: { exposeAll: -18, setFlags: ["ventilation"] },
        result: {
          tone: "good",
          hi: "कमरे में धूप और हवा आने लगी। आपने मुँह ढक कर खाँसना शुरू किया।",
          factHi:
            "टीबी हवा से फैलती है। खुली हवा, धूप और खाँसते-छींकते समय मुँह ढकना — यही घरवालों को बचाता है। इधर-उधर थूकना नहीं चाहिए।",
          icon: "window",
        },
        next: "s_contacts",
      },
      {
        id: "utensils",
        hi: "अपने बर्तन, खाना और कपड़े अलग कर लो",
        icon: "no",
        effect: { health: -1, exposeAll: 4 },
        result: {
          tone: "mixed",
          hi: "घर में दीवार सी खिंच गई — पर हवा तो वही की वही रही।",
          factHi:
            "टीबी सिर्फ़ हवा से फैलती है, बर्तन, खाने या कपड़ों से नहीं। अलग बर्तन रखने से कोई बचाव नहीं होता, बस मरीज़ अकेला पड़ जाता है।",
          icon: "no",
        },
        next: "s_contacts",
      },
      {
        id: "nothing",
        hi: "कुछ मत बदलो",
        icon: "wait",
        effect: { exposeAll: 14 },
        result: {
          tone: "bad",
          hi: "बंद कमरे में सब साथ सोते रहे।",
          factHi:
            "इलाज के शुरू के हफ़्तों में मरीज़ के साथ बंद कमरे में ज़्यादा देर रहना सबसे खतरनाक है। खिड़की खोलना मुफ़्त का बचाव है।",
          icon: "window",
        },
        next: "s_contacts",
      },
    ],
  },

  {
    id: "s_contacts",
    art: "familyTest",
    hi: "डॉक्टर ने कहा — घर के सब लोगों की जाँच करवाइए, ख़ासकर बच्चों की।",
    options: [
      {
        id: "allTested",
        hi: "पूरे घर को जाँच के लिए ले जाओ",
        icon: "familyTest",
        effect: { tpt: true, health: 1, setFlags: ["contactsScreened"] },
        result: {
          tone: "good",
          hi: "सबकी जाँच हुई। किसी को टीबी नहीं निकली, और बच्चों को बचाव की दवा शुरू कर दी गई।",
          factHi:
            "जिस घर में टीबी है, वहाँ बाकी लोगों की जाँच मुफ़्त होती है। बच्चों और कमज़ोर लोगों को बचाव की दवा (टी०पी०टी०) दी जाती है, जिससे उन्हें टीबी होने का खतरा बहुत कम हो जाता है।",
          icon: "child",
        },
        next: "s_month1_side",
      },
      {
        id: "childOnly",
        hi: "सिर्फ़ सबसे छोटे बच्चे को ले जाओ",
        icon: "child",
        effect: { tpt: true, exposeAll: 4 },
        result: {
          tone: "mixed",
          hi: "बच्चे को बचाव की दवा मिल गई, बाकी घर की जाँच नहीं हुई।",
          factHi:
            "घर का कोई भी सदस्य, जिसे खाँसी, बुखार या वज़न घटना हो, उसकी जाँच ज़रूरी है — बड़े भी बीमार पड़ते हैं।",
          icon: "familyTest",
        },
        next: "s_month1_side",
      },
      {
        id: "none",
        hi: "किसी को मत ले जाओ — सब ठीक तो हैं",
        icon: "no",
        effect: { exposeAll: 10 },
        result: {
          tone: "bad",
          hi: "किसी की जाँच नहीं हुई।",
          factHi:
            "टीबी शुरू में चुपचाप बढ़ती है — बीमारी दिखने से पहले ही शरीर में होती है। इसलिए घर के लोगों की जाँच लक्षण का इंतज़ार किए बिना करवानी चाहिए।",
          icon: "familyTest",
        },
        next: "s_month1_side",
      },
    ],
  },
];
