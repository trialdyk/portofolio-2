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
  category: 'Frontend' | 'Backend' | 'Mobile' | 'Database' | 'Tools'
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
  name: 'Tri Aldy Kurniawan',
  username: 'trialdyk',
  role: 'Fullstack Developer',
  tagline: 'Transforming ideas into elegant digital solutions — and exploring the fascinating world of psychology.',
  location: 'Malang, Jawa Timur, Indonesia',
  email: 'trialdykk@gmail.com',
  /** Put an image in /public and reference it here, e.g. '/avatar.jpg'. Initials are shown when empty. */
  avatar: '/profile.png',
  /** Put your CV in /public and reference it here, e.g. '/resume.pdf', to enable the download button. */
  resumeFile: '',
  codingSince: 2021,
  openToWork: true,
  languages: [
    { name: 'Bahasa Indonesia', level: 'Native' },
    { name: 'English', level: 'Professional working proficiency' },
  ],
  interests: ['Psychology', 'Human behavior', 'Habits & productivity', 'Coffee'],
}

/** SEO & social sharing. Replace /public/og-image.png when your name or role changes. */
export const site = {
  url: 'https://trialdyk.id',
  title: `${profile.name} — ${profile.role}`,
  description: `${profile.name} is a ${profile.role} based in ${profile.location}. ${profile.tagline} Explore projects, skills and experience in a Windows 11–style portfolio.`,
  ogImage: '/og-image.png',
}

export const socials: Social[] = [
  { id: 'github', name: 'GitHub', handle: '@trialdyk', url: 'https://github.com/trialdyk', icon: 'mdi:github' },
  { id: 'linkedin', name: 'LinkedIn', handle: 'in/trialdyk', url: 'https://linkedin.com/in/trialdyk', icon: 'mdi:linkedin', color: '#0a66c2' },
  { id: 'instagram', name: 'Instagram', handle: '@trialdyk', url: 'https://instagram.com/trialdyk', icon: 'mdi:instagram', color: '#e1306c' },
  { id: 'email', name: 'Email', handle: profile.email, url: `mailto:${profile.email}`, icon: 'mdi:email-outline', color: '#0f6cbd' },
]

export const skills: Skill[] = [
  { name: 'HTML', icon: 'logos:html-5', category: 'Frontend', level: 100, since: 2021 },
  { name: 'CSS/SCSS', icon: 'logos:css-3', category: 'Frontend', level: 100, since: 2021 },
  { name: 'JavaScript', icon: 'logos:javascript', category: 'Frontend', level: 100, since: 2021 },
  { name: 'TypeScript', icon: 'logos:typescript-icon', category: 'Frontend', level: 90, since: 2021 },
  { name: 'Vue.js', icon: 'logos:vue', category: 'Frontend', level: 100, since: 2023 },
  { name: 'Nuxt.js', icon: 'logos:nuxt-icon', category: 'Frontend', level: 90, since: 2023 },
  { name: 'Tailwind CSS', icon: 'logos:tailwindcss-icon', category: 'Frontend', level: 100, since: 2021 },
  { name: 'Bootstrap', icon: 'logos:bootstrap', category: 'Frontend', level: 75, since: 2021 },
  { name: 'React', icon: 'logos:react', category: 'Frontend', level: 50, since: 2021 },
  { name: 'Next.js', icon: 'logos:nextjs-icon', category: 'Frontend', level: 25, since: 2024 },
  { name: 'PHP', icon: 'logos:php', category: 'Backend', level: 100, since: 2021 },
  { name: 'Laravel', icon: 'logos:laravel', category: 'Backend', level: 100, since: 2023 },
  { name: 'Golang', icon: 'logos:go', category: 'Backend', level: 75, since: 2024 },
  { name: 'Node.js', icon: 'logos:nodejs-icon', category: 'Backend', level: 75, since: 2021 },
  { name: 'Java', icon: 'logos:java', category: 'Backend', level: 50, since: 2021 },
  { name: 'Dart', icon: 'logos:dart', category: 'Mobile', level: 75, since: 2024 },
  { name: 'Flutter', icon: 'logos:flutter', category: 'Mobile', level: 75, since: 2024 },
  { name: 'MySQL', icon: 'logos:mysql-icon', category: 'Database', level: 100, since: 2023 },
  { name: 'PostgreSQL', icon: 'logos:postgresql', category: 'Database', level: 90, since: 2024 },
  { name: 'MongoDB', icon: 'logos:mongodb-icon', category: 'Database', level: 50, since: 2021 },
  { name: 'Redis', icon: 'logos:redis', category: 'Database', level: 25, since: 2021 },
  { name: 'SQL', icon: 'mdi:database', category: 'Database', level: 75, since: 2021 },
  { name: 'VS Code', icon: 'logos:visual-studio-code', category: 'Tools', level: 100, since: 2021 },
  { name: 'Git', icon: 'logos:git-icon', category: 'Tools', level: 100, since: 2021 },
  { name: 'GitHub', icon: 'logos:github-icon', category: 'Tools', level: 100, since: 2021 },
  { name: 'Figma', icon: 'logos:figma', category: 'Tools', level: 90, since: 2021 },
  { name: 'Postman', icon: 'logos:postman-icon', category: 'Tools', level: 90, since: 2021 },
  { name: 'Docker', icon: 'logos:docker-icon', category: 'Tools', level: 50, since: 2021 },
  { name: 'Linux', icon: 'logos:linux-tux', category: 'Tools', level: 75, since: 2021 },
]

export const projects: Project[] = [
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
  {
    slug: 'sipjaki',
    name: 'SIPJAKI',
    summary: 'Construction services information system for the construction industry.',
    description:
      'Construction Services Information System for transparency and business networking in the construction industry. Managed by national, provincial, and city construction supervisors.',
    tech: ['Laravel', 'JavaScript', 'MySQL'],
    year: 2024,
    role: 'Fullstack developer & project manager',
    status: 'Live',
    demo: 'https://sipjaki.pasuruankab.com',
    colors: ['#f97316', '#eab308'],
  },
  {
    slug: 'tracer-study-system',
    name: 'Tracer Study System',
    summary: 'Alumni tracking and career monitoring for educational institutions.',
    description: 'Alumni tracking and career monitoring system for educational institutions.',
    tech: ['Laravel', 'JavaScript', 'MySQL'],
    year: 2024,
    role: 'Fullstack developer & project manager',
    status: 'Live',
    colors: ['#10b981', '#14b8a6'],
  },
  {
    slug: 'e-rapor-trensains-tebuireng',
    name: 'E-Rapor SMA Trensains Tebuireng',
    summary: 'Digital report card system for high school.',
    description: 'Digital report card system for high school with grade management and parent portal.',
    tech: ['Laravel', 'Inertia.js', 'Vue.js', 'MySQL'],
    year: 2024,
    role: 'Fullstack developer',
    status: 'Live',
    colors: ['#7c3aed', '#ec4899'],
  },
  {
    slug: 'lms-tryout-asn-indonesia',
    name: 'LMS & Tryout ASN Indonesia',
    summary: 'Learning platform and examination system for civil servant candidates.',
    description:
      'Learning management system and examination platform for civil servant candidates with comprehensive test features.',
    tech: ['Laravel', 'JavaScript', 'MySQL'],
    year: 2024,
    role: 'Fullstack developer',
    status: 'Live',
    demo: 'https://asn-indonesia.com',
    colors: ['#0ea5e9', '#22c55e'],
  },
  {
    slug: 'toefl-test-asn',
    name: 'TOEFL Test ASN',
    summary: 'Integrated English proficiency testing system.',
    description: 'Integrated English proficiency testing system for government civil servant assessment.',
    tech: ['Laravel', 'JavaScript', 'MySQL'],
    year: 2024,
    role: 'Fullstack developer',
    status: 'Live',
    demo: 'https://asn-indonesia.com',
    colors: ['#6366f1', '#8b5cf6'],
  },
  {
    slug: 'boarding-school-management',
    name: 'Boarding School Management',
    summary: 'Boarding school management with a mobile app and PPOB payments.',
    description:
      'Integrated boarding school management system with mobile app and PPOB payment gateway for comprehensive school operations.',
    tech: ['Laravel', 'Vue', 'Inertia.js', 'Flutter', 'MySQL'],
    year: 2024,
    role: 'Fullstack developer',
    status: 'Live',
    colors: ['#e11d48', '#f97316'],
  },
  {
    slug: 'e-course-platform',
    name: 'E-Course Platform',
    summary: 'Online learning website similar to Udemy.',
    description: 'Online learning website similar to Udemy with course creation, video streaming, and payment integration.',
    tech: ['Next.js', 'Golang', 'PostgreSQL'],
    year: 2024,
    role: 'Fullstack developer',
    status: 'Live',
    colors: ['#0d9488', '#84cc16'],
  },
  {
    slug: 'mischool',
    name: 'MiSchool',
    summary: 'Comprehensive school management platform.',
    description:
      'Comprehensive school management platform with attendance, curriculum, student/teacher data management, LMS, online examination, and digital report cards.',
    tech: ['Laravel', 'Vue.js', 'Nuxt.js', 'JavaScript', 'MySQL'],
    year: 2023,
    role: 'Fullstack developer intern & project manager',
    status: 'Live',
    colors: ['#2563eb', '#06b6d4'],
  },
]

export const experience: Experience[] = [
  {
    role: 'System Analyst',
    company: 'Freelance',
    location: 'Indonesia',
    start: 'Dec 2025',
    end: 'Present',
    summary: 'Working as a freelance System Analyst for various enterprise projects.',
    highlights: [
      'Analyzing business requirements and translating them into technical specifications',
      'Creating system documentation and business process flows',
      'Collaborating with development teams for solution implementation',
    ],
  },
  {
    role: 'Fullstack Developer',
    company: 'Freelance Projects',
    location: 'Indonesia',
    start: 'Jul 2024',
    end: 'Present',
    summary:
      'Working on various freelance projects while pursuing my degree using Laravel, Inertia.js, Nuxt.js, and Golang.',
    highlights: [
      'E-Rapor SMA Trensains Tebuireng — digital report card system for high school',
      'LMS & Tryout ASN Indonesia — learning platform and examination system for civil servant candidates',
      'TOEFL Test ASN — integrated English proficiency testing system',
      'Boarding School Management — integrated system with mobile app and PPOB payment gateway',
      'E-Course Platform — online learning website similar to Udemy with complete features',
    ],
  },
  {
    role: 'Fullstack Developer & Project Manager',
    company: 'PT Hummatech Indonesia',
    location: 'Indonesia',
    start: 'Jan 2024',
    end: 'Jun 2024',
    summary:
      'Worked full-time after completing internship. Led development teams while building enterprise systems using Laravel, Vue.js, and Nuxt.js.',
    highlights: [
      'Led development teams as Project Manager while actively coding',
      'Continued development of School Management System with new features',
      'Developed Tracer Study System for alumni tracking and career monitoring',
      'Built SIPJAKI — Construction Services Information System for transparency and business networking',
    ],
  },
  {
    role: 'Fullstack Developer Intern & Project Manager',
    company: 'PT Hummatech Indonesia',
    location: 'Indonesia',
    start: 'Jan 2023',
    end: 'Dec 2023',
    summary:
      '1-year internship. Built large-scale enterprise systems using Laravel, Vue.js, and Nuxt.js while also managing project teams.',
    highlights: [
      'Built comprehensive School Management System (SMS) from scratch',
      'Developed Attendance, Curriculum, and Data Management modules',
      'Built integrated LMS, Online Examination, and E-Report Card systems',
      'Managed project timelines and coordinated with development teams',
    ],
  },
]

export const education: Education[] = [
  { school: 'Politeknik Negeri Malang', degree: 'D4 Informatics Engineering', start: '2024', end: 'Present' },
  { school: 'SMKN 1 Kepanjen', degree: 'Software Engineering', start: '2021', end: '2024' },
]

/** Shown as "available updates" in Settings > Windows Update. */
export const learning = ['Psychology', 'Next.js', 'Redis']

export const deviceSpecs: [string, string][] = [
  ['Device name', `${profile.username.toUpperCase()}-PC`],
  ['Processor', 'Human Brain(R) Core(TM) i9 — powered by coffee @ 4.20 GHz'],
  ['Installed RAM', '16.0 GB (remembers every shortcut, forgets every name)'],
  ['Device ID', 'DEV-2021-FULL-STACK'],
  ['System type', 'Full-stack developer, x64-based problem solver'],
  ['Pen and touch', 'Ten-finger touch typing support'],
]

export const aboutText = `Hi there! 👋

I'm ${profile.name} — a ${profile.role} based in ${profile.location}.

I build digital products that bridge technology and human experience
— solutions that are both technically sound and intuitively designed.
Most days you'll find me working with Laravel, Vue.js/Nuxt.js and
Golang, and I'm currently studying D4 Informatics Engineering at
Politeknik Negeri Malang.

----------------------------------------------------------------
WHAT I DO
----------------------------------------------------------------
- Build full-stack web apps with Laravel, Inertia.js, Vue.js and Nuxt.js
- Create cross-platform mobile apps with Flutter
- Design and ship backend services with Laravel and Golang
- Analyze business requirements and document systems as a System Analyst
- Model data with MySQL and PostgreSQL

----------------------------------------------------------------
CURRENTLY
----------------------------------------------------------------
- Freelancing as a System Analyst and Fullstack Developer
- Studying at Politeknik Negeri Malang (D4 Informatics Engineering)
- Learning: ${learning.join(', ')}
- ${profile.openToWork ? 'Available for freelance projects and collaboration opportunities' : 'Not looking for new opportunities right now'}

----------------------------------------------------------------
FUN FACTS
----------------------------------------------------------------
- This portfolio is a Windows 11 clone built with Nuxt 4 + Bun
- I've been writing code since vocational school in ${profile.codingSince}
- I'm fascinated by psychology and the way habits shape behavior
- Tabs or spaces? Let's not talk about it.

----------------------------------------------------------------
CONTACT
----------------------------------------------------------------
${socials.map(s => `${s.name.padEnd(10)}: ${s.handle}`).join('\n')}

Thanks for stopping by! Feel free to poke around — try the
Terminal, right-click the desktop, or drag a window to the edge
of the screen. 🙂
`
