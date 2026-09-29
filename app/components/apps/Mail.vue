<script setup lang="ts">
import type { WinState } from '~/composables/useWindows'
import { RESUME_URL } from '~/utils/fs'
import { profile, socials } from '~/data/portfolio'

const props = defineProps<{ win: WinState; active: boolean }>()
const wm = useWindows()
const os = useOs()
const shell = useShell()

type Folder = 'inbox' | 'drafts' | 'sent' | 'archive' | 'deleted'

interface Message {
  id: string
  folder: Folder
  from: string
  email: string
  subject: string
  body: string[]
  time: Date
  unread: boolean
  links?: { label: string; url: string }[]
  attachment?: { name: string; icon: string; url: string }
}

const FOLDERS: { id: Folder; label: string; icon: string }[] = [
  { id: 'inbox', label: 'Inbox', icon: 'fluent:mail-inbox-20-regular' },
  { id: 'drafts', label: 'Drafts', icon: 'fluent:drafts-20-regular' },
  { id: 'sent', label: 'Sent Items', icon: 'fluent:send-20-regular' },
  { id: 'archive', label: 'Archive', icon: 'fluent:archive-20-regular' },
  { id: 'deleted', label: 'Deleted Items', icon: 'fluent:delete-20-regular' },
]

const today = new Date()
const at = (daysAgo: number, h: number, m: number) => {
  const d = new Date(today)
  d.setDate(d.getDate() - daysAgo)
  d.setHours(h, m, 0, 0)
  return d
}

const messages = ref<Message[]>([
  {
    id: 'welcome',
    folder: 'inbox',
    from: profile.name,
    email: profile.email,
    subject: 'Thanks for stopping by 👋',
    time: at(0, 9, 41),
    unread: true,
    body: [
      'Hi there,',
      `Thanks for checking out my portfolio! I'm a ${profile.role} based in ${profile.location}, and I love building fast, delightful web apps.`,
      'If you have a project in mind, a role you think I\'d be a great fit for, or just want to say hi — hit Reply and your email app will open with my address filled in.',
      'You can also find me here:',
    ],
    links: socials.filter(s => s.id !== 'email').map(s => ({ label: `${s.name} — ${s.handle}`, url: s.url })),
  },
  {
    id: 'resume',
    folder: 'inbox',
    from: profile.name,
    email: profile.email,
    subject: 'My resume',
    time: at(1, 21, 41),
    unread: true,
    body: [
      'Hello again,',
      'Attached is my latest resume with my experience, selected projects and skills. It opens right here in Microsoft Edge.',
      'Cheers,',
      profile.name,
    ],
    attachment: { name: 'Resume.pdf', icon: 'file-pdf', url: RESUME_URL },
  },
  {
    id: 'tips',
    folder: 'inbox',
    from: 'Portfolio Tips',
    email: 'tips@portfolio.local',
    subject: '6 things to try on this desktop',
    time: at(3, 10, 5),
    unread: false,
    body: [
      '1. Drag a window to the top, left or right edge of the screen to snap it.',
      '2. Right-click the desktop to change icon size, sort, or personalize.',
      '3. Open Terminal and type "help" — then try "winfetch" or "projects".',
      '4. Switch between light and dark mode from Quick Settings (the Wi-Fi/volume icons).',
      '5. Press the Windows key (or click Start) and search for any project or skill.',
      '6. Settings > Windows Update holds my work history. Yes, really.',
    ],
  },
])

const folder = ref<Folder>('inbox')
const selectedId = ref<string | null>('welcome')
const composing = ref(false)
const mobilePane = ref<'list' | 'read'>('list')
const search = ref('')
const draft = reactive({ subject: '', body: '' })

const list = computed(() => {
  const q = search.value.trim().toLowerCase()
  return messages.value
    .filter(m => m.folder === folder.value)
    .filter(m => !q || `${m.from} ${m.subject} ${m.body.join(' ')}`.toLowerCase().includes(q))
    .sort((a, b) => b.time.getTime() - a.time.getTime())
})
const selected = computed(() => messages.value.find(m => m.id === selectedId.value))
const unreadCount = computed(() => messages.value.filter(m => m.folder === 'inbox' && m.unread).length)

function handleLaunch(p: Record<string, unknown>) {
  if (p.compose) startCompose()
}
handleLaunch(props.win.props)
watch(() => props.win.launch, () => handleLaunch(props.win.props))

function open(m: Message) {
  selectedId.value = m.id
  m.unread = false
  composing.value = false
  mobilePane.value = 'read'
}

function selectFolder(f: Folder) {
  folder.value = f
  composing.value = false
  selectedId.value = list.value[0]?.id ?? null
  mobilePane.value = 'list'
}

function startCompose(subject = '') {
  draft.subject = subject
  draft.body = ''
  composing.value = true
  mobilePane.value = 'read'
}

function send() {
  const subject = draft.subject.trim() || `Hello ${profile.name}!`
  const body = draft.body.trim()
  shell.openExternal(`mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
  messages.value.push({
    id: `sent-${Date.now()}`,
    folder: 'sent',
    from: 'You',
    email: '',
    subject,
    body: body ? body.split('\n') : ['(no message)'],
    time: new Date(),
    unread: false,
  })
  composing.value = false
  os.notify({ app: 'Mail', icon: 'mail', title: 'Opening your email app', body: `Your message to ${profile.name} is ready to send from your default email app.` }, 6000)
}

function fmtTime(d: Date) {
  const sameDay = d.toDateString() === today.toDateString()
  return sameDay
    ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString([], { weekday: 'short', month: 'numeric', day: 'numeric' })
}
function initials(name: string) {
  return name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
</script>

<template>
  <div class="mail" :class="`pane-${mobilePane}`">
    <nav class="m-nav">
      <button class="fl-btn accent m-new" @click="startCompose()">
        <Icon name="fluent:compose-20-regular" size="16px" />
        <span>New mail</span>
      </button>
      <p class="m-account">{{ profile.email }}</p>
      <button v-for="f in FOLDERS" :key="f.id" class="m-folder" :class="{ on: folder === f.id }" :title="f.label" @click="selectFolder(f.id)">
        <Icon :name="f.icon" size="18px" />
        <span class="m-folder-label">{{ f.label }}</span>
        <b v-if="f.id === 'inbox' && unreadCount" class="m-count">{{ unreadCount }}</b>
      </button>
    </nav>

    <section class="m-list">
      <div class="m-list-head">
        <label class="m-search">
          <Icon name="fluent:search-20-regular" size="14px" />
          <input v-model="search" placeholder="Search" aria-label="Search mail">
        </label>
        <div class="m-list-title">
          <b>{{ FOLDERS.find(f => f.id === folder)!.label }}</b>
          <span class="m-tabs"><span class="on">Focused</span><span>Other</span></span>
        </div>
      </div>
      <div class="m-items">
        <p v-if="!list.length" class="m-empty">Nothing in this folder.</p>
        <button
          v-for="m in list"
          :key="m.id"
          class="m-item"
          :class="{ on: m.id === selectedId && !composing, unread: m.unread }"
          @click="open(m)"
        >
          <span class="m-avatar">{{ initials(m.from) }}</span>
          <span class="m-item-text">
            <span class="m-item-top">
              <span class="m-from">{{ m.from }}</span>
              <time>{{ fmtTime(m.time) }}</time>
            </span>
            <span class="m-subject">{{ m.subject }}</span>
            <span class="m-preview">{{ m.body.join(' ') }}</span>
          </span>
        </button>
      </div>
    </section>

    <section class="m-read">
      <button class="fl-btn subtle m-back" @click="mobilePane = 'list'">
        <Icon name="fluent:arrow-left-20-regular" size="16px" />
        Back
      </button>

      <form v-if="composing" class="m-compose" @submit.prevent="send">
        <div class="m-compose-bar">
          <button type="submit" class="fl-btn accent">
            <Icon name="fluent:send-20-regular" size="16px" />
            Send
          </button>
          <button type="button" class="fl-btn subtle" @click="composing = false">
            <Icon name="fluent:delete-20-regular" size="16px" />
            Discard
          </button>
        </div>
        <div class="m-field">
          <span>To</span>
          <span class="m-chip">
            <OsAvatar :size="20" />
            {{ profile.name }} &lt;{{ profile.email }}&gt;
          </span>
        </div>
        <label class="m-field">
          <span>Subject</span>
          <input v-model="draft.subject" placeholder="Add a subject">
        </label>
        <textarea v-model="draft.body" class="m-body-input" placeholder="Write your message here..." aria-label="Message" />
      </form>

      <article v-else-if="selected" class="m-message selectable">
        <h2 class="m-msg-subject">{{ selected.subject }}</h2>
        <div class="m-msg-meta">
          <span class="m-avatar lg">{{ initials(selected.from) }}</span>
          <span class="m-msg-from">
            <b>{{ selected.from }}</b>
            <small>{{ selected.email }}</small>
          </span>
          <time>{{ selected.time.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) }}</time>
        </div>
        <div class="m-actions">
          <button v-if="selected.folder === 'inbox'" class="fl-btn" @click="startCompose(`Re: ${selected.subject}`)">
            <Icon name="fluent:arrow-reply-20-regular" size="16px" />
            Reply
          </button>
          <button class="fl-btn" disabled>
            <Icon name="fluent:arrow-forward-20-regular" size="16px" />
            Forward
          </button>
        </div>
        <div class="m-msg-body">
          <p v-for="(para, i) in selected.body" :key="i">{{ para }}</p>
          <ul v-if="selected.links">
            <li v-for="l in selected.links" :key="l.url">
              <a :href="l.url" target="_blank" rel="noopener noreferrer">{{ l.label }}</a>
            </li>
          </ul>
          <p v-if="selected.id === 'welcome'">Talk soon,<br>{{ profile.name }}</p>
        </div>
        <button v-if="selected.attachment" class="m-attachment" @click="wm.openApp('edge', { url: selected.attachment.url })">
          <OsIcon :name="selected.attachment.icon" :size="32" />
          <span>
            <b>{{ selected.attachment.name }}</b>
            <small>Click to open</small>
          </span>
        </button>
      </article>

      <div v-else class="m-placeholder">
        <OsIcon name="mail" :size="64" />
        <p>Select an item to read</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.mail {
  display: flex;
  height: 100%;
  container-type: inline-size;
}
.m-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;
  width: 220px;
  padding: 12px 8px;
  overflow-y: auto;
}
.m-new {
  justify-content: flex-start;
  margin-bottom: 12px;
}
.m-account {
  padding: 4px 10px 8px;
  overflow: hidden;
  color: var(--text-2);
  font-size: 12px;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.m-folder {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 36px;
  padding: 0 10px;
  border-radius: 4px;
  font-size: 13px;
  text-align: left;
}
.m-folder:hover {
  background: var(--subtle-hover);
}
.m-folder.on {
  background: var(--subtle-selected);
}
.m-folder.on::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  width: 3px;
  height: 16px;
  margin-top: -8px;
  border-radius: 2px;
  background: var(--accent);
}
.m-folder-label {
  flex: 1;
}
.m-count {
  color: var(--accent);
  font-size: 12px;
}

.m-list {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 340px;
  background: var(--layer);
  border-left: 1px solid var(--divider);
  border-right: 1px solid var(--divider);
}
.m-list-head {
  padding: 12px 12px 0;
}
.m-search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 10px;
  border-radius: 4px;
  background: var(--control);
  border: 1px solid var(--stroke);
  color: var(--text-2);
}
.m-search input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  font-size: 13px;
}
.m-list-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 4px 10px;
}
.m-list-title b {
  font-size: 16px;
  font-weight: 600;
}
.m-tabs {
  display: flex;
  gap: 12px;
  color: var(--text-2);
  font-size: 12px;
}
.m-tabs .on {
  color: var(--text);
  font-weight: 600;
  text-decoration: underline;
  text-decoration-color: var(--accent);
  text-decoration-thickness: 2px;
  text-underline-offset: 6px;
}
.m-items {
  flex: 1;
  overflow-y: auto;
}
.m-empty {
  padding: 32px 16px;
  color: var(--text-2);
  font-size: 13px;
  text-align: center;
}
.m-item {
  position: relative;
  display: flex;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  border-bottom: 1px solid var(--divider);
  text-align: left;
}
.m-item:hover {
  background: var(--subtle-hover);
}
.m-item.on {
  background: var(--sel-bg);
}
.m-item.unread::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 3px;
  background: var(--accent);
}
.m-avatar {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--accent) 22%, transparent);
  color: var(--text);
  font-size: 12px;
  font-weight: 600;
}
.m-avatar.lg {
  width: 40px;
  height: 40px;
  font-size: 14px;
}
.m-item-text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  font-size: 12px;
  line-height: 17px;
}
.m-item-top {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.m-from {
  font-size: 14px;
  line-height: 20px;
}
.m-item time {
  flex-shrink: 0;
  color: var(--text-2);
}
.m-item.unread .m-from,
.m-item.unread .m-subject,
.m-item.unread time {
  color: var(--accent);
  font-weight: 600;
}
.m-subject,
.m-preview {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.m-preview {
  color: var(--text-2);
}

.m-read {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  background: var(--surface);
}
.m-back {
  display: none;
  align-self: flex-start;
  margin: 8px;
}
.m-message {
  flex: 1;
  padding: 24px 32px 32px;
  overflow-y: auto;
}
.m-msg-subject {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
}
.m-msg-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}
.m-msg-from {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.m-msg-from small,
.m-msg-meta time {
  color: var(--text-2);
  font-size: 12px;
}
.m-actions {
  display: flex;
  gap: 8px;
  margin: 16px 0 20px;
}
.m-msg-body {
  max-width: 680px;
  font-size: 14px;
  line-height: 22px;
}
.m-msg-body p + p,
.m-msg-body ul,
.m-msg-body ul + p {
  margin-top: 12px;
}
.m-attachment {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  padding: 10px 16px 10px 12px;
  border-radius: 6px;
  background: var(--card);
  border: 1px solid var(--stroke-2);
  text-align: left;
}
.m-attachment:hover {
  background: var(--card-hover);
}
.m-attachment > span:last-child {
  display: flex;
  flex-direction: column;
}
.m-attachment small {
  color: var(--text-2);
  font-size: 12px;
}
.m-placeholder {
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 12px;
  flex: 1;
  color: var(--text-2);
  opacity: 0.8;
}
.m-compose {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 16px 24px 24px;
}
.m-compose-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.m-field {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 44px;
  border-bottom: 1px solid var(--divider);
  font-size: 14px;
}
.m-field > span:first-child {
  width: 60px;
  color: var(--text-2);
}
.m-field input {
  flex: 1;
  height: 40px;
  border: 0;
  background: transparent;
  font-size: 14px;
}
.m-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 2px 10px 2px 2px;
  border-radius: 14px;
  background: var(--subtle-selected);
  font-size: 13px;
}
.m-body-input {
  flex: 1;
  min-height: 120px;
  margin-top: 12px;
  padding: 8px 0;
  border: 0;
  resize: none;
  background: transparent;
  font-size: 14px;
  line-height: 22px;
}

@container (max-width: 900px) {
  .m-nav {
    width: 56px;
    padding: 12px 6px;
  }
  .m-new span,
  .m-account,
  .m-folder-label,
  .m-count {
    display: none;
  }
  .m-new,
  .m-folder {
    justify-content: center;
    padding: 0;
  }
  .m-list {
    width: 280px;
  }
}
@container (max-width: 640px) {
  .m-list {
    flex: 1;
    width: auto;
    border-right: 0;
  }
  .pane-list .m-read,
  .pane-read .m-list {
    display: none;
  }
  .m-back {
    display: inline-flex;
  }
  .m-message {
    padding: 8px 16px 24px;
  }
}
</style>
