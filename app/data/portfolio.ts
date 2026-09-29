// All portfolio content lives here. Edit this file to make the desktop yours.

export interface Social {
  id: string
  name: string
  handle: string
  url: string
  icon: string
  color?: string
}

export interface Skill {
  name: string
  icon: string
  category: 'Frontend' | 'Backend' | 'Database' | 'Tools'
  level: number
  since: number
}

export interface Project {
  slug: string
  name: string
  summary: string
  description: string
  tech: string[]
  year: number
  role: string
  status: 'Live' | 'In progress' | 'Archived'
  demo?: string
  repo?: string
  colors: [string, string]
  /** Real screenshots in /public, e.g. ['/projects/shop-1.png']. Generated previews are used when empty. */
  images?: string[]
}

export interface Experience {
  role: string
  company: string
  location: string
  start: string
  end: string
  summary: string
  highlights: string[]
}

export interface Education {
  school: string
  degree: string
  start: string
  end: string
}

export const profile = {
  name: 'Trialdyk',
  username: 'trialdyk',
  role: 'Full-Stack Developer',
  tagline: 'Building fast, accessible and delightful web experiences.',
  location: 'Indonesia',
  email: 'hello@example.com',
  /** Put an image in /public and reference it here, e.g. '/avatar.jpg'. Initials are shown when empty. */
  avatar: '',
  /** Put your CV in /public and reference it here, e.g. '/resume.pdf', to enable the download button. */
  resumeFile: '',
  codingSince: 2019,
  openToWork: true,
  languages: [
    { name: 'Bahasa Indonesia', level: 'Native' },
    { name: 'English', level: 'Professional working proficiency' },
  ],
  interests: ['Open source', 'UI engineering', 'Developer tooling', 'Coffee'],
}

/** SEO & social sharing. Replace /public/og-image.png when your name or role changes. */
export const site = {
  url: 'https://trialdyk.dev',
  title: `${profile.name} — ${profile.role}`,
  description: `${profile.name} is a ${profile.role} based in ${profile.location}. ${profile.tagline} Explore projects, skills and experience in a Windows 11–style portfolio.`,
  ogImage: '/og-image.png',
}

export const socials: Social[] = [
  { id: 'github', name: 'GitHub', handle: '@your-username', url: 'https://github.com/your-username', icon: 'mdi:github' },
  { id: 'linkedin', name: 'LinkedIn', handle: 'in/your-username', url: 'https://www.linkedin.com/in/your-username', icon: 'mdi:linkedin', color: '#0a66c2' },
  { id: 'instagram', name: 'Instagram', handle: '@your-username', url: 'https://www.instagram.com/your-username', icon: 'mdi:instagram', color: '#e1306c' },
  { id: 'email', name: 'Email', handle: profile.email, url: `mailto:${profile.email}`, icon: 'mdi:email-outline', color: '#0f6cbd' },
]

export const skills: Skill[] = [
  { name: 'HTML5', icon: 'logos:html-5', category: 'Frontend', level: 95, since: 2019 },
  { name: 'CSS3', icon: 'logos:css-3', category: 'Frontend', level: 90, since: 2019 },
  { name: 'JavaScript', icon: 'logos:javascript', category: 'Frontend', level: 92, since: 2019 },
  { name: 'TypeScript', icon: 'logos:typescript-icon', category: 'Frontend', level: 88, since: 2021 },
  { name: 'Vue.js', icon: 'logos:vue', category: 'Frontend', level: 92, since: 2020 },
  { name: 'Nuxt', icon: 'logos:nuxt-icon', category: 'Frontend', level: 90, since: 2021 },
  { name: 'React', icon: 'logos:react', category: 'Frontend', level: 78, since: 2021 },
  { name: 'Tailwind CSS', icon: 'logos:tailwindcss-icon', category: 'Frontend', level: 90, since: 2021 },
  { name: 'Node.js', icon: 'logos:nodejs-icon', category: 'Backend', level: 85, since: 2020 },
  { name: 'Bun', icon: 'logos:bun', category: 'Backend', level: 75, since: 2023 },
  { name: 'Laravel', icon: 'logos:laravel', category: 'Backend', level: 80, since: 2020 },
  { name: 'PostgreSQL', icon: 'logos:postgresql', category: 'Database', level: 80, since: 2021 },
  { name: 'MySQL', icon: 'logos:mysql-icon', category: 'Database', level: 82, since: 2019 },
  { name: 'Docker', icon: 'logos:docker-icon', category: 'Tools', level: 72, since: 2022 },
  { name: 'Git', icon: 'logos:git-icon', category: 'Tools', level: 90, since: 2019 },
  { name: 'Figma', icon: 'logos:figma', category: 'Tools', level: 70, since: 2021 },
]

export const projects: Project[] = [
  {
    slug: 'nuxt-commerce',
    name: 'Nuxt Commerce',
    summary: 'A blazing-fast headless e-commerce storefront.',
    description:
      'A headless storefront with server-side rendering, instant search, cart & checkout flow, and an admin dashboard for managing products and orders.',
    tech: ['Nuxt', 'TypeScript', 'Tailwind CSS', 'PostgreSQL', 'Stripe'],
    year: 2025,
    role: 'Full-stack developer',
    status: 'Live',
    demo: 'https://example.com',
    repo: 'https://github.com/your-username/nuxt-commerce',
    colors: ['#2563eb', '#06b6d4'],
  },
  {
    slug: 'taskflow',
    name: 'TaskFlow',
    summary: 'Kanban-style project management for small teams.',
    description:
      'Real-time boards with drag & drop, comments, labels and due-date reminders. Built with a collaborative-first data model and optimistic UI updates.',
    tech: ['Vue', 'Pinia', 'Node.js', 'Socket.IO', 'PostgreSQL'],
    year: 2024,
    role: 'Full-stack developer',
    status: 'Live',
    demo: 'https://example.com',
    repo: 'https://github.com/your-username/taskflow',
    colors: ['#7c3aed', '#ec4899'],
  },
  {
    slug: 'skycast',
    name: 'SkyCast',
    summary: 'A beautiful weather dashboard with 7-day forecasts.',
    description:
      'Weather dashboard with location search, hourly charts, air-quality index and offline support as an installable PWA.',
    tech: ['Vue', 'Chart.js', 'PWA', 'OpenWeather API'],
    year: 2024,
    role: 'Frontend developer',
    status: 'Live',
    demo: 'https://example.com',
    repo: 'https://github.com/your-username/skycast',
    colors: ['#0ea5e9', '#22c55e'],
  },
  {
    slug: 'stockwise',
    name: 'StockWise',
    summary: 'Inventory & point-of-sale system for retail stores.',
    description:
      'Multi-branch inventory tracking, purchase orders, barcode scanning and sales reports with exportable PDF invoices.',
    tech: ['Laravel', 'Livewire', 'MySQL', 'Alpine.js'],
    year: 2023,
    role: 'Backend developer',
    status: 'Archived',
    repo: 'https://github.com/your-username/stockwise',
    colors: ['#f97316', '#eab308'],
  },
  {
    slug: 'pulse-chat',
    name: 'Pulse Chat',
    summary: 'Realtime chat app with rooms, typing indicators and reactions.',
    description:
      'Websocket-powered chat with public/private rooms, message reactions, typing indicators, image uploads and push notifications.',
    tech: ['React', 'Bun', 'WebSocket', 'Redis'],
    year: 2023,
    role: 'Full-stack developer',
    status: 'In progress',
    repo: 'https://github.com/your-username/pulse-chat',
    colors: ['#10b981', '#14b8a6'],
  },
  {
    slug: 'windows-portfolio',
    name: 'Windows 11 Portfolio',
    summary: 'This very website — a Windows 11 desktop in the browser.',
    description:
      'A portfolio that recreates the Windows 11 experience: boot screen, window manager with snapping, Start menu, File Explorer, Notepad, Terminal and more.',
    tech: ['Nuxt 4', 'Vue 3', 'TypeScript', 'Bun'],
    year: 2026,
    role: 'Designer & developer',
    status: 'Live',
    colors: ['#0078d4', '#60cdff'],
  },
]

export const experience: Experience[] = [
  {
    role: 'Full-Stack Developer',
    company: 'Company Name',
    location: 'Remote',
    start: 'Jan 2024',
    end: 'Present',
    summary: 'Building and maintaining customer-facing web apps and internal tools.',
    highlights: [
      'Led the migration of a legacy SPA to Nuxt, cutting load time by 40%',
      'Designed REST APIs used by web and mobile clients',
      'Mentored junior developers through code reviews and pairing',
    ],
  },
  {
    role: 'Frontend Developer',
    company: 'Startup Name',
    location: 'Jakarta, Indonesia',
    start: 'Mar 2022',
    end: 'Dec 2023',
    summary: 'Shipped product features end-to-end with a small, fast-moving team.',
    highlights: [
      'Built a reusable component library used across 3 products',
      'Improved Lighthouse performance score from 62 to 95',
    ],
  },
  {
    role: 'Web Developer Intern',
    company: 'Agency Name',
    location: 'Indonesia',
    start: 'Jun 2021',
    end: 'Feb 2022',
    summary: 'Developed landing pages and CMS-driven websites for clients.',
    highlights: ['Delivered 10+ client websites with Laravel and Vue'],
  },
]

export const education: Education[] = [
  { school: 'University Name', degree: 'Bachelor of Computer Science', start: '2019', end: '2023' },
]

/** Shown as "available updates" in Settings > Windows Update. */
export const learning = ['Rust', 'System design', 'Web performance']

export const deviceSpecs: [string, string][] = [
  ['Device name', `${profile.username.toUpperCase()}-PC`],
  ['Processor', 'Human Brain(R) Core(TM) i9 — powered by coffee @ 4.20 GHz'],
  ['Installed RAM', '16.0 GB (remembers every shortcut, forgets every name)'],
  ['Device ID', 'DEV-2019-FULL-STACK'],
  ['System type', 'Full-stack developer, x64-based problem solver'],
  ['Pen and touch', 'Ten-finger touch typing support'],
]

export const aboutText = `Hi there! 👋

I'm ${profile.name} — a ${profile.role} based in ${profile.location}.

I love building web apps that feel fast, look clean and are a joy
to use. Most days you'll find me working with Vue/Nuxt and TypeScript
on the front end, and Node.js, Bun or Laravel on the back end.

----------------------------------------------------------------
WHAT I DO
----------------------------------------------------------------
- Build responsive, accessible web apps with Vue, Nuxt and React
- Design and ship APIs with Node.js, Bun and Laravel
- Model data with PostgreSQL and MySQL, ship with Docker
- Obsess over performance, DX and small UI details

----------------------------------------------------------------
CURRENTLY
----------------------------------------------------------------
- Building side projects in the open
- Learning: ${learning.join(', ')}
- ${profile.openToWork ? 'Open to freelance and full-time opportunities' : 'Not looking for new opportunities right now'}

----------------------------------------------------------------
FUN FACTS
----------------------------------------------------------------
- This portfolio is a Windows 11 clone built with Nuxt 4 + Bun
- I've probably restarted my dev server 10,000 times
- Tabs or spaces? Let's not talk about it.

----------------------------------------------------------------
CONTACT
----------------------------------------------------------------
${socials.map(s => `${s.name.padEnd(10)}: ${s.handle}`).join('\n')}

Thanks for stopping by! Feel free to poke around — try the
Terminal, right-click the desktop, or drag a window to the edge
of the screen. 🙂
`
