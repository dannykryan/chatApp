import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, RoomType } from "@prisma/client";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

const BASE_URL =
  "https://birclqnuxghihsievxtb.supabase.co/storage/v1/object/public/Images";

const users = [
  {
    username: "cyclops",
    email: "cyclops@xmen.com",
    bio: "Leader of the X-Men",
    profilePictureUrl: `${BASE_URL}/UserAvatars/cyclops.webp`,
  },
  {
    username: "wolverine",
    email: "wolverine@xmen.com",
    bio: "The best there is at what I do",
    profilePictureUrl: `${BASE_URL}/UserAvatars/wolverine.jpg`,
  },
  {
    username: "storm",
    email: "storm@xmen.com",
    bio: "Mistress of the elements",
    profilePictureUrl: `${BASE_URL}/UserAvatars/storm.jpg`,
  },
  {
    username: "jean_grey",
    email: "jean@xmen.com",
    bio: "Telepathic X-Man",
    profilePictureUrl: `${BASE_URL}/UserAvatars/jean_grey.jpg`,
  },
  {
    username: "beast",
    email: "beast@xmen.com",
    bio: "Brilliant scientist and X-Man",
    profilePictureUrl: `${BASE_URL}/UserAvatars/beast.jpg`,
  },
  {
    username: "gambit",
    email: "gambit@xmen.com",
    bio: "The Ragin' Cajun",
    profilePictureUrl: `${BASE_URL}/UserAvatars/gambit.webp`,
  },
  {
    username: "rogue",
    email: "rogue@xmen.com",
    bio: "Can't touch this",
    profilePictureUrl: `${BASE_URL}/UserAvatars/rogue.webp`,
  },
  {
    username: "iceman",
    email: "iceman@xmen.com",
    bio: "Coolest X-Man alive",
    profilePictureUrl: `${BASE_URL}/UserAvatars/iceman.jpg`,
  },
  {
    username: "nightcrawler",
    email: "nightcrawler@xmen.com",
    bio: "BAMF!",
    profilePictureUrl: `${BASE_URL}/UserAvatars/nightcrawler.jpg`,
  },
  {
    username: "magneto",
    email: "magneto@xmen.com",
    bio: "Master of magnetism",
    profilePictureUrl: `${BASE_URL}/UserAvatars/magneto.webp`,
  },
];

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 10);

  // Create users
  const createdUsers: Record<string, string> = {};
  for (const user of users) {
    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: { ...user, passwordHash },
    });
    createdUsers[user.username] = created.id;
    console.log(`Created user: ${user.username}`);
  }

  const cyclopsId = createdUsers["cyclops"];
  const wolverineId = createdUsers["wolverine"];
  const stormId = createdUsers["storm"];
  const jeanId = createdUsers["jean_grey"];
  const beastId = createdUsers["beast"];
  const gambitId = createdUsers["gambit"];
  const rogueId = createdUsers["rogue"];
  const icemanId = createdUsers["iceman"];
  const nightcrawlerId = createdUsers["nightcrawler"];
  const magnetoId = createdUsers["magneto"];

  // ─── FRIENDSHIPS ─────────────────────────────────────────────────

  console.log("Creating friendships...");

  const friendships = [
    // Cyclops' friends
    { userId1: cyclopsId, userId2: wolverineId },
    { userId1: cyclopsId, userId2: stormId },
    { userId1: cyclopsId, userId2: jeanId },
    { userId1: cyclopsId, userId2: beastId },
    { userId1: cyclopsId, userId2: nightcrawlerId },
    { userId1: cyclopsId, userId2: icemanId },

    // Pending requests TO cyclops (so he has some to respond to)
    { userId1: gambitId, userId2: cyclopsId },
    { userId1: rogueId, userId2: cyclopsId },

    // Other friendships
    { userId1: wolverineId, userId2: stormId },
    { userId1: wolverineId, userId2: nightcrawlerId },
    { userId1: wolverineId, userId2: gambitId },
    { userId1: wolverineId, userId2: rogueId },
    { userId1: jeanId, userId2: stormId },
    { userId1: jeanId, userId2: beastId },
    { userId1: gambitId, userId2: rogueId },
    { userId1: icemanId, userId2: nightcrawlerId },
    { userId1: icemanId, userId2: beastId },

    // Pending requests (not yet accepted)
    { userId1: magnetoId, userId2: stormId },
    { userId1: magnetoId, userId2: beastId },
    { userId1: nightcrawlerId, userId2: jeanId },
  ];

  const friendStatuses = {
    FRIENDS: "FRIENDS",
    PENDING: "PENDING",
  } as const;

  // First 17 are established friendships, last 3 are pending
  for (let i = 0; i < friendships.length; i++) {
    const { userId1, userId2 } = friendships[i];
    const status = i < 18 ? friendStatuses.FRIENDS : friendStatuses.PENDING;

    await prisma.friends.upsert({
      where: { userId1_userId2: { userId1, userId2 } },
      update: {},
      create: { userId1, userId2, status },
    });
  }

  // ─── PUBLIC ROOMS ────────────────────────────────────────────────

  console.log("Creating rooms...");

  // Public Room 1: X-Men General
  const xmenGeneral = await prisma.room.create({
    data: {
      type: RoomType.PUBLIC_BOARD,
      name: "X-Men General",
      description: "The main channel for all X-Men communication",
      isPublic: true,
      imageUrl: `${BASE_URL}/RoomAvatars/xmen.jpeg`,
      createdById: cyclopsId,
    },
  });

  const xmenGeneralMembers = [
    cyclopsId,
    wolverineId,
    stormId,
    jeanId,
    beastId,
    gambitId,
    rogueId,
    icemanId,
    nightcrawlerId,
  ];
  for (const userId of xmenGeneralMembers) {
    await prisma.roomMember.create({
      data: { roomId: xmenGeneral.id, userId },
    });
  }

  const xmenGeneralMessages = [
    {
      senderId: cyclopsId,
      content:
        "Alright everyone, listen up. We have a new threat emerging from Genosha and I need all available X-Men on standby. This is not a drill. Professor Xavier has briefed me on the situation and it looks serious. We'll be doing a full team debrief at 0800 tomorrow in the war room. Make sure you've reviewed the latest Sentinel activity reports before then.",
    },
    {
      senderId: wolverineId,
      content:
        "Already on it, Summers. Been tracking some unusual activity in the tunnels beneath the city.",
    },
    {
      senderId: stormId,
      content:
        "I can provide aerial reconnaissance if needed. The weather patterns in that region have been unusually disrupted — which suggests large scale energy output.",
    },
    {
      senderId: jeanId,
      content:
        "I've been sensing something too. There's a lot of psychic noise coming from the east. It's not clear yet but something is definitely building.",
    },
    {
      senderId: beastId,
      content:
        "Fascinating. I've been cross-referencing the Sentinel activity data with historical patterns and the frequency of incidents has increased by 340% in the last six weeks alone. I've prepared a full report which I'll present at tomorrow's briefing.",
    },
    {
      senderId: gambitId,
      content:
        "Sounds like fun, non? Gambit's always ready for a little excitement.",
    },
    {
      senderId: rogueId,
      content:
        "Fun isn't exactly the word I'd use, Remy. Last time we went up against Sentinels half the team ended up in the med bay.",
    },
    {
      senderId: icemanId,
      content:
        "I've been training specifically for anti-Sentinel combat. My ice constructs can jam their joint mechanisms if I get close enough.",
    },
    {
      senderId: nightcrawlerId,
      content:
        "And I can teleport inside their chassis if necessary. It is risky but I have done it before.",
    },
    {
      senderId: cyclopsId,
      content:
        "Good. That's what I want to hear. Everyone stay sharp and get some rest tonight.",
    },
  ];

  for (const msg of xmenGeneralMessages) {
    await prisma.message.create({
      data: {
        roomId: xmenGeneral.id,
        senderId: msg.senderId,
        content: msg.content,
      },
    });
  }

  // Public Room 2: Danger Room Schedule
  const dangerRoom = await prisma.room.create({
    data: {
      type: RoomType.PUBLIC_BOARD,
      name: "Danger Room Schedule",
      description: "Booking and discussion for Danger Room sessions",
      isPublic: true,
      imageUrl: `${BASE_URL}/RoomAvatars/danger_room.jpeg`,
      createdById: cyclopsId,
    },
  });

  const dangerRoomMembers = [
    cyclopsId,
    wolverineId,
    stormId,
    jeanId,
    icemanId,
    nightcrawlerId,
    beastId,
  ];
  for (const userId of dangerRoomMembers) {
    await prisma.roomMember.create({ data: { roomId: dangerRoom.id, userId } });
  }

  const dangerRoomMessages = [
    {
      senderId: cyclopsId,
      content:
        "I've updated the Danger Room schedule for next week. Tuesday and Thursday are reserved for the new recruits. Everyone else has open slots on Monday, Wednesday and Friday mornings.",
    },
    {
      senderId: beastId,
      content:
        "I've taken the liberty of programming several new scenarios specifically designed to test our response times against fast-moving aerial threats. I think you'll find them quite challenging.",
    },
    {
      senderId: icemanId,
      content:
        "Last time you said that I ended up frozen to the ceiling for twenty minutes. Not literally, but you get the idea.",
    },
    {
      senderId: nightcrawlerId,
      content:
        "I would like to book Friday at 7am if that is still available. I have been working on a new combination of teleportation and hand to hand combat that I would like to refine.",
    },
    {
      senderId: stormId,
      content:
        "I'll take Wednesday. I want to run atmosphere manipulation scenarios at extreme altitude.",
    },
    {
      senderId: wolverineId,
      content:
        "Just leave the room open whenever. I'll use it when I feel like it.",
    },
    {
      senderId: cyclopsId,
      content: "Logan, that's not how scheduling works. Pick a slot.",
    },
    {
      senderId: jeanId,
      content:
        "I can take Monday morning. I've been wanting to work on combining telekinesis with barrier projection — it's something Charles suggested during our last session.",
    },
  ];

  for (const msg of dangerRoomMessages) {
    await prisma.message.create({
      data: {
        roomId: dangerRoom.id,
        senderId: msg.senderId,
        content: msg.content,
      },
    });
  }

  // ─── PRIVATE ROOMS ───────────────────────────────────────────────

  // Private Room 1: X-Men Leadership (Cyclops + Storm + Jean)
  const leadership = await prisma.room.create({
    data: {
      type: RoomType.PRIVATE_GROUP,
      name: "X-Men Leadership",
      description: "Strategic planning for senior X-Men",
      isPublic: false,
      imageUrl: `${BASE_URL}/RoomAvatars/leadership.jpeg`,
      createdById: cyclopsId,
    },
  });

  const leadershipMembers = [cyclopsId, stormId, jeanId];
  for (const userId of leadershipMembers) {
    await prisma.roomMember.create({ data: { roomId: leadership.id, userId } });
  }

  const leadershipMessages = [
    {
      senderId: cyclopsId,
      content:
        "I wanted to speak with you both privately. The Professor has asked me to evaluate whether we need to restructure the team given the increasing frequency of threats. I have some thoughts but I want your input before I bring anything to the wider group.",
    },
    {
      senderId: jeanId,
      content:
        "I think it's worth considering. The current structure made sense when we were a smaller team but things have changed a lot. We need clearer lines of command and better communication protocols, especially in the field.",
    },
    {
      senderId: stormId,
      content:
        "I agree. There have been several instances recently where conflicting orders in the field led to dangerous situations. We were lucky no one was seriously hurt. A clearer hierarchy would help, even if some people won't like it.",
    },
    {
      senderId: cyclopsId,
      content:
        "My bigger concern is Wolverine. He's invaluable in combat but he refuses to follow orders when he disagrees with them. I need to know you'll both back me if I push for clearer accountability.",
    },
    {
      senderId: jeanId,
      content:
        "You know I'll back you, Scott. But approach Logan carefully. Push too hard and he'll walk, and despite everything we can't afford to lose him right now.",
    },
    {
      senderId: stormId,
      content:
        "Let me speak with him first. We have an understanding. I may be able to get him to come to the table without it becoming a confrontation.",
    },
    {
      senderId: cyclopsId,
      content:
        "That would help a lot, Ororo. Thank you. Let's reconvene after you've spoken with him.",
    },
  ];

  for (const msg of leadershipMessages) {
    await prisma.message.create({
      data: {
        roomId: leadership.id,
        senderId: msg.senderId,
        content: msg.content,
      },
    });
  }

  // Private Room 2: Recon Team (Cyclops + Wolverine + Nightcrawler + Storm)
  const reconTeam = await prisma.room.create({
    data: {
      type: RoomType.PRIVATE_GROUP,
      name: "Recon Team Alpha",
      description: "Field reconnaissance coordination",
      isPublic: false,
      imageUrl: `${BASE_URL}/RoomAvatars/recon.jpeg`,
      createdById: cyclopsId,
    },
  });

  const reconMembers = [cyclopsId, wolverineId, nightcrawlerId, stormId];
  for (const userId of reconMembers) {
    await prisma.roomMember.create({ data: { roomId: reconTeam.id, userId } });
  }

  const reconMessages = [
    {
      senderId: cyclopsId,
      content:
        "This is our recon team for the Genosha operation. Storm provides aerial cover and weather suppression. Nightcrawler handles insertion and extraction. Logan, you're on threat assessment and close quarters if it goes sideways. I'll coordinate from the secondary entry point.",
    },
    {
      senderId: wolverineId,
      content: "What are we expecting to find in there?",
    },
    {
      senderId: stormId,
      content:
        "Based on satellite imagery the compound has been significantly expanded since our last intel. There are at least three new structures on the eastern perimeter. I can suppress radar and provide cloud cover for our approach but the window is narrow — maybe forty minutes before it looks suspicious.",
    },
    {
      senderId: nightcrawlerId,
      content:
        "Forty minutes is plenty for insertion. I have studied the blueprints. There is a service corridor on the north side that leads directly to the central control room. I can have us in and out before anyone knows we were there.",
    },
    { senderId: wolverineId, content: "Famous last words, elf." },
    {
      senderId: nightcrawlerId,
      content: "I prefer to think of it as confidence born from experience.",
    },
    {
      senderId: cyclopsId,
      content:
        "We go in quiet. Primary objective is intelligence gathering only. If we encounter hostiles we fall back to the extraction point. No heroics.",
    },
    { senderId: wolverineId, content: "Define heroics." },
    { senderId: cyclopsId, content: "Anything that isn't in the plan, Logan." },
  ];

  for (const msg of reconMessages) {
    await prisma.message.create({
      data: {
        roomId: reconTeam.id,
        senderId: msg.senderId,
        content: msg.content,
      },
    });
  }

  // Private Room 3: Science Team (Beast + Jean + Storm)
  const scienceTeam = await prisma.room.create({
    data: {
      type: RoomType.PRIVATE_GROUP,
      name: "Science Team",
      description: "Research and development discussion",
      isPublic: false,
      imageUrl: `${BASE_URL}/RoomAvatars/science.jpg`,
      createdById: beastId,
    },
  });

  const scienceMembers = [beastId, jeanId, stormId];
  for (const userId of scienceMembers) {
    await prisma.roomMember.create({
      data: { roomId: scienceTeam.id, userId },
    });
  }

  const scienceMessages = [
    {
      senderId: beastId,
      content:
        "I've completed my analysis of the energy signatures we collected during the last Sentinel encounter. What I found is quite remarkable — the power source they're using appears to be a variant of the same technology Trask Industries patented in 1973 but it has been significantly miniaturised and the efficiency gains are extraordinary. Someone with considerable resources and technical expertise has been working on this for years.",
    },
    {
      senderId: jeanId,
      content:
        "That's alarming. Do you have any indication of who might be behind the upgrade program?",
    },
    {
      senderId: beastId,
      content:
        "Not definitively. However the metallurgical composition of the chassis components I analysed shares some characteristics with materials sourced from a facility in Eastern Europe. I've sent the data to Reed Richards for a second opinion but I haven't heard back yet.",
    },
    {
      senderId: stormId,
      content:
        "If someone has been quietly upgrading the Sentinel program for years then we've been operating on badly outdated threat assessments. We need to brief Scott immediately.",
    },
    {
      senderId: jeanId,
      content:
        "Agreed. Though I'd like to have more concrete data before we do. The last thing we need right now is to cause panic within the team when we don't have the full picture. Hank, how long do you need to complete a more thorough analysis?",
    },
    {
      senderId: beastId,
      content:
        "Give me 48 hours. I can run a full spectral analysis and cross reference with our historical Sentinel encounter data. If there's a pattern I'll find it.",
    },
  ];

  for (const msg of scienceMessages) {
    await prisma.message.create({
      data: {
        roomId: scienceTeam.id,
        senderId: msg.senderId,
        content: msg.content,
      },
    });
  }

  // ─── DIRECT MESSAGES ─────────────────────────────────────────────

  // DM 1: Cyclops <-> Jean Grey
  const dmCyclopsJean = await prisma.room.create({
    data: {
      type: RoomType.DIRECT_MESSAGE,
      isPublic: false,
      createdById: cyclopsId,
    },
  });

  await prisma.roomMember.create({
    data: { roomId: dmCyclopsJean.id, userId: cyclopsId },
  });
  await prisma.roomMember.create({
    data: { roomId: dmCyclopsJean.id, userId: jeanId },
  });

  const dmCyclopsJeanMessages = [
    {
      senderId: jeanId,
      content:
        "Scott, are you okay? I could feel your stress levels from across the mansion. That's not a complaint, just... I'm here if you need to talk.",
    },
    {
      senderId: cyclopsId,
      content:
        "I'm fine. Just a lot on my mind with everything going on. The Genosha situation, the team restructure, trying to keep everyone safe. Sometimes I wonder if I'm actually cut out for this.",
    },
    {
      senderId: jeanId,
      content:
        "You are. I know you doubt yourself more than you let on but the fact that you care this much is exactly why you're the right person to lead. You don't take it lightly and that matters.",
    },
    {
      senderId: cyclopsId,
      content:
        "I just keep thinking about the last mission. If Nightcrawler had been two seconds slower on the extraction we'd have lost Rogue. That's on me. My plan, my call.",
    },
    {
      senderId: jeanId,
      content:
        "And he wasn't two seconds slower. Everyone came home. I know that doesn't make the weight any lighter but you can't carry every worst case scenario that didn't happen. You'd break under it.",
    },
    { senderId: cyclopsId, content: "You always know what to say." },
    {
      senderId: jeanId,
      content:
        "I'm telepathic. I know what you need to hear before you know you need to hear it. It's cheating a little bit.",
    },
    {
      senderId: cyclopsId,
      content: "I appreciate it. Really. Are we still on for dinner tonight?",
    },
    {
      senderId: jeanId,
      content:
        "Obviously. And before you ask — no, you don't get to cancel because of a Danger Room session. I will physically drag you out of there if I have to.",
    },
    { senderId: cyclopsId, content: "Noted." },
  ];

  for (const msg of dmCyclopsJeanMessages) {
    await prisma.message.create({
      data: {
        roomId: dmCyclopsJean.id,
        senderId: msg.senderId,
        content: msg.content,
      },
    });
  }

  // DM 2: Cyclops <-> Wolverine
  const dmCyclopsWolverine = await prisma.room.create({
    data: {
      type: RoomType.DIRECT_MESSAGE,
      isPublic: false,
      createdById: cyclopsId,
    },
  });

  await prisma.roomMember.create({
    data: { roomId: dmCyclopsWolverine.id, userId: cyclopsId },
  });
  await prisma.roomMember.create({
    data: { roomId: dmCyclopsWolverine.id, userId: wolverineId },
  });

  const dmCyclopsWolverineMessages = [
    {
      senderId: cyclopsId,
      content:
        "Logan. We need to talk about what happened in the field yesterday.",
    },
    { senderId: wolverineId, content: "I handled it." },
    {
      senderId: cyclopsId,
      content:
        "You went off plan. Again. I gave a clear retreat order and you ignored it. We've had this conversation before.",
    },
    {
      senderId: wolverineId,
      content:
        "If I'd retreated when you said, Gambit would be dead right now. You know that.",
    },
    {
      senderId: cyclopsId,
      content:
        "And if you'd been taken out in the process, we'd have lost you both. The plan accounts for calculated risk. Going rogue accounts for nothing.",
    },
    {
      senderId: wolverineId,
      content:
        "Your plans are good, Summers. I'll give you that. But they're built on what you can predict. I've been doing this a lot longer than you. Sometimes you have to read what's in front of you.",
    },
    {
      senderId: cyclopsId,
      content:
        "I'm not saying your instincts are wrong. I'm saying we need to be able to trust the plan or the whole team is at risk. I need to know you'll follow orders in critical moments.",
    },
    {
      senderId: wolverineId,
      content:
        "I'll follow them when they make sense. That's the best you're getting from me.",
    },
    {
      senderId: cyclopsId,
      content:
        "Fine. Then I need you to trust me enough to at least communicate when you're deviating. A signal, a word over comms. Anything. Don't just disappear.",
    },
    { senderId: wolverineId, content: "...I can do that." },
    { senderId: cyclopsId, content: "Good. That's all I'm asking." },
  ];

  for (const msg of dmCyclopsWolverineMessages) {
    await prisma.message.create({
      data: {
        roomId: dmCyclopsWolverine.id,
        senderId: msg.senderId,
        content: msg.content,
      },
    });
  }

  // ─── ADDITIONAL ROOMS (no Cyclops) ───────────────────────────────

  // Private Room: Gambit + Rogue
  const dmGambitRogue = await prisma.room.create({
    data: {
      type: RoomType.DIRECT_MESSAGE,
      isPublic: false,
      createdById: gambitId,
    },
  });

  await prisma.roomMember.create({
    data: { roomId: dmGambitRogue.id, userId: gambitId },
  });
  await prisma.roomMember.create({
    data: { roomId: dmGambitRogue.id, userId: rogueId },
  });

  const dmGambitRogueMessages = [
    {
      senderId: gambitId,
      content:
        "Chère, you were incredible out there today. The way you handled that last wave — magnifique.",
    },
    {
      senderId: rogueId,
      content:
        "Don't try to charm me, Remy. I almost got hit because you threw a card into my line of sight.",
    },
    {
      senderId: gambitId,
      content:
        "That card took out the Sentinel that was about to fire at you from behind. You are welcome.",
    },
    {
      senderId: rogueId,
      content: "...okay fine. Thank you. But warn me next time.",
    },
    { senderId: gambitId, content: "Where would be the fun in that?" },
    {
      senderId: rogueId,
      content:
        "I genuinely cannot tell if you're flirting or if this is just how you communicate with everyone.",
    },
    {
      senderId: gambitId,
      content:
        "With everyone else it is just communication. With you it is always a little of both.",
    },
  ];

  for (const msg of dmGambitRogueMessages) {
    await prisma.message.create({
      data: {
        roomId: dmGambitRogue.id,
        senderId: msg.senderId,
        content: msg.content,
      },
    });
  }

  // Public Room 3: Open to all including Magneto
  const mutantRights = await prisma.room.create({
    data: {
      type: RoomType.PUBLIC_BOARD,
      name: "Mutant Rights Discussion",
      description: "Open discussion on mutant rights and coexistence",
      isPublic: true,
      imageUrl: `${BASE_URL}/RoomAvatars/mutant_rights.jpeg`,
      createdById: magnetoId,
    },
  });

  const mutantRightsMembers = [
    magnetoId,
    cyclopsId,
    stormId,
    jeanId,
    beastId,
    rogueId,
    icemanId,
  ];
  for (const userId of mutantRightsMembers) {
    await prisma.roomMember.create({
      data: { roomId: mutantRights.id, userId },
    });
  }

  const mutantRightsMessages = [
    {
      senderId: magnetoId,
      content:
        "The recent legislation proposed in Washington is nothing short of a declaration of war against our kind. They dress it up in the language of public safety and national security but make no mistake — this is persecution with a legal framework built around it. We have seen this before. History is not subtle in its repetitions.",
    },
    {
      senderId: cyclopsId,
      content:
        "I understand the anger, Erik. I share it. But inflammatory language doesn't help us build the coalitions we need. There are humans who are genuinely undecided and we need them on our side.",
    },
    {
      senderId: beastId,
      content:
        "Cyclops is right. I've been consulting with Senator Kelly's office — yes, that Senator Kelly — and there is more nuance in his current position than his public statements suggest. These conversations matter. They are slow and frustrating but they matter.",
    },
    {
      senderId: magnetoId,
      content:
        "You negotiate from a position of weakness, Henry. Every concession you make is treated as an invitation to demand more. I have tried it your way. For decades I tried it your way.",
    },
    {
      senderId: jeanId,
      content: "And we've tried yours. The result was Genosha.",
    },
    {
      senderId: stormId,
      content:
        "I think what we can all agree on is that mutant children deserve to grow up in a world where they are not afraid. Whatever our differences on method, that has to be the shared foundation.",
    },
    {
      senderId: rogueId,
      content:
        "Storm's right. I didn't ask for this. None of us did. I just want to exist without being treated like a weapon or a threat.",
    },
    {
      senderId: icemanId,
      content:
        "Came out to my parents as a mutant last year. Hardest thing I've ever done. The legislation makes conversations like that even harder for kids who are still figuring things out.",
    },
    {
      senderId: beastId,
      content:
        "Bobby's point is important. Policy shapes culture. These bills send a message to every young mutant about how society views them, regardless of whether they ever pass.",
    },
    {
      senderId: magnetoId,
      content:
        "Then perhaps we agree more than it appears. The disagreement is not in the destination but the road. I simply no longer have the patience for the slow road.",
    },
    {
      senderId: cyclopsId,
      content:
        "Then stay in the conversation, Erik. Even if we disagree, you walking away helps no one.",
    },
  ];

  for (const msg of mutantRightsMessages) {
    await prisma.message.create({
      data: {
        roomId: mutantRights.id,
        senderId: msg.senderId,
        content: msg.content,
      },
    });
  }

  console.log("Seeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
