import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }     from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/* ── Neural canvas ── */
(function(){
  const nc=document.getElementById('neural-canvas');
  if(!nc) return;
  const nctx=nc.getContext('2d');
  let NW=innerWidth,NH=innerHeight;
  nc.width=NW; nc.height=NH;
  window.addEventListener('resize',()=>{ NW=innerWidth; NH=innerHeight; nc.width=NW; nc.height=NH; });
  const NODE_COUNT=55, CONNECT_DIST=180;
  const nodes=Array.from({length:NODE_COUNT},()=>({
    x:Math.random()*NW, y:Math.random()*NH,
    vx:(Math.random()-.5)*.32, vy:(Math.random()-.5)*.32,
    r:Math.random()*2+1, pulse:Math.random()*Math.PI*2
  }));
  function drawNeural(){
    nctx.clearRect(0,0,NW,NH);
    for(const n of nodes){
      n.x+=n.vx; n.y+=n.vy; n.pulse+=.012;
      if(n.x<-20) n.x=NW+20; if(n.x>NW+20) n.x=-20;
      if(n.y<-20) n.y=NH+20; if(n.y>NH+20) n.y=-20;
    }
    for(let i=0;i<nodes.length;i++) for(let j=i+1;j<nodes.length;j++){
      const a=nodes[i],b=nodes[j],dx=a.x-b.x,dy=a.y-b.y,d=Math.sqrt(dx*dx+dy*dy);
      if(d<CONNECT_DIST){
        const alpha=(1-d/CONNECT_DIST)*.12;
        nctx.beginPath(); nctx.moveTo(a.x,a.y); nctx.lineTo(b.x,b.y);
        nctx.strokeStyle=`rgba(40,50,80,${alpha})`; nctx.lineWidth=.6; nctx.stroke();
      }
    }
    for(const n of nodes){
      const pulse=.5+Math.sin(n.pulse)*.5, alpha=.25+pulse*.35, r=n.r+pulse*.6;
      const grad=nctx.createRadialGradient(n.x,n.y,0,n.x,n.y,r*3);
      grad.addColorStop(0,`rgba(40,50,80,${alpha*.3})`); grad.addColorStop(1,'rgba(40,50,80,0)');
      nctx.beginPath(); nctx.arc(n.x,n.y,r*3,0,Math.PI*2); nctx.fillStyle=grad; nctx.fill();
      nctx.beginPath(); nctx.arc(n.x,n.y,r,0,Math.PI*2); nctx.fillStyle=`rgba(40,50,80,${alpha})`; nctx.fill();
    }
    requestAnimationFrame(drawNeural);
  }
  drawNeural();
})();

/* ── Nav handler ── */
function handleNavAction(action){
  if(action === 'resume'){ openPage('resume'); return; }
  if(action === 'about'){ openPage('about'); return; }
  if(action === 'casestudies'){ openPage('casestudies'); return; }
  if(action === 'contact'){ openPage('contact'); return; }
  if(action === 'projects'){ openPage('casestudies'); return; }
}

document.querySelectorAll('.apple-nav-item, .dnav-item, .bnav-item, .hmenu-item').forEach(item => {
  item.addEventListener('click', () => handleNavAction(item.dataset.action));
});

/* ── Hamburger menu ── */
(function(){
  const btn  = document.getElementById('hamburger-btn');
  const menu = document.getElementById('hamburger-menu');
  if(!btn || !menu) return;

  function openMenu(){
    btn.classList.add('open');
    menu.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu(){
    btn.classList.remove('open');
    menu.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', () => {
    btn.classList.contains('open') ? closeMenu() : openMenu();
  });

  menu.querySelectorAll('.hmenu-item').forEach(item => {
    item.addEventListener('click', () => {
      closeMenu();
      handleNavAction(item.dataset.action);
    });
  });

  document.addEventListener('keydown', e => { if(e.key === 'Escape') closeMenu(); });
})();

/* ── Radial Orb Menu (mobile only) ── */
(function(){
  const backdrop   = document.getElementById('orb-menu-backdrop');
  const tapZone    = document.getElementById('orb-tap-zone');
  const radialMenu = document.getElementById('orb-radial-menu');
  if(!tapZone || !radialMenu) return;

  let menuOpen = false;
  let closing  = false;

  function triggerPulse(){
    tapZone.classList.remove('pulsing');
    void tapZone.offsetWidth;
    tapZone.classList.add('pulsing');
    tapZone.addEventListener('animationend', () => tapZone.classList.remove('pulsing'), { once: true });
  }

  function openOrbMenu(){
    if(menuOpen || closing) return;
    menuOpen = true;
    triggerPulse();
    if(backdrop) backdrop.classList.add('open');
    radialMenu.classList.remove('closing');
    radialMenu.classList.add('open');
    tapZone.setAttribute('aria-expanded', 'true');
    radialMenu.setAttribute('aria-hidden', 'false');
    if(window._orbState) window._orbState.hoverBoost = 2.5;
  }

  function closeOrbMenu(cb){
    if(!menuOpen) return;
    menuOpen = false;
    closing  = true;
    if(backdrop) backdrop.classList.remove('open');
    radialMenu.classList.remove('open');
    radialMenu.classList.add('closing');
    tapZone.setAttribute('aria-expanded', 'false');
    radialMenu.setAttribute('aria-hidden', 'true');
    if(window._orbState) window._orbState.hoverBoost = 1.0;
    setTimeout(() => {
      radialMenu.classList.remove('closing');
      closing = false;
      if(cb) cb();
    }, 330);
  }

  function toggle(){ menuOpen ? closeOrbMenu() : openOrbMenu(); }

  tapZone.addEventListener('touchstart', e => { e.preventDefault(); toggle(); }, { passive: false });
  tapZone.addEventListener('click', toggle);

  radialMenu.querySelectorAll('.orb-menu-link').forEach(link => {
    link.addEventListener('touchstart', e => {
      e.preventDefault();
      e.stopPropagation();
      closeOrbMenu(() => handleNavAction(link.dataset.action));
    }, { passive: false });
    link.addEventListener('click', e => {
      e.stopPropagation();
      closeOrbMenu(() => handleNavAction(link.dataset.action));
    });
  });

  if(backdrop){
    backdrop.addEventListener('touchstart', e => { e.preventDefault(); closeOrbMenu(); }, { passive: false });
    backdrop.addEventListener('click', () => closeOrbMenu());
  }

  document.addEventListener('keydown', e => { if(e.key === 'Escape' && menuOpen) closeOrbMenu(); });
})();

/* ── Boot ── */
const BOOT_LINES=['Palmer Charles','UX Designer · Developer','Loading portfolio...','Ready.'];
const bootText=document.getElementById('boot-text');
const bootBar=document.getElementById('boot-bar');
const bootOverlay=document.getElementById('boot-overlay');
async function runBoot(){
  for(let i=0;i<BOOT_LINES.length;i++){
    bootText.textContent=BOOT_LINES[i];
    bootBar.style.width=((i+1)/BOOT_LINES.length*100)+'%';
    await new Promise(r=>setTimeout(r,i===BOOT_LINES.length-1?600:380));
  }
  bootOverlay.classList.add('done');
  setTimeout(()=>{ bootOverlay.style.display='none'; },1400);
}
runBoot();

/* ── Burst canvas ── */
const burstCanvas=document.getElementById('burst-canvas');
const bctx=burstCanvas.getContext('2d');
burstCanvas.width=innerWidth; burstCanvas.height=innerHeight;
window.addEventListener('resize',()=>{ burstCanvas.width=innerWidth; burstCanvas.height=innerHeight; });
let burstParticles=[];
function spawnBurst(x,y,color='#00f5ff'){
  for(let i=0;i<55;i++){
    const angle=Math.random()*Math.PI*2, speed=Math.random()*4+1;
    burstParticles.push({ x,y, vx:Math.cos(angle)*speed, vy:Math.sin(angle)*speed,
      life:1, decay:Math.random()*.018+.012, size:Math.random()*2.5+.5, color });
  }
}
function animateBurst(){
  bctx.clearRect(0,0,burstCanvas.width,burstCanvas.height);
  burstParticles=burstParticles.filter(p=>{
    p.x+=p.vx; p.y+=p.vy; p.vy+=.06; p.vx*=.98; p.life-=p.decay;
    bctx.globalAlpha=Math.max(0,p.life); bctx.fillStyle=p.color;
    bctx.beginPath(); bctx.arc(p.x,p.y,p.size,0,Math.PI*2); bctx.fill();
    return p.life>0;
  });
  bctx.globalAlpha=1;
  requestAnimationFrame(animateBurst);
}
animateBurst();

/* ── Page modal ── */
const PALMER_HEADSHOT=document.getElementById('palmer-headshot-data').content;
const PAGE_OVERLAY=document.getElementById('page-overlay');

function openPage(id){
  const tpl=document.getElementById('tpl-'+id);
  if(!tpl) return;
  const content=document.getElementById('page-content');
  content.innerHTML='';
  content.appendChild(tpl.content.cloneNode(true));
  const hs=content.querySelector('#about-headshot');
  if(hs) hs.src=PALMER_HEADSHOT;
  PAGE_OVERLAY.classList.add('open');
  document.body.style.overflow='hidden';
  PAGE_OVERLAY.scrollTop=0;
}
window.openPage=openPage;

function closePage(e,force){
  if(e && e.target!==PAGE_OVERLAY && !force) return;
  PAGE_OVERLAY.classList.remove('open');
  document.body.style.overflow='';
}
window.closePage=closePage;

/* ── Shimmer: mark images loaded ── */
function initShimmer(root){
  (root || document).querySelectorAll('.card-thumb').forEach(img => {
    if(img.complete && img.naturalWidth > 0) img.classList.add('img-loaded');
    else img.addEventListener('load', () => img.classList.add('img-loaded'));
  });
}
initShimmer();

/* ── Parallax scroll ── */
function initParallax(scrollEl){
  const wrap = scrollEl.querySelector('.parallax-wrap');
  if(!wrap) return;
  const img = wrap.querySelector('.case-hero-img');
  if(!img) return;
  function update(){
    const wrapTop = wrap.getBoundingClientRect().top;
    const scrollH = window.innerHeight;
    const progress = 1 - (wrapTop + wrap.offsetHeight) / (scrollH + wrap.offsetHeight);
    const clamp = Math.max(0, Math.min(1, progress));
    img.style.transform = `translateY(${(clamp - 0.5) * 16}%)`;
  }
  scrollEl.addEventListener('scroll', update, { passive: true });
  update();
}

/* ── Lightbox ── */
(function(){
  const lb    = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img');
  const lbClose = document.getElementById('lightbox-close');
  if(!lb || !lbImg) return;

  function openLightbox(src, alt){
    lbImg.src = src;
    lbImg.alt = alt || '';
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox(){
    lb.classList.remove('open');
    setTimeout(() => { lbImg.src = ''; }, 300);
    document.body.style.overflow = '';
  }

  document.addEventListener('click', e => {
    const img = e.target.closest('[data-lightbox]');
    if(img) { e.stopPropagation(); openLightbox(img.src, img.alt); }
  });

  lb.addEventListener('click', e => { if(e.target === lb || e.target === lbClose) closeLightbox(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && lb.classList.contains('open')) closeLightbox(); });
})();

/* ── Orb reactive state (shared with Three.js animate loop) ── */
window._orbState = { hoverBoost: 1.0, morphOpen: false };


/* ── Card morph system ── */
const morphOverlay  = document.getElementById('morph-overlay');
const morphCard     = document.getElementById('morph-card');
const morphSummary  = document.getElementById('morph-card-summary');
const morphContent  = document.getElementById('morph-card-content');
const morphInner    = document.getElementById('morph-inner');
const morphEmoji    = document.getElementById('morph-summary-emoji');
const morphLabel    = document.getElementById('morph-summary-label');
const morphTitle    = document.getElementById('morph-summary-title');
const morphCloseBtn = document.getElementById('morph-close-btn');

let morphActive     = false;
let morphFromSelector = false;

function morphOpen(cardEl, pageId) {
  if(morphActive) return;
  morphActive = true;
  window._orbState.morphOpen = true;
  window._orbState.hoverBoost = 1.0;

  morphFromSelector = !!document.getElementById('page-overlay').classList.contains('open');
  document.getElementById('landing-cards')?.classList.add('hidden');
  if(morphFromSelector) {
    PAGE_OVERLAY.classList.remove('open');
    document.body.style.overflow = 'hidden';
  }

  const tpl = document.getElementById('tpl-' + pageId);
  if(!tpl) { morphActive = false; window._orbState.morphOpen = false; return; }
  morphInner.innerHTML = '';
  morphInner.appendChild(tpl.content.cloneNode(true));

  const hs = morphInner.querySelector('#about-headshot');
  if(hs) hs.src = PALMER_HEADSHOT;

  morphEmoji.textContent = cardEl.dataset.emoji || '';
  morphLabel.textContent = cardEl.dataset.label || '';
  morphTitle.textContent = cardEl.dataset.title || '';

  /* ── Cinema enter: position centered at final size, hidden + scaled ── */
  const isMob  = window.innerWidth < 600;
  const pad    = isMob ? 0 : 24;
  const maxW   = isMob ? window.innerWidth : Math.min(860, window.innerWidth - 48);
  const left   = (window.innerWidth - maxW) / 2;
  const top    = isMob ? 0 : pad;
  const height = window.innerHeight - top - (isMob ? 0 : pad);

  morphCard.style.transition   = 'none';
  morphCard.style.display      = 'block';
  morphCard.style.top          = top    + 'px';
  morphCard.style.left         = left   + 'px';
  morphCard.style.width        = maxW   + 'px';
  morphCard.style.height       = height + 'px';
  morphCard.style.borderRadius = isMob ? '20px 20px 0 0' : '16px';
  morphCard.style.transform    = 'scale(0.88)';
  morphCard.style.opacity      = '0';

  morphSummary.classList.remove('hidden');
  morphContent.classList.remove('visible');
  morphContent.scrollTop = 0;

  cardEl.classList.add('morphed');
  cardEl.closest('.cs-grid')?.querySelectorAll('.cs-card:not(.morphed)')
    .forEach(c => c.classList.add('morphed'));

  morphOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  /* Trigger spring-in on next paint */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      morphCard.style.transition = 'transform 0.52s cubic-bezier(0.175,0.885,0.32,1.275), opacity 0.32s ease';
      morphCard.style.transform  = 'scale(1)';
      morphCard.style.opacity    = '1';
    });
  });

  /* Fade in content after animation settles */
  setTimeout(() => {
    morphSummary.classList.add('hidden');
    morphContent.classList.add('visible');
    morphInner.querySelectorAll('.page-section, .page-hero, .page-tools-row, .case-section, .case-layout').forEach((el, i) => {
      el.style.opacity   = '0';
      el.style.transform = 'translateY(14px)';
      el.style.transition = `opacity 0.32s ease ${i * 55}ms, transform 0.32s ease ${i * 55}ms`;
      requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
    });
    initShimmer(morphInner);
    initParallax(morphContent);
  }, 540);
}

function morphClose() {
  if(!morphActive) return;

  morphContent.classList.remove('visible');

  /* Spring-out */
  morphCard.style.transition = 'transform 0.35s cubic-bezier(0.4,0,1,1), opacity 0.28s ease';
  morphCard.style.transform  = 'scale(0.88)';
  morphCard.style.opacity    = '0';

  morphOverlay.classList.remove('active');
  document.body.style.overflow = '';

  setTimeout(() => {
    document.querySelectorAll('.cs-card.morphed').forEach(c => c.classList.remove('morphed'));
  }, 180);

  setTimeout(() => {
    morphCard.style.display    = 'none';
    morphCard.style.transition = 'none';
    morphActive = false;
    window._orbState.morphOpen = false;
    if(morphFromSelector) {
      openPage('casestudies');
      morphFromSelector = false;
    } else {
      document.getElementById('landing-cards')?.classList.remove('hidden');
    }
  }, 360);
}

if(morphCloseBtn) morphCloseBtn.addEventListener('click', morphClose);
morphOverlay.addEventListener('click', morphClose);
document.addEventListener('keydown', e => { if(e.key === 'Escape' && morphActive) morphClose(); });

document.addEventListener('click', e => {
  const card = e.target.closest('[data-morph]');
  if(card) {
    e.preventDefault();
    morphOpen(card, card.dataset.morph);
  }
});

const overlayCloseBtn=document.getElementById('overlay-close');
if(overlayCloseBtn) overlayCloseBtn.addEventListener('click',()=>{
  document.getElementById('section-overlay').classList.remove('visible');
});

/* ── Three.js Layered Scene: Cortex Orb + Neuron Field ── */

let scene, camera, renderer, composer, bloomPass;
let orbGroup, neuronGroup;
let mouse = new THREE.Vector2(-10, -10), clock;

/* Icosahedron Cortex Orb — dark shell + glowing cyan edges */
function buildOrb(){
  orbGroup = new THREE.Group();

  const geo    = new THREE.IcosahedronGeometry(0.85, 1);
  const geoHi  = new THREE.IcosahedronGeometry(0.85, 3);

  /* Solid inner shell — absorbs light, gives depth */
  const shell = new THREE.Mesh(geoHi, new THREE.MeshPhongMaterial({
    color:       0x030810,
    emissive:    0x001840,
    shininess:   90,
    transparent: true,
    opacity:     0.82,
  }));

  /* Clean shared-edge wireframe — this is what the bloom catches */
  const wire = new THREE.LineSegments(
    new THREE.EdgesGeometry(geo),
    new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.92 })
  );

  /* Outer halo sphere — very faint, larger radius */
  const halo = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.08, 2),
    new THREE.MeshBasicMaterial({ color: 0x003355, transparent: true, opacity: 0.08, wireframe: true })
  );

  orbGroup.add(shell, wire, halo);
  scene.add(orbGroup);
}

/* 500 neuron points distributed in a hollow sphere — camera sits inside */
function buildNeurons(count){
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);

  for(let i = 0; i < count; i++){
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = 5 + Math.random() * 9;        /* radius band 5 – 14 */
    pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i*3+2] = r * Math.cos(phi);
  }

  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

  neuronGroup = new THREE.Points(geo, new THREE.PointsMaterial({
    color:           0xaaccee,
    size:            0.055,
    sizeAttenuation: true,
    transparent:     true,
    opacity:         0.55,
    blending:        THREE.AdditiveBlending,
    depthWrite:      false,
  }));

  scene.add(neuronGroup);
}

function init(){
  clock = new THREE.Clock();
  scene = new THREE.Scene();

  const W   = window.innerWidth;
  const H   = window.innerHeight;
  const mob = W < 600;

  /* Camera inside the neuron sphere, looking at orb center */
  camera = new THREE.PerspectiveCamera(mob ? 75 : 65, W / H, 0.1, 100);
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: !mob, alpha: false });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x050505, 1);
  document.body.appendChild(renderer.domElement);
  renderer.domElement.id = 'orb-canvas';
  if(mob) renderer.domElement.style.pointerEvents = 'none';

  /* Ambient fill + core point light that feeds the bloom */
  scene.add(new THREE.AmbientLight(0x111828, 3));
  const coreLight = new THREE.PointLight(0x00b8ff, 5, 20);
  coreLight.position.set(0, 0, 2);
  scene.add(coreLight);

  /* Bloom post-processing — makes the cyan edges glow */
  const rp = new RenderPass(scene, camera);
  bloomPass = new UnrealBloomPass(new THREE.Vector2(W, H), 1.4, 0.55, 0.08);
  composer  = new EffectComposer(renderer);
  composer.addPass(rp);
  composer.addPass(bloomPass);

  buildOrb();
  buildNeurons(mob ? 300 : 500);

  window.addEventListener('resize',    onResize);
  window.addEventListener('mousemove', onMouseMove);
  renderer.domElement.addEventListener('click', onCanvasClick);

  document.querySelectorAll('.theme-swatch').forEach(el => el.addEventListener('click', () => {}));
  document.getElementById('explode-btn')?.addEventListener('click', () => {});
  document.getElementById('fs-btn')?.addEventListener('click', () => {
    if(!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  });

  onResize();
}

function animate(){
  requestAnimationFrame(animate);

  const morphOpen = window._orbState?.morphOpen;

  /* Cortex Orb — slow base rotation + subtle mouse lean */
  if(orbGroup){
    orbGroup.rotation.y += 0.004 + mouse.x * 0.0008;
    orbGroup.rotation.x += 0.001 + mouse.y * 0.0004;

    const targetS = morphOpen ? 0.55 : 1.0;
    orbGroup.scale.x += (targetS - orbGroup.scale.x) * 0.06;
    orbGroup.scale.y  = orbGroup.scale.z = orbGroup.scale.x;
  }

  /* Neuron field — very slow drift, dims when modal is open */
  if(neuronGroup){
    neuronGroup.rotation.y += 0.0005;
    neuronGroup.rotation.x += 0.0002;

    const targetOp = morphOpen ? 0.18 : 0.55;
    neuronGroup.material.opacity += (targetOp - neuronGroup.material.opacity) * 0.04;
  }

  composer.render();
}

function onResize(){
  const W = window.innerWidth, H = window.innerHeight;
  camera.aspect = W / H;
  camera.updateProjectionMatrix();
  renderer.setSize(W, H);
  composer.setSize(W, H);
}

function onMouseMove(e){
  mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
}

function onCanvasClick(e){
  spawnBurst(e.clientX, e.clientY, '#00e5ff');
}

if(document.readyState === 'complete') setTimeout(() => { init(); animate(); }, 0);
else window.addEventListener('load', () => { init(); animate(); });
