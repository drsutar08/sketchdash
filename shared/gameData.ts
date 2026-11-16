import {
  LOCALIZED_PACK_CONTENT,
  SUPPORTED_LANGUAGES,
  normalizeLanguage,
  type LanguageOption,
  type SupportedLanguage,
} from './localizedPacks.ts';

export {
  SUPPORTED_LANGUAGES,
  normalizeLanguage,
  type LanguageOption,
  type SupportedLanguage,
};

export type GameMode = 'draw' | 'trivia';

export type RoomPhase =
  | 'LOBBY'
  | 'WORD_CHOICE'
  | 'DRAWING'
  | 'TRIVIA'
  | 'ROUND_SUMMARY'
  | 'GAME_OVER';

export type DrawTool = 'marker' | 'highlighter' | 'eraser' | 'fill';

export interface Point {
  x: number;
  y: number;
}

export interface DrawStroke {
  id: string;
  tool: DrawTool;
  color: string;
  size: number;
  points: Point[];
}

export const MAX_ROOM_PLAYERS = 12;

export const AVATAR_SHAPES = [
  'circle',
  'rounded',
  'blob',
  'hexagon',
  'star',
  'diamond',
] as const;
export type AvatarShape = (typeof AVATAR_SHAPES)[number];

export const AVATAR_EYES = ['classic', 'happy', 'wink', 'cool', 'wide'] as const;
export type AvatarEyes = (typeof AVATAR_EYES)[number];

export const AVATAR_MOUTHS = ['smile', 'grin', 'cat', 'surprised', 'smirk'] as const;
export type AvatarMouth = (typeof AVATAR_MOUTHS)[number];

export const AVATAR_ACCESSORIES = [
  'none',
  'glasses',
  'crown',
  'headphones',
  'cap',
  'antenna',
] as const;
export type AvatarAccessory = (typeof AVATAR_ACCESSORIES)[number];

export interface AvatarConfig {
  color: string;
  shape: AvatarShape;
  eyes: AvatarEyes;
  mouth: AvatarMouth;
  accessory: AvatarAccessory;
}

export interface PlayerInfo {
  id: string;
  name: string;
  avatarColor: string;
  avatar?: AvatarConfig;
  score: number;
  roundDelta: number;
  hasGuessed: boolean;
  hasAnsweredTrivia: boolean;
  connected: boolean;
  isSpectator: boolean;
  streak: number;
  hasDailyBadge?: boolean;
}

export interface ChatEntry {
  id: string;
  playerId?: string;
  playerName?: string;
  playerColor?: string;
  text: string;
  kind: 'chat' | 'correct' | 'close' | 'system' | 'reaction';
  timestamp: number;
}

export interface TriviaQuestionPublic {
  id: string;
  category: string;
  prompt: string;
  options: [string, string, string, string];
}

export interface TriviaQuestionFull extends TriviaQuestionPublic {
  correctIndex: number;
  factoid: string;
}

export interface WordPack {
  id: string;
  title: string;
  subtitle: string;
  priceUsd: number;
  tier: 'free' | 'paid' | 'custom';
  coverImage?: string;
  accentColor: string;
  words: string[];
  trivia: TriviaQuestionFull[];
}

export interface LeaderboardDayPoint {
  date: string;
  label: string;
  earned: number;
  cumulative: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatarColor: string;
  avatar?: AvatarConfig;
  totalPoints: number;
  gamesPlayed: number;
  wins: number;
  lastActive: number;
  hasDailyBadge?: boolean;
  dailyPoints?: Record<string, number>;
  history7Days?: LeaderboardDayPoint[];
}

export const DAILY_CHALLENGE_MULTIPLIER = 1.5;
export const DAILY_CHALLENGE_BONUS_POINTS = 250;
export const DAILY_CHALLENGE_WORD_COUNT = 5;

export interface DailyFinisher {
  id: string;
  name: string;
  avatarColor: string;
  avatar?: AvatarConfig;
  elapsedSeconds: number;
  completedAt: number;
  bonusPoints: number;
}

export interface DailyChallengeState {
  dateKey: string;
  multiplier: number;
  bonusPoints: number;
  words: string[];
  packSourceTitle: string;
  totalFinishers: number;
  topFinishers: DailyFinisher[];
  completedByPlayer: boolean;
  playerResult?: DailyFinisher;
}

export interface RoomPublicState {
  code: string;
  hostId: string;
  isPublic: boolean;
  mode: GameMode;
  language: SupportedLanguage;
  packId: string;
  packTitle: string;
  adFree: boolean;
  phase: RoomPhase;
  round: number;
  roundsTotal: number;
  turnIndex: number;
  totalTurnsInRound: number;
  roundDuration: number;
  timeLeft: number;
  drawerId: string | null;
  wordMask: string;
  wordLength: number;
  wordOptions?: string[];
  secretWord?: string;
  revealedWord?: string;
  triviaQuestion?: TriviaQuestionPublic;
  triviaCorrectIndex?: number;
  triviaFactoid?: string;
  players: PlayerInfo[];
  strokes: DrawStroke[];
  chat: ChatEntry[];
  sponsorSlot: {
    brand: string;
    headline: string;
    ctaLabel: string;
  };
}

export type ClientMessage =
  | {
      type: 'room:create';
      name: string;
      avatarColor: string;
      avatar?: AvatarConfig;
      mode: GameMode;
      language?: SupportedLanguage;
      packId: string;
      roundsTotal: number;
      roundDuration: number;
      customWords: string[];
      adFree: boolean;
      isPublic?: boolean;
    }
  | {
      type: 'room:join';
      code: string;
      name: string;
      avatarColor: string;
      avatar?: AvatarConfig;
      spectate?: boolean;
    }
  | { type: 'room:claim_spot' }
  | {
      type: 'room:update_settings';
      mode?: GameMode;
      language?: SupportedLanguage;
      packId?: string;
      roundsTotal?: number;
      roundDuration?: number;
      customWords?: string[];
      adFree?: boolean;
      isPublic?: boolean;
    }
  | { type: 'game:start' }
  | { type: 'game:restart' }
  | { type: 'game:next_turn' }
  | { type: 'word:select'; word: string }
  | { type: 'draw:stroke'; stroke: DrawStroke }
  | { type: 'draw:preview'; stroke: DrawStroke }
  | { type: 'draw:undo' }
  | { type: 'draw:clear' }
  | { type: 'chat:guess'; text: string }
  | { type: 'chat:reaction'; emoji: string }
  | { type: 'trivia:answer'; optionIndex: number };

export const QUICK_REACTIONS = ['❤️', '😂', '👏', '🔥', '🤯', '👀'] as const;

export type ServerMessage =
  | { type: 'room:joined'; playerId: string; state: RoomPublicState }
  | { type: 'room:state'; state: RoomPublicState }
  | { type: 'room:full'; code: string; activeCount: number; spectatorCount: number }
  | { type: 'draw:stroke'; stroke: DrawStroke }
  | { type: 'draw:preview'; stroke: DrawStroke }
  | { type: 'draw:sync_strokes'; strokes: DrawStroke[] }
  | { type: 'chat:entry'; entry: ChatEntry }
  | { type: 'timer:tick'; timeLeft: number; wordMask?: string }
  | { type: 'error'; message: string };

export const AVATAR_COLORS = [
  '#FF5A36',
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EC4899',
  '#8B5CF6',
  '#06B6D4',
  '#84CC16',
];

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  color: AVATAR_COLORS[0],
  shape: 'rounded',
  eyes: 'classic',
  mouth: 'smile',
  accessory: 'none',
};

export function sanitizeAvatarConfig(raw: unknown, fallbackColor?: string): AvatarConfig {
  const obj = raw && typeof raw === 'object' ? (raw as Partial<AvatarConfig>) : {};
  const color =
    typeof obj.color === 'string' && AVATAR_COLORS.includes(obj.color)
      ? obj.color
      : typeof fallbackColor === 'string' && AVATAR_COLORS.includes(fallbackColor)
      ? fallbackColor
      : AVATAR_COLORS[0];

  const shape = AVATAR_SHAPES.includes(obj.shape as AvatarShape)
    ? (obj.shape as AvatarShape)
    : DEFAULT_AVATAR_CONFIG.shape;
  const eyes = AVATAR_EYES.includes(obj.eyes as AvatarEyes)
    ? (obj.eyes as AvatarEyes)
    : DEFAULT_AVATAR_CONFIG.eyes;
  const mouth = AVATAR_MOUTHS.includes(obj.mouth as AvatarMouth)
    ? (obj.mouth as AvatarMouth)
    : DEFAULT_AVATAR_CONFIG.mouth;
  const accessory = AVATAR_ACCESSORIES.includes(obj.accessory as AvatarAccessory)
    ? (obj.accessory as AvatarAccessory)
    : DEFAULT_AVATAR_CONFIG.accessory;

  return { color, shape, eyes, mouth, accessory };
}

export function createSeededAvatar(seedText: string, fallbackColor?: string): AvatarConfig {
  let hash = 0;
  for (let i = 0; i < seedText.length; i++) {
    hash = (hash * 31 + seedText.charCodeAt(i)) >>> 0;
  }
  return {
    color:
      fallbackColor && AVATAR_COLORS.includes(fallbackColor)
        ? fallbackColor
        : AVATAR_COLORS[hash % AVATAR_COLORS.length],
    shape: AVATAR_SHAPES[hash % AVATAR_SHAPES.length],
    eyes: AVATAR_EYES[(hash >> 3) % AVATAR_EYES.length],
    mouth: AVATAR_MOUTHS[(hash >> 6) % AVATAR_MOUTHS.length],
    accessory: AVATAR_ACCESSORIES[(hash >> 9) % AVATAR_ACCESSORIES.length],
  };
}

export const MARKER_COLORS = [
  '#181A20',
  '#EF4444',
  '#F97316',
  '#EAB308',
  '#10B981',
  '#06B6D4',
  '#3B82F6',
  '#6366F1',
  '#EC4899',
  '#92400E',
  '#64748B',
  '#FCFBF7',
];

export const SPONSOR_CARDS = [
  {
    brand: 'Midnight Kettle Coffee',
    headline: 'Late-night study & hostel fuel. Zero bitterness, instant brew.',
    ctaLabel: 'Sponsor Slot · Go Ad-Free',
  },
  {
    brand: 'CampusFiber Wi-Fi',
    headline: 'Lag-free party lobbies across every dorm floor.',
    ctaLabel: 'Sponsor Slot · Go Ad-Free',
  },
  {
    brand: 'QuickBite Noodles',
    headline: 'Ready in 120 seconds—just like your fastest sketch round.',
    ctaLabel: 'Sponsor Slot · Go Ad-Free',
  },
];

export const WORD_PACKS: WordPack[] = [
  {
    id: 'classic',
    title: 'Classic Party',
    subtitle: 'Instant crowd-pleasers for any friend group',
    priceUsd: 0,
    tier: 'free',
    accentColor: '#FF5A36',
    words: [
      'Skateboard',
      'Volcano',
      'Headphones',
      'Trampoline',
      'Astronaut',
      'Origami',
      'Submarine',
      'Flamingo',
      'Campfire',
      'Microscope',
      'Pancakes',
      'Parachute',
      'Windmill',
      'Kangaroo',
      'Saxophone',
      'Snowglobe',
      'Treehouse',
      'Backpack',
      'Espresso',
      'Lighthouse',
      'Telescope',
      'Pineapple',
      'Rollercoaster',
      'Boomerang',
    ],
    trivia: [
      {
        id: 'cl-1',
        category: 'General',
        prompt: 'Which animal sleeps standing up most of the time yet cannot vomit?',
        options: ['Giraffe', 'Horse', 'Elephant', 'Flamingo'],
        correctIndex: 1,
        factoid: 'Horses have a one-way valve in their esophagus that prevents vomiting.',
      },
      {
        id: 'cl-2',
        category: 'Food',
        prompt: 'Which fruit was historically named after a pine cone by European explorers?',
        options: ['Pomegranate', 'Pineapple', 'Papaya', 'Dragonfruit'],
        correctIndex: 1,
        factoid: 'Explorers called it "pineapple" because it resembled a giant pine cone.',
      },
      {
        id: 'cl-3',
        category: 'Science',
        prompt: 'About how long does light take to travel from the Sun to Earth?',
        options: ['8 seconds', '8 minutes', '8 hours', '24 minutes'],
        correctIndex: 1,
        factoid: 'Sunlight takes roughly 8 minutes and 20 seconds to cover 150 million km.',
      },
      {
        id: 'cl-4',
        category: 'Geography',
        prompt: 'Which country has more natural lakes than the rest of the world combined?',
        options: ['Finland', 'Russia', 'Canada', 'Brazil'],
        correctIndex: 2,
        factoid: 'Canada holds over 60% of all natural lakes on Earth.',
      },
      {
        id: 'cl-5',
        category: 'Design',
        prompt: 'What color is the traditional black box flight recorder inside an airplane?',
        options: ['Matte Black', 'Bright Orange', 'Neon Green', 'Chrome Silver'],
        correctIndex: 1,
        factoid: 'Flight recorders are painted bright orange so search teams can spot them easily.',
      },
      {
        id: 'cl-6',
        category: 'Everyday',
        prompt: 'How many dots appear in total on a standard six-sided die?',
        options: ['18', '21', '24', '16'],
        correctIndex: 1,
        factoid: '1 + 2 + 3 + 4 + 5 + 6 equals 21, and opposite sides always sum to 7.',
      },
      {
        id: 'cl-7',
        category: 'Space',
        prompt: 'Which planet in our solar system spins clockwise (opposite most planets)?',
        options: ['Mars', 'Venus', 'Neptune', 'Mercury'],
        correctIndex: 1,
        factoid: 'On Venus, the sun rises in the west and sets in the east.',
      },
      {
        id: 'cl-8',
        category: 'Music',
        prompt: 'How many keys are on a standard full-size acoustic piano?',
        options: ['76', '84', '88', '92'],
        correctIndex: 2,
        factoid: 'A standard piano has 52 white keys and 36 black keys, totaling 88.',
      },
    ],
  },
  {
    id: 'hostel',
    title: 'Hostel & Campus',
    subtitle: 'Midnight noodles, proxy attendance, and dorm chaos',
    priceUsd: 0,
    tier: 'free',
    coverImage: '/src/assets/images/pack_hostel_campus_1794764686569.jpg',
    accentColor: '#10B981',
    words: [
      'Instant Noodles',
      'Proxy Attendance',
      'Midnight Chai',
      'Bunk Ladder',
      'Wi-Fi Router',
      'Exam Cramming',
      'Laundry Pile',
      'Extension Cord',
      'Ceiling Fan',
      'Group Project',
      'Lost Keys',
      'Borrowed Hoodie',
      'Alarm Snooze',
      'Tangled Earphones',
      'Dead Laptop',
      'Canteen Samosa',
      '8 AM Lecture',
      'Kettle Soup',
      'Roommate Snoring',
      'Backpack',
      'Coffee Mug',
      'Library Nap',
      'Power Bank',
      'Semester Break',
    ],
    trivia: [
      {
        id: 'ho-1',
        category: 'Campus Tech',
        prompt: 'What does "Wi-Fi" actually stand for according to its branding creators?',
        options: [
          'Wireless Fidelity',
          'Wideband Finder',
          'Nothing—it is a coined trademark',
          'Wired Free Internet',
        ],
        correctIndex: 2,
        factoid: 'Interbrand invented "Wi-Fi" as a catchy pun on "Hi-Fi"; it is not an acronym.',
      },
      {
        id: 'ho-2',
        category: 'Late Night',
        prompt: 'Which instant noodle brand was invented in Japan in 1958 by Momofuku Ando?',
        options: ['Indomie', 'Chikin Ramen', 'Samyang Buldak', 'Shin Ramyun'],
        correctIndex: 1,
        factoid: 'Momofuku Ando flash-fried noodles in 1958 to create the first instant Chikin Ramen.',
      },
      {
        id: 'ho-3',
        category: 'Study Fuel',
        prompt: 'Which common beverage naturally contains more caffeine per ounce: espresso or drip coffee?',
        options: ['Espresso', 'Drip coffee', 'They are identical', 'Green tea'],
        correctIndex: 0,
        factoid: 'Ounce for ounce, espresso is far more concentrated (~63mg per 1oz shot vs ~12mg per 1oz drip).',
      },
      {
        id: 'ho-4',
        category: 'Dorm Life',
        prompt: 'In keyboard layouts, why were QWERTY keys arranged the way they are?',
        options: [
          'To maximize typing speed',
          'To prevent typewriter jam bars',
          'Alphabetical order failed patents',
          'Early telegraph rules',
        ],
        correctIndex: 1,
        factoid: 'Christopher Sholes spaced common letter pairs apart so mechanical arms would not jam.',
      },
      {
        id: 'ho-5',
        category: 'Student Survival',
        prompt: 'Which sleep cycle stage is most closely linked to vivid dreams before an 8 AM alarm?',
        options: ['Stage 1 Light', 'Deep Slow-Wave', 'REM Sleep', 'Micro-nap'],
        correctIndex: 2,
        factoid: 'Rapid Eye Movement (REM) periods lengthen toward early morning hours.',
      },
      {
        id: 'ho-6',
        category: 'Campus Math',
        prompt: 'If a pizza has radius z and thickness a, what is its volume formula?',
        options: ['pi * z * z * a', '2 * pi * z * a', 'pi * a * a * z', 'z * a * pi'],
        correctIndex: 0,
        factoid: 'Cylinder volume is pi * r^2 * h, which famously spells pi-z-z-a!',
      },
      {
        id: 'ho-7',
        category: 'Hostel Lore',
        prompt: 'Which everyday object was originally invented to clean soot off wallpaper?',
        options: ['Duct tape', 'Play-Doh', 'Post-it Notes', 'Bubble wrap'],
        correctIndex: 1,
        factoid: 'Play-Doh started in the 1930s as a non-toxic wallpaper cleaner before kids loved molding it.',
      },
      {
        id: 'ho-8',
        category: 'Tech',
        prompt: 'What error code in HTTP means "I am a teapot" (April Fools RFC 2324)?',
        options: ['404', '418', '429', '503'],
        correctIndex: 1,
        factoid: 'HTTP 418 "I’m a teapot" is an official, beloved internet Easter egg since 1998.',
      },
    ],
  },
  {
    id: 'pop_culture',
    title: 'Pop & Internet',
    subtitle: 'Memes, streaming habits, and viral moments',
    priceUsd: 0,
    tier: 'free',
    accentColor: '#3B82F6',
    words: [
      'Podcast Mic',
      'Green Screen',
      'Binge Watch',
      'Screenshot',
      'Spoiler Alert',
      'Pixel Art',
      'Dark Mode',
      'Autocorrect',
      'Playlist',
      'Unboxing',
      'Reaction Face',
      'Speedrun',
      'Thumb Drive',
      'VR Headset',
      'Live Stream',
      'Ring Light',
      'Voice Note',
      'Group Chat',
      'Viral Dance',
      'Loading Bar',
    ],
    trivia: [
      {
        id: 'pop-1',
        category: 'Internet History',
        prompt: 'What was the very first video ever uploaded to YouTube in April 2005?',
        options: ['Charlie Bit My Finger', 'Me at the zoo', 'Evolution of Dance', 'Keyboard Cat'],
        correctIndex: 1,
        factoid: 'Co-founder Jawed Karim uploaded the 19-second clip "Me at the zoo" on April 23, 2005.',
      },
      {
        id: 'pop-2',
        category: 'Gaming',
        prompt: 'Which classic puzzle game became the best-selling video game franchise of its era on Game Boy?',
        options: ['Tetris', 'Minesweeper', 'Pac-Man', 'Breakout'],
        correctIndex: 0,
        factoid: 'Bundling Tetris with the original Game Boy turned it into a global phenomenon.',
      },
      {
        id: 'pop-3',
        category: 'Memes',
        prompt: 'In the "This is Fine" meme, what animal is calmly sipping coffee inside a burning room?',
        options: ['A cat', 'A frog', 'A dog', 'A raccoon'],
        correctIndex: 2,
        factoid: 'Cartoonist KC Green drew the dog in a bowler hat in his 2013 Gunshow comic.',
      },
      {
        id: 'pop-4',
        category: 'Streaming',
        prompt: 'Which South Korean survival drama became Netflix’s most-watched series upon release in 2021?',
        options: ['All of Us Are Dead', 'Kingdom', 'Squid Game', 'Sweet Home'],
        correctIndex: 2,
        factoid: 'Squid Game topped charts in over 90 countries within weeks.',
      },
      {
        id: 'pop-5',
        category: 'Design',
        prompt: 'Which iconic emoji was named Oxford Dictionaries Word of the Year in 2015?',
        options: ['Fire', 'Face with Tears of Joy', 'Thumbs Up', '100'],
        correctIndex: 1,
        factoid: 'It was the first time a pictograph won Oxford’s Word of the Year.',
      },
      {
        id: 'pop-6',
        category: 'Audio',
        prompt: 'Which 1987 Rick Astley hit powers the classic "Rickroll" internet prank?',
        options: ['Together Forever', 'Never Gonna Give You Up', 'Take Me to Your Heart', 'Cry for Help'],
        correctIndex: 1,
        factoid: 'The prank evolved from "duckrolling" on imageboards in 2007.',
      },
    ],
  },
  {
    id: 'cinema',
    title: 'Cinema & Classics',
    subtitle: 'Blockbusters, interval snacks, and iconic props',
    priceUsd: 1.99,
    tier: 'paid',
    coverImage: '/src/assets/images/pack_cinema_classics_1794764686354.jpg',
    accentColor: '#F59E0B',
    words: [
      'Clapperboard',
      'Popcorn Bucket',
      'Red Carpet',
      'Plot Twist',
      'Stunt Double',
      '3D Glasses',
      'Director Chair',
      'Oscar Trophy',
      'Movie Poster',
      'Drive-In',
      'Cliffhanger',
      'Film Reel',
      'Box Office',
      'Spotlight',
      'Camera Lens',
      'Soundtrack',
      'Time Machine',
      'Laser Sword',
      'Treasure Map',
      'Supervillain',
    ],
    trivia: [
      {
        id: 'cin-1',
        category: 'Cinema',
        prompt: 'What is the fictional metal used to forge Captain America’s circular shield?',
        options: ['Adamantium', 'Vibranium', 'Beskar', 'Mythril'],
        correctIndex: 1,
        factoid: 'Vibranium absorbs kinetic energy and originates from Wakanda.',
      },
      {
        id: 'cin-2',
        category: 'Animation',
        prompt: 'Which 1995 film was the first feature-length movie created entirely with CGI?',
        options: ['A Bug’s Life', 'Shrek', 'Toy Story', 'Monsters, Inc.'],
        correctIndex: 2,
        factoid: 'Pixar’s Toy Story pioneered full-length computer-animated cinema in 1995.',
      },
      {
        id: 'cin-3',
        category: 'Trivia',
        prompt: 'In Back to the Future, what speed must the DeLorean reach to travel through time?',
        options: ['77 mph', '88 mph', '99 mph', '100 mph'],
        correctIndex: 1,
        factoid: 'Doc Brown chose 88 mph because it looked punchy on the digital speedometer.',
      },
      {
        id: 'cin-4',
        category: 'Film Craft',
        prompt: 'Why is a clapperboard snapped loudly right before a movie scene begins?',
        options: [
          'To wake the actors',
          'To sync audio and video tracks',
          'To mark lens focus',
          'To test mic volume',
        ],
        correctIndex: 1,
        factoid: 'The sharp visual clap matches the audio spike so editors can align sound and film.',
      },
      {
        id: 'cin-5',
        category: 'World Cinema',
        prompt: 'Which 2019 Korean film became the first non-English language movie to win Best Picture at the Oscars?',
        options: ['Oldboy', 'Minari', 'Parasite', 'Train to Busan'],
        correctIndex: 2,
        factoid: 'Bong Joon-ho’s Parasite won four Academy Awards including Best Picture.',
      },
      {
        id: 'cin-6',
        category: 'Soundtrack',
        prompt: 'How many notes make up the famous ominous Jaws shark theme motif?',
        options: ['Two notes', 'Four notes', 'Six notes', 'Eight notes'],
        correctIndex: 0,
        factoid: 'John Williams created one of cinema’s scariest themes from just two alternating notes.',
      },
    ],
  },
  {
    id: 'nostalgia',
    title: '90s & 2000s Retro',
    subtitle: 'Cassette tapes, flip phones, and CRT weekends',
    priceUsd: 1.99,
    tier: 'paid',
    coverImage: '/src/assets/images/pack_nostalgia_retro_1794764686992.jpg',
    accentColor: '#EC4899',
    words: [
      'Cassette Tape',
      'Lava Lamp',
      'Flip Phone',
      'Floppy Disk',
      'Game Boy',
      'Rubik Cube',
      'Boombox',
      'Rollerblades',
      'VHS Tape',
      'CRT Monitor',
      'Disposable Camera',
      'Walkman',
      'Beanbag Chair',
      'Arcade Token',
      'Dial-Up Modem',
      'Tamagotchi',
      'CD Burner',
      'Slap Bracelet',
      'Pager',
      'Pixel Snake',
    ],
    trivia: [
      {
        id: 'ret-1',
        category: 'Retro Tech',
        prompt: 'What common household item did people use to wind loose ribbon back into a cassette tape?',
        options: ['A toothbrush', 'A wooden pencil', 'A paperclip', 'A spoon'],
        correctIndex: 1,
        factoid: 'A standard hexagonal pencil fit snugly inside the cassette spool teeth.',
      },
      {
        id: 'ret-2',
        category: 'Mobile History',
        prompt: 'Which classic Nokia game kept millions occupied on monochrome LCD screens in the late 1990s?',
        options: ['Bounce', 'Snake', 'Space Impact', 'Brick'],
        correctIndex: 1,
        factoid: 'Snake debuted on the Nokia 6110 in 1997 and became an instant classic.',
      },
      {
        id: 'ret-3',
        category: 'Storage',
        prompt: 'How much data could a classic 3.5-inch high-density floppy disk hold?',
        options: ['1.44 MB', '14.4 MB', '128 MB', '640 KB'],
        correctIndex: 0,
        factoid: '1.44 megabytes—barely enough for one modern smartphone photo!',
      },
      {
        id: 'ret-4',
        category: 'Toys',
        prompt: 'What was the name of the tiny 1996 keychain digital pet you had to feed and clean up after?',
        options: ['Furby', 'Tamagotchi', 'Polly Pocket', 'Digimon'],
        correctIndex: 1,
        factoid: 'Tamagotchi combines the Japanese words for "egg" (tamago) and "watch" (uotchi).',
      },
      {
        id: 'ret-5',
        category: 'Internet',
        prompt: 'Before broadband, what device made that iconic screeching handshake noise to connect online?',
        options: ['Ethernet Switch', 'Dial-Up Modem', 'Fax Splitter', 'Sound Blaster'],
        correctIndex: 1,
        factoid: '56k dial-up modems encoded digital bits as audible tones over telephone lines.',
      },
      {
        id: 'ret-6',
        category: 'Music',
        prompt: 'How much maximum audio typically fit onto a standard recordable CD-R?',
        options: ['45 minutes', '60 minutes', '80 minutes', '120 minutes'],
        correctIndex: 2,
        factoid: 'Standard 700 MB CD-Rs held up to 80 minutes of uncompressed stereo audio.',
      },
    ],
  },
  {
    id: 'custom',
    title: 'Custom Inside Jokes',
    subtitle: 'Your hostel wing, nicknames, and group lore',
    priceUsd: 4.99,
    tier: 'custom',
    accentColor: '#8B5CF6',
    words: [
      'Room 304 Raid',
      'Missing Charger',
      'Hostel Cat',
      'Sunday Biryani',
      'Borrowed Bike',
      'Midnight Maggi',
      'Warden Walk',
      'Exam All-Nighter',
    ],
    trivia: [
      {
        id: 'cus-1',
        category: 'Group Lore',
        prompt: 'Who in every hostel group swears they "did not study at all" before topping the quiz?',
        options: ['The 8 AM Sleeper', 'The Quiet Genius', 'The Wi-Fi Hoarder', 'The Kettle Chef'],
        correctIndex: 1,
        factoid: 'Classic campus phenomenon since the invention of lecture notes.',
      },
    ],
  },
];

export function getWordPack(packId: string): WordPack {
  return WORD_PACKS.find((p) => p.id === packId) || WORD_PACKS[0];
}

export function getLocalizedWordPack(packId: string, language: SupportedLanguage): WordPack {
  const base = getWordPack(packId);
  if (language === 'en') return base;
  const localized = LOCALIZED_PACK_CONTENT[language]?.[base.id];
  if (!localized) return base;
  return {
    ...base,
    title: localized.title,
    subtitle: localized.subtitle,
    words: localized.words,
    trivia: localized.trivia,
  };
}

export function getLocalizedWordPacks(language: SupportedLanguage): WordPack[] {
  return WORD_PACKS.map((p) => getLocalizedWordPack(p.id, language));
}

export function getDailyChallengeWordSet(
  dateKey: string,
  language: SupportedLanguage
): { words: string[]; packSourceTitle: string } {
  const packs = getLocalizedWordPacks(language).filter((p) => p.id !== 'custom');
  let seed = 2166136261;
  for (let i = 0; i < dateKey.length; i++) {
    seed ^= dateKey.charCodeAt(i);
    seed = Math.imul(seed, 16777619) >>> 0;
  }

  const featuredPack = packs[seed % packs.length] || packs[0];
  const combinedPool: string[] = [];
  for (const w of featuredPack.words) {
    if (!combinedPool.includes(w)) combinedPool.push(w);
  }
  for (const p of packs) {
    for (const w of p.words) {
      if (!combinedPool.includes(w)) combinedPool.push(w);
    }
  }

  const chosen: string[] = [];
  let cursor = seed;
  while (chosen.length < DAILY_CHALLENGE_WORD_COUNT && combinedPool.length > 0) {
    cursor = (Math.imul(cursor, 1664525) + 1013904223) >>> 0;
    const idx = cursor % combinedPool.length;
    const [picked] = combinedPool.splice(idx, 1);
    if (picked) chosen.push(picked);
  }

  return {
    words: chosen,
    packSourceTitle: featuredPack.title,
  };
}
