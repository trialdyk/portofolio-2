<script setup lang="ts">
import { education, experience, learning, profile, projects, site, skills, socials } from '~/data/portfolio'

const skillGroups = [...new Set(skills.map(s => s.category))].map(category => ({
  category,
  names: skills.filter(s => s.category === category).map(s => s.name).join(', '),
}))
</script>

<!--
  Server-rendered, visually hidden copy of the portfolio for search engines and screen readers.
  The interactive desktop is client-only, so without this the HTML would contain no content.
-->
<template>
  <main class="sr-only" aria-label="Portfolio">
    <h1>{{ profile.name }} — {{ profile.role }}</h1>
    <p>{{ site.description }}</p>

    <section>
      <h2>About</h2>
      <p>{{ profile.tagline }} I've been writing code since {{ profile.codingSince }} and I'm currently learning {{ learning.join(', ') }}.</p>
      <p>Interests: {{ profile.interests.join(', ') }}.</p>
      <p v-if="profile.openToWork">Open to freelance and full-time opportunities.</p>
    </section>

    <section>
      <h2>Projects</h2>
      <article v-for="p in projects" :key="p.slug">
        <h3>{{ p.name }} ({{ p.year }})</h3>
        <p>{{ p.description }}</p>
        <p>Built with {{ p.tech.join(', ') }}. Role: {{ p.role }}. Status: {{ p.status }}.</p>
        <p v-if="p.demo || p.repo">
          <a v-if="p.demo" :href="p.demo" tabindex="-1" rel="noopener">Live demo of {{ p.name }}</a>
          <a v-if="p.repo" :href="p.repo" tabindex="-1" rel="noopener">Source code of {{ p.name }}</a>
        </p>
      </article>
    </section>

    <section>
      <h2>Skills</h2>
      <ul>
        <li v-for="g in skillGroups" :key="g.category">{{ g.category }}: {{ g.names }}</li>
      </ul>
    </section>

    <section>
      <h2>Experience</h2>
      <article v-for="e in experience" :key="`${e.company}-${e.start}`">
        <h3>{{ e.role }} at {{ e.company }}</h3>
        <p>{{ e.start }} – {{ e.end }}, {{ e.location }}. {{ e.summary }}</p>
        <ul>
          <li v-for="h in e.highlights" :key="h">{{ h }}</li>
        </ul>
      </article>
    </section>

    <section>
      <h2>Education</h2>
      <p v-for="ed in education" :key="ed.school">{{ ed.degree }}, {{ ed.school }} ({{ ed.start }} – {{ ed.end }})</p>
    </section>

    <section>
      <h2>Contact</h2>
      <ul>
        <li v-for="s in socials" :key="s.id">
          <a :href="s.url" tabindex="-1" rel="me noopener">{{ s.name }}: {{ s.handle }}</a>
        </li>
      </ul>
    </section>
  </main>
</template>
