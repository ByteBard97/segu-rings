<script setup lang="ts">
</script>

<template>
  <main class="landing">
    <header class="masthead">
      <div class="kicker">segu · ring quantities</div>
      <h1>When your math<br>needs to wrap around.</h1>
      <p class="sub">Interactive explorations of cyclic value handling — averages, interpolation, distance — for angles, times, phases, and anything else that lives on a ring.</p>
    </header>

    <nav class="cards">
      <a class="card card--accent" href="./playground/loop-time-is-a-ring.html">
        <div class="card-tag">Playground</div>
        <div class="card-title">Loop time is a ring.</div>
        <div class="card-body">Side-by-side code and interactive demos showing exactly where segu's functions break on ring inputs — and the correct geometric fix.</div>
        <div class="card-cta">Explore &rarr;</div>
      </a>

      <a class="card" href="./essay/essay.html">
        <div class="card-tag">Essay</div>
        <div class="card-title">Your angles are lying to you.</div>
        <div class="card-body">Why scalar arithmetic fails on cyclic quantities, the geometry of the fix, and the general pattern behind it.</div>
        <div class="card-cta">Read &rarr;</div>
      </a>
    </nav>

    <footer class="colophon">
      <span>Built on <a href="https://github.com/slurmulon/segu" target="_blank">segu</a></span>
      <span class="dot">·</span>
      <span><a href="https://github.com/ByteBard97/segu-rings" target="_blank">GitHub</a></span>
    </footer>
  </main>
</template>

<style scoped>
.landing {
  max-width: 860px;
  margin: 0 auto;
  padding: 12vh 24px 16vh;
  display: flex;
  flex-direction: column;
  gap: 10vh;
}

.masthead {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 6vh;
  border-bottom: 1px solid var(--rule);
}

.kicker {
  font-family: var(--sans);
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--ink-3);
}

h1 {
  font-family: var(--serif);
  font-weight: 600;
  font-size: clamp(36px, 5.5vw, 64px);
  line-height: 1.06;
  letter-spacing: -0.02em;
  color: var(--ink);
}

.sub {
  font-family: var(--serif);
  font-size: 1.05em;
  color: var(--ink-2);
  max-width: 54ch;
  line-height: 1.6;
}

.cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 32px;
  background: var(--paper-2);
  border: 1px solid var(--rule);
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.card:hover {
  border-color: var(--ink-3);
  box-shadow: 0 4px 24px oklch(0.22 0.012 80 / 0.06);
}

.card--accent {
  border-color: oklch(0.55 0.12 230 / 0.3);
  background: oklch(0.55 0.12 230 / 0.04);
}

.card--accent:hover {
  border-color: var(--vector);
}

.card-tag {
  font-family: var(--sans);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-3);
}

.card-title {
  font-family: var(--serif);
  font-weight: 600;
  font-size: 1.2em;
  line-height: 1.25;
  color: var(--ink);
}

.card-body {
  font-family: var(--serif);
  font-size: 0.92em;
  color: var(--ink-2);
  line-height: 1.55;
  flex: 1;
}

.card-cta {
  font-family: var(--sans);
  font-size: 13px;
  color: var(--ink-3);
  margin-top: 8px;
}

.colophon {
  font-family: var(--sans);
  font-size: 12px;
  color: var(--ink-3);
  display: flex;
  gap: 10px;
  align-items: center;
}

.colophon a { color: var(--ink-2); text-decoration: none; }
.colophon a:hover { color: var(--ink); }
.dot { color: var(--rule); }

@media (max-width: 640px) {
  .cards { grid-template-columns: 1fr; }
  h1 { font-size: 36px; }
}
</style>
