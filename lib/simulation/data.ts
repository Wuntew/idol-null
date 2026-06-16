import type { ChallengeType, TraitDef } from './types'

export const CASTAWAY_NAMES = [
  'Garbage Kevin','Babs','Trent','DeShawn','Moonpie','Brad','Crystal','Nguyen',
  'Skylar','Hoss','Patches','Vex','Ramona','Cleetus','Bex','Tofu Greg',
  'Sister Mary','Gizz','Lurleen','Chadwick','Mama Sue','Pixel','Worm',
  'Daphne','Roach','Bunny','Tank','Esmerelda',
]

export const ARCHETYPES = [
  'The Schemer','The Golden Retriever','The Villain Edit','The Floater',
  'The Provider','The Wildcard','The Pageant Queen','The Conspiracy Guy',
  'The Gym Bro','The Sweetheart','The Goblin','The Saboteur',
]

export const INSULTS = ['snake','rat','clown','gremlin','liar','ghoul','freak','weasel','goblin','worm']

export const TRAITS: Record<string, TraitDef> = {
  Cannibalistic: { accent:'#FF0000', bias:{ moxie:1.2, likeability:-1.0, physical:.6 } },
  Glitched:      { accent:'#BD00FF', bias:{ gaslighting:1.0, paranoia:.8 } },
  Paranoid:      { accent:'#00FFFF', bias:{ paranoia:1.6, likeability:-.5 } },
  Narcissistic:  { accent:'#FFFF00', bias:{ gaslighting:1.4, moxie:.8, likeability:-.6 } },
  Feral:         { accent:'#FFB000', bias:{ physical:1.4, likeability:-.8, paranoia:.4 } },
  Hollow:        { accent:'#00FF00', bias:{ paranoia:.6, moxie:-.6, likeability:-.4 } },
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
export const HOMETOWNS = ['Lower Moose Jaw','Spittlefield','New Caustic','Bismuth Creek','Salt Forks','Drywell','Cinderlick','Hog Valley','Backwater Bend','Toad Suck Annex','Grayrot','Static Hollow','Bleak Ridge','Cooper\'s Drain','Mossbarrow','Lostlight']

export const JOBS = ['discount mattress salesman','third-shift gas station clerk','competitive eater','failed cult leader','substitute gym teacher','repo man','wedding DJ','crime scene cleaner','daycare worker','insurance fraud investigator','retired exotic bird smuggler','funeral home cosmetician','crab boat deckhand','tarot reader at the mall','unlicensed tattoo artist','foreclosure auctioneer','beekeeper','community theater villain']

export const EDUCATIONS = ['dropped out of community college to "find clarity"','online ordained minister certificate','GED, earned twice for reasons unclear','self-taught, mostly from late-night infomercials','expelled from culinary school for "the incident"','correspondence degree in criminal justice','high school diploma, valedictorian of a class of nine','two semesters of art school before the funding ran out','homeschooled by a parent who distrusted institutions','vocational certificate in small engine repair','some college, didn\'t finish, doesn\'t want to talk about it','PhD dropout, ABD in a field nobody can pronounce','trade school welding certificate','military service, discharge status classified']

export const FAMILIES = ['raised by a single mother who ran a tarot hotline','oldest of seven, none of whom are speaking right now','estranged from a twin nobody else knew about','married into a family that owns a regional waterpark','parents run a roadside attraction nobody visits anymore','grandmother claims to have invented a popular condiment','has a stepfather currently incarcerated for "civil reasons"','comes from a long line of competitive yodelers','raised in a trailer behind the family\'s failing drive-in theater','youngest of four, the designated "normal one" until now','parents divorced live on local cable access television','family runs a struggling exotic pet rescue out of their garage','engaged twice, married zero times, no comment beyond that','has a brother who is "basically" famous, by his own account','raised by grandparents after a family situation nobody explains on camera','only child, overcorrected for it in every relationship since']

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
    '${a} goes feral and marks the shelter as territory; ${b} is not welcome.',
    '${a} drags ${b}\'s belongings into the tree line, growling at the cameras.',
    '${a} bites the immunity idol to check if ${b} poisoned it.',
  ],
  Hollow: [
    '${a} stares at the ocean for nine hours. ${b} swears ${a} did not blink once.',
    '${a} forgets their own name but remembers exactly how ${b} betrayed them.',
    '${a} hums a song no one taught them while ${b} backs slowly away.',
  ],
}

export const GHOST_LINES = [
  'The Ghost of ${a} drags cold fingers down ${b}\'s spine. ${b} loses their nerve.',
  '${a}\'s Ghost rearranges the alliance charts at 3AM. ${b} wakes up terrified.',
  'Static spells out ${a} on the dead monitor. ${b} stops trusting the live feed.',
  'The Ghost of ${a} whispers the votes before they happen. ${b} cannot unhear it.',
]

export const HOST_LINES = [
  'Idol.Null leans in: is it worth playing for?',
  'The host-construct grins through forty broken pixels. Worth playing for?',
  'Come on in, guys. The island is hungry today.',
  'Drop your buffs. Or your spines. The signal does not care.',
  'Somewhere on this beach, a vote is already corrupted.',
]

export const VOTE_LINES = [
  '${a} scrawls ${b}. "Nothing personal, you paranoid ${x}."',
  '${a} votes ${b}. "You gaslit the wrong damn ghost."',
  '${a} writes ${b}. "The island told me to, I swear."',
  '${a} marks ${b}. "I trusted you. That was my mistake, ${x}."',
  '${a} votes ${b} and refuses to show the camera why.',
  '${a} writes ${b}. "Burn in hell, you backstabbing ${x}."',
]

export const SNUFF_LINES = [
  'The host raises the snuffer. "${a}, the matrix has spoken." Darkness.',
  '"${a}... your signal is terminated." The torch gutters out cold.',
  '"The tribe has spoken, ${a}." Forty cameras blink off at once.',
]

export const CONSUMED_LINES = [
  'The island does not snuff ${a}. It SWALLOWS them. The feed screams and deletes the file.',
  '${a} is unwritten from the season. Even the Ghosts refuse to remember them.',
  'Where ${a} stood there is only a humming square of corrupted ███ pixels.',
]

export const ANOMALY_LINES = [
  'ANOMALY INJECTED: the sky inverts and every relationship flips its sign.',
  'ANOMALY: a second moon casts a vote. Stats scramble across the beach.',
  'ANOMALY: the confessional booth starts confessing back to the castaways.',
  'ANOMALY: time stutters. Two castaways briefly share one body and hate it.',
]

export const INFLUENCE_NARRATIVES: Record<string, string[]> = {
  gift_idol:           ['A viewer blessing materializes at ${a}\'s feet. They now hold a hidden immunity idol.'],
  poison_relationship: ['An anonymous tip poisons ${a}\'s trust in ${b}. Their bond fractures overnight.'],
  broadcast_rumor:     ['A rumor spreads through camp that ${a} is the puppet master. Votes shift toward them.'],
  inject_anomaly:      ['The signal spikes. Something from outside the game reaches in and scrambles everything.'],
  ghost_boost:         ['The Ghost of ${a} grows stronger, fed by viewer energy. ${b} begins hearing their name.'],
  confessional_leak:   ['${a}\'s confessional was leaked. The tribe now knows exactly who they plan to vote out.'],
}
