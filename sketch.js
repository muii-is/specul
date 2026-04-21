// ─── DATA ────────────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: 'world',
    title: '이 세계가\n낯선가요?',
    subtitle: 'A world where individuality is exile.',
    bg:      [240, 237, 230],
    accent:  [26,  26,  26],
    sub:     [130, 125, 118],
    barBg:   [240, 237, 230],
  },
  {
    id: 'aq',
    title: 'AQ\nCLINIC',
    subtitle: 'Upgrade your taste. Earn your place.',
    bg:      [237, 232, 245],   // 라벤더
    accent:  [90,  60, 140],
    sub:     [140, 110, 180],
    barBg:   [230, 224, 242],
    tagline: 'AQ 91.5  ━  AESTHETIC QUOTIENT',
    tagColor:[140, 110, 180],
  },
  {
    id: 'still',
    title: 'STILL',
    subtitle: 'When emotions leak, the mask deploys.',
    bg:      [36,  38,  42],    // 딥 다크
    accent:  [210, 210, 215],
    sub:     [120, 120, 128],
    barBg:   [36,  38,  42],
    tagline: 'SILENCE IS COMPLIANCE',
    tagColor:[90,  92,  98],
  },
  {
    id: 'luster',
    title: 'PROJECT\nLUSTER',
    subtitle: 'The perfect polished head, at home.',
    bg:      [245, 244, 240],   // 웜 화이트
    accent:  [60,  60,  60],
    sub:     [140, 136, 130],
    barBg:   [238, 236, 230],
    tagline: 'Model: S-AI Pro 1.0',
    tagColor:[160, 156, 148],
  },
  {
    id: 'silhouette',
    title: 'SILHOUETTE™',
    subtitle: 'Because not everything needs to be said.',
    bg:      [240, 228, 222],   // 블러쉬 핑크
    accent:  [100,  50,  60],
    sub:     [170,  110, 115],
    barBg:   [235, 220, 214],
    tagline: 'SPEAK LESS.  BE MORE.',
    tagColor:[170, 110, 115],
  },
];

const REACTIONS = [
  { id: 'need',      kr: '나라면 필요해',  en: 'I need this',     color: '#FF3366', shape: 'star6'     },
  { id: 'future',    kr: '너무 미래적',   en: 'Too futuristic',  color: '#00BBFF', shape: 'burst'     },
  { id: 'real',      kr: '너무 현실적',   en: 'Too real',        color: '#FF6B00', shape: 'hourglass' },
  { id: 'relate',    kr: '공감돼',        en: 'I feel this',     color: '#9B59B6', shape: 'infinity'  },
  { id: 'norelate',  kr: '공감 안 돼',   en: 'Not for me',      color: '#2ECC71', shape: 'xmark'     },
  { id: 'unsettled', kr: '불편해',        en: 'Unsettling',      color: '#E74C3C', shape: 'eye'       },
];

const state = {
  currentSection: 0,
  votes: {},
  userVotes: {},
  floaters: [],
  hoveredBtn:   -1,
  hoveredNav:   -1,
  hoveredArrow: '',
};

SECTIONS.forEach(s => {
  state.votes[s.id]    = {};
  state.userVotes[s.id] = null;
  REACTIONS.forEach(r => { state.votes[s.id][r.id] = 0; });
});

// ─── FONT ────────────────────────────────────────────────────────────────────

function preload() {
  const link = document.createElement('link');
  link.rel  = 'stylesheet';
  link.href = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css';
  document.head.appendChild(link);
}

// ─── LAYOUT HELPERS ──────────────────────────────────────────────────────────

const NAV_H = 50;

function isMobile() { return width < 600; }

function getBtnZone() {
  const mobile  = isMobile();
  const btnR    = mobile ? 22 : 28;
  const spacing = mobile
    ? min(52, (width - 24) / REACTIONS.length)
    : min(88, (width - 60) / REACTIONS.length);
  const totalW  = (REACTIONS.length - 1) * spacing;
  const barH    = mobile ? 110 : 128;
  return {
    startX: (width - totalW) / 2,
    y:      height - (mobile ? 58 : 68),
    spacing, btnR, barH,
  };
}

function getNavTabs() {
  const labels  = ['WORLD', 'AQ', 'STILL', 'LUSTER', 'SILHOUETTE'];
  const mobile  = isMobile();
  const tabW    = mobile ? 58 : 78;
  const tabH    = mobile ? 22 : 26;
  const gap     = mobile ? 4  : 5;
  const totalW  = SECTIONS.length * tabW + (SECTIONS.length - 1) * gap;
  const startX  = (width - totalW) / 2;
  return SECTIONS.map((s, i) => ({
    x: startX + i*(tabW+gap), y: mobile ? 13 : 12,
    w: tabW, h: tabH, i, label: labels[i],
  }));
}

function sec() { return SECTIONS[state.currentSection]; }

// ─── SETUP / DRAW ────────────────────────────────────────────────────────────

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(60);
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }

function draw() {
  const s = sec();
  background(...s.bg);
  drawGrid();
  drawFloaters();
  drawTitleBlock(s);
  drawButtonBar(s);
  drawNavBar(s);
  drawArrows(s);
  drawDots(s);
}

// ─── GRID ─────────────────────────────────────────────────────────────────────

function drawGrid() {
  const s = sec();
  // dark section → lighter grid lines
  const alpha = s.id === 'still' ? 18 : 38;
  stroke(s.id === 'still' ? 255 : 0, s.id === 'still' ? 255 : 0,
         s.id === 'still' ? 255 : 0, alpha);
  strokeWeight(0.5);
  for (let x = 0; x < width;  x += 48) line(x, 0, x, height);
  for (let y = 0; y < height; y += 48) line(0, y, width, y);
}

// ─── NAV BAR ─────────────────────────────────────────────────────────────────

function drawNavBar(s) {
  noStroke(); fill(...s.barBg, 230);
  rect(0, 0, width, NAV_H);

  // 하단 구분선
  const lineCol = s.id === 'still' ? [80,80,85,120] : [200,195,188,120];
  stroke(...lineCol); strokeWeight(0.5);
  line(0, NAV_H, width, NAV_H);

  // 로고
  noStroke(); fill(...s.accent);
  textFont('Pretendard, sans-serif');
  textSize(isMobile() ? 10 : 12); textStyle(BOLD); textAlign(LEFT, CENTER);
  text('SPECUL ✦', isMobile() ? 12 : 24, NAV_H / 2);

  // 탭
  const tabs = getNavTabs();
  tabs.forEach(t => {
    const active  = t.i === state.currentSection;
    const hov     = t.i === state.hoveredNav;
    noStroke();
    if (active)       fill(...s.accent);
    else if (hov)     fill(...s.accent, 28);
    else              fill(0, 0, 0, 0);
    rect(t.x, t.y, t.w, t.h, 2);

    const [ar, ag, ab] = s.accent;
    const [br, bg_, bb] = s.barBg;
    fill(active ? br : ar, active ? bg_ : ag, active ? bb : ab);
    textFont('Pretendard, sans-serif');
    textSize(isMobile() ? 7 : 8); textStyle(BOLD); textAlign(CENTER, CENTER);
    text(t.label, t.x + t.w/2, t.y + t.h/2);

    noFill(); stroke(...s.accent, active ? 255 : 70); strokeWeight(1.2);
    rect(t.x, t.y, t.w, t.h, 2);
  });

  // 리액션 수
  const total = Object.values(state.votes[s.id]).reduce((a,b)=>a+b,0);
  noStroke(); fill(...s.sub);
  textFont('Pretendard, sans-serif');
  textSize(isMobile() ? 8 : 10); textStyle(NORMAL); textAlign(RIGHT, CENTER);
  text(total + ' reactions', width - (isMobile() ? 12 : 24), NAV_H/2);
}

// ─── ARROWS ──────────────────────────────────────────────────────────────────

function drawArrows(s) {
  const cy = height - (isMobile() ? 130 : 155);
  const i  = state.currentSection;
  const sz = isMobile() ? 32 : 38;

  [[i>0, 'prev', 28], [i<SECTIONS.length-1, 'next', width-28]].forEach(([show, dir, cx]) => {
    if (!show) return;
    const hov = state.hoveredArrow === dir;
    noStroke();
    if (hov) fill(...s.accent);
    else     fill(...s.barBg, 195);
    ellipse(cx, cy, sz, sz);
    stroke(...s.accent, hov ? 255 : 70); strokeWeight(1.2); noFill();
    ellipse(cx, cy, sz, sz);
    noStroke();
    const [ar,ag,ab] = s.accent; const [br,bg_,bb] = s.barBg;
    fill(hov ? br : ar, hov ? bg_ : ag, hov ? bb : ab);
    textFont('Pretendard, sans-serif');
    textSize(isMobile() ? 12 : 15); textAlign(CENTER, CENTER);
    text(dir==='prev' ? '←' : '→', cx, cy+1);
  });
}

// ─── DOTS ────────────────────────────────────────────────────────────────────

function drawDots(s) {
  const y      = height - (isMobile() ? 122 : 148);
  const dotGap = 14;
  const startX = (width - (SECTIONS.length-1)*dotGap) / 2;
  const labels = ['WORLD','AQ CLINIC','STILL','LUSTER','SILHOUETTE'];

  for (let i = 0; i < SECTIONS.length; i++) {
    const active = i === state.currentSection;
    noStroke();
    const c = color(...s.accent); c.setAlpha(active ? 255 : 55);
    fill(c);
    ellipse(startX + i*dotGap, y, active ? 8 : 5, active ? 8 : 5);
  }

  fill(...s.sub); noStroke();
  textFont('Pretendard, sans-serif');
  textSize(isMobile() ? 7 : 8); textStyle(BOLD); textAlign(CENTER, BASELINE);
  text(labels[state.currentSection], width/2, y-10);
}

// ─── TITLE BLOCK ─────────────────────────────────────────────────────────────

function drawTitleBlock(s) {
  const PAD = isMobile() ? 18 : 36;
  const tx  = PAD + (isMobile() ? 8 : 20);
  const ty  = NAV_H + PAD + (isMobile() ? 8 : 10);

  if      (s.id === 'silhouette') { drawSilhouetteHero(s, tx, ty); return; }
  else if (s.id === 'still')      { drawStillHero(s, tx, ty);      return; }
  else if (s.id === 'aq')         { drawAQHero(s, tx, ty);         return; }
  else if (s.id === 'luster')     { drawLusterHero(s, tx, ty);     return; }

  // WORLD — 기본
  drawDefaultHero(s, tx, ty);
}

// ── WORLD ────────────────────────────────────────────────────────────────────
function drawDefaultHero(s, tx, ty) {
  // 장식 버스트
  push();
  translate(width - (isMobile()?44:72), NAV_H + (isMobile()?30:46));
  noFill(); stroke(...s.sub, 40); strokeWeight(0.8);
  for (let a=0; a<TWO_PI; a+=TWO_PI/8) line(0,0,cos(a)*36,sin(a)*36);
  ellipse(0,0,16,16);
  pop();

  const fs = isMobile() ? 32 : 44;
  noStroke(); fill(...s.accent);
  textFont('Pretendard, sans-serif'); textSize(fs); textStyle(BOLD); textAlign(LEFT,TOP);
  s.title.split('\n').forEach((ln,i) => text(ln, tx, ty + i*(fs+4)));
  const lc = s.title.split('\n').length;
  fill(...s.sub); textSize(isMobile()?11:13); textStyle(NORMAL);
  text(s.subtitle, tx, ty + lc*(fs+4) + 10);
  stroke(...s.accent); strokeWeight(1.5);
  line(tx, ty+lc*(fs+4)+28, tx+140, ty+lc*(fs+4)+28);
}

// ── AQ CLINIC ────────────────────────────────────────────────────────────────
function drawAQHero(s, tx, ty) {
  // 라벤더 카드
  noStroke(); fill(200, 188, 225, 60);
  rect(tx-8, ty-8, width-tx*2+16, isMobile()?108:118, 6);

  const fs = isMobile() ? 28 : 40;
  noStroke(); fill(...s.accent);
  textFont('Pretendard, sans-serif'); textSize(fs); textStyle(BOLD); textAlign(LEFT,TOP);
  s.title.split('\n').forEach((ln,i) => text(ln, tx, ty + i*(fs+4)));
  const lc = s.title.split('\n').length;

  fill(...s.sub); textSize(isMobile()?10:12); textStyle(NORMAL);
  text(s.subtitle, tx, ty + lc*(fs+4) + 10);

  // AQ 점수 태그
  const tagY = ty + lc*(fs+4) + 28;
  noStroke(); fill(200, 188, 225, 100);
  rect(tx, tagY, isMobile()?160:200, 20, 3);
  fill(...s.tagColor); textSize(9); textStyle(BOLD); textAlign(LEFT, CENTER);
  text(s.tagline, tx+8, tagY+10);

  // 오른쪽 장식 — 펜 심볼 느낌
  push();
  translate(width-(isMobile()?50:90), ty+(isMobile()?30:45));
  const ps = isMobile() ? 18 : 28;
  fill(180, 160, 210, 160); noStroke();
  rect(-ps*0.18, -ps, ps*0.36, ps*2, ps*0.18); // 펜 몸통
  fill(140, 110, 180, 200);
  triangle(-ps*0.18, ps*0.6, ps*0.18, ps*0.6, 0, ps*1.1); // 펜 팁
  fill(160, 200, 190, 180);
  rect(-ps*0.18, -ps, ps*0.36, ps*0.4, ps*0.1); // 민트 그립
  pop();
}

// ── STILL ─────────────────────────────────────────────────────────────────────
function drawStillHero(s, tx, ty) {
  // 어두운 카드
  noStroke(); fill(50, 52, 58, 120);
  rect(tx-8, ty-8, width-tx*2+16, isMobile()?108:118, 6);

  const fs = isMobile() ? 32 : 46;
  noStroke(); fill(...s.accent);
  textFont('Pretendard, sans-serif'); textSize(fs); textStyle(BOLD); textAlign(LEFT,TOP);
  text('STILL', tx, ty);

  fill(...s.sub); textSize(isMobile()?10:12); textStyle(NORMAL);
  text(s.subtitle, tx, ty + fs + 10);

  // 차가운 수평선
  stroke(...s.sub, 60); strokeWeight(0.8);
  line(tx, ty+fs+28, tx+180, ty+fs+28);

  // 태그라인
  noStroke(); fill(...s.tagColor);
  textSize(9); textStyle(BOLD); textAlign(LEFT, TOP);
  text(s.tagline, tx, ty+fs+36);

  // 안경 실루엣 (오른쪽)
  push();
  translate(width-(isMobile()?52:95), ty+(isMobile()?32:48));
  const gs = isMobile() ? 18 : 30;
  noFill(); stroke(160, 160, 168, 140); strokeWeight(1.5);
  ellipse(-gs*0.7, 0, gs*1.1, gs*0.8);
  ellipse( gs*0.7, 0, gs*1.1, gs*0.8);
  line(-gs*1.25, 0, -gs*1.25, -gs*0.5); // 왼쪽 다리
  line( gs*1.25, 0,  gs*1.25, -gs*0.5);
  line(-gs*0.15, 0,  gs*0.15, 0);        // 코받침
  pop();
}

// ── LUSTER ───────────────────────────────────────────────────────────────────
function drawLusterHero(s, tx, ty) {
  // 실버 카드
  noStroke(); fill(200, 198, 192, 70);
  rect(tx-8, ty-8, width-tx*2+16, isMobile()?108:118, 6);

  const fs = isMobile() ? 26 : 38;
  noStroke(); fill(...s.accent);
  textFont('Pretendard, sans-serif'); textSize(fs); textStyle(BOLD); textAlign(LEFT,TOP);
  s.title.split('\n').forEach((ln,i) => text(ln, tx, ty + i*(fs+4)));
  const lc = s.title.split('\n').length;

  fill(...s.sub); textSize(isMobile()?10:12); textStyle(NORMAL);
  text(s.subtitle, tx, ty + lc*(fs+4) + 10);

  // 모델 태그
  noStroke(); fill(185, 183, 175, 120);
  rect(tx, ty+lc*(fs+4)+26, isMobile()?120:150, 18, 2);
  fill(...s.tagColor); textSize(8); textStyle(BOLD); textAlign(LEFT, CENTER);
  text(s.tagline, tx+8, ty+lc*(fs+4)+35);

  // 기계 다이얼 느낌 (오른쪽)
  push();
  translate(width-(isMobile()?50:90), ty+(isMobile()?32:46));
  const ds = isMobile() ? 18 : 28;
  noFill(); stroke(160, 158, 150, 150); strokeWeight(1.5);
  ellipse(0, 0, ds*2, ds*2);
  ellipse(0, 0, ds*1.2, ds*1.2);
  fill(170, 168, 160, 130); noStroke();
  ellipse(0, 0, ds*0.5, ds*0.5);
  // 다이얼 눈금
  stroke(160, 158, 150, 100); strokeWeight(1);
  for (let a=0; a<TWO_PI; a+=TWO_PI/8) {
    const r1=ds*0.65, r2=ds*0.9;
    line(cos(a)*r1, sin(a)*r1, cos(a)*r2, sin(a)*r2);
  }
  pop();
}

// ── SILHOUETTE ───────────────────────────────────────────────────────────────
function drawSilhouetteHero(s, tx, ty) {
  noStroke(); fill(210, 175, 165, 65);
  rect(tx-8, ty-8, width-tx*2+16, isMobile()?108:112, 6);

  textAlign(LEFT,TOP); textFont('Pretendard, sans-serif');
  fill(180, 100, 110); textStyle(BOLD);
  textSize(isMobile()?38:54);
  text('SILHOUETTE™', tx+4, ty+4);

  const tH = isMobile()?38:54;
  const dY = ty+tH+18;
  fill(180,100,110,130);
  push(); translate(tx+24,dY); rotate(PI/4); rect(-4,-4,8,8); pop();
  stroke(180,100,110,70); strokeWeight(0.8);
  line(tx+4,dY,tx+16,dY); line(tx+32,dY,tx+84,dY);

  noStroke(); fill(...s.sub);
  textSize(11); textStyle(NORMAL); textLeading(16);
  text('Designed to soften interruption,\nreduce unnecessary expression.', tx+4, dY+10);
  fill(...s.tagColor); textSize(10); textStyle(BOLD);
  text(s.tagline, tx+4, dY+46);

  push();
  translate(width-(isMobile()?65:105), ty+(isMobile()?30:44));
  drawLipLock(isMobile()?28:42);
  pop();
}

function drawLipLock(s) {
  fill(210,170,160,185); noStroke();
  beginShape();
  vertex(-s,0);
  bezierVertex(-s*.6,-s*.55,-s*.2,-s*.75,0,-s*.55);
  bezierVertex(s*.2,-s*.75,s*.6,-s*.55,s,0);
  bezierVertex(s*.6,s*.7,-s*.6,s*.7,-s,0);
  endShape(CLOSE);
  stroke(180,130,120,155); strokeWeight(1.2); noFill();
  beginShape(); vertex(-s*.5,0);
  bezierVertex(-s*.25,-s*.18,s*.25,-s*.18,s*.5,0); endShape();
  stroke(180,140,120,195); strokeWeight(2);
  line(-s*.78,0,-s*.22,0); line(s*.22,0,s*.78,0);
  noStroke(); fill(190,150,130,215);
  ellipse(0,0,s*.3,s*.3);
  fill(155,105,95);
  ellipse(0,-s*.04,s*.1,s*.1);
  rect(-s*.04,-s*.01,s*.08,s*.12,1);
}

// ─── BUTTON BAR ──────────────────────────────────────────────────────────────

function drawButtonBar(s) {
  const sId  = s.id;
  const zone = getBtnZone();
  const mob  = isMobile();

  noStroke(); fill(...s.barBg, 218);
  rect(0, height-zone.barH, width, zone.barH);
  const lc = s.id==='still' ? [80,80,85,150] : [200,195,188,150];
  stroke(...lc); strokeWeight(0.8);
  line(0, height-zone.barH, width, height-zone.barH);

  for (let i=0; i<REACTIONS.length; i++) {
    const r     = REACTIONS[i];
    const x     = zone.startX + i*zone.spacing;
    const y     = zone.y;
    const voted = state.userVotes[sId] === r.id;
    const hov   = state.hoveredBtn === i;
    const count = state.votes[sId][r.id];

    if (hov || voted) {
      noStroke();
      const gc = color(r.color); gc.setAlpha(voted?48:22);
      fill(gc); ellipse(x, y, zone.btnR*3, zone.btnR*3);
    }

    push(); translate(x, y);
    const c = color(r.color); c.setAlpha(voted?255:hov?210:145);
    fill(c); noStroke();
    const sz = voted?zone.btnR*.80:hov?zone.btnR*.70:zone.btnR*.58;
    drawSymbol(r.shape, sz);
    pop();

    if (voted) { fill(r.color); noStroke(); ellipse(x, y-zone.btnR*.92, 5, 5); }

    noStroke();
    fill(voted ? color(r.color) : color(...s.accent, 180));
    textFont('Pretendard, sans-serif');
    textSize(mob?8:10); textStyle(voted?BOLD:NORMAL); textAlign(CENTER,TOP);
    text(r.kr, x, y+zone.btnR*.82);

    fill(voted ? color(r.color) : color(...s.sub));
    textSize(mob?7:8); textStyle(NORMAL);
    text(r.en, x, y+zone.btnR*.82+(mob?12:14));

    if (count>0) {
      fill(voted ? color(r.color) : color(...s.sub));
      textSize(mob?8:9); textStyle(BOLD);
      text(count, x, y+zone.btnR*.82+(mob?24:27));
    }
  }
}

// ─── FLOATERS ────────────────────────────────────────────────────────────────

function spawnFloater(ri, fx, fy) {
  const r   = REACTIONS[ri];
  const sId = SECTIONS[state.currentSection].id;
  state.floaters.push({
    sectionId: sId, shape: r.shape, color: r.color,
    x:fx, y:fy,
    vx:random(-0.55,0.55), vy:random(-1.0,-0.15),
    size:random(18,40), angle:random(TWO_PI),
    spin:random(-0.006,0.006),
    alpha:0, fadeIn:true,
    woff:random(1000), wamp:random(0.15,0.45),
  });
}

function drawFloaters() {
  const sId    = SECTIONS[state.currentSection].id;
  const zone   = getBtnZone();
  const floorY = height - zone.barH - 2;

  for (const f of state.floaters) {
    if (f.sectionId !== sId) continue;
    f.woff += 0.010;
    f.vx   += sin(f.woff)*f.wamp*0.010;
    f.vy   += cos(f.woff*0.65)*f.wamp*0.007;
    f.vx    = constrain(f.vx,-1.2,1.2);
    f.vy    = constrain(f.vy,-1.3,1.3);
    f.x    += f.vx; f.y += f.vy;
    f.angle += f.spin;

    if (f.x < f.size)         { f.x=f.size;         f.vx*=-1; }
    if (f.x > width-f.size)   { f.x=width-f.size;   f.vx*=-1; }
    if (f.y < f.size+NAV_H)   { f.y=f.size+NAV_H;   f.vy*=-1; }
    if (f.y > floorY-f.size)  { f.y=floorY-f.size;  f.vy*=-1; }

    if (f.fadeIn) {
      f.alpha = min(f.alpha+7, 175);
      if (f.alpha>=175) f.fadeIn=false;
    }

    push();
    translate(f.x,f.y); rotate(f.angle);
    const c=color(f.color); c.setAlpha(f.alpha);
    fill(c); noStroke();
    drawSymbol(f.shape, f.size);
    pop();
  }
}

// ─── SYMBOLS ─────────────────────────────────────────────────────────────────

function drawSymbol(shape,s) {
  noStroke();
  if      (shape==='star6')     drawStar6(s);
  else if (shape==='burst')     drawBurst(s);
  else if (shape==='hourglass') drawHourglass(s);
  else if (shape==='infinity')  drawInfinity(s);
  else if (shape==='xmark')     drawXmark(s);
  else if (shape==='eye')       drawEye(s);
}

function drawStar6(s) {
  beginShape();
  for (let i=0;i<6;i++) {
    const a=(i/6)*TWO_PI-HALF_PI, b=a+TWO_PI/12;
    vertex(cos(a)*s,sin(a)*s); vertex(cos(b)*s*.38,sin(b)*s*.38);
  }
  endShape(CLOSE);
}
function drawBurst(s) {
  push();
  for (let i=0;i<8;i++) {
    push(); rotate((i/8)*TWO_PI);
    beginShape(); vertex(0,-s*.9); vertex(s*.13,-s*.37); vertex(-s*.13,-s*.37);
    endShape(CLOSE); pop();
  }
  ellipse(0,0,s*.6,s*.6); pop();
}
function drawHourglass(s) {
  beginShape();
  vertex(-s*.55,-s); vertex(s*.55,-s); vertex(s*.12,0);
  vertex(s*.55,s);   vertex(-s*.55,s); vertex(-s*.12,0);
  endShape(CLOSE);
}
function drawInfinity(s) {
  ellipse(-s*.42,0,s*.78,s*.52); ellipse(s*.42,0,s*.78,s*.52);
}
function drawXmark(s) {
  const t=s*.22;
  beginShape();
  vertex(-s,-s+t); vertex(-s+t,-s); vertex(0,-t);
  vertex(s-t,-s);  vertex(s,-s+t);  vertex(t,0);
  vertex(s,s-t);   vertex(s-t,s);   vertex(0,t);
  vertex(-s+t,s);  vertex(-s,s-t);  vertex(-t,0);
  endShape(CLOSE);
}
function drawEye(s) {
  beginShape();
  vertex(-s,0);
  bezierVertex(-s*.5,-s*.7,s*.5,-s*.7,s,0);
  bezierVertex(s*.5,s*.7,-s*.5,s*.7,-s,0);
  endShape(CLOSE);
  const bg = sec().bg;
  fill(...bg); ellipse(0,0,s*.6,s*.6);
}

// ─── MOUSE / TOUCH ───────────────────────────────────────────────────────────

function mouseMoved() {
  const zone = getBtnZone();
  const tabs = getNavTabs();
  const cy   = height - (isMobile()?130:155);
  const i    = state.currentSection;

  let foundBtn=-1;
  for (let j=0;j<REACTIONS.length;j++) {
    if (dist(mouseX,mouseY,zone.startX+j*zone.spacing,zone.y) < zone.btnR+10) { foundBtn=j; break; }
  }
  state.hoveredBtn = foundBtn;

  let foundNav=-1;
  for (const t of tabs) {
    if (mouseX>=t.x&&mouseX<=t.x+t.w&&mouseY>=t.y&&mouseY<=t.y+t.h) { foundNav=t.i; break; }
  }
  state.hoveredNav = foundNav;

  if      (i>0 && dist(mouseX,mouseY,28,cy)<20)                       state.hoveredArrow='prev';
  else if (i<SECTIONS.length-1 && dist(mouseX,mouseY,width-28,cy)<20) state.hoveredArrow='next';
  else                                                                   state.hoveredArrow='';

  document.body.style.cursor =
    (foundBtn>=0||foundNav>=0||state.hoveredArrow!=='') ? 'pointer':'default';
}

function mousePressed() {
  const sId  = SECTIONS[state.currentSection].id;
  const zone = getBtnZone();
  const tabs = getNavTabs();
  const cy   = height-(isMobile()?130:155);
  const i    = state.currentSection;

  if (i>0 && dist(mouseX,mouseY,28,cy)<20)                       { state.currentSection--; return false; }
  if (i<SECTIONS.length-1&&dist(mouseX,mouseY,width-28,cy)<20)   { state.currentSection++; return false; }

  for (const t of tabs) {
    if (mouseX>=t.x&&mouseX<=t.x+t.w&&mouseY>=t.y&&mouseY<=t.y+t.h) { state.currentSection=t.i; return false; }
  }

  for (let j=0;j<REACTIONS.length;j++) {
    const bx=zone.startX+j*zone.spacing;
    if (dist(mouseX,mouseY,bx,zone.y)<zone.btnR+10) {
      const r=REACTIONS[j], prev=state.userVotes[sId];
      if (prev===r.id) {
        state.votes[sId][r.id]=max(0,state.votes[sId][r.id]-1);
        state.userVotes[sId]=null;
      } else {
        if (prev) state.votes[sId][prev]=max(0,state.votes[sId][prev]-1);
        state.votes[sId][r.id]++;
        state.userVotes[sId]=r.id;
        for (let k=0;k<4;k++) spawnFloater(j, bx+random(-20,20), zone.y+random(-24,-4));
      }
      return false;
    }
  }
}

function keyPressed() {
  if (keyCode===RIGHT_ARROW&&state.currentSection<SECTIONS.length-1) state.currentSection++;
  if (keyCode===LEFT_ARROW &&state.currentSection>0)                 state.currentSection--;
}

function touchStarted() { mousePressed(); return false; }
