// ─── DATA ────────────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: 'world',
    title: '이 세계가\n낯선가요?',
    subtitle: 'A world where individuality is exile.',
    bg: [240,237,230], accent: [26,26,26], sub: [130,125,118], barBg: [240,237,230],
  },
  {
    id: 'silhouette',
    title: 'SILHOUETTE™',
    subtitle: 'Because not everything needs to be said.',
    bg: [240,228,222], accent: [100,50,60], sub: [170,110,115], barBg: [235,220,214],
    tagline: 'SPEAK LESS.  BE MORE.', tagColor: [170,110,115],
    reactionOverride: { need: { kr: '나라면 살 거 같다', en: 'I want this' } },
  },
  {
    id: 'luster',
    title: 'PROJECT\nLUSTER',
    subtitle: 'The perfect polished head, at home.',
    bg: [245,244,240], accent: [60,60,60], sub: [140,136,130], barBg: [238,236,230],
    tagline: 'Model: S-AI Pro 1.0', tagColor: [160,156,148],
    reactionOverride: { need: { kr: '나라면 살 거 같다', en: 'I want this' } },
  },
  {
    id: 'still',
    title: 'STILL',
    subtitle: 'When emotions leak, the mask deploys.',
    bg: [36,38,42], accent: [210,210,215], sub: [120,120,128], barBg: [36,38,42],
    tagline: 'SILENCE IS COMPLIANCE', tagColor: [90,92,98],
    reactionOverride: { need: { kr: '나라면 살 거 같다', en: 'I want this' } },
  },
  {
    id: 'aq',
    title: 'AQ\nCLINIC',
    subtitle: 'Upgrade your taste. Earn your place.',
    bg: [237,232,245], accent: [90,60,140], sub: [140,110,180], barBg: [230,224,242],
    tagline: 'AQ 91.5  ━  AESTHETIC QUOTIENT', tagColor: [140,110,180],
    reactionOverride: { need: { kr: '나라면 살 거 같다', en: 'I want this' } },
  },
  {
    id: 'result',
    title: '참여해주셔서\n감사합니다',
    subtitle: 'Thank you for your reactions.',
    bg: [240,237,230], accent: [26,26,26], sub: [130,125,118], barBg: [240,237,230],
  },
];

const REACTIONS = [
  { id: 'need',      kr: '있을 수 있을 거 같다',  en: 'This could happen',    color: '#FF3366', shape: 'star6'     },
  { id: 'future',    kr: '너무 미래적',   en: 'Too futuristic', color: '#00BBFF', shape: 'burst'     },
  { id: 'real',      kr: '너무 현실적',   en: 'Too real',       color: '#FF6B00', shape: 'hourglass' },
  { id: 'relate',    kr: '공감돼',        en: 'I feel this',    color: '#9B59B6', shape: 'infinity'  },
  { id: 'norelate',  kr: '공감 안 돼',   en: 'Not for me',     color: '#2ECC71', shape: 'xmark'     },
  { id: 'unsettled', kr: '불편해',        en: 'Unsettling',     color: '#E74C3C', shape: 'eye'       },
];

// 실제 섹션 (result 제외)
const VOTE_SECTIONS = SECTIONS.filter(s => s.id !== 'result');

const state = {
  currentSection: 0,
  votes: {},        // 실시간 Firebase에서 받아온 전체 투표
  userVotes: {},    // 이 기기에서 누른 투표
  floaters: [],
  hoveredBtn: -1,
  hoveredNav: -1,
  hoveredArrow: '',
  fbReady: false,
  resetBtn: {x:0, y:0, w:130, h:32}, // 초기값
};

SECTIONS.forEach(s => {
  state.votes[s.id] = {};
  state.userVotes[s.id] = new Set(); // 다중 선택 — Set으로 관리
  REACTIONS.forEach(r => { state.votes[s.id][r.id] = 0; });
});

// ─── FIREBASE 실시간 연동 ─────────────────────────────────────────────────────

function initFirebase() {
  if (typeof db === 'undefined') return;

  // 전체 votes 실시간 구독
  db.ref('votes').on('value', snapshot => {
    const data = snapshot.val();
    if (!data) { state.fbReady = true; return; }
    VOTE_SECTIONS.forEach(s => {
      if (data[s.id]) {
        REACTIONS.forEach(r => {
          state.votes[s.id][r.id] = data[s.id][r.id] || 0;
        });
      }
    });
    state.fbReady = true;
  });

  // 다른 사람 floater 실시간 구독
  db.ref('floaters').limitToLast(200).on('child_added', snapshot => {
    const f = snapshot.val();
    if (!f) return;
    state.floaters.push({
      sectionId: f.sectionId,
      shape: f.shape,
      color: f.color,
      x: f.x, y: f.y,
      vx: random(-0.55, 0.55),
      vy: random(-1.0, -0.15),
      size: f.size,
      angle: random(TWO_PI),
      spin: random(-0.006, 0.006),
      alpha: 0, fadeIn: true,
      woff: random(1000), wamp: random(0.15, 0.45),
    });
  });
}

function firebaseVote(sId, rId, delta) {
  if (typeof db === 'undefined') return;
  db.ref(`votes/${sId}/${rId}`).transaction(cur => (cur || 0) + delta);
}

function firebaseSpawnFloater(sId, shape, color, x, y, size) {
  if (typeof db === 'undefined') return;
  db.ref('floaters').push({ sectionId: sId, shape, color, x, y, size });
}

// ─── LAYOUT ──────────────────────────────────────────────────────────────────

const NAV_H = 50;
function isMobile() { return width < 600; }

function getBtnZone() {
  const mob     = isMobile();
  const btnR    = mob ? 22 : 28;
  const spacing = mob ? min(52,(width-24)/REACTIONS.length) : min(88,(width-60)/REACTIONS.length);
  const barH    = mob ? 110 : 128;
  return {
    startX: (width - (REACTIONS.length-1)*spacing) / 2,
    y: height - (mob ? 58 : 68),
    spacing, btnR, barH,
  };
}

function getNavTabs() {
  const labels = ['WORLD','SILHOUETTE','LUSTER','STILL','AQ','RESULT'];
  const mob = isMobile();
  const tabW = mob ? 50 : 72, tabH = mob ? 20 : 24, gap = mob ? 3 : 4;
  const totalW = SECTIONS.length * tabW + (SECTIONS.length-1) * gap;
  return SECTIONS.map((s,i) => ({
    x: (width-totalW)/2 + i*(tabW+gap), y: mob ? 14 : 13,
    w: tabW, h: tabH, i, label: labels[i],
  }));
}

function sec() { return SECTIONS[state.currentSection]; }

// ─── SETUP ───────────────────────────────────────────────────────────────────

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(60);
  initFirebase();
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }

// ─── DRAW ────────────────────────────────────────────────────────────────────

function draw() {
  const s = sec();
  background(...s.bg);
  drawGrid();

  if (s.id === 'result') {
    drawResultPage(s);
  } else {
    drawFloaters();
    drawTitleBlock(s);
    drawButtonBar(s);
  }

  drawNavBar(s);
  drawArrows(s);
  drawDots(s);
}

// ─── GRID ─────────────────────────────────────────────────────────────────────

function drawGrid() {
  const s = sec();
  const dark = s.id === 'still';
  stroke(dark?255:0, dark?255:0, dark?255:0, dark?14:32);
  strokeWeight(0.5);
  for (let x=0;x<width; x+=48) line(x,0,x,height);
  for (let y=0;y<height;y+=48) line(0,y,width,y);
}

// ─── NAV BAR ─────────────────────────────────────────────────────────────────

function drawNavBar(s) {
  noStroke(); fill(...s.barBg, 228); rect(0,0,width,NAV_H);
  const lc = s.id==='still' ? [80,80,85,110] : [200,195,188,110];
  stroke(...lc); strokeWeight(0.5); line(0,NAV_H,width,NAV_H);

  noStroke(); fill(...s.accent);
  textFont('Pretendard, sans-serif');
  textSize(isMobile()?9:11); textStyle(BOLD); textAlign(LEFT,CENTER);
  text('SPECUL ✦', isMobile()?12:20, NAV_H/2);

  const tabs = getNavTabs();
  tabs.forEach(t => {
    const active = t.i === state.currentSection;
    const hov    = t.i === state.hoveredNav;
    noStroke();
    if (active)      fill(...s.accent);
    else if (hov)    fill(...s.accent, 25);
    else             fill(0,0,0,0);
    rect(t.x,t.y,t.w,t.h,2);
    const [ar,ag,ab]=s.accent, [br,bg_,bb]=s.barBg;
    fill(active?br:ar, active?bg_:ag, active?bb:ab);
    textFont('Pretendard, sans-serif');
    textSize(isMobile()?6:7); textStyle(BOLD); textAlign(CENTER,CENTER);
    text(t.label, t.x+t.w/2, t.y+t.h/2);
    noFill(); stroke(...s.accent, active?255:65); strokeWeight(1.2);
    rect(t.x,t.y,t.w,t.h,2);
  });

  // 총 반응 수
  const total = VOTE_SECTIONS.reduce((sum,vs) =>
    sum + Object.values(state.votes[vs.id]).reduce((a,b)=>a+b,0), 0);
  noStroke(); fill(...s.sub);
  textFont('Pretendard, sans-serif');
  textSize(isMobile()?7:9); textStyle(NORMAL); textAlign(RIGHT,CENTER);
  text(total+' reactions', width-(isMobile()?12:20), NAV_H/2);
}

// ─── ARROWS ──────────────────────────────────────────────────────────────────

function drawArrows(s) {
  const cy = height-(isMobile()?128:152);
  const i  = state.currentSection;
  const sz = isMobile()?30:36;
  [[i>0,'prev',28],[i<SECTIONS.length-1,'next',width-28]].forEach(([show,dir,cx])=>{
    if(!show) return;
    const hov = state.hoveredArrow===dir;
    noStroke(); fill(hov?color(...s.accent):color(...s.barBg,190)); ellipse(cx,cy,sz,sz);
    stroke(...s.accent,hov?255:65); strokeWeight(1.2); noFill(); ellipse(cx,cy,sz,sz);
    noStroke();
    const [ar,ag,ab]=s.accent,[br,bg_,bb]=s.barBg;
    fill(hov?br:ar,hov?bg_:ag,hov?bb:ab);
    textFont('Pretendard, sans-serif'); textSize(isMobile()?11:14); textAlign(CENTER,CENTER);
    text(dir==='prev'?'←':'→',cx,cy+1);
  });
}

// ─── DOTS ────────────────────────────────────────────────────────────────────

function drawDots(s) {
  const y=height-(isMobile()?120:145);
  const gap=12, startX=(width-(SECTIONS.length-1)*gap)/2;
  const labels=['WORLD','SILHOUETTE','LUSTER','STILL','AQ CLINIC','RESULT'];
  for(let i=0;i<SECTIONS.length;i++){
    const active=i===state.currentSection;
    noStroke();
    const c=color(...s.accent); c.setAlpha(active?255:50); fill(c);
    ellipse(startX+i*gap, y, active?8:5, active?8:5);
  }
  fill(...s.sub); noStroke();
  textFont('Pretendard, sans-serif');
  textSize(isMobile()?7:8); textStyle(BOLD); textAlign(CENTER,BASELINE);
  text(labels[state.currentSection], width/2, y-9);
}

// ─── TITLE BLOCK ─────────────────────────────────────────────────────────────

function drawTitleBlock(s) {
  const PAD=isMobile()?18:36;
  const tx=PAD+(isMobile()?8:20), ty=NAV_H+PAD+(isMobile()?8:10);
  if      (s.id==='silhouette') drawSilhouetteHero(s,tx,ty);
  else if (s.id==='still')      drawStillHero(s,tx,ty);
  else if (s.id==='aq')         drawAQHero(s,tx,ty);
  else if (s.id==='luster')     drawLusterHero(s,tx,ty);
  else                          drawDefaultHero(s,tx,ty);
}

function drawDefaultHero(s,tx,ty) {
  push(); translate(width-(isMobile()?44:72),NAV_H+(isMobile()?30:46));
  noFill(); stroke(...s.sub,38); strokeWeight(0.8);
  for(let a=0;a<TWO_PI;a+=TWO_PI/8) line(0,0,cos(a)*36,sin(a)*36);
  ellipse(0,0,16,16); pop();
  const fs=isMobile()?32:44;
  noStroke(); fill(...s.accent);
  textFont('Pretendard, sans-serif'); textSize(fs); textStyle(BOLD); textAlign(LEFT,TOP);
  s.title.split('\n').forEach((ln,i)=>text(ln,tx,ty+i*(fs+4)));
  const lc=s.title.split('\n').length;
  fill(...s.sub); textSize(isMobile()?11:13); textStyle(NORMAL);
  text(s.subtitle,tx,ty+lc*(fs+4)+10);
  stroke(...s.accent); strokeWeight(1.5);
  line(tx,ty+lc*(fs+4)+28,tx+140,ty+lc*(fs+4)+28);
}

function drawAQHero(s,tx,ty) {
  noStroke(); fill(200,188,225,55); rect(tx-8,ty-8,width-tx*2+16,isMobile()?108:118,6);
  const fs=isMobile()?28:40;
  noStroke(); fill(...s.accent);
  textFont('Pretendard, sans-serif'); textSize(fs); textStyle(BOLD); textAlign(LEFT,TOP);
  s.title.split('\n').forEach((ln,i)=>text(ln,tx,ty+i*(fs+4)));
  const lc=s.title.split('\n').length;
  fill(...s.sub); textSize(isMobile()?10:12); textStyle(NORMAL);
  text(s.subtitle,tx,ty+lc*(fs+4)+10);
  const tagY=ty+lc*(fs+4)+28;
  noStroke(); fill(200,188,225,95); rect(tx,tagY,isMobile()?160:200,20,3);
  fill(...s.tagColor); textSize(9); textStyle(BOLD); textAlign(LEFT,CENTER);
  text(s.tagline,tx+8,tagY+10);
  push(); translate(width-(isMobile()?50:90),ty+(isMobile()?30:45));
  const ps=isMobile()?18:28;
  fill(180,160,210,155); noStroke();
  rect(-ps*.18,-ps,ps*.36,ps*2,ps*.18);
  fill(140,110,180,195); triangle(-ps*.18,ps*.6,ps*.18,ps*.6,0,ps*1.1);
  fill(160,200,190,175); rect(-ps*.18,-ps,ps*.36,ps*.4,ps*.1); pop();
}

function drawStillHero(s,tx,ty) {
  noStroke(); fill(50,52,58,115); rect(tx-8,ty-8,width-tx*2+16,isMobile()?108:118,6);
  const fs=isMobile()?32:46;
  noStroke(); fill(...s.accent);
  textFont('Pretendard, sans-serif'); textSize(fs); textStyle(BOLD); textAlign(LEFT,TOP);
  text('STILL',tx,ty);
  fill(...s.sub); textSize(isMobile()?10:12); textStyle(NORMAL);
  text(s.subtitle,tx,ty+fs+10);
  stroke(...s.sub,55); strokeWeight(0.8); line(tx,ty+fs+28,tx+180,ty+fs+28);
  noStroke(); fill(...s.tagColor); textSize(9); textStyle(BOLD); textAlign(LEFT,TOP);
  text(s.tagline,tx,ty+fs+36);
  push(); translate(width-(isMobile()?52:95),ty+(isMobile()?32:48));
  const gs=isMobile()?18:30;
  noFill(); stroke(160,160,168,135); strokeWeight(1.5);
  ellipse(-gs*.7,0,gs*1.1,gs*.8); ellipse(gs*.7,0,gs*1.1,gs*.8);
  line(-gs*1.25,0,-gs*1.25,-gs*.5); line(gs*1.25,0,gs*1.25,-gs*.5);
  line(-gs*.15,0,gs*.15,0); pop();
}

function drawLusterHero(s,tx,ty) {
  noStroke(); fill(200,198,192,65); rect(tx-8,ty-8,width-tx*2+16,isMobile()?108:118,6);
  const fs=isMobile()?26:38;
  noStroke(); fill(...s.accent);
  textFont('Pretendard, sans-serif'); textSize(fs); textStyle(BOLD); textAlign(LEFT,TOP);
  s.title.split('\n').forEach((ln,i)=>text(ln,tx,ty+i*(fs+4)));
  const lc=s.title.split('\n').length;
  fill(...s.sub); textSize(isMobile()?10:12); textStyle(NORMAL);
  text(s.subtitle,tx,ty+lc*(fs+4)+10);
  noStroke(); fill(185,183,175,115); rect(tx,ty+lc*(fs+4)+26,isMobile()?120:150,18,2);
  fill(...s.tagColor); textSize(8); textStyle(BOLD); textAlign(LEFT,CENTER);
  text(s.tagline,tx+8,ty+lc*(fs+4)+35);
  push(); translate(width-(isMobile()?50:90),ty+(isMobile()?32:46));
  const ds=isMobile()?18:28;
  noFill(); stroke(160,158,150,145); strokeWeight(1.5);
  ellipse(0,0,ds*2,ds*2); ellipse(0,0,ds*1.2,ds*1.2);
  fill(170,168,160,125); noStroke(); ellipse(0,0,ds*.5,ds*.5);
  stroke(160,158,150,95); strokeWeight(1);
  for(let a=0;a<TWO_PI;a+=TWO_PI/8) {
    line(cos(a)*ds*.65,sin(a)*ds*.65,cos(a)*ds*.9,sin(a)*ds*.9);
  } pop();
}

function drawSilhouetteHero(s,tx,ty) {
  noStroke(); fill(210,175,165,62); rect(tx-8,ty-8,width-tx*2+16,isMobile()?108:112,6);
  textAlign(LEFT,TOP); textFont('Pretendard, sans-serif');
  fill(180,100,110); textStyle(BOLD);
  textSize(isMobile()?38:54);
  text('SILHOUETTE™',tx+4,ty+4);
  const tH=isMobile()?38:54;
  const dY=ty+tH+18;
  fill(180,100,110,125);
  push(); translate(tx+24,dY); rotate(PI/4); rect(-4,-4,8,8); pop();
  stroke(180,100,110,68); strokeWeight(0.8);
  line(tx+4,dY,tx+16,dY); line(tx+32,dY,tx+84,dY);
  noStroke(); fill(...s.sub);
  textSize(11); textStyle(NORMAL); textLeading(16);
  text('Designed to soften interruption,\nreduce unnecessary expression.',tx+4,dY+10);
  fill(...s.tagColor); textSize(10); textStyle(BOLD);
  text(s.tagline,tx+4,dY+46);
  push(); translate(width-(isMobile()?65:105),ty+(isMobile()?30:44));
  drawLipLock(isMobile()?28:42); pop();
}

function drawLipLock(s) {
  fill(210,170,160,182); noStroke();
  beginShape();
  vertex(-s,0); bezierVertex(-s*.6,-s*.55,-s*.2,-s*.75,0,-s*.55);
  bezierVertex(s*.2,-s*.75,s*.6,-s*.55,s,0);
  bezierVertex(s*.6,s*.7,-s*.6,s*.7,-s,0); endShape(CLOSE);
  stroke(180,130,120,150); strokeWeight(1.2); noFill();
  beginShape(); vertex(-s*.5,0);
  bezierVertex(-s*.25,-s*.18,s*.25,-s*.18,s*.5,0); endShape();
  stroke(180,140,120,192); strokeWeight(2);
  line(-s*.78,0,-s*.22,0); line(s*.22,0,s*.78,0);
  noStroke(); fill(190,150,130,212); ellipse(0,0,s*.3,s*.3);
  fill(155,105,95); ellipse(0,-s*.04,s*.1,s*.1); rect(-s*.04,-s*.01,s*.08,s*.12,1);
}

// ─── RESULT PAGE ─────────────────────────────────────────────────────────────

function drawResultPage(s) {
  const mob = isMobile();
  const PAD = mob ? 20 : 48;
  const tx  = PAD;
  const ty  = NAV_H + PAD;

  // 감사 메시지
  noStroke(); fill(...s.accent);
  textFont('Pretendard, sans-serif');
  textSize(mob?28:42); textStyle(BOLD); textAlign(LEFT,TOP);
  s.title.split('\n').forEach((ln,i)=>text(ln,tx,ty+i*(mob?32:46)));
  const lc=s.title.split('\n').length;
  fill(...s.sub); textSize(mob?11:13); textStyle(NORMAL);
  text(s.subtitle,tx,ty+lc*(mob?32:46)+10);
  stroke(...s.accent); strokeWeight(1.5);
  line(tx,ty+lc*(mob?32:46)+28,tx+120,ty+lc*(mob?32:46)+28);

  // 섹션별 통계
  const chartTop = ty + lc*(mob?32:46) + 50;
  const sectionLabels = ['WORLD','AQ CLINIC','STILL','LUSTER','SILHOUETTE'];
  const colW   = (width - PAD*2) / (mob?1:VOTE_SECTIONS.length);
  const barMaxW = colW - (mob?40:32);

  // 전체 최댓값
  let globalMax = 1;
  VOTE_SECTIONS.forEach(vs => {
    REACTIONS.forEach(r => { globalMax = max(globalMax, state.votes[vs.id][r.id]||0); });
  });

  if (mob) {
    // 모바일: 세로로 쌓기
    let yOff = chartTop;
    VOTE_SECTIONS.forEach((vs, si) => {
      const total = Object.values(state.votes[vs.id]).reduce((a,b)=>a+b,0);
      // 섹션 라벨
      fill(...s.accent); noStroke();
      textSize(9); textStyle(BOLD); textAlign(LEFT,TOP);
      text(sectionLabels[si] + '  (' + total + ')', tx, yOff);
      yOff += 16;
      REACTIONS.forEach((r,ri) => {
        const count = state.votes[vs.id][r.id]||0;
        const pct   = count/globalMax;
        // 바
        fill(220,215,208); noStroke(); rect(tx+60, yOff, barMaxW-20, 7, 2);
        if(count>0){ fill(color(r.color)); rect(tx+60,yOff,(barMaxW-20)*pct,7,2); }
        // 라벨
        fill(100,95,90); textSize(8); textStyle(NORMAL); textAlign(RIGHT,CENTER);
        text(r.kr, tx+56, yOff+4);
        fill(...s.sub); textSize(8); textStyle(BOLD); textAlign(LEFT,CENTER);
        text(count, tx+barMaxW-10, yOff+4);
        yOff += 13;
      });
      yOff += 10;
      if(yOff > height - 140) return; // 화면 넘치면 중단
    });
  } else {
    // 데스크탑: 가로 5열
    VOTE_SECTIONS.forEach((vs, si) => {
      const cx  = PAD + si*colW;
      const total = Object.values(state.votes[vs.id]).reduce((a,b)=>a+b,0);
      // 섹션 라벨
      fill(...s.accent); noStroke();
      textFont('Pretendard, sans-serif');
      textSize(9); textStyle(BOLD); textAlign(LEFT,TOP);
      text(sectionLabels[si], cx, chartTop);
      fill(...s.sub); textSize(8); textStyle(NORMAL);
      text('총 '+total+'명', cx, chartTop+13);

      REACTIONS.forEach((r,ri) => {
        const count = state.votes[vs.id][r.id]||0;
        const pct   = count/globalMax;
        const rowY  = chartTop+34 + ri*26;
        // 바 트랙
        fill(220,215,208); noStroke(); rect(cx, rowY, barMaxW, 9, 2);
        // 바 채우기
        if(count>0){ fill(color(r.color)); rect(cx,rowY,barMaxW*pct,9,2); }
        // 라벨
        fill(90,85,82); textSize(8); textStyle(NORMAL); textAlign(LEFT,BASELINE);
        text(r.kr + '  ' + count, cx, rowY-2);
      });
    });
  }

  // 하단 총계
  const totalAll = VOTE_SECTIONS.reduce((sum,vs)=>
    sum+Object.values(state.votes[vs.id]).reduce((a,b)=>a+b,0),0);
  const bottomY = height - (getBtnZone().barH) - 20;
  fill(...s.sub); noStroke();
  textFont('Pretendard, sans-serif');
  textSize(mob?10:12); textStyle(NORMAL); textAlign(CENTER,BASELINE);
  text('총 ' + totalAll + '명이 반응했습니다', width/2, bottomY);

  // 리셋 버튼
  const rw = mob?110:130, rh = mob?28:32;
  const rx = width/2 - rw/2, ry = bottomY + 10;
  const hovReset = state.hoveredArrow === 'reset';
  noStroke();
  fill(hovReset ? color(...s.accent) : color(...s.accent, 18));
  rect(rx, ry, rw, rh, 4);
  stroke(...s.accent, hovReset?255:80); strokeWeight(1); noFill();
  rect(rx, ry, rw, rh, 4);
  noStroke();
  fill(hovReset ? color(...s.barBg) : color(...s.accent));
  textFont('Pretendard, sans-serif');
  textSize(mob?8:9); textStyle(BOLD); textAlign(CENTER,CENTER);
  text('↺  통계 초기화', rx+rw/2, ry+rh/2);

  // 리셋 버튼 위치 저장
  state.resetBtn = {x:rx, y:ry, w:rw, h:rh};
}

// ─── BUTTON BAR ──────────────────────────────────────────────────────────────

function drawButtonBar(s) {
  const sId  = s.id;
  const zone = getBtnZone();
  const mob  = isMobile();

  noStroke(); fill(...s.barBg, 215); rect(0,height-zone.barH,width,zone.barH);
  const lc=s.id==='still'?[80,80,85,145]:[200,195,188,145];
  stroke(...lc); strokeWeight(0.8); line(0,height-zone.barH,width,height-zone.barH);

  for(let i=0;i<REACTIONS.length;i++){
    const r=REACTIONS[i];
    const x=zone.startX+i*zone.spacing, y=zone.y;
    const voted=state.userVotes[sId].has(r.id);
    const hov=state.hoveredBtn===i;
    const count=state.votes[sId][r.id]||0;

    if(hov||voted){
      noStroke(); const gc=color(r.color); gc.setAlpha(voted?45:22); fill(gc);
      ellipse(x,y,zone.btnR*3,zone.btnR*3);
    }
    push(); translate(x,y);
    const c=color(r.color); c.setAlpha(voted?255:hov?208:142); fill(c); noStroke();
    drawSymbol(r.shape, voted?zone.btnR*.80:hov?zone.btnR*.70:zone.btnR*.58); pop();

    if(voted){ fill(r.color); noStroke(); ellipse(x,y-zone.btnR*.92,5,5); }

    const ovr = s.reactionOverride && s.reactionOverride[r.id];
    const kr  = ovr ? ovr.kr : r.kr;
    const en  = ovr ? ovr.en : r.en;

    noStroke();
    fill(voted?color(r.color):color(...s.accent,175));
    textFont('Pretendard, sans-serif');
    textSize(mob?8:10); textStyle(voted?BOLD:NORMAL); textAlign(CENTER,TOP);
    text(kr,x,y+zone.btnR*.82);
    fill(voted?color(r.color):color(...s.sub));
    textSize(mob?7:8); textStyle(NORMAL);
    text(en,x,y+zone.btnR*.82+(mob?12:14));
    if(count>0){
      fill(voted?color(r.color):color(...s.sub));
      textSize(mob?8:9); textStyle(BOLD);
      text(count,x,y+zone.btnR*.82+(mob?24:27));
    }
  }
}

// ─── FLOATERS ────────────────────────────────────────────────────────────────

function spawnFloater(ri, fx, fy) {
  const r=REACTIONS[ri], sId=SECTIONS[state.currentSection].id;
  const sz=random(18,40);
  // Firebase에 저장 → 다른 기기에도 보임
  firebaseSpawnFloater(sId, r.shape, r.color, fx, fy, sz);
  // 내 화면에도 즉시 추가
  state.floaters.push({
    sectionId:sId, shape:r.shape, color:r.color,
    x:fx, y:fy, vx:random(-0.55,0.55), vy:random(-1.0,-0.15),
    size:sz, angle:random(TWO_PI), spin:random(-0.006,0.006),
    alpha:0, fadeIn:true, woff:random(1000), wamp:random(0.15,0.45),
  });
}

function drawFloaters() {
  const sId=SECTIONS[state.currentSection].id;
  const zone=getBtnZone();
  const floorY=height-zone.barH-2;

  for(const f of state.floaters){
    if(f.sectionId!==sId) continue;
    f.woff+=0.010;
    f.vx+=sin(f.woff)*f.wamp*0.010; f.vy+=cos(f.woff*.65)*f.wamp*0.007;
    f.vx=constrain(f.vx,-1.2,1.2); f.vy=constrain(f.vy,-1.3,1.3);
    f.x+=f.vx; f.y+=f.vy; f.angle+=f.spin;
    if(f.x<f.size)         {f.x=f.size;         f.vx*=-1;}
    if(f.x>width-f.size)   {f.x=width-f.size;   f.vx*=-1;}
    if(f.y<f.size+NAV_H)   {f.y=f.size+NAV_H;   f.vy*=-1;}
    if(f.y>floorY-f.size)  {f.y=floorY-f.size;  f.vy*=-1;}
    if(f.fadeIn){ f.alpha=min(f.alpha+7,175); if(f.alpha>=175)f.fadeIn=false; }
    push(); translate(f.x,f.y); rotate(f.angle);
    const c=color(f.color); c.setAlpha(f.alpha); fill(c); noStroke();
    drawSymbol(f.shape,f.size); pop();
  }
}

// ─── SYMBOLS ─────────────────────────────────────────────────────────────────

function drawSymbol(shape,s) {
  noStroke();
  if(shape==='star6')     drawStar6(s);
  else if(shape==='burst')     drawBurst(s);
  else if(shape==='hourglass') drawHourglass(s);
  else if(shape==='infinity')  drawInfinity(s);
  else if(shape==='xmark')     drawXmark(s);
  else if(shape==='eye')       drawEye(s);
}
function drawStar6(s){
  beginShape();
  for(let i=0;i<6;i++){const a=(i/6)*TWO_PI-HALF_PI,b=a+TWO_PI/12;vertex(cos(a)*s,sin(a)*s);vertex(cos(b)*s*.38,sin(b)*s*.38);}
  endShape(CLOSE);
}
function drawBurst(s){
  push();
  for(let i=0;i<8;i++){push();rotate((i/8)*TWO_PI);beginShape();vertex(0,-s*.9);vertex(s*.13,-s*.37);vertex(-s*.13,-s*.37);endShape(CLOSE);pop();}
  ellipse(0,0,s*.6,s*.6);pop();
}
function drawHourglass(s){
  beginShape();vertex(-s*.55,-s);vertex(s*.55,-s);vertex(s*.12,0);vertex(s*.55,s);vertex(-s*.55,s);vertex(-s*.12,0);endShape(CLOSE);
}
function drawInfinity(s){ ellipse(-s*.42,0,s*.78,s*.52); ellipse(s*.42,0,s*.78,s*.52); }
function drawXmark(s){
  const t=s*.22;
  beginShape();
  vertex(-s,-s+t);vertex(-s+t,-s);vertex(0,-t);vertex(s-t,-s);vertex(s,-s+t);vertex(t,0);
  vertex(s,s-t);vertex(s-t,s);vertex(0,t);vertex(-s+t,s);vertex(-s,s-t);vertex(-t,0);
  endShape(CLOSE);
}
function drawEye(s){
  beginShape();vertex(-s,0);bezierVertex(-s*.5,-s*.7,s*.5,-s*.7,s,0);bezierVertex(s*.5,s*.7,-s*.5,s*.7,-s,0);endShape(CLOSE);
  fill(...sec().bg); ellipse(0,0,s*.6,s*.6);
}

// ─── MOUSE ───────────────────────────────────────────────────────────────────

function mouseMoved(){
  const zone=getBtnZone(), tabs=getNavTabs();
  const cy=height-(isMobile()?128:152), i=state.currentSection;
  let foundBtn=-1;
  for(let j=0;j<REACTIONS.length;j++){
    if(dist(mouseX,mouseY,zone.startX+j*zone.spacing,zone.y)<zone.btnR+10){foundBtn=j;break;}
  }
  state.hoveredBtn=foundBtn;
  let foundNav=-1;
  for(const t of tabs){ if(mouseX>=t.x&&mouseX<=t.x+t.w&&mouseY>=t.y&&mouseY<=t.y+t.h){foundNav=t.i;break;} }
  state.hoveredNav=foundNav;
  if(i>0&&dist(mouseX,mouseY,28,cy)<18)                        state.hoveredArrow='prev';
  else if(i<SECTIONS.length-1&&dist(mouseX,mouseY,width-28,cy)<18) state.hoveredArrow='next';
  else if(state.resetBtn && SECTIONS[state.currentSection].id==='result' &&
    mouseX>=state.resetBtn.x && mouseX<=state.resetBtn.x+state.resetBtn.w &&
    mouseY>=state.resetBtn.y && mouseY<=state.resetBtn.y+state.resetBtn.h) state.hoveredArrow='reset';
  else state.hoveredArrow='';
  document.body.style.cursor=(foundBtn>=0||foundNav>=0||state.hoveredArrow!=='')?'pointer':'default';
}

function mousePressed(){
  const sId=SECTIONS[state.currentSection].id;
  const zone=getBtnZone(), tabs=getNavTabs();
  const cy=height-(isMobile()?128:152), i=state.currentSection;

  if(i>0&&dist(mouseX,mouseY,28,cy)<18){state.currentSection--;return false;}
  if(i<SECTIONS.length-1&&dist(mouseX,mouseY,width-28,cy)<18){state.currentSection++;return false;}

  // 리셋 버튼 클릭
  if(state.resetBtn && sId==='result' &&
    mouseX>=state.resetBtn.x && mouseX<=state.resetBtn.x+state.resetBtn.w &&
    mouseY>=state.resetBtn.y && mouseY<=state.resetBtn.y+state.resetBtn.h) {
    if(confirm('통계를 초기화할까요?')) {
      if(typeof db !== 'undefined') {
        db.ref('votes').remove();
        db.ref('floaters').remove();
      }
      SECTIONS.forEach(s => {
        state.userVotes[s.id] = new Set();
        REACTIONS.forEach(r => { state.votes[s.id][r.id] = 0; });
      });
      state.floaters = [];
    }
    return false;
  }
  for(const t of tabs){ if(mouseX>=t.x&&mouseX<=t.x+t.w&&mouseY>=t.y&&mouseY<=t.y+t.h){state.currentSection=t.i;return false;} }

  // result 페이지에서는 투표 안 됨
  if(sId==='result') return false;

  for(let j=0;j<REACTIONS.length;j++){
    const bx=zone.startX+j*zone.spacing;
    if(dist(mouseX,mouseY,bx,zone.y)<zone.btnR+10){
      const r=REACTIONS[j];
      const userSet=state.userVotes[sId];
      if(userSet.has(r.id)){
        // 이미 선택 → 취소
        firebaseVote(sId,r.id,-1);
        userSet.delete(r.id);
      } else {
        // 새로 선택 — 다른 것 취소 없이 추가
        firebaseVote(sId,r.id,1);
        userSet.add(r.id);
        for(let k=0;k<1;k++) spawnFloater(j,bx+random(-20,20),zone.y+random(-24,-4));
      }
      return false;
    }
  }
}

function keyPressed(){
  if(keyCode===RIGHT_ARROW&&state.currentSection<SECTIONS.length-1) state.currentSection++;
  if(keyCode===LEFT_ARROW &&state.currentSection>0)                  state.currentSection--;
}
function touchStarted(){ mousePressed(); return false; }
