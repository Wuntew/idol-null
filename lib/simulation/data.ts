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
    announce: '⚔ TODAY\'S TRIAL: ENDURANCE GAUNTLET. Each castaway stands on a platform above the pit, arms gripping the overhead bar. Last signal standing wins immunity.',
    winTemplate: '${a} is the last one standing — arms shaking, jaw locked, feet not moving. ${a} wins immunity.',
    progressLines: [
      '${a} grips the bar and sets their jaw. They are pacing, not struggling.',
      '${a} sways once and rights themselves. The body is listening.',
      '${a} breathes through the nose, counts seconds. Survivable.',
      '${a}\'s arms are shaking but the feet are not moving.',
      '${a} stares at nothing in particular. Somewhere else in their head. Still holding.',
      '${a} is not pretty to watch. But has not let go.',
    ],
    strongLines: [
      '${a} isn\'t showing anything. No expression. Just holding. Everyone else notices.',
      '${a} hasn\'t moved in twenty minutes. Their platform looks cemented in.',
      '${a} anchors to the bar like this is the only thing they have ever done.',
      '${a} is built for exactly this and the body knows it. Nothing is happening in their face.',
      '${a} settles in. This could go for hours. That is fine with ${a}.',
    ],
    weakLines: [
      '${a} is fighting their own legs. The legs are winning.',
      '${a} drops off the platform and lands badly. That is over.',
      '${a} lasted longer than expected. That is the kindest thing to say.',
      '${a} overtightens the grip and loses the arms first.',
      '${a} taps out and steps back. Calls it tactical. The tribe says nothing.',
    ],
  },
  {
    name: 'Puzzle Array',
    statWeights: { gaslighting: 1.2, paranoia: 0.5 },
    announce: '⚔ TODAY\'S TRIAL: PUZZLE ARRAY. Each castaway faces a locked grid of signal tiles. Decode the sequence, reconstruct the array, raise your flag. The cunning and the suspicious have the advantage.',
    winTemplate: '${a} slots the final tile, raises the flag, and wins immunity — the array solved before anyone else found the pattern.',
    progressLines: [
      '${a} stares at the board and begins pulling pieces apart methodically.',
      '${a} is talking through the sequence under their breath. The logic is there, just slow.',
      '${a} rotates a piece four times, places it wrong, places it again.',
      '${a} pauses for ten seconds before moving. Then moves correctly.',
      '${a} keeps glancing at the other boards. Their own is half-done.',
      '${a} makes a mistake, spots it, corrects it without commentary.',
    ],
    strongLines: [
      '${a} finds a pattern in the array nobody else has located. The board snaps into shape.',
      '${a} disassembles and rebuilds the front section in half the expected time.',
      '${a}\'s solution is wrong for one second, then immediately right. They knew it before it landed.',
      '${a} slots the final pieces without slowing down. Finishes before the host calls it.',
      '${a} is three moves ahead of the puzzle. The puzzle doesn\'t know it yet.',
    ],
    weakLines: [
      '${a} dismantles and rebuilds the same corner for the third time.',
      '${a}\'s section is in the same configuration it was at the start.',
      '${a} looks at the board like it insulted them personally.',
      '${a} guesses. Several times. The array does not respond well to guessing.',
      '${a} stops engaging. Just stares at the pieces. Something has disconnected.',
    ],
  },
  {
    name: 'Balance Trial',
    statWeights: { physical: 0.8, paranoia: -0.8 },
    announce: '⚔ TODAY\'S TRIAL: BALANCE TRIAL. Each castaway stands on a narrow beam over the water, arms out, feet still. The paranoid fall first. Clear your mind or go home wet.',
    winTemplate: '${a} holds the beam long after the others have gone into the water — last one standing, immunity earned.',
    progressLines: [
      '${a} holds position with arms out and eyes level.',
      '${a} controls a wobble. Not easy. Makes it look like it was.',
      '${a} breathes slow and locks the platform. Not spectacular. Effective.',
      '${a}\'s legs are clearly burning. The face is not confirming this.',
      '${a} shifts weight slowly and recenters. They know what they are doing.',
      '${a} stands still in a way that looks expensive.',
    ],
    strongLines: [
      '${a} isn\'t thinking about the drop. ${a} is thinking about the vote. Still hasn\'t moved.',
      '${a} makes tiny corrections nobody can see from the shore. Remains stable.',
      '${a} glances at the water once. Goes back to the horizon. Doesn\'t wobble.',
      '${a} has gone somewhere peaceful. The body stays. The mind is already elsewhere.',
      '${a} looks like they could read a book up there.',
    ],
    weakLines: [
      '${a} spirals into their own head and the beam punishes it immediately.',
      '${a} looks down. That was the last thing they needed to do.',
      '${a} is wobbling before the first minute is over.',
      '${a} overthinks the balance and the balance takes it personally.',
      '${a} steps off before falling. Calls it strategic. Nobody buys it.',
    ],
  },
  {
    name: 'Memory Wall',
    statWeights: { gaslighting: 0.6, likeability: 0.6 },
    announce: '⚔ TODAY\'S TRIAL: MEMORY WALL. The host reads thirty encoded signals aloud once. Castaways must reconstruct the sequence on their wall — block by block, in order. Recall everything. Or go to tribal.',
    winTemplate: '${a} places the final block without hesitation — every sequence correct, every symbol in order — and claims immunity.',
    progressLines: [
      '${a} studies the blank wall for twelve full seconds before touching a block.',
      '${a} reads each symbol twice and places the block with moderate confidence.',
      '${a} makes a mistake, spots it, corrects it without commentary.',
      '${a} moves to the second row and stops. The sequence is harder here.',
      '${a}\'s recall is fine. Their nerves are not fine.',
      '${a} answers the questions in under three seconds. Not always correctly.',
    ],
    strongLines: [
      '${a} moves through the wall like they built it.',
      '${a} clears the first section without pausing. The host makes a note.',
      '${a} rattles off the sequence like a grocery list.',
      '${a}\'s memory for things that would not normally matter is impeccable.',
      '${a} finishes the row and looks around. The others are still on block two.',
    ],
    weakLines: [
      '${a} blanks completely on a symbol they saw eleven seconds ago.',
      '${a}\'s sequence is close. Three errors. Enough to bury them.',
      '${a} hesitates on every placement and gets most of them wrong anyway.',
      '${a} can not explain why they can\'t recall it. They were right there.',
      '${a} is guessing by the third row. The wall knows.',
    ],
  },
  {
    name: 'Social Trust Fall',
    statWeights: { likeability: 1.3, moxie: 0.4 },
    announce: '⚔ TODAY\'S TRIAL: SOCIAL TRUST FALL. Each castaway must stand before the tribe and make the case that they are worth protecting. The tribe votes. High trust clears. Low trust hits the ground.',
    winTemplate: '${a} stands before the tribe and is trusted — completely, without hesitation — and wins immunity.',
    progressLines: [
      '${a} works the group quietly, checking each face before speaking.',
      '${a} speaks to every castaway before making their appeal. Plants seeds.',
      '${a} holds eye contact and nods in the right places. Listening first.',
      '${a} delivers the speech. Whether the tribe believes it is another question.',
      '${a} is performing trust. The audience is evaluating the performance.',
      '${a} says the words. The delivery is technically correct.',
    ],
    strongLines: [
      '${a} doesn\'t even have to ask for it. The tribe turns toward ${a} without prompting.',
      '${a}\'s sincerity reads as real from twenty feet away.',
      '${a} says exactly the thing that needed to be said. Nobody rehearsed this.',
      '${a} has spent a week making people feel seen. It is paying out now.',
      '${a} is trusted. Maybe undeservedly. Possibly the same thing in this game.',
    ],
    weakLines: [
      '${a}\'s tribe doesn\'t reach for them. Nobody says why.',
      '${a} overexplains. The more they talk, the further everyone moves.',
      '${a} makes it uncomfortable. Specifically, uncomfortably transparent.',
      '${a} looks around for support and finds careful, neutral expressions.',
      '${a}\'s trust numbers are not landing. They can feel it.',
    ],
  },
  {
    name: 'Brute Force Relay',
    statWeights: { physical: 1.0, moxie: 1.0 },
    announce: '⚔ TODAY\'S TRIAL: BRUTE FORCE RELAY. Six legs: sandbag carry, wall climb, rope drag, beam cross, knot release, flag pull. No tricks. No puzzles. Just power and nerve.',
    winTemplate: '${a} slams the final flag post into the sand first — muddy, wrecked, and winning immunity.',
    progressLines: [
      '${a} charges the sandbag leg. Heavy. Fast. Not elegant.',
      '${a} takes the wall at a run and gets over clean.',
      '${a} grunts through the rope drag. Still moving.',
      '${a} hits the beam and slows down — crosses carefully, gains time back on the knot.',
      '${a}\'s form is rough. Their time is not bad.',
      '${a} makes up ground on the incline. This leg was built for them.',
    ],
    strongLines: [
      '${a} blows through their leg. The tribe doesn\'t need to yell.',
      '${a} carries twice the bag weight anyone else would attempt. Does not break.',
      '${a} completes their leg before the other castaway is halfway through theirs.',
      '${a} has extra in the tank and makes sure everyone can see that.',
      '${a} runs this relay like the island owes them something.',
    ],
    weakLines: [
      '${a} hits the obstacle and stalls. Momentum is gone.',
      '${a} drops the bag. Recovers. Has already lost the gap.',
      '${a} gives everything this leg. It is not enough today.',
      '${a} finishes last on their section and knows it.',
      '${a} is running. The math is just not working out.',
    ],
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
  // original 10
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
  // expanded — 36 new entries
  '${a} tells ${b} exactly what they think of them. It takes twenty minutes.',
  '${a} watches ${b} sleep and says nothing when ${b} opens their eyes.',
  '${a} volunteers for the camp chores nobody else wants. ${b} notices. Neither says anything.',
  '${a} and ${b} sit on opposite sides of the fire and don\'t speak for an hour.',
  '${a} steals ${b}\'s spot in the shelter. The displacement is intentional.',
  '${a} tells the camera that ${b} is more dangerous than anyone is giving them credit for.',
  '${a} asks ${b} three direct questions. ${b} answers none of them directly.',
  '${a} finds ${b}\'s hidden supply cache and says nothing. For now.',
  '${a} and ${b} volunteer to gather wood together. Neither returns with wood.',
  '${a} whispers the same name three times in the same hour to three different people.',
  '${a} sabotages the shelter repair. ${b} gets the blame. The tribe believes it.',
  '${a} sits too close to ${b} at the fire. ${b} moves. ${a} moves with them.',
  '${a} tries to read ${b}\'s face and decides what they see there. They are wrong.',
  '${a} laughs at something ${b} says. It does not sound like a genuine laugh.',
  '${a} refuses to let ${b} finish a sentence for the third time today.',
  '${a} asks ${b} to help haul water. It is not about the water.',
  '${a} gets caught going through ${b}\'s bag. Claims they were looking for flint.',
  '${a} tells ${b} they\'re safe. ${b} has heard that before.',
  '${a} runs the same scenario by ${b} six different ways until ${b} says what ${a} wants to hear.',
  '${a} and ${b} exchange a look across camp that lasts too long. Nobody misses it.',
  '${a} shares the last fish with ${b}. The tribe draws the wrong conclusion.',
  '${a} says ${b}\'s name under their breath when they think no one is recording. The feed always records.',
  '${a} disagrees with every decision ${b} makes today. Loudly. On camera.',
  '${a} sits down next to ${b} and starts talking as if they were mid-conversation.',
  '${a} helps ${b} with the fire and then immediately goes to tell someone else what they saw.',
  '${a} insists ${b} is running the show. Nobody else has noticed. That is the point.',
  '${a} offers ${b} half their ration. ${b} takes it. Neither trusts the other.',
  '${a} writes something in the sand. ${b} walks over it. The message is gone.',
  '${a} builds a fire alone and doesn\'t invite ${b}. It is noticed.',
  '${a} lists every alliance ${b} has made in this game to the camera. Gets most of them right.',
  '${a} confronts ${b} at the water\'s edge. There is no version of this conversation that helps ${a}.',
  '${a} overhears ${b} talking to the wrong person. Stores it. The storage has been building for days.',
  '${a} mirrors ${b}\'s body language perfectly. ${b} doesn\'t know why they feel uneasy.',
  '${a} tells the camera ${b} is playing too hard. ${a} is playing twice as hard.',
  '${a} gives ${b} a compliment. It lands wrong. ${b} doesn\'t know how to take it.',
  '${a} talks to ${b} for an hour and reveals nothing. ${b} does the same. Neither of them wanted to be here.',
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
    '${a} smiles at ${b} at exactly the wrong moment. The smile is technically correct.',
    '${a} has not reacted to anything ${b} has done today. Not the argument. Not the vote talk. Nothing.',
    '${a} is present but not in the way ${b} needs them to be.',
  ],
  Haunted: [
    '${a} warns ${b} about someone who was voted out three days ago. Insists they are still here.',
    '${a} falls silent mid-sentence and stares at the treeline. ${b} checks. Nothing is there.',
    '${a} knows something happened to ${b} last night. ${b} cannot explain how ${a} knows.',
    '${a} apologizes to ${b} for something ${b} doesn\'t remember happening.',
    '${a} draws a name in the dirt and then erases it before ${b} can read it.',
    '${a} tells ${b} the island has been talking. Tells ${b} what it said. ${b} stops sleeping well.',
  ],
  Obsessed: [
    '${a} redirects every conversation with ${b} back to the same person. The same name. Every time.',
    '${a} describes ${b} in terms of whether they are useful for reaching their actual target.',
    '${a} recites ${b}\'s alliance history unprompted. Gets one detail wrong on purpose.',
  ],
}


// ── Camp / Ghost / Vote narrative pools ───────────────────────────────────────
// Fresh ghosts (eliminated 0–3 days ago): immediate, angry, recognizable
export const GHOST_LINES_FRESH = [
  '${a} was just here. ${b} can still hear the vote. The fire agrees.',
  '${a}\'s ghost arrives before the static has finished processing the elimination.',
  '${a} finds ${b} and says the name of the person who voted for them. It is accurate.',
  '${a} is not done. The torch went out but the signal didn\'t.',
  '${b} reaches for ${a}\'s spot in the shelter before remembering. Something reaches back.',
  '${a}\'s data-echo is clean and sharp and pointed directly at ${b}.',
  '${a} walks through camp and everybody sees them for a second. Nobody says it.',
  '${b} wakes up with ${a}\'s strategy in their head. Doesn\'t know whose it is.',
]

// Ancient ghosts (4+ days): ambient, corrupted, barely coherent
export const GHOST_LINES_ANCIENT = [
  '${a}\'s ghost drifts through camp and settles behind ${b}\'s eyes. Something is still there.',
  '${a} cannot vote but ${b} can feel the static trailing them across the camp perimeter.',
  '${a} whispers from deep in the signal and ${b} wakes up changed. Doesn\'t know why.',
  '${a}\'s presence warps the feed around ${b}. Nobody else notices the distortion.',
  '${a} reaches back from the ghost layer. The reach is degraded. It still adjusts ${b}\'s paranoia.',
  '${a} no longer exists as a player. The island still routes them through ${b}\'s nightmares.',
  '${a}\'s data-echo is fragmented and slow. It finds ${b} at the water source anyway.',
  '${b} hears a name they can\'t quite place. The voice sounds like someone who is no longer here.',
  '${a}\'s ghost has been here long enough to become ambient noise. ${b} calls it the island.',
]

// Keep the original export as a fallback alias
export const GHOST_LINES = GHOST_LINES_ANCIENT

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
  // Signal drops — Idol.Null aesthetic (no Hunger Games language)
  'A corporate signal drop descends on coordinates matching ${a}\'s last registered position.',
  '${a} receives an unsolicited equipment cache. The manifest is encoded. The contents are not.',
  'The arena\'s logistics system routes a care package to ${a}. Origin: unspecified.',
  'An unmarked supply canister lands near ${a}\'s camp zone. Nobody authorized this drop.',
  '${a} opens the cache before telling the tribe. Standard protocol. Nobody calls it cheating.',
  '${a} receives enough field medicine to close one wound and enough rations to stop counting hours.',
  'The arena\'s support tier activates for ${a}. It does not explain why ${a} was selected.',
  'A signal-coded package materializes at ${a}\'s coordinates. The island had it queued.',
  '${a}\'s external support network came through. The drop is discrete. The tribe notices anyway.',
]

export const GAMEMAKER_LINES = [
  'The arena operators have been watching. They introduce a variable.',
  'High in the production infrastructure, someone decides the feed has been too stable.',
  'A new parameter deploys to the island\'s western sector. No briefing was sent.',
  'An event flag activates in the arena backend. The island processes it before the castaways do.',
  'The arena shifts configuration. Not dramatically. Just enough to notice.',
  'The arena operators compress the viable zone. The map gets smaller.',
  'Someone in the control layer flags a castaway as a priority signal. The arena reconfigures around them.',
  'The arena deploys a biohazard event to the canopy zone. The operators needed a response.',
  'The arena\'s resource distribution is rebalanced. Dehydration becomes the episode\'s logic.',
  'A system-level intervention targets the most comfortable castaway in the current session.',
  'The production layer decides the island needs a new variable. The castaways are the last to find out.',
]

// ── Camp Reactions ────────────────────────────────────────────────────────────
// ${a} = person reacting, ${b} = person they are reacting to
export const REACTION_LINES = [
  '${a} doesn\'t respond to ${b}. That silence is the response.',
  '${a} laughs it off in front of the cameras. Then walks away and pulls two people aside.',
  '${a} watches ${b} go and immediately starts running new numbers.',
  '${a} says "okay" in a tone that means the exact opposite of okay.',
  '${a} walks to the water\'s edge and stands there. Processing.',
  '${a} lets it go — in a way that is absolutely going to come back at tribal.',
  '${a} tells the cameras that ${b} just made a very expensive mistake.',
  '${a} doesn\'t react visibly. Stores it. The storage is getting full.',
  '${a} smiles when ${b} turns away. It is not a friendly smile.',
  '${a} goes to find their closest ally before ${b} can get there first.',
  '${a} says nothing. Mutters something. The feed picks it up. The tribe doesn\'t.',
  '${a} stares at ${b}\'s back until ${b} rounds the corner. Then moves.',
]

// ── Camp Chain Reactions ──────────────────────────────────────────────────────
// ${a} = third-party observer who gets drawn in
export const CHAIN_REACTION_LINES = [
  '${a} watched the whole thing from the tree line. Doesn\'t move. Files it.',
  '${a} looks between both of them and very deliberately picks a side.',
  '${a} heard enough. The vote was already decided; this just made it cleaner.',
  '${a} catches it all from across camp. The file will be opened at tribal.',
  '${a} pulls two people away from the fire. Whatever was planned is now changing.',
  '${a} doesn\'t intervene. Just watches. Learns something useful.',
  '${a} is visibly recalculating. Nobody pretends they can\'t see it.',
  '${a} absorbs the fallout from twenty feet away and quietly decides this is good for them.',
  '${a} was minding their own business until they weren\'t. Now they are involved.',
  '${a} realizes they just became a swing vote and the feeling is complicated.',
]

// ── Vote Speeches ─────────────────────────────────────────────────────────────
// ${a} = voter, ${b} = target. Used when voter has high threat-read on target.
export const VOTE_SPEECH_THREAT = [
  '"${b}." ${a} holds up the parchment. "I\'ve watched you since day one. You are the most dangerous person out here. Tonight is the night."',
  '${a} writes the name deliberately. "${b} is good at this. That\'s exactly why they can\'t stay."',
  '"Tonight I\'m writing ${b} because if I wait any longer I won\'t get the chance. Simple math." ${a} folds the parchment.',
  '"${b} has been in everyone\'s ear since day one and won every challenge they needed to. I need them gone before jury." ${a} caps the pen.',
  '${a} to the urn: "${b}. They are going to win this game if they make it to the end. I cannot let them make it to the end."',
  '"${b} has played a better game than anyone wants to admit out loud. That\'s why they have to go first." ${a} caps the pen.',
  '${a}: "Writing ${b} because if this tribe was smart we\'d all be writing ${b}. They are the biggest threat and we keep pretending they\'re not."',
]

// ${a} = voter, ${b} = target. Used when voter actively dislikes target (neg relationship).
export const VOTE_SPEECH_ENEMY = [
  '"${b}." ${a} doesn\'t hesitate. "They know exactly what they did. I don\'t need to explain it to the cameras."',
  '${a} scrawls the name. "${b} has made my time here genuinely miserable and this vote is the first good thing I\'ve had in days."',
  '"I have been waiting to write this name since day three." ${a} underlines it. Twice.',
  '"${b} has lied to me, cut me out, and taken credit for my work in front of everyone on this beach. This is long overdue." ${a} folds the slip.',
  '${a}: "I don\'t even want the money right now. I just want ${b} gone. I want to sit down tomorrow morning and not see that face."',
  '${a} stares at the name after writing it. "Feels right." Folds the paper.',
  '"${b} came for me before I could come for them. They almost got there." ${a} tucks the parchment away.',
]

// ${a} = voter, ${b} = target. Used when voter had positive relationship but is voting against (betrayal).
export const VOTE_SPEECH_BETRAY = [
  '"${b}, I am sorry. I genuinely am. But I need this more than I need you to be okay with me right now." ${a} folds the parchment.',
  '"${b} trusted me. I trusted ${b}. And I\'m writing this name anyway — which tells you where we are in this game." ${a} doesn\'t look at the camera.',
  '${a}: "I promised ${b} final two. I\'m breaking that promise because promises don\'t have a place this late in the season. I\'m sorry."',
  '"${b} is my closest ally here. That\'s exactly why they have to go before jury. They\'re the one person who could beat me." ${a} doesn\'t meet the camera.',
  '"${b} and I came into this together. I\'m hoping we can talk about it on the other side." ${a} folds the slip quickly.',
  '${a} hesitates, pen on parchment. "I know you think this isn\'t coming. I need you to know I didn\'t want it to." Then writes it.',
  '"${b} was always going to be my biggest problem in the end. I just got there first." ${a} slides it into the urn.',
]

// ${a} = voter, ${b} = target. Default/neutral strategic vote.
export const VOTE_SPEECH_STRATEGIC = [
  '${a}: "${b}. I\'ve run the numbers and this is the move that keeps me alive longest."',
  '"I\'m voting ${b} tonight because the game requires it. Nothing personal on my end." ${a} sets the pen down.',
  '${a} to the urn: "${b}. The tribe has a direction and I\'m voting with the tribe."',
  '"${b} isn\'t someone I hate. I\'m just someone they should have worked harder to keep." ${a} writes the name.',
  '${a}: "Writing ${b} because the math works out for me that way going forward."',
  '"${b} is the name that makes sense for my game at this specific moment." ${a} folds it neatly.',
  '"I don\'t enjoy this part. But ${b} is going home tonight and the reason is pure strategy." ${a} slides the parchment in.',
  '${a}: "Every player still alive is someone I had a conversation with this week. ${b}\'s conversation didn\'t go the way it needed to."',
]

// ── Map Event Narratives ──────────────────────────────────────────────────────
// ${a} = affected castaway (used in injury lines). Non-${a} lines are scene-setting.
export const MAP_EVENT_FIRE = [
  'A fire erupts near camp. The smoke column is visible from both shores.',
  'The signal doesn\'t explain the fire. It starts at the treeline and moves fast.',
  'Smoke. Then heat. Then everyone running. The island set something burning.',
  'The arena is on fire. The Gamemakers didn\'t announce this one.',
  'Orange light across the valley. It started before dawn.',
  '${a} gets caught on the wrong side of the fire line. The burns are survivable. Barely.',
  '${a} tries to save camp supplies. Comes back with singed hands and half of what they grabbed.',
]

export const MAP_EVENT_FLOOD = [
  'Water rises from the river. The camp was not built high enough.',
  'The flood arrives without warning. The island drains uphill.',
  'A wall of grey water moves through the valley. Everyone was already wet.',
  'The flood recedes. Leaves mud. Leaves damage. Leaves everyone tired.',
  '${a} loses footing in the current. Gets back up. Looks at the damage. Says nothing.',
  '${a}\'s supplies are underwater. Everything they saved from before is gone.',
]

export const MAP_EVENT_ANOMALY = [
  '▚ A signal anomaly activates at grid coordinates unknown. The island knows.',
  '▚ Something in the terrain doesn\'t match what it was yesterday. The island is rewriting.',
  '▚ The anomaly manifests at the edge of camp. The castaways feel it before they see it.',
  '▚ SIGNAL READ: sector corrupted. Recommend clearance. Clearance denied.',
  '▚ A null-pointer event destabilizes the trust matrix. The alliances don\'t know yet.',
  '▚ ${a} is standing in the wrong place when the anomaly hits. Their stats don\'t stabilize for hours.',
]

export const MAP_EVENT_LAVA = [
  'The ground opens near camp. The island is showing its insides.',
  'Lava flow detected at the island\'s west quadrant. Nobody was briefed on this.',
  'The ground runs orange. The island is boiling. The castaways run.',
  'SYSTEM: thermal event active. Evacuation recommended. Nobody listens.',
  'The lava doesn\'t reach camp. It gets close enough to matter.',
  '${a} gets closest. The heat is medical. The burns are real.',
  '${a} doesn\'t get clear in time. The island doesn\'t apologize.',
]

// ── Merge Event ──────────────────────────────────────────────────────────────
// Fired on the first day both tribes converge to one.
export const MERGE_LINES_ANNOUNCE = [
  '▓▓ THE TRIBES HAVE MERGED. ONE CAMP. ONE FIRE. ONE SIGNAL. ▓▓',
  '▓▓ MERGE EVENT: the island collapses the two tribes into one. The game changes now. ▓▓',
  '▓▓ SYSTEM: tribe boundaries dissolved. All players compete as individuals. The signal reconfigures. ▓▓',
]

export const MERGE_LINES_CAMP = [
  'The merge camp looks the same as yesterday. Nothing is the same as yesterday.',
  'Old alliances recalculate in real time. Nobody says it out loud.',
  'Two tribes worth of paranoia has been condensed into one camp. The math is bad.',
  'Everyone is smiling. Everyone knows what the smiling means.',
  'The fire is bigger tonight. The trust is smaller.',
  'Old tribal lines don\'t disappear. They just go underground.',
  'The Gamemakers drop the merge buff like a grenade. The fallout is immediate.',
]

export const MERGE_LINES_CASTAWAY = [
  '${a} reads the room and starts making new handshakes before the sun sets.',
  '${a} had a plan for this. The plan does not survive contact with the merge.',
  '${a} takes stock. Counts allies. Counts threats. Doesn\'t like the math.',
  '${a} is the most dangerous person here. Three people have thought that. None of them agree on who it is.',
  '${a} smiles, shakes hands, and immediately starts tracking who is talking to whom.',
  '${a} sits at the edge of the new camp and watches every conversation that isn\'t theirs.',
  '${a} already has a post-merge name in mind. Just one.',
]

// ── Season Bootstrap ──────────────────────────────────────────────────────────
export const TRIBE_NAME_PAIRS: [string, string][] = [
  ['KALA',   'VORA'],
  ['NAGA',   'TOLO'],
  ['SOVA',   'KIRA'],
  ['IRON',   'ASHEN'],
  ['EMBER',  'BRACK'],
  ['SPIRE',  'DIRGE'],
  ['MESA',   'REBUS'],
  ['DELTA',  'CANON'],
  ['HELIX',  'AXIOM'],
  ['SABLE',  'THORN'],
  ['VAPOR',  'CINDER'],
  ['NEXUS',  'DREAD'],
  ['ONYX',   'SOLUM'],
  ['PRISM',  'VANTA'],
  ['KAIROS', 'TELOS'],
]

export const TRIBE_COLOR_PAIRS: [string, string][] = [
  ['#cc6600', '#1166aa'],
  ['#cc3300', '#007744'],
  ['#8833cc', '#aa8800'],
  ['#cc0066', '#007799'],
  ['#447700', '#cc5500'],
  ['#884400', '#006688'],
  ['#993300', '#008855'],
  ['#1155bb', '#bb5500'],
]

export const MERGE_TRIBE_NAMES = [
  'NULL', 'TERRA', 'APEX', 'ZERO', 'SIGNAL',
  'PRIME', 'AETHER', 'LOOP', 'FRACTURE', 'STATIC',
  'LIMINAL', 'VOID', 'ECHO', 'REMNANT',
]
