// Case studies. Every number here was checked against the repo or the store listing
// on the date in `checked`. Do not add figures that can't be verified the same way.

export interface Layer { name: string; tech: string; does: string }
export interface Problem { title: string; body: string }
export interface CaseStudy {
  slug: string;
  title: string;
  kind: string;
  summary: string;
  status: string;
  checked: string;
  facts: { label: string; value: string }[];
  problem: string[];
  built: string[];
  layers: Layer[];
  hard: Problem[];
  done?: string[];
  planned?: string[];
  outcome: string[];
  media?: { type: 'video' | 'image'; src: string; webm?: string; poster?: string; alt: string; caption: string; shape: 'wide' | 'phone' };
  link?: { label: string; href: string };
}

export const cases: CaseStudy[] = [
  {
    slug: 'falkryn',
    title: 'FALKRYN',
    kind: 'Desktop software and web portal',
    summary: 'A flight logbook for police and agriculture drone teams. It runs with no internet, and every record in it can be proven unaltered.',
    status: 'Version 0.3 on Windows, team portal live',
    checked: 'November 16, 2026',
    facts: [
      { label: 'Role', value: 'Sole designer and engineer' },
      { label: 'Started', value: 'November 2026' },
      { label: 'Core', value: 'Rust, 47 modules' },
      { label: 'Automated tests', value: '113 in the desktop core' },
    ],
    problem: [
      'A drone unit has to answer hard questions after a flight: which aircraft, which pilot, was the battery within limits, was the pilot current, and can you prove the log was not edited afterwards.',
      'Most fleet tools assume a cloud account and a good connection. Police units often can’t send flight data to a vendor, and farm fields rarely have signal. The record has to live on the team’s own computer and still hold up in a case file.',
    ],
    built: [
      'Aircraft, battery, and pilot records with maintenance schedules, certificate expiry, and automatic grounding when something is overdue.',
      'Flight import for ArduPilot, MAVLink, and PX4 logs, with replay over the team’s own maps.',
      'A live screen that tracks aircraft in the air on a 3D map and shows the drone’s video feed, receive-only.',
      'A signed ledger: every change is hash-chained and signed, and nothing is hard-deleted.',
      'One-click evidence packages: the flight record, the original log, the track, and the ledger entries in a signed ZIP.',
      'A web portal for organizations, roles, invitations, and linked computers.',
    ],
    layers: [
      { name: 'Interface', tech: 'React, MapLibre, three.js, WebCodecs', does: 'Screens, 3D map, and video drawn on a worker thread so the map can never stall a frame.' },
      { name: 'Desktop shell', tech: 'Tauri 2', does: 'A small native window around the interface.' },
      { name: 'Core', tech: 'Rust', does: 'Log parsers, map import, the ledger, reports, live telemetry, video, and local AI. All logic that touches a record lives here.' },
      { name: 'Storage', tech: 'SQLite with SQLCipher', does: 'Encrypted on disk. Keys sit in the Windows credential store, not in a file.' },
      { name: 'Portal', tech: 'Rust (Axum), PostgreSQL, Fly.io', does: 'Accounts, custom roles, and device linking at app.falkryn.com.' },
    ],
    hard: [
      { title: 'Proving a record was not changed', body: 'Each ledger entry stores the hash of the one before it and is signed with an Ed25519 key held by that computer. Editing any old entry breaks every hash after it, and the app can verify the whole chain on demand. An evidence package carries its own signed manifest, so a copy handed to a court can be matched back to the ledger.' },
      { title: 'AI that can’t invent facts in a report', body: 'Report drafts are written by a language model running on the same computer, never a cloud service. The model is given only the facts FALKRYN already holds. A separate checker then compares every time, date, number, ID, and name in the draft against those facts and flags anything it can’t find. A person still reviews and approves, and the approval records which model wrote it.' },
      { title: 'Live video without lag', body: 'The drone’s video is not decoded and re-encoded on the way through. Each compressed frame is passed straight to the screen over a local connection and decoded by the graphics card. A viewer that falls behind skips to the next keyframe instead of building up delay.' },
      { title: 'Reading files the app has never seen', body: 'Flight logs and map files come from many tools and are often damaged. The parsers were run against 317 real files with no failures and 3,120 deliberately corrupted inputs with no crashes or hangs.' },
    ],
    done: [
      'Drone, battery, and pilot records with grounding rules',
      'ArduPilot, MAVLink, and PX4 import and replay',
      'Live tracking and live video',
      'Signed ledger, evidence packages, and printed flight records',
      'Offline maps, including imported aerial surveys',
      'Local AI report drafts with fact-checking',
      'On-device object detection on live video',
      'Team portal at app.falkryn.com',
    ],
    planned: [
      'Android tablet build',
      'DJI flight logs',
      'Code-signing certificate and hosted update feed',
      'Independent penetration test before sale',
    ],
    outcome: [
      'FALKRYN is in development and has no paying customers yet. The desktop app installs and runs on Windows, and the team portal is live.',
      'It is the clearest example of how I work: security decisions made first, the risky parts tested hardest, and an honest line between what is built and what is not.',
    ],
    media: { type: 'video', src: '/media/falkryn.mp4', webm: '/media/falkryn.webm', poster: '/media/falkryn.jpg', alt: 'Screens from FALKRYN: live drone tracking, a flight replayed over aerial imagery, fleet readiness, and the evidence ledger', caption: 'Screens from the working build', shape: 'wide' },
  },
  {
    slug: 'baitiq',
    title: 'BaitIQ',
    kind: 'iOS app',
    summary: 'An AI fishing companion. Photograph the water and it tells you what to throw, where to cast, and why, using the photo, your location, and the live weather together.',
    status: 'Live on the App Store since May 14, 2026',
    checked: 'November 16, 2026',
    facts: [
      { label: 'Role', value: 'Sole designer and engineer' },
      { label: 'Released', value: 'May 14, 2026' },
      { label: 'Current version', value: '1.0.3' },
      { label: 'App Store rating', value: '5.0 from 6 ratings' },
    ],
    problem: [
      'A bank angler standing at an unfamiliar pond has to guess: which bait, which color, how deep, and where the fish are likely holding. The answer depends on the water in front of them and on today’s weather, and most fishing apps only offer a map and a logbook.',
      'I fish from the bank myself, so the test was simple. The advice had to be specific enough that I would actually tie it on.',
    ],
    built: [
      'Spot scan: one photo becomes three ranked bait picks, suggested casting zones, and a confidence score.',
      'Bite score: weather, moon phase, and barometric pressure combined into one number for today.',
      'Catch log, friends, crews, and a leaderboard.',
      'Accounts, subscriptions, and push notifications.',
    ],
    layers: [
      { name: 'App', tech: 'React Native 0.81, Expo SDK 54, Expo Router', does: 'One codebase for the screens, camera, and navigation.' },
      { name: 'Accounts and data', tech: 'Supabase Auth, PostgreSQL', does: 'Sign-in and all user data, with row-level security on user data. 42 schema migrations so far.' },
      { name: 'AI', tech: 'Supabase Edge Functions, GPT-4o', does: 'The app never talks to the AI provider directly. A server function holds the key, adds location and weather, and returns structured results.' },
      { name: 'Subscriptions', tech: 'RevenueCat', does: 'Purchases, renewals, and access to paid features.' },
      { name: 'Releases', tech: 'Expo Updates', does: 'Fixes ship over the air in minutes without waiting on a store review.' },
    ],
    hard: [
      { title: 'Keeping the AI key off the phone', body: 'Anything shipped inside an app can be pulled out of it. The app sends the photo to my own server function, and only that function holds the provider key. It also means I can change the model or the prompt without shipping a new build.' },
      { title: 'Advice from three inputs, not one', body: 'A photo alone gives generic advice. The server function also turns the phone’s coordinates into a named body of water and adds the current weather, and the model is required to use all three. Results come back as fixed fields, so the app shows ranked picks instead of a paragraph of text.' },
      { title: 'Not hammering free map services', body: 'Looking up a lake name from coordinates relies on public map services with strict limits. Lookups are cached in the database, so a second scan at the same spot is a single fast read and the public service is never asked twice.' },
    ],
    outcome: [
      'BaitIQ passed App Store review and has been live since May 14, 2026. The listing shows a 5.0 rating from 6 ratings. That is a small sample and I don’t present it as market proof.',
      'What it does prove is the full path: design, build, backend, payments, store review, and updates after launch, done by one person.',
    ],
    media: { type: 'video', src: '/media/baitiq-scan.mp4', webm: '/media/baitiq-scan.webm', poster: '/media/baitiq-scan.jpg', alt: 'BaitIQ on an iPhone: a photo of a pond is analysed and three ranked bait recommendations appear', caption: 'Recorded on an iPhone', shape: 'phone' },
    link: { label: 'View BaitIQ on the App Store', href: 'https://apps.apple.com/us/app/baitiq/id6768169415' },
  },
  {
    slug: 'helm',
    title: 'Helm',
    kind: 'Desktop software',
    summary: 'A command center for a crew of AI agents. I describe a job, approve the plan, and workers carry it out on my real projects and report back.',
    status: 'Working end to end, used on my own projects',
    checked: 'November 16, 2026',
    facts: [
      { label: 'Role', value: 'Sole designer and engineer' },
      { label: 'Built', value: 'May 2026' },
      { label: 'Platform', value: 'Windows, with an installer' },
      { label: 'Remote control', value: 'Telegram' },
    ],
    problem: [
      'AI coding agents are useful one at a time, in one terminal. Running several on different projects means losing track of what each is doing, what it has changed, and what it is waiting on.',
      'I wanted one screen that shows every job, and a rule that nothing runs until I approve it.',
    ],
    built: [
      'A dashboard that shows departments, workers, and the task each one is on.',
      'An assistant I talk to that turns a request into tasks and routes them to the right worker.',
      'Five worker roles (scout, designer, builder, writer, tester) grouped into four departments.',
      'An approval gate: every task waits for a yes unless I switch on autopilot.',
      'Two-way control from my phone over Telegram.',
    ],
    layers: [
      { name: 'Dashboard', tech: 'Electron, Three.js', does: 'The window and the live 3D view of the crew.' },
      { name: 'Bridge', tech: 'Node.js', does: 'A local service that holds the task queue, starts workers, and streams their progress to the dashboard. It listens on this computer only.' },
      { name: 'Workers', tech: 'Headless AI coding agents', does: 'Each runs as its own process against one project folder and reports results back to the bridge.' },
      { name: 'Remote', tech: 'Telegram Bot API', does: 'Sends me updates and takes approvals when I’m away from the desk.' },
    ],
    hard: [
      { title: 'Keeping a person in charge', body: 'An agent with shell access can do real damage. Every task is held until approved, the bridge accepts connections from this computer only, and each worker is started inside a single project folder.' },
      { title: 'Staying up when a part fails', body: 'A dropped Telegram connection or a crashed worker used to take the whole app down. A supervisor now restarts the bridge on failure, and a worker that dies is reported as failed instead of hanging its task forever.' },
    ],
    outcome: [
      'Helm runs end to end: request, plan, approval, work, report. I use it on my own projects. It is a personal tool, not a product for sale.',
    ],
  },
];
