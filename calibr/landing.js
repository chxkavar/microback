/* Local landing. Account and workspace routes remain owned by app.js. */
'use strict';
window.CalibrLanding={
 markup({icon,cloud}){const action=cloud?'sessions':'signup';return`
 <div class="calibr-landing" id="calibr-home">
  <section class="calibr-hero" aria-labelledby="calibr-headline">
   <div class="calibr-flow" aria-hidden="true"><div class="calibr-spotlight"></div><div class="calibr-light-bar"></div><div class="calibr-warm-glow"></div></div>
   <header class="calibr-nav"><a class="brand" href="#" data-action="landing">calibr<span class="brand-period">.</span></a><nav aria-label="Main navigation"><a href="#calibr-home">Overview</a><a href="#calibr-practice">How it works</a></nav><button class="calibr-nav-signin" data-action="${cloud?'sessions':'signin'}">${cloud?'Open workspace':'Sign in'} ${icon('arrow',13)}</button></header>
   <main class="calibr-hero-copy"><h1 id="calibr-headline">Better decisions,<br>built through <span>practice.</span></h1><p>Replay the market. Refine your execution.<br>Make progress, one session at a time.</p><button class="calibr-pill hero-cta" data-action="${action}">${cloud?'Open workspace':'Start practising'} ${icon('arrow',15)}</button></main>
   <a class="calibr-scroll" href="#calibr-practice" aria-label="See how it works">How it works <span aria-hidden="true">↓</span></a>
  </section>
  <section class="calibr-practice" id="calibr-practice" aria-label="How it works"><div class="practice-grid">
   <article class="practice-glass"><span>01</span><h2>Bring your market.</h2><p>Upload a dataset or choose from your library.</p></article>
   <article class="practice-glass"><span>02</span><h2>Find your rhythm.</h2><p>Set your balance. Replay and trade at your pace.</p></article>
   <article class="practice-glass"><span>03</span><h2>See your progress.</h2><p>Review your results and pick up where you left off.</p></article>
  </div></section>
  <footer class="calibr-footer"><span>Historical markets. Your next move.</span><button data-action="${action}">${cloud?'Open workspace':'Get started'} ${icon('arrow',13)}</button></footer>
 </div>`},
 mount(){}
};
