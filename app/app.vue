<script setup lang="ts">
import { profile, site, skills, socials } from '~/data/portfolio'

const url = `${site.url}/`
const image = `${site.url}${site.ogImage}`

useSeoMeta({
  title: site.title,
  description: site.description,
  author: profile.name,
  ogType: 'website',
  ogUrl: url,
  ogSiteName: site.title,
  ogTitle: site.title,
  ogDescription: site.description,
  ogImage: image,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: `${profile.name}'s Windows 11–style portfolio`,
  ogLocale: 'en_US',
  twitterCard: 'summary_large_image',
  twitterTitle: site.title,
  twitterDescription: site.description,
  twitterImage: image,
})

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  'name': profile.name,
  'jobTitle': profile.role,
  'description': profile.tagline,
  url,
  image,
  'email': `mailto:${profile.email}`,
  'address': { '@type': 'PostalAddress', 'addressCountry': profile.location },
  'sameAs': socials.filter(s => s.url.startsWith('http')).map(s => s.url),
  'knowsAbout': skills.map(s => s.name),
}

useHead({
  link: [{ rel: 'canonical', href: url }],
  script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(personJsonLd).replace(/</g, '\\u003c') }],
})
</script>

<template>
  <SeoContent />
  <ClientOnly>
    <OsRoot />
    <template #fallback>
      <div class="boot-screen">
        <OsBootVisual />
      </div>
    </template>
  </ClientOnly>
</template>
