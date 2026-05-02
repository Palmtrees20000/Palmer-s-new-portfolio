import * as THREE from 'three';
import { OrbitControls }  from 'three/addons/controls/OrbitControls.js';
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

const PROJECT_ACCENTS = {
  awardco:    { speedBoost: 1.9 },
  craigslist: { speedBoost: 2.6 },
  hershey:    { speedBoost: 1.7 },
};
document.addEventListener('mouseover', e => {
  if(window._orbState.morphOpen) return;
  const card = e.target.closest('[data-morph]');
  const accent = card ? PROJECT_ACCENTS[card.dataset.morph] : null;
  window._orbState.hoverBoost = accent ? accent.speedBoost : 1.0;
});

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

/* ── Three.js orb ── */
const SECTIONS = {
  work:    { label:'01 // WORK',    title:'Case Studies', desc:'UX sprints, interaction systems, and full-stack prototypes — from Awardco to Collect AF and beyond.' },
  about:   { label:'02 // ABOUT',   title:'Palmer',       desc:'UX designer + front-end developer at UVU. I build things that feel like the future — calm, intelligent, not toy-like.' },
  contact: { label:'03 // CONTACT', title:'Open Comms',   desc:'Internships, freelance, and collaboration. Reach out via email or LinkedIn.' },
  resume:  { label:'04 // RESUME',  title:'Credentials',  desc:'Education, experience, and tools. Download the full PDF or browse inline.' }
};

const themes = {
  metroid: {
    sphere: [new THREE.Color(0x00f5ff),new THREE.Color(0x0077ff),new THREE.Color(0x00c9a7),new THREE.Color(0x003fff),new THREE.Color(0x00f5ff)],
    rings: (i,n,j,p)=>new THREE.Color().setHSL(0.52+(i/n)*0.12+(j/p)*0.06,0.95,0.60),
    bloom:{strength:1.4,radius:0.55}, light:0x00c9ff,
  },
  starmap: {
    sphere: [new THREE.Color(0xc8860a),new THREE.Color(0x8a5a00),new THREE.Color(0xe8a020),new THREE.Color(0x6a3d00),new THREE.Color(0xb07010)],
    rings: (i,n,j,p)=>new THREE.Color().setHSL(0.09+(i/n)*0.04+(j/p)*0.02,0.55,0.38+(j/p)*0.12),
    bloom:{strength:0.9,radius:0.4}, light:0x9a6510,
  },
  varia: {
    sphere: [new THREE.Color(0x6a28cc),new THREE.Color(0x3a0f88),new THREE.Color(0x8844bb),new THREE.Color(0x4a1a99),new THREE.Color(0x5c22aa)],
    rings: (i,n,j,p)=>new THREE.Color().setHSL(0.75+(i/n)*0.08+(j/p)*0.04,0.55,0.38+(j/p)*0.1),
    bloom:{strength:1.0,radius:0.45}, light:0x6622bb,
  },
  darkspace: {
    sphere: [new THREE.Color(0x080808),new THREE.Color(0x111111),new THREE.Color(0x0a0a0a),new THREE.Color(0x181818),new THREE.Color(0x060606)],
    rings: (i,n,j,p)=>{ const light=(i%2===0); const brightness=light?0.88+(j/p)*0.1:0.06+(j/p)*0.08; return new THREE.Color().setHSL(0,0,brightness); },
    bloom:{strength:0.15,radius:0.08}, light:0xffffff, speed:0.008,
  },
};

let currentSpeed=1.0, targetSpeed=1.0;
const PULSE_COLORS=[
  new THREE.Vector3(0.12,0.12,0.18),new THREE.Vector3(0.10,0.10,0.16),
  new THREE.Vector3(0.12,0.12,0.18),new THREE.Vector3(0.10,0.10,0.16),
  new THREE.Vector3(0.12,0.12,0.18),
];
let pulseIdx=0, pulsePhase=0;

const VERT=`
attribute float size; attribute vec3 randomDir;
varying vec3 vColor; varying float vMouseEffect;
uniform float time; uniform vec2 uMouse; uniform float uExplode; uniform float uClick;
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;
  vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
void main(){
  vColor=color;
  float explodeAmt=uExplode*38.;
  float turb=snoise(position*.4+randomDir*2.+time*.8)*10.*uExplode;
  vec3 explodedPos=position+randomDir*(explodeAmt+turb);
  vec3 mixedPos=mix(position,explodedPos,uExplode);
  float dist=length(position);float wave=sin(dist*2.-time*8.)*.5+.5;float clickRipple=uClick*wave*2.5;
  vec4 projV=projectionMatrix*modelViewMatrix*vec4(position,1.);
  vec2 screenPos=projV.xy/projV.w;float mouseDist=distance(screenPos,uMouse);
  float mouseEffect=1.-smoothstep(0.,.28,mouseDist);vMouseEffect=mouseEffect;
  vec3 noiseIn=mixedPos*.4+time*.5;
  vec3 disp=vec3(snoise(noiseIn),snoise(noiseIn+vec3(10.)),snoise(noiseIn+vec3(20.)));
  float noiseAmp=(0.8+mouseEffect*3.5+clickRipple)*(1.-uExplode*.8);
  vec3 finalPos=mixedPos+disp*noiseAmp;float pulse=sin(time+length(position))*.1+1.;
  vec4 mvPos=modelViewMatrix*vec4(finalPos,1.);
  gl_PointSize=size*(400./-mvPos.z)*pulse*(1.+vMouseEffect*.5+uClick*.3);
  gl_Position=projectionMatrix*mvPos;
}`;

const FRAG=`
varying vec3 vColor; varying float vMouseEffect;
uniform float time; uniform float uExplode; uniform float uClick;
uniform vec3 uPulseColor; uniform float uPulseAmt;
float rand(vec2 co){return fract(sin(dot(co.xy,vec2(12.9898,78.233)))*43758.5453);}
void main(){
  vec2 cxy=2.*gl_PointCoord-1.;float r=dot(cxy,cxy);if(r>1.)discard;
  float glow=exp(-r*3.5)+vMouseEffect*.2;float twinkle=rand(gl_PointCoord+time)*.08+.92;
  vec3 mixed=mix(vColor,uPulseColor,uPulseAmt*.15);
  mixed=mix(mixed,vec3(1.),uExplode*.85);mixed=mix(mixed,vec3(1.),uClick*.4);
  gl_FragColor=vec4(mixed*glow*twinkle,glow);
}`;

let scene,camera,renderer,composer,controls,bloomPass;
let mainGroup,coreSphere,orbitRings,centralLight;
let mouse=new THREE.Vector2(-10,-10), clock;
let currentTheme='darkspace', activeSection=null;
let isExploding=false, explodeStart=0;
const EXPLODE_DUR=2200;
let clickPulse=0;
const raycaster=new THREE.Raycaster();
let clickSphere;
let clickRippleActive=false, clickRippleStart=0;
const RIPPLE_DUR=1200;

function init(){
  clock=new THREE.Clock();
  scene=new THREE.Scene();
  const isMobile=innerWidth<600;
  camera=new THREE.PerspectiveCamera(isMobile?85:70,innerWidth/innerHeight,0.1,50000);
  camera.position.set(0,14,isMobile?22:22);
  renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setSize(innerWidth,innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setClearColor(isMobile ? 0x050505 : 0xeeede8, 1);
  document.body.appendChild(renderer.domElement);
  renderer.domElement.id = 'orb-canvas';
  controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true; controls.dampingFactor=0.045; controls.rotateSpeed=0.55;
  controls.enableZoom=false;
  controls.enablePan=false;
  controls.minDistance=10; controls.maxDistance=48;
  controls.target.set(0,isMobile?10:18,0);
  if(isMobile){ controls.enabled=false; renderer.domElement.style.pointerEvents='none'; }
  const renderPass=new RenderPass(scene,camera);
  bloomPass=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),1.4,0.55,0);
  composer=new EffectComposer(renderer);
  composer.addPass(renderPass); composer.addPass(bloomPass);
  coreSphere=buildSphere(1.7,18000);
  orbitRings=buildRings(2.8,6,0.35);
  mainGroup=new THREE.Group();
  mainGroup.add(coreSphere,orbitRings);
  mainGroup.position.set(0,isMobile?2:3,0);
  scene.add(mainGroup);
  clickSphere=new THREE.Mesh(new THREE.SphereGeometry(2.8,16,16),new THREE.MeshBasicMaterial({visible:false}));
  clickSphere.position.set(0,3,0);
  scene.add(clickSphere);
  centralLight=new THREE.PointLight(0x00c9ff,2.5,0);
  scene.add(centralLight);
  applyTheme('darkspace');
  window.addEventListener('resize',onResize);
  window.addEventListener('mousemove',onMouseMove);
  renderer.domElement.addEventListener('click',onCanvasClick);
  document.querySelectorAll('.theme-swatch').forEach(el=>{
    el.addEventListener('click',()=>applyTheme(el.dataset.theme));
  });
  document.getElementById('explode-btn').addEventListener('click',triggerExplode);
  document.getElementById('fs-btn').addEventListener('click',()=>{
    if(!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  });
}

function makeMaterial(){
  return new THREE.ShaderMaterial({
    uniforms:{
      time:{value:0},uMouse:{value:mouse},uExplode:{value:0},uClick:{value:0},
      uPulseColor:{value:new THREE.Vector3(0,0,0)},uPulseAmt:{value:0},
    },
    vertexShader:VERT, fragmentShader:FRAG,
    vertexColors:true, transparent:true, depthWrite:false, blending:THREE.NormalBlending,
  });
}

function buildSphere(radius,count){
  const geo=new THREE.BufferGeometry();
  const pos=new Float32Array(count*3),col=new Float32Array(count*3),sz=new Float32Array(count),rDir=new Float32Array(count*3);
  for(let i=0;i<count;i++){
    const phi=Math.acos(-1+(2*i)/count),theta=Math.sqrt(count*Math.PI)*phi;
    pos[i*3]=radius*Math.cos(theta)*Math.sin(phi); pos[i*3+1]=radius*Math.sin(theta)*Math.sin(phi); pos[i*3+2]=radius*Math.cos(phi);
    sz[i]=Math.random()*.35+.15;
    const d=new THREE.Vector3(Math.random()*2-1,Math.random()*2-1,Math.random()*2-1).normalize();
    rDir[i*3]=d.x; rDir[i*3+1]=d.y; rDir[i*3+2]=d.z;
  }
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  geo.setAttribute('color',new THREE.BufferAttribute(col,3));
  geo.setAttribute('size',new THREE.BufferAttribute(sz,1));
  geo.setAttribute('randomDir',new THREE.BufferAttribute(rDir,3));
  return new THREE.Points(geo,makeMaterial());
}

function buildRings(radius,count,thick){
  const group=new THREE.Group();
  for(let i=0;i<count;i++){
    const n=2200,geo=new THREE.BufferGeometry();
    const pos=new Float32Array(n*3),col=new Float32Array(n*3),sz=new Float32Array(n),rDir=new Float32Array(n*3);
    for(let j=0;j<n;j++){
      const a=(j/n)*Math.PI*2,rv=radius+(Math.random()-.5)*thick;
      pos[j*3]=Math.cos(a)*rv; pos[j*3+1]=(Math.random()-.5)*(thick*.5); pos[j*3+2]=Math.sin(a)*rv;
      sz[j]=Math.random()*.28+.12;
      const d=new THREE.Vector3(Math.random()*2-1,Math.random()*2-1,Math.random()*2-1).normalize();
      rDir[j*3]=d.x; rDir[j*3+1]=d.y; rDir[j*3+2]=d.z;
    }
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    geo.setAttribute('size',new THREE.BufferAttribute(sz,1));
    geo.setAttribute('randomDir',new THREE.BufferAttribute(rDir,3));
    const ring=new THREE.Points(geo,makeMaterial());
    ring.rotation.x=Math.random()*Math.PI; ring.rotation.y=Math.random()*Math.PI;
    group.add(ring);
  }
  return group;
}

function applyTheme(name){
  const t=themes[name]; if(!t) return;
  currentTheme=name;
  const sca=coreSphere.geometry.attributes.color;
  for(let i=0;i<sca.count;i++){
    const p=(i/sca.count)*(t.sphere.length-1);
    const c=new THREE.Color().copy(t.sphere[Math.floor(p)]).lerp(t.sphere[Math.min(Math.ceil(p),t.sphere.length-1)],p-Math.floor(p));
    sca.setXYZ(i,c.r,c.g,c.b);
  }
  sca.needsUpdate=true;
  orbitRings.children.forEach((ring,i)=>{
    const rca=ring.geometry.attributes.color;
    for(let j=0;j<rca.count;j++){ const c=t.rings(i,orbitRings.children.length,j,rca.count); rca.setXYZ(j,c.r,c.g,c.b); }
    rca.needsUpdate=true;
  });
  centralLight.color.set(t.light);
  bloomPass.strength=t.bloom.strength; bloomPass.radius=t.bloom.radius;
  targetSpeed=t.speed??1.0;
  document.querySelectorAll('.theme-swatch').forEach(el=>el.classList.toggle('active',el.dataset.theme===name));
}

function easeInOut(x){ return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2; }
function triggerExplode(){ if(isExploding) return; isExploding=true; explodeStart=clock.getElapsedTime(); document.getElementById('explode-btn').classList.add('active'); }
function triggerClickRipple(){ clickRippleActive=true; clickRippleStart=clock.getElapsedTime(); }

function onCanvasClick(e){
  mouse.x=(e.clientX/innerWidth)*2-1; mouse.y=-(e.clientY/innerHeight)*2+1;
  raycaster.setFromCamera(mouse,camera);
  const hits=raycaster.intersectObject(clickSphere);
  if(hits.length>0){
    triggerClickRipple();
    const panel=document.getElementById('section-panel');
    const isOpen=panel.classList.contains('visible');
    panel.classList.toggle('visible',!isOpen);
    document.getElementById('greeting').style.opacity='0';
    if(isOpen) document.getElementById('section-overlay').classList.remove('visible');
  }
}

function animate(){
  requestAnimationFrame(animate);

  const t=clock.getElapsedTime();

  let explodeVal=0;
  if(isExploding){
    const prog=Math.min((t-explodeStart)*1000/EXPLODE_DUR,1);
    explodeVal=easeInOut(Math.sin(prog*Math.PI));
    if(prog>=1){ isExploding=false; document.getElementById('explode-btn').classList.remove('active'); }
  }

  let clickVal=0;
  if(clickRippleActive){
    const prog=Math.min((t-clickRippleStart)*1000/RIPPLE_DUR,1);
    clickVal=Math.sin(prog*Math.PI);
    if(prog>=1) clickRippleActive=false;
  }

  currentSpeed+=(targetSpeed-currentSpeed)*.025;
  const S=currentSpeed;

  pulsePhase+=0.000048;
  if(pulsePhase>=1.0){ pulsePhase=0; pulseIdx=(pulseIdx+1)%PULSE_COLORS.length; }
  let pulseAmt=0;
  if(pulsePhase<0.25) pulseAmt=pulsePhase/0.25;
  else if(pulsePhase<0.75) pulseAmt=1.0;
  else pulseAmt=1.0-(pulsePhase-0.75)/0.25;
  pulseAmt=pulseAmt*pulseAmt*(3-2*pulseAmt);
  const pulseColor=PULSE_COLORS[pulseIdx];

  const shaderT=t*(0.4+S*0.6);
  [coreSphere,...orbitRings.children].forEach(obj=>{
    obj.material.uniforms.time.value=shaderT;
    obj.material.uniforms.uMouse.value.copy(mouse);
    obj.material.uniforms.uExplode.value=explodeVal;
    obj.material.uniforms.uClick.value=clickVal;
    obj.material.uniforms.uPulseColor.value.copy(pulseColor);
    obj.material.uniforms.uPulseAmt.value=pulseAmt;
  });

  if(!window._orbScale)   window._orbScale=1.0;
  if(!window._orbOffsetY) window._orbOffsetY=25.0;

  const orbSt = window._orbState || { hoverBoost: 1.0, morphOpen: false };
  const targetScale    = orbSt.morphOpen ? 0.65 : 1.0;
  const targetOffsetY  = orbSt.morphOpen ? -8.0 : 25.0;
  const stateSpeedMult = orbSt.morphOpen ? 0.25 : orbSt.hoverBoost;
  const stateBloomTarget = themes[currentTheme]?.bloom.strength ?? themes['darkspace'].bloom.strength;

  window._orbScale  += (targetScale  - window._orbScale)  * 0.055;
  window._orbOffsetY+= (targetOffsetY- window._orbOffsetY) * 0.055;

  mainGroup.scale.setScalar(window._orbScale);
  mainGroup.position.y+=(window._orbOffsetY-mainGroup.position.y)*0.055;

  const effectiveS=S*stateSpeedMult;
  orbitRings.children.forEach((ring,i)=>{
    const spd=0.00045*(i+1)*effectiveS;
    ring.rotation.z+=spd; ring.rotation.x+=spd*0.28; ring.rotation.y+=spd*0.18;
  });
  mainGroup.rotation.y+=0.0004*effectiveS;

  bloomPass.strength+=(stateBloomTarget-bloomPass.strength)*0.05;
  bloomPass.radius=themes[currentTheme]?themes[currentTheme].bloom.radius:0.08;

  controls.update();
  composer.render();
}

function onResize(){
  const W=window.innerWidth, H=window.innerHeight;
  camera.aspect=W/H; camera.updateProjectionMatrix();
  renderer.setSize(W,H); composer.setSize(W,H);
  renderer.setClearColor(W < 600 ? 0x050505 : 0xeeede8, 1);
}

function onMouseMove(e){
  mouse.x=(e.clientX/innerWidth)*2-1;
  mouse.y=-(e.clientY/innerHeight)*2+1;
}

if(document.readyState==='complete') setTimeout(()=>{ init(); animate(); },0);
else window.addEventListener('load',()=>{ init(); animate(); });
