export const DEFAULT_CATEGORIES = [
  {
    id: 'groceries', name: 'Groceries', icon: '\u{1F96C}',
    buildings: [
      { name: 'The Root Cellar', desc: 'A humble stone larder beneath the kitchens, cool and quiet, lined with jars of preserved fruit and bundles of dried herbs.', cost: 50 },
      { name: 'Kitchen Hall', desc: 'Steam rises from copper pots. The morning bread is already baking. Students linger at the doorway, drawn by the smell.', cost: 150 },
      { name: 'The Greenhouse', desc: 'Glass and wrought iron arching over raised beds of herbs, vegetables, and climbing vines. The air is warm and green inside, even in autumn.', cost: 400 },
      { name: 'The Grand Refectory', desc: 'Vaulted ceilings, tall windows streaming golden light, long oak tables. This is where Brackroot gathers \u2014 not just to eat, but to belong.', cost: 1000 }
    ]
  },
  {
    id: 'food_delivery', name: 'Food Delivery', icon: '\u{1F989}',
    buildings: [
      { name: "The Courier's Roost", desc: 'A narrow tower at the campus edge where messenger owls land with parcels. The windowsill is perpetually cluttered with waxed-paper wrappings.', cost: 50 },
      { name: 'The Night Kitchen', desc: 'Open past midnight for those who missed dinner. Warm soup, fresh bread, no questions asked. The lamps never quite go out.', cost: 150 },
      { name: 'The Wandering Cart', desc: 'A charmed food cart that drifts between buildings after dusk, offering hot cider and pastries to students studying late.', cost: 400 },
      { name: 'The Midnight Pantry', desc: 'A secret room behind the kitchens, stocked by quiet hands. If you know the door, you never go hungry. The faculty pretends not to notice.', cost: 1000 }
    ]
  },
  {
    id: 'dining', name: 'Dining Out', icon: '\u{1F377}',
    buildings: [
      { name: 'The Gilded Yolk', desc: "A tiny breakfast nook just off the main road. Eggs benny with whatever twist they're doing this week. The owner remembers your order.", cost: 50 },
      { name: 'The Copper Kettle Outpost', desc: "Edith Morrow sent her apprentice to run this campus branch. Bergamot and honey in the air. There's always a seat by the window.", cost: 150 },
      { name: 'The Courtyard Terrace', desc: 'Lantern-lit tables under a canopy of autumn leaves. Faculty and students dine side by side here. The wine list is surprisingly good.', cost: 400 },
      { name: 'Bramblewood Hall', desc: "Holt would be proud. Dark wood, low lighting, hearty food. The lamb stew is legendary. Some say Brendan's mother used to visit.", cost: 1000 }
    ]
  },
  {
    id: 'coffee', name: 'Coffee & Tea', icon: '\u2615',
    buildings: [
      { name: 'The Kettle Stand', desc: 'A battered copper kettle on a stone ledge between lecture halls. Someone always keeps it filled. No one knows who.', cost: 50 },
      { name: 'The Study Nook', desc: 'Tucked into an alcove off the library. Worn leather chairs, a self-serve coffee station, and the sound of turning pages.', cost: 150 },
      { name: 'The Inkwell Lounge', desc: 'Velvet seats, dark wood, the scratch of fountain pens. Coffee served in ceramic cups that never seem to go cold. Spires students claim this as theirs.', cost: 400 },
      { name: 'The Observatory Caf\u00e9', desc: "Perched in the clock tower's upper floor, with arched windows overlooking the whole campus. The best cup of coffee at Brackroot \u2014 if you can find it.", cost: 1000 }
    ]
  },
  {
    id: 'stationery', name: 'Stationery', icon: '\u{1F58B}\uFE0F',
    buildings: [
      { name: 'Inkwell & Quill', desc: 'Tam runs the campus branch now. Ink bottles catching the light, paper samples fanned on tables, the scratch of test nibs on scrap sheets.', cost: 50 },
      { name: 'The Scriptorium', desc: 'Long tables lit by amber lamps. Calligraphy guides pinned to the walls. The air smells like good paper and iron gall ink.', cost: 150 },
      { name: 'The Illuminated Press', desc: 'A working printshop where students learn letterpress. The thunk-hiss of the press is the heartbeat of this building.', cost: 400 },
      { name: 'Thornwood Archive Wing', desc: "Vera's grandmother bound the original SGC charter here. Now it houses the rarest manuscripts. The leather-and-paper smell alone is worth the visit.", cost: 1000 }
    ]
  },
  {
    id: 'shopping', name: 'Shopping', icon: '\u{1F6CD}\uFE0F',
    buildings: [
      { name: 'The Market Stall', desc: "A simple awning and a table of curiosities. Every week it's something different \u2014 candles, charms, second-hand books.", cost: 50 },
      { name: 'The Curiosity Cabinet', desc: 'A permanent shop in the east wing, crammed floor to ceiling with oddments. The owner insists everything has a story.', cost: 150 },
      { name: 'The Artisan Quarter', desc: 'A cluster of workshops where campus artisans sell their work. Sable sends pieces here. The quality is devastatingly good.', cost: 400 },
      { name: 'The Gilded Arcade', desc: "Arched glass ceiling, warm lantern light, shops lining both sides. It feels like stepping into a painting of somewhere that shouldn't exist.", cost: 1000 }
    ]
  },
  {
    id: 'gaming', name: 'Gaming', icon: '\u{1F3B2}',
    buildings: [
      { name: 'The Common Room', desc: 'Mismatched furniture, a perpetual card game in the corner, someone always arguing about rules. It smells like popcorn and competition.', cost: 50 },
      { name: 'The Game Hall', desc: 'Proper tables, proper chairs, proper lighting. The chess sets are marble. The strategy board collection fills an entire wall.', cost: 150 },
      { name: "The Strategist's Tower", desc: 'A round room at the top of a narrow stair. Maps and campaign notes cover every surface. Panthers students practically live here.', cost: 400 },
      { name: 'The Grand Amphitheatre', desc: 'Tournament-grade. Tiered seating, enchanted scoreboards, and an energy that makes your pulse quicken before the first move is played.', cost: 1000 }
    ]
  },
  {
    id: 'subscriptions', name: 'Subscriptions', icon: '\u{1F4EE}',
    buildings: [
      { name: 'The Notice Board', desc: 'Pinned with flyers, event posters, and the occasional anonymous love letter. Updated daily. Everyone checks it; no one admits it.', cost: 50 },
      { name: 'The Postal Office', desc: 'Parcels from home, magazine subscriptions, letters with wax seals. The postmaster knows everyone by name and package frequency.', cost: 150 },
      { name: 'The Telegraph Tower', desc: 'Clicking and whirring, connecting Brackroot to the wider world. Messages arrive on thin paper tape that curls at the edges.', cost: 400 },
      { name: 'The Aetherium', desc: "Part communications hub, part magical research lab. The signals here travel through channels that don't appear on any map.", cost: 1000 }
    ]
  },
  {
    id: 'transport', name: 'Transport', icon: '\u{1F6E4}\uFE0F',
    buildings: [
      { name: 'The Dirt Path', desc: 'Worn smooth by generations of students. It leads from the dormitories to the main hall, and smells like earth after rain.', cost: 50 },
      { name: 'The Cobblestone Road', desc: 'Properly laid stones connecting the campus buildings. Lanterns line the edges. Your footsteps echo differently here \u2014 more intentional.', cost: 150 },
      { name: 'The Covered Bridge', desc: 'Spanning the ravine between the old campus and the new. Rain drums on the wooden roof. Students pause here to watch the mist below.', cost: 400 },
      { name: 'The Skyway Gondola', desc: 'Glass and brass, gliding silently between the tallest towers. The view of the autumn canopy below is worth every second of the ride.', cost: 1000 }
    ]
  },
  {
    id: 'theatre', name: 'Theatre & Ent.', icon: '\u{1F3AD}',
    buildings: [
      { name: 'The Stage Door', desc: 'A side entrance draped in velvet. The first thing you see is a mirror with fairy lights and a note: "You\'re already in character."', cost: 50 },
      { name: 'The Rehearsal Hall', desc: 'Scuffed hardwood floors, a battered piano in the corner, costume racks along the walls. Everything important happens here first.', cost: 150 },
      { name: 'The Playhouse', desc: 'Intimate. Two hundred seats, a thrust stage, acoustics that make whispers carry. The Citadel has nothing on this.', cost: 400 },
      { name: 'The Grand Theatre', desc: 'Gilded balconies, a painted ceiling, a chandelier that dims on cue. Opening night here is a campus event. Standing ovations are earned.', cost: 1000 }
    ]
  },
  {
    id: 'health', name: 'Health', icon: '\u{1F33F}',
    buildings: [
      { name: 'The Apothecary', desc: 'Bundles of dried flowers hanging from the rafters, glass jars of remedies, the green smell of growing things. Maren would approve.', cost: 50 },
      { name: 'The Healing Ward', desc: 'Quiet beds, clean linen, warm light. The healers here believe rest is medicine. No one rushes you out.', cost: 150 },
      { name: 'The Sanctuary', desc: 'A still room with no windows and no sound. Just warmth, and breathing, and the knowledge that you are allowed to stop.', cost: 400 },
      { name: 'The Wellspring', desc: "A natural spring beneath the campus, discovered by Divines students decades ago. The water doesn't heal \u2014 but it reminds you that you can.", cost: 1000 }
    ]
  },
  {
    id: 'bills', name: 'Bills & Utilities', icon: '\u{1F3DB}\uFE0F',
    buildings: [
      { name: "Groundskeeper's Hut", desc: 'A stone cottage at the campus edge, tools hanging neatly on the wall. The groundskeeper leaves lanterns lit on the paths each evening.', cost: 50 },
      { name: 'The Clock Tower', desc: 'It chimes on the hour. It has chimed on the hour for one hundred and forty years. Brackroot breathes to this rhythm.', cost: 150 },
      { name: 'The Irongate Walls', desc: 'Moss-covered stone surrounding the campus. Not to keep anyone out \u2014 to mark the boundary between the world and this place apart.', cost: 400 },
      { name: "The Chancellor's Spire", desc: 'The tallest point on campus. The light at its peak is visible from the town. It means Brackroot endures.', cost: 1000 }
    ]
  }
];

export const TIER_NAMES = ['I', 'II', 'III', 'IV'];

export function getCategoryById(id) {
  return DEFAULT_CATEGORIES.find(c => c.id === id);
}

export function getCategoryName(id) {
  return getCategoryById(id)?.name ?? id;
}

export function getCategoryIcon(id) {
  return getCategoryById(id)?.icon ?? '\u{1F4E6}';
}
