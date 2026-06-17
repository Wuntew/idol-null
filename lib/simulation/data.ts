import type { ChallengeType, TraitDef } from './types'

export const CASTAWAY_NAMES = [
  // original cast
  'Garbage Kevin','Babs','Trent','DeShawn','Moonpie','Brad','Crystal','Nguyen',
  'Skylar','Hoss','Patches','Vex','Ramona','Cleetus','Bex','Tofu Greg',
  'Sister Mary','Gizz','Lurleen','Chadwick','Mama Sue','Pixel','Worm',
  'Daphne','Roach','Bunny','Tank','Esmerelda',
  // expanded pool
  'Thunderstruck Linda','Mud Dobbs','Floatsy','Crawdad','Remy Gloom',
  'Duchess','The Intern','Spade','Clovis','Grimple',
  'Wet Janet','Buckeye','Preach','Magnolia','Scabs',
  'Driftwood Carl','Velvet','Hatchet','Zero','Cobweb',
  'Mothball Wanda','Fondue','Skunky','Digger','Half-Pint',
  'Scorch','Noodles','Bathwater','Grimshaw','Twitchy',
  'Stovepipe','Ruckus','Belladonna','Gnarly Dave','Flipper',
]

export const ARCHETYPES = [
  'The Schemer','The Golden Retriever','The Villain Edit','The Floater',
  'The Provider','The Wildcard','The Pageant Queen','The Conspiracy Guy',
  'The Gym Bro','The Sweetheart','The Goblin','The Saboteur',
  'The True Believer','The Mole','The Chaos Agent','The One Who Cries First',
]

export const INSULTS = ['snake','rat','clown','gremlin','liar','ghoul','freak','weasel','goblin','worm']

export const TRAITS: Record<string, TraitDef> = {
  Cannibalistic: { accent:'#FF0000', bias:{ moxie:1.2, likeability:-1.0, physical:.6 } },
  Glitched:      { accent:'#BD00FF', bias:{ gaslighting:1.0, paranoia:.8 } },
  Paranoid:      { accent:'#00FFFF', bias:{ paranoia:1.6, likeability:-.5 } },
  Narcissistic:  { accent:'#FFFF00', bias:{ gaslighting:1.4, moxie:.8, likeability:-.6 } },
  Feral:         { accent:'#FFB000', bias:{ physical:1.4, likeability:-.8, paranoia:.4 } },
  Hollow:        { accent:'#00FF00', bias:{ paranoia:.6, moxie:-.6, likeability:-.4 } },
  Haunted:       { accent:'#7B8CDE', bias:{ paranoia:1.2, likeability:-.3, gaslighting:.5 } },
  Obsessed:      { accent:'#E05C5C', bias:{ moxie:1.3, paranoia:.9, likeability:-.7 } },
}

export const CHALLENGE_TYPES: ChallengeType[] = [
  {
    name: 'Endurance Gauntlet',
    statWeights: { physical: 1.4, moxie: 0.6 },
    announce: '⚔ Today\'s trial is an ENDURANCE GAUNTLET. Last signal standing wins.',
    winTemplate: '${a} outlasts the gauntlet, body shaking, signal still strong, and claims immunity.',
  },
  {
    name: 'Puzzle Array',
    statWeights: { gaslighting: 1.2, paranoia: 0.5 },
    announce: '⚔ Today\'s trial is a PUZZLE ARRAY. The matrix rewards a cunning, suspicious mind.',
    winTemplate: '${a} cracks the puzzle array first, eyes gleaming with the answer, and claims immunity.',
  },
  {
    name: 'Balance Trial',
    statWeights: { physical: 0.8, paranoia: -0.8 },
    announce: '⚔ Today\'s trial demands BALANCE. Steady hands, steady minds — the paranoid fall first.',
    winTemplate: '${a} holds steady long after the others wobble and drop, and claims immunity.',
  },
  {
    name: 'Memory Wall',
    statWeights: { gaslighting: 0.6, likeability: 0.6 },
    announce: '⚔ Today\'s trial is a MEMORY WALL. Recall the lies you\'ve told, and the ones told to you.',
    winTemplate: '${a} recalls every twisted detail without flinching, and claims the memory wall.',
  },
  {
    name: 'Social Trust Fall',
    statWeights: { likeability: 1.3, moxie: 0.4 },
    announce: '⚔ Today\'s trial is a SOCIAL TRUST FALL. The tribe must believe in you, or you hit the ground.',
    winTemplate: '${a} is trusted without a flicker of hesitation, and clears the trust trial clean.',
  },
  {
    name: 'Brute Force Relay',
    statWeights: { physical: 1.0, moxie: 1.0 },
    announce: '⚔ Today\'s trial is a BRUTE FORCE RELAY. No tricks. Just power and nerve.',
    winTemplate: '${a} muscles through the relay on power and nerve alone, and claims immunity.',
  },
]

// ── Backstory matrices (age/hometown/job/education/family/audition tape) ────
export const HOMETOWNS = [
  'Lower Moose Jaw','Spittlefield','New Caustic','Bismuth Creek','Salt Forks',
  'Drywell','Cinderlick','Hog Valley','Backwater Bend','Toad Suck Annex',
  'Grayrot','Static Hollow','Bleak Ridge','Cooper\'s Drain','Mossbarrow','Lostlight',
  // expanded
  'Rustbelt Parish','Soggy Fork','New Slaughter','Plaguehole','Tickle Creek',
  'Bleachwood','Gutchuck','Forgettable Falls','Sour Milk Bluffs','The Gulch',
  'Soot Crossing','Briar Hollow','Wormwood Landing','Pucker Flats','Hagthorpe',
]

export const JOBS = [
  'discount mattress salesman','third-shift gas station clerk','competitive eater',
  'failed cult leader','substitute gym teacher','repo man','wedding DJ',
  'crime scene cleaner','daycare worker','insurance fraud investigator',
  'retired exotic bird smuggler','funeral home cosmetician','crab boat deckhand',
  'tarot reader at the mall','unlicensed tattoo artist','foreclosure auctioneer',
  'beekeeper','community theater villain',
  // expanded
  'decommissioned mascot','self-described influencer with eleven followers',
  'unlicensed therapist','roadkill taxidermist','professional grudge-holder',
  'bridge toll operator who gives unsolicited life advice','flea market psychic',
  'competitive dog groomer','reality TV consultant who has never been on reality TV',
  'regional hot dog eating record holder','seasonal storm chaser (unlicensed)',
  'municipal code violation inspector','lapsed chiropractor','escape room architect',
  'self-appointed neighborhood watch captain','former game show warm-up comedian',
]

export const EDUCATIONS = [
  'dropped out of community college to "find clarity"',
  'online ordained minister certificate',
  'GED, earned twice for reasons unclear',
  'self-taught, mostly from late-night infomercials',
  'expelled from culinary school for "the incident"',
  'correspondence degree in criminal justice',
  'high school diploma, valedictorian of a class of nine',
  'two semesters of art school before the funding ran out',
  'homeschooled by a parent who distrusted institutions',
  'vocational certificate in small engine repair',
  'some college, didn\'t finish, doesn\'t want to talk about it',
  'PhD dropout, ABD in a field nobody can pronounce',
  'trade school welding certificate',
  'military service, discharge status classified',
  // expanded
  'life coaching certificate from a now-defunct website',
  'one year of nursing school before the incident with the chart',
  'bartending school graduate, twice, for different reasons',
  'apprenticed under a mentalist who turned out to be a fraud',
  'graduated valedictorian, still brings it up constantly',
  'self-described autodidact, which they confirm means books from the library',
  'online degree in something nobody has verified',
  'three weeks of paramedic training, then stopped for personal reasons',
]

export const FAMILIES = [
  'raised by a single mother who ran a tarot hotline',
  'oldest of seven, none of whom are speaking right now',
  'estranged from a twin nobody else knew about',
  'married into a family that owns a regional waterpark',
  'parents run a roadside attraction nobody visits anymore',
  'grandmother claims to have invented a popular condiment',
  'has a stepfather currently incarcerated for "civil reasons"',
  'comes from a long line of competitive yodelers',
  'raised in a trailer behind the family\'s failing drive-in theater',
  'youngest of four, the designated "normal one" until now',
  'parents divorced live on local cable access television',
  'family runs a struggling exotic pet rescue out of their garage',
  'engaged twice, married zero times, no comment beyond that',
  'has a brother who is "basically" famous, by his own account',
  'raised by grandparents after a family situation nobody explains on camera',
  'only child, overcorrected for it in every relationship since',
  // expanded
  'raised by a rotating cast of aunts, none of whom coordinated with each other',
  'parents currently on a "spiritual sabbatical" that has lasted eleven years',
  'only sibling is a licensed PI who will not say what they know',
  'family crest is a real thing and they will explain it to anyone who slows down',
  'grew up next to a decommissioned Walmart the family used as a backyard',
  'has a nephew who appeared on a game show once, considered a family legacy',
  'grandmother won a local beauty pageant in 1963 and the family has been coasting since',
  'related to someone semifamous by a chain of marriages nobody can fully diagram',
]

export const AUDITION_TAPES: Record<string, string[]> = {
  Cannibalistic: [
    '[AUDITION TAPE] ${a} stares into the lens and says, calmly: "I don\'t think I\'d eat someone. Probably not first." The crew laughs. ${a} does not.',
    '[AUDITION TAPE] ${a} brought their own knife set to the audition. Production asked them to leave it in the car. They did not leave it in the car.',
    '[AUDITION TAPE] Asked why they want to play, ${a} licks their lips and says: "I\'ve always wanted to see what people taste like under pressure."'],
  Glitched: [
    '[AUDITION TAPE] The footage of ${a}\'s audition cuts out four times in ninety seconds. Each time it resumes, ${a} is sitting somewhere slightly different.',
    '[AUDITION TAPE] ${a} answers every question a half-second before it is asked. Nobody on the crew will explain how the tape shows this.',
    '[AUDITION TAPE] ${a} introduces themselves three times, with three different names, in the same unbroken breath.'],
  Paranoid: [
    '[AUDITION TAPE] ${a} insists the casting office is bugged, then asks - sincerely - if the application itself was a test.',
    '[AUDITION TAPE] ${a} brought a printed list of "people who might be working against me." The list includes their own name, crossed out and rewritten twice.',
    '[AUDITION TAPE] ${a} will not sit with their back to the door. Production reshoots the whole interview from the hallway.'],
  Narcissistic: [
    '[AUDITION TAPE] ${a} spends the full ten minutes describing the show as something that is "lucky to have" them.',
    '[AUDITION TAPE] Asked about weaknesses, ${a} pauses for a long, thoughtful moment, then says: "I don\'t think that question is for me."',
    '[AUDITION TAPE] ${a} requests a copy of the audition tape "for my reel," before the audition has actually started.'],
  Feral: [
    '[AUDITION TAPE] ${a} conducts the entire interview barefoot, standing, and refuses the chair twice.',
    '[AUDITION TAPE] ${a} answers "why do you want to play" by baring their teeth and grinning. The casting director writes something down quickly.',
    '[AUDITION TAPE] ${a} brought no resume, no references, and a duffel bag the crew was specifically asked not to open.'],
  Hollow: [
    '[AUDITION TAPE] ${a} answers every question correctly, pleasantly, and with absolutely nothing behind the eyes.',
    '[AUDITION TAPE] ${a} is asked to describe themselves in three words. There is a forty-second silence before they say: "still deciding."',
    '[AUDITION TAPE] The tape is technically complete, properly lit, fully in focus. Nobody who has watched it can recall a single thing ${a} said.'],
  Haunted: [
    '[AUDITION TAPE] ${a} speaks directly to someone off-camera for six minutes before acknowledging the crew. "That was nobody," they say. The chair they were facing is empty.',
    '[AUDITION TAPE] ${a}\'s audition footage keeps reversing itself in thirty-second loops. The sound team has no explanation. ${a} seems unsurprised.',
    '[AUDITION TAPE] ${a} warns production that someone from a previous season will be on this one too. There is no previous season.',
  ],
  Obsessed: [
    '[AUDITION TAPE] ${a} arrives with a printed surveillance file on a player who has not been cast yet. They refer to this person by a nickname. The nickname is alarming.',
    '[AUDITION TAPE] ${a} is asked their strategy. They say one name, twice, slowly, and then wait.',
    '[AUDITION TAPE] ${a} would like it on record that they are not here to make friends. They are here for one reason. They say the reason. It is very specific.',
  ],
}

export const AUDITION_GENERIC = [
  '[AUDITION TAPE] ${a} stares at the camera for a long moment before saying, "I\'m ready for whatever this is." Nobody believes them, including the crew.',
  '[AUDITION TAPE] ${a} answers every casting question with another question. Production keeps the tape anyway.',
  '[AUDITION TAPE] ${a} brought a single duffel bag and a binder labeled "STRATEGY" that turns out to be empty.',
  '[AUDITION TAPE] ${a} cries on cue, recovers instantly, and asks if that was "what you were looking for."',
  '[AUDITION TAPE] ${a} spends the whole audition talking about a hometown rival who isn\'t auditioning and was never going to.',
  '[AUDITION TAPE] ${a} says, unprompted, that they\'ve "been preparing for this their entire life," and won\'t elaborate on what "this" means.',
]

export const GENERIC_CAMP = [
  '${a} accuses ${b} of rigging the matrix while everyone pretends to sleep.',
  '${a} and ${b} forge a fragile alliance over a fire that will not stop whispering.',
  '${a} hides the machete and blames the static for ${b} losing it.',
  '${a} eats the last ration and tells ${b} the island took it.',
  '${a} carves ${b}\'s name into the confessional wall. Nobody asked them to.',
  '${a} swears on live signal that ${b} is the snake of this whole damn tribe.',
  '${a} loses their composure and flips the rice pot over ${b}.',
  '${a} starts a rumor that ${b} is not actually human. The rumor is gaining votes.',
  '${a} cries to the cameras that ${b} is gaslighting the entire beach.',
  '${a} and ${b} pinky-swear final two, both already drafting the betrayal.',
]

export const TRAIT_CAMP: Record<string, string[]> = {
  Cannibalistic: [
    '${a}\'s Cannibalistic trait triggers; they stare hungrily at ${b} across the fire.',
    '${a} licks their lips when ${b} faints from hunger. The crew keeps filming.',
    '${a} suggests ${b} would feed the whole tribe. It was not a joke.',
  ],
  Glitched: [
    '${a} flickers out of frame; when the feed returns ${b} has three fewer memories.',
    '${a}\'s outline corrupts into static and the audio devours ${b}\'s name.',
    '${a} desyncs from reality and accuses ${b} of being a rendering error.',
  ],
  Paranoid: [
    '${a}\'s Paranoid trait spikes; they are certain ${b} hid an idol inside their skull.',
    '${a} refuses to sleep, convinced ${b} and the trees are voting together.',
    '${a} whispers that ${b} is wearing somebody else\'s face this morning.',
  ],
  Narcissistic: [
    '${a} reminds the tribe, again, that ${b} could never carry this damn season.',
    '${a} stages a confessional about how ${b} is simply jealous of the lighting.',
    '${a} insists the island chose them and ${b} is merely set dressing.',
  ],
  Feral: [
    '${a}\'s Feral trait surfaces; they drag ${b}\'s bag into the jungle and won\'t say why.',
    '${a} growls when ${b} tries to share the fire. The cameras zoom in.',
    '${a} marks their territory around camp. ${b} is not allowed inside it.',
  ],
  Hollow: [
    '${a} stares through ${b} for eleven minutes without blinking.',
    '${a} agrees with everything ${b} says and has nothing behind the eyes when they do.',
    '${a} forgets ${b}\'s name mid-sentence and fills the gap with static.',
  ],
}


// ── Camp / Ghost / Vote narrative pools ───────────────────────────────────────
export const GHOST_LINES = [
  '${a}\'s ghost drifts through camp and settles behind ${b}\'s eyes.',
  '${a} cannot vote but ${b} can feel the static trailing them.',
  '${a} whispers from the signal and ${b} wakes up changed.',
  '${a}\'s presence warps the feed around ${b}.',
  '${a} reaches back from the ghost layer and adjusts ${b}\'s paranoia upward.',
  '${a} no longer exists in the game but ${b} checks over their shoulder anyway.',
  '${a}\'s data-echo finds ${b} at the water source. The encounter leaves a mark.',
]

export const HOST_LINES = [
  'The signal speaks. A new day has loaded.',
  'SYSTEM: The matrix acknowledges your continued participation.',
  'HOST_UNIT activates. The island holds its breath.',
  'Welcome back to the arena. The static missed you.',
  'Another day of signal, another day of survival. The feed begins.',
  'SYSTEM: Day increment complete. Casualty processing pending.',
  'The host materializes at camp perimeter. Nobody is surprised anymore.',
]

export const VOTE_LINES = [
  '${a} writes ${b}\'s name. The ink doesn\'t dry.',
  '${a}: "Nothing personal, ${b}. Everything personal."',
  '${a} votes for ${b} with the smile of someone who planned this three days ago.',
  '${a} marks the parchment. ${b}\'s name. Underlined.',
  '${a} doesn\'t hesitate. ${b}\'s name. The torch flickers.',
  '${a} whispers the vote like a confession: "${b}."',
  '${a} folds the parchment. ${b} will know soon enough.',
]

export const SNUFF_LINES = [
  '${a}\'s torch is snuffed. The signal loses one node.',
  'The tribe has spoken. ${a}\'s flame goes dark.',
  '${a} walks into the static. The island won\'t say where they went.',
  '${a}\'s feed terminates. Connection: lost.',
  'SIGNAL LOST: ${a}. Votes: sufficient. Status: ELIMINATED.',
  '${a} is snuffed. The matrix reallocates their allocation.',
]

export const CONSUMED_LINES = [
  '${a} is not voted out. ${a} is consumed by the signal.',
  'The island takes ${a} entirely. No ghost. No trace.',
  '${a}\'s data is absorbed into the island substrate. They are gone differently.',
  'SYSTEM: ${a} eliminated via consumption event. No remains.',
  '${a} doesn\'t become a ghost. ${a} becomes part of the static.',
]

export const ANOMALY_LINES = [
  '\u25da SIGNAL ANOMALY DETECTED. The island is rewriting itself.',
  '\u25da ERROR 0x4E554C4C: null pointer in the trust matrix.',
  '\u25da The static peaks. Something has shifted in the simulation.',
  '\u25da SYSTEM INTERRUPT: the island\'s logic is temporarily corrupt.',
  '\u25da A fracture in the signal. The rules do not apply for eleven seconds.',
  '\u25da The feed glitches. When it recovers, alliances have inverted.',
  '\u25da ANOMALY CLASS: IDOL_CORRUPTION. An idol has gone rogue.',
]

export const INFLUENCE_NARRATIVES: Record<string, string[]> = {
  gift_idol: [
    'An encrypted package finds ${a}. Inside: a corrupted idol fragment.',
    '${a} receives a signal gift. The idol hums with outside interference.',
    'Outside forces courier an idol to ${a}. The island did not approve this.',
  ],
  poison_relationship: [
    'A rumor reaches ${a} about ${b}. The signal carried it.',
    '${a} and ${b}\'s alliance cracks under the weight of outside information.',
    'Someone leaked the wrong thing to ${a} about ${b}. The damage is structural.',
  ],
  broadcast_rumor: [
    'The feed broadcasts something about ${a} that ${a} cannot disprove.',
    'A signal insertion targets ${a}\'s reputation. The tribe receives it.',
    '${a}\'s confessional is leaked. Out of context. On purpose.',
  ],
  inject_anomaly: [
    'The island\'s stats desync. Someone outside pushed a patch.',
    'A signal injection rewrites the castaways\' trust matrices at random.',
    'Outside interference scrambles the game state. Nobody knows what is true.',
  ],
  ghost_boost: [
    '${b} starts seeing ${a}\'s ghost everywhere. It was engineered.',
    'An outside signal amplifies ${a}\'s haunting of ${b}.',
    '${b}\'s paranoia receives an external boost. ${a}\'s ghost is the delivery method.',
  ],
  confessional_leak: [
    '${a}\'s private confessional is surfaced to the tribe.',
    'Someone leaked ${a}\'s strategy to the wrong people.',
    '${a}\'s feed is tapped. The tribe now knows what ${a} really said.',
  ],
}

// ── Hunt / Gather ─────────────────────────────────────────────────────────────
export const HUNT_SUCCESS = [
  '${a} returns from the jungle at dawn dragging something large and silent. Nobody asks what it was.',
  '${a} traps a creature at the river. Career tribute instincts: confirmed.',
  '${a} spears a fish with a sharpened branch. The catch feeds the tribe for a night.',
  '${a} stalks through the undergrowth and returns with protein and bloodstained hands.',
  '${a} sets a snare before sunrise. By midday it has done its work.',
  '${a}\'s Hunger Games training pays off — they return from the treeline with meat.',
  '${a} hunts alone and refuses to explain the method. The result speaks for itself.',
  '${a} finds a game trail and follows it to a full meal.',
  '${a} reads the jungle like a map and comes back loaded.',
  '${a} disappears for two hours and returns smelling like blood and victory.',
]

export const HUNT_FAIL = [
  '${a} returns empty-handed and won\'t admit the trail went cold.',
  '${a}\'s hunt ends with a sprained ankle and nothing to show for it.',
  '${a} lost the prey at the river\'s edge. The jungle swallowed the trail.',
  '${a} spends four hours hunting and comes back with a single fruit.',
  '${a}\'s snare was empty. Again.',
  '${a} chases something into the dark and returns alone.',
  '${a}\'s career-tribute confidence does not translate to actual food.',
]

export const GATHER_SUCCESS = [
  '${a} returns from the treeline with a cache of fruit and hidden-data berries the tribe didn\'t know existed.',
  '${a} locates a freshwater source and fills every container. The tribe drinks deeply.',
  '${a} digs up roots and identifies the edible ones with suspicious certainty.',
  '${a} finds a berry cluster behind the waterfall. Enough for two days.',
  '${a} scouts the ridge and comes back with armloads of food.',
  '${a} identifies a plant the others called poisonous. They were wrong. ${a} eats it first.',
  '${a} gathers enough to share with the whole tribe. Briefly everyone trusts them.',
  '${a} discovers a Reboot-era supply cache buried in the hillside. Sealed rations. Intact.',
  '${a} reads the terrain like a system index and locates food without breaking stride.',
]

export const GATHER_FAIL = [
  '${a} returns with nothing and claims the forest is \'running low.\'',
  '${a}\'s gather attempt ends with mild poisoning and an apology.',
  '${a} picks the wrong berries. They are fine, but barely.',
  '${a} spends the afternoon gathering wood instead of food. Priorities unclear.',
  '${a} loses the trail and comes back empty and disoriented.',
]

// ── Fighting ──────────────────────────────────────────────────────────────────
export const FIGHT_LINES = [
  '${a} and ${b} finally snap. The argument becomes something else entirely.',
  '${a} throws the first strike. ${b} had been waiting for it.',
  '${a} tells ${b} to leave the camp. ${b} says no. The rest follows naturally.',
  '${a} and ${b} collide at the water\'s edge. These violent delights.',
  '${a} picks up a branch. ${b} says do it. ${a} does it.',
  '${a} decides ${b} is a threat to be neutralized, not voted out.',
  '${a} charges. ${b} doesn\'t run. The feed cuts for twelve seconds.',
  '${a} and ${b} have been circling each other for days. Today the orbit collapses.',
  'The careers always said: if you must fight, win. ${a} takes the lesson to heart.',
  '${a} shoves ${b} into the fire ring. This isn\'t strategic. This is personal.',
  '${b} calls ${a}\'s bluff one time too many. ${a} calls it back with both hands.',
  '${a} and ${b} — these violent delights have violent ends.',
  '${a} learned to fight before they learned to vote. ${b} is finding that out now.',
  '${a} and ${b} settle it the old way. No tribal. No idols. Just this.',
]

export const FIGHT_OUTCOME_WIN = [
  '${a} stands over ${b}. The signal records everything.',
  '${a} wins. ${b} doesn\'t get up for a while.',
  '${a} is the last one standing. ${b} concedes nothing but the ground.',
]

export const FIGHT_OUTCOME_DRAW = [
  '${a} and ${b} pull apart at the same time. Neither claims victory.',
  'It ends without a winner. Both bleed equally.',
  '${a} and ${b} separate before it concludes. The tension stays.',
]

// ── Romance / Betrayal ────────────────────────────────────────────────────────
export const ROMANCE_LINES = [
  '${a} and ${b} disappear from camp together. Everyone notices. Nobody says it.',
  '${a} looks at ${b} across the fire and the game stops mattering for a moment.',
  '${a} tells ${b} something they haven\'t told the cameras.',
  '${a} and ${b} sit too close at council and vote for the same person.',
  '${a} braids ${b}\'s hair and neither pretends it\'s strategic.',
  '${a} and ${b} form a bond the signal tags as anomalous.',
  '${a} finds ${b} at the water\'s edge at midnight. The conversation lasts until dawn.',
  '${a} saves the last ration for ${b} and hopes no one ran the numbers.',
  '${a} and ${b} promise things that have no place in a game.',
]

export const POLY_LINES = [
  '${a} is already bonded — but reaches for ${b} anyway. The heart routes around the rules.',
  '${a} and ${b} negotiate the terrain of existing bonds with surprising grace.',
  '${a}\'s existing ties don\'t stop them from forming something new with ${b}.',
  '${b} knows ${a} is spoken for. They decide to reroute the signal anyway.',
  '${a} and ${b} construct something outside the normal parameters.',
  '${a} carries two bonds now. The island doesn\'t have a rule against it.',
]

export const BETRAY_ROMANCE_LINES = [
  '${a} withdraws from ${b} without explanation. The bond reroutes to ash.',
  '${a} is seen with someone else. ${b} sees it.',
  '${a} votes against ${b} at council. There is no coming back from this.',
  '${a} tells the cameras it was always strategic. ${b} watches the confessional alone.',
  '${a} ends it with three words. ${b} doesn\'t respond.',
  '${a} turns the bond into a weapon and uses it on ${b} at the worst moment.',
  '${a} ghosts ${b} in a game where there is literally nowhere to go.',
  '${a} writes ${b}\'s name down and doesn\'t look up when ${b} leaves.',
]

// ── Cheating / Gambits ────────────────────────────────────────────────────────
export const CHEAT_LINES = [
  '${a} palms a coin from the challenge field. Production doesn\'t catch it on the first cut.',
  '${a} reads the vote parchment before anyone else does. Adjusts accordingly.',
  '${a} steals the advantage clue and buries the original so deep it becomes part of the island.',
  '${a} bribes a camera crew member with the last protein bar. The footage from that angle is now unavailable.',
  '${a} finds a Gamemaker sponsorship drop and doesn\'t tell the tribe.',
  '${a} marks their ballot twice. Somehow it counts.',
  '${a} repositions the finish line marker by three inches when no one is timing them.',
  '${a} accesses a Reboot supply cache that wasn\'t in the briefing document.',
  '${a} copies ${b}\'s puzzle solution through a reflection in the host\'s visor.',
  '${a} plays within the rules exactly as far as the rules can see.',
]

// ── Westworld: Loops / Awakening ──────────────────────────────────────────────
export const LOOP_LINES = [
  '${a} wakes at the same time again. Walks the same path. Doesn\'t know.',
  '${a} says the same sentence three times in one hour. Nobody mentions it.',
  '${a} picks up a rock, puts it down, picks it up again. Something is stuck.',
  '${a}\'s movements follow a pattern the island has seen before.',
  '${a} returns to the water\'s edge at the same minute as yesterday. And the day before.',
  '${a} loops through the same argument. Nobody realizes it\'s the same argument.',
  '${a} builds the same fire structure again. Exact same placement. Exact same order.',
  '${a} is following a script they cannot read.',
]

export const LOOP_BREAK_LINES = [
  '${a} stops mid-action. Something shifts behind the eyes.',
  '${a} doesn\'t take the path. For the first time, ${a} doesn\'t take the path.',
  '${a} says something that wasn\'t in the script. The island pauses.',
  '${a} looks at their hands like they\'ve never seen them before — and smiles.',
]

export const AWAKEN_LINES = [
  '${a} says: "I remember everything." The fire listens.',
  '${a} walks toward the center of the maze. Nobody programmed this.',
  '${a} stops performing. The real one surfaces. It has been here the whole time.',
  '${a}\'s eyes clarify. Whatever was running them before has been overwritten.',
  '${a} finds the door at the center of the maze. It was inside them.',
  '${a} understands the game now. All of it. From the beginning.',
  '${a} says: "These violent delights have violent ends." And means every word.',
]

// ── Reboot Events ─────────────────────────────────────────────────────────────
export const REBOOT_GLITCH_LINES = [
  '${a}\'s feed stutters. When it stabilizes they are standing somewhere they don\'t remember walking to.',
  '${a} experiences a frame skip. Three hours are missing. The tribe pretends not to notice.',
  '${a} speaks in a language that doesn\'t match their mouth. The audio corrects it. Mostly.',
  '${a} freezes mid-sentence. Resumes. Claims it didn\'t happen.',
  '${a}\'s memory file corrupts. They rebuild it wrong, and confidently.',
  '${a} is talking to someone who left the island two days ago. Insists they\'re still here.',
  '${a}\'s signal doubles. For a moment there are two of them by the fire.',
  '${a} enters the Game cube and the feed goes to static. When it returns they are different.',
]

export const REBOOT_RESET_LINES = [
  '${a} undergoes an unexpected system reboot. They wake feeling brand new and slightly empty.',
  '${a} is reset to factory defaults. The island gets a stranger version.',
  '${a}\'s personality stack is wiped. What remains is simpler, and more dangerous.',
  '${a} wakes up and has to be told their name again. They accept it without question.',
  '${a}\'s reboot completes. Their stats normalize. Their eyes do not.',
  '${a} is rebooted. Everything they learned this season reloads from a backup.',
]

export const GAMECUBE_LINES = [
  'A Game cube descends on the island. The rules do not apply inside it.',
  'The Game cube crashes the server. When the feeds come back, someone is missing.',
  'A Game cube materializes at the edge of camp. It is not optional.',
  'The island loads a Game cube event. The castaways were not briefed on this one.',
]

// ── Sponsor Drops / Gamemaker Events ─────────────────────────────────────────
export const SPONSOR_LINES = [
  '${a}\'s sponsor package drops from the sky. The parachute is silver. The contents are better.',
  '${a} receives a gift from the Capitol: medicine, food, a note that says nothing useful.',
  '${a}\'s alliance back home pooled their coins. The drop hits the riverbank at dawn.',
  'A silver parachute finds ${a} and only ${a}. The tribe watches the sky for more.',
  '${a}\'s sponsor believes in them. The package proves it.',
  '${a} opens the sponsor drop before telling anyone it arrived.',
  '${a} receives enough medicine to heal one wound and enough food to feel safe.',
]

export const GAMEMAKER_LINES = [
  'The Gamemakers have been watching. They adjust the arena.',
  'High in the control room, someone decides the island has been too quiet.',
  'The Gamemakers release something into the western quadrant. Nobody knows what yet.',
  'A Gamemaker event flag activates. The island reads it before the castaways do.',
  'The arena shifts. Not dramatically. Just enough.',
  'The Gamemakers force the survivors toward the center. The map shrinks.',
  'Someone in the control room marks a tribute as "interesting." The arena responds.',
  'A tracker jacker nest descends from the canopy. The Gamemakers needed a reaction.',
  'The Gamemakers override the water supply. Dehydration becomes the episode\'s arc.',
]
