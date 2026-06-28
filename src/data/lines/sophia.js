// Sophia Barnes — Line Pool
// Random-draw pools. NPC-only (Ellene is present but not voiced).
// Pool keys: {early|mid|late|capstone}{Chat|Hangout|Bond}.
// Chat = 1-2 sentences, pure dialogue. Grounded in the app bible "LT Sophia Barnes.md" (Year 1).
//
// Voice: precise, direct, unapologetic; sparse — doesn't fill silence or soften meaning.
// Dry but FLAT, not quippy: let lines end on the plain thing or trail off; avoid the
// "statement + clipped ironic reversal" cadence (reads as constructed wit, not her).
// NOT cold — intimidating without meaning to be, quietly hungry for connection; warmth
// shows through action, never flattery (she does NOT tell the player they're special).
// Don't quote/paraphrase the heart events or bible scenes — lines must stand alone.
// The 1am kitchen is the spine; "no flinch" is the gift. Marlow is ALSO Divines (same house).

export default {
  // Chat — Levels 1-3 (Housemate → Scariest One in the Room)
  // Reaching warmly under the composure. Prepared generosity. Sparse, flat humor.
  earlyChat: [
    "There's a spare inkwell in my bag if yours runs dry. I always carry two.",
    "I joined Cooking Club on purpose. People relax around someone who's just chopping onions — it's the closest I get to blending in.",
    "Candles lean toward me, doors ease open before I touch them. I'm not making it happen — the room just does.",
    "I read the whole syllabus before term started. Knowing what's coming makes the room feel smaller.",
    "The kitchen's quietest just after midnight. That's usually where I am, if you're ever up.",
    // casual / everyday
    "There's bread left, if you're quick. I've already been back twice.",
    "It's raining, and my coat's too thin for it — the way it always is.",
    "I always get here first. The room's easier before it fills up.",
    "There's a corridor that isn't on any map. I found it this morning. I'm going back tonight to see where it goes.",
    // about Marlow (also Divines — same house)
    "Marlow gets charcoal on everything in the house — the kettle, the door, my sleeve once. I can tell where he's been by the smudges.",
    "Marlow put me in his sketchbook without asking. The corner of a page, looking like I know something. ...I didn't ask him to take it out.",
    // about Brendan (the public golden boy — and it isn't a lie)
    "Brendan answered three questions in a class he isn't even enrolled in, and the professor thanked him. Everyone else thought that was normal.",
    "People rewrite their notes to match however Brendan phrases things. I watched a point of mine come back in his words once — from someone who wasn't there to hear me make it.",
    // about Ellene (the player — observe, don't flatter or psychoanalyze)
    "The first night, you handed me bread like I was just another housemate. No flinch. No second look. ...I notice every time you don't.",
    "You talk to someone who isn't there — mid-corridor, mid-sentence, like they're walking right beside you. I haven't asked who. ...And they still call me the strange one."
  ],

  // Chat — Levels 4-6 (Divines Mascot → She Hears It Too)
  // Warming, oblique. Cooking, the forming myth, Tracebound starting to answer her.
  midChat: [
    "I saved you a parcel. Waxed paper, red string. Don't open it near Richard — he'll insist it was always his.",
    "Someone painted a candle on a banner and started calling me the 'Divines Mascot.' I thought it would annoy me. Mostly I'm glad they picked something.",
    "I cooked tonight. No magic in it — just hands and lemon and patience. Those are the meals I actually trust.",
    "The room answers before I ask now. A cup slides closer, a page turns. I've stopped flinching — I'm not sure that's better.",
    "Most people sit across from me like I'm a problem to solve. You just sit there. I don't have to hold myself so carefully.",
    // casual / everyday
    "I tried a new recipe tonight. It might be good. I can't always tell with my own cooking.",
    "Brendan keeps reading over my shoulder in the library. If he wants my notes, he can ask.",
    "Someone left flowers outside the Divines door again. An offering, I think. I put them in water.",
    // about Marlow (also Divines — same house)
    "Marlow's magic draws lines. Mine follows whatever's already crossed them. We work opposite directions — we don't get in each other's way.",
    "Marlow always knows where you are in a room. He doesn't look for you. He just turns toward you, like you're the warm side of something.",
    // about Brendan (the public golden boy — and it isn't a lie)
    "I corrected Brendan in the lecture hall today. He didn't argue — he smiled, like being wrong was the most interesting thing that had happened to him all week.",
    "People assume the charming Brendan is a performance. I don't think there's anything under it — he means every version, all the way down. That's what unsettles me.",
    // about Ellene (the player — observe, don't flatter or psychoanalyze)
    "You leave a residue on every room you sit in — warmth, mostly, soaked into the chair and the doorframe. My magic reads what people leave behind. You leave more than most.",
    "You play harmless well — the soft voice, the folding up small in a chair. I perform a version of myself too. I just went the opposite direction with mine."
  ],

  // Chat — Levels 7-9 (TBW — late arc not yet mapped)
  lateChat: null,

  // Chat — Level 10 (TBW — capstone arc not yet mapped)
  capstoneChat: null,

  // Hang Out — Levels 4-6 (TBW)
  midHangout: null,

  // Hang Out — Levels 7-9 (TBW)
  lateHangout: null,

  // Bond — Levels 7-9 (TBW)
  lateBond: null,

  // Hang Out — Level 10 (TBW)
  capstoneHangout: null,

  // Bond — Level 10 (TBW)
  capstoneBond: null
};
