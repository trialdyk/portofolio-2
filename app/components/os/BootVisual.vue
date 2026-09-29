<template>
  <svg class="boot-logo" viewBox="0 0 48 48" aria-hidden="true">
    <defs>
      <linearGradient id="boot-logo-g" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#4ec3f7" />
        <stop offset="1" stop-color="#0a66c9" />
      </linearGradient>
    </defs>
    <g fill="url(#boot-logo-g)">
      <rect x="2" y="2" width="21" height="21" rx="1" />
      <rect x="25" y="2" width="21" height="21" rx="1" />
      <rect x="2" y="25" width="21" height="21" rx="1" />
      <rect x="25" y="25" width="21" height="21" rx="1" />
    </g>
  </svg>
  <div class="win-spinner">
    <i v-for="n in 5" :key="n" />
  </div>
</template>
