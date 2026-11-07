

const SwarmConfig = {
  maxAgents: 20,
  minAgents: 5,
  introAgents: 10,
  cursorSize: 20,
  cursorStroke: 1.5,
  colors: ['#06b6d4', '#67e8f9', '#22d3ee', '#0891b2', '#a855f7', '#06b6d4'],
  staggerBase: 40,
  introDuration: 1000,
  rectDrawDuration: 500,
  textTypeDuration: 35,
  lineDrawDuration: 450,
  guideSlideDuration: 350,
  inertia: 0.9,
  orbitRadius: 140,
  orbitSpeed: 0.002,
  mouseAvoidRadius: 150,
  selector: '[data-swarm-target]',
  adaptiveQuality: true,
  pauseWhenHidden: true,
};

const Utils = {
  clamp(v, a, b) { return Math.max(a, Math.min(b, v)); },
  lerp(a, b, t) { return a + (b - a) * t; },
  easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); },
  random(a, b) { return a + Math.random() * (b - a); },
  pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  dist(x1, y1, x2, y2) { const dx = x2 - x1, dy = y2 - y1; return Math.hypot(dx, dy); },
  now() { return performance.now(); },
  reduceMotion() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; },
  isTouch() { return 'ontouchstart' in window || navigator.maxTouchPoints > 0; },
};

class Vec2 {
  constructor(x = 0, y = 0) { this.x = x; this.y = y; }
  set(x, y) { this.x = x; this.y = y; return this; }
  add(v) { this.x += v.x; this.y += v.y; return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; return this; }
  mul(s) { this.x *= s; this.y *= s; return this; }
  div(s) { this.x /= s; this.y /= s; return this; }
  mag() { return Math.hypot(this.x, this.y); }
  dist(v) { return Math.hypot(this.x - v.x, this.y - v.y); }
  normalize() { const m = this.mag(); if (m) this.div(m); return this; }
  lerp(v, t) { this.x += (v.x - this.x) * t; this.y += (v.y - this.y) * t; return this; }
  static lerp(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; }
  clone() { return new Vec2(this.x, this.y); }
  static random() { return new Vec2(Math.random() * 2 - 1, Math.random() * 2 - 1).normalize(); }
}





class Agent {
  constructor(index, config, canvasRect, swarm) {
    this.id = index;
    this.cfg = config;
    this.canvasRect = canvasRect;
    this.swarm = swarm;
    this.pos = new Vec2();
    this.vel = new Vec2();
    this.acc = new Vec2();
    this.color = Utils.pickRandom(config.colors);
    this.size = config.cursorSize;
    this.stroke = config.cursorStroke;
    this.trail = [];
    this.maxTrail = 6;
    this.shape = 'cross';
    this.state = 'orbit';
    this.task = null;
    this.taskProgress = 0;
    this.taskDuration = 0;
    this.taskStartTime = 0;
    this.delay = 0;
    this.buildRect = null;
    this.buildText = null;
    this.buildLine = null;
    this.rotation = 0;
    this.spawnOrbit();
  }

  spawnOrbit() {
    const { width, height } = this.canvasRect;
    const cx = width / 2, cy = height / 2;
    const angle = (this.id / this.cfg.maxAgents) * Math.PI * 2 + Utils.random(-0.3, 0.3);
    const r = this.cfg.orbitRadius + Utils.random(-15, 15);
    this.pos.set(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
    this.vel.set(-Math.sin(angle) * this.cfg.orbitSpeed * r, Math.cos(angle) * this.cfg.orbitSpeed * r);
    this.shape = 'cross';
  }

  assignTask(task) {
    this.task = task;
    this.taskProgress = 0;
    this.taskStartTime = Utils.now() + this.delay;
    this.state = 'travel';
    this.taskDuration = task.type === 'rect' ? this.cfg.rectDrawDuration
      : task.type === 'text' ? Math.max(300, task.text.length * this.cfg.textTypeDuration)
      : task.type === 'line' ? this.cfg.lineDrawDuration
      : this.cfg.guideSlideDuration;
    if (task.type === 'rect') { this.buildRect = { w: 0, h: 0 }; this.shape = 'cross'; }
    else if (task.type === 'text') { this.buildText = { full: task.text, typed: '', caret: true }; this.shape = 'ibeam'; }
    else if (task.type === 'line') { this.buildLine = { progress: 0 }; this.shape = 'pen'; }
    else { this.buildLine = { progress: 0 }; this.shape = 'ew'; }
  }

  update(canvasRect, mousePos, allAgents, dt) {
    this.canvasRect = canvasRect;
    if (Utils.now() < this.taskStartTime) return false;
    const elapsed = Utils.now() - this.taskStartTime;
    this.taskProgress = Utils.clamp(elapsed / this.taskDuration, 0, 1);
    const eased = Utils.easeOutCubic(this.taskProgress);

    switch (this.state) {
      case 'orbit': this.updateOrbit(dt); break;
      case 'travel': this.updateTravel(eased); break;
      case 'build': this.updateBuild(eased); break;
      case 'flock': this.updateFlock(mousePos, allAgents, dt); break;
      case 'done': this.vel.mul(0.95); break;
    }
    this.pos.add(this.vel);
    this.vel.add(this.acc).mul(0.96);
    this.acc.set(0, 0);
    this.trail.push(this.pos.clone());
    if (this.trail.length > this.maxTrail) this.trail.shift();
    return this.state !== 'done';
  }

  updateOrbit(dt) {
    const { width, height } = this.canvasRect;
    const cx = width / 2, cy = height / 2;
    const toCenter = new Vec2(cx - this.pos.x, cy - this.pos.y);
    const dist = toCenter.mag();
    const targetR = this.cfg.orbitRadius;
    const force = (dist - targetR) * 0.002;
    toCenter.normalize().mul(force);
    this.acc.add(toCenter);
    const tangent = new Vec2(-toCenter.y, toCenter.x).normalize().mul(this.cfg.orbitSpeed * targetR);
    this.vel.lerp(tangent, 0.03);
    if (this.task) this.state = 'travel';
  }

  updateTravel(eased) {
    if (!this.task) { this.state = 'orbit'; return; }
    const t = this.task.rect;
    const dx = t.x - this.pos.x, dy = t.y - this.pos.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 6) { this.pos.set(t.x, t.y); this.vel.set(0, 0); this.state = 'build'; this.taskStartTime = Utils.now(); this.taskProgress = 0; return; }
    this.vel.x = Utils.lerp(this.vel.x, dx * 0.04, 1 - this.cfg.inertia);
    this.vel.y = Utils.lerp(this.vel.y, dy * 0.04, 1 - this.cfg.inertia);
    this.pos.x += (Math.random() - 0.5) * 0.8;
    this.pos.y += (Math.random() - 0.5) * 0.8;
  }

  updateBuild(eased) {
    if (!this.task) { this.complete(); return; }
    const t = this.task.rect;
    this.pos.set(t.x, t.y); this.vel.set(0, 0);
    if (this.task.type === 'rect') {
      this.buildRect.w = t.w * eased;
      this.buildRect.h = t.h * eased;
      if (eased > 0.55 && !this.task.element.classList.contains('swarm-built')) this.task.element.classList.add('swarm-built');
    } else if (this.task.type === 'text') {
      const len = Math.floor(this.buildText.full.length * eased);
      this.buildText.typed = this.buildText.full.slice(0, len);
      this.buildText.caret = eased < 1;
      if (this.task.element) {
        this.task.element.textContent = this.buildText.typed;
        if (eased >= 1) this.task.element.classList.add('swarm-built');
      }
    } else if (this.task.type === 'line') {
      this.buildLine.progress = eased;
      if (eased >= 1 && this.task.element) this.task.element.classList.add('swarm-built');
    } else {
      this.buildLine.progress = eased;
      if (eased >= 1 && this.task.element) this.task.element.classList.add('swarm-built');
    }
    if (eased >= 1) this.complete();
  }

  updateFlock(mousePos, allAgents, dt) {
    let align = new Vec2(), cohesion = new Vec2(), separation = new Vec2();
    let n = 0;
    for (const o of allAgents) {
      if (o === this || o.state === 'done') continue;
      const d = this.pos.dist(o.pos);
      if (d < 100) { align.add(o.vel); cohesion.add(o.pos); const diff = this.pos.clone().sub(o.pos); if (d > 0) diff.div(d * d); separation.add(diff); n++; }
    }
    if (n > 0) { align.div(n).normalize().mul(2).sub(this.vel).mul(0.015); cohesion.div(n).sub(this.pos).normalize().mul(2).sub(this.vel).mul(0.008); separation.div(n).normalize().mul(3).mul(0.025); this.acc.add(align).add(cohesion).add(separation); }
    if (mousePos) { const tm = this.pos.clone().sub(mousePos); const d = tm.mag(); if (d < this.cfg.mouseAvoidRadius && d > 0) { tm.normalize().mul((this.cfg.mouseAvoidRadius - d) * 0.08); this.acc.add(tm); } }
    const { width, height } = this.canvasRect;
    const tc = new Vec2(width / 2 - this.pos.x, height / 2 - this.pos.y);
    if (tc.mag() > 250) { tc.normalize().mul(0.5); this.acc.add(tc); }
  }

  complete() { this.state = 'done'; this.vel.set(0, 0); if (this.task && this.task.onComplete) this.task.onComplete(this.task.element); this.task = null; }

  render(ctx) {
    if (this.state === 'orbit' && !this.task) {
      ctx.globalAlpha = Math.min(1, (Utils.now() - this.swarm.startTime) / this.cfg.introDuration);
    } else ctx.globalAlpha = 1;

    if (this.trail.length > 1) {
      ctx.strokeStyle = this.color; ctx.lineWidth = this.stroke * 0.9; ctx.lineCap = 'round'; ctx.globalAlpha = 0.55;
      ctx.beginPath(); ctx.moveTo(this.trail[0].x, this.trail[0].y);
      for (let i = 1; i < this.trail.length; i++) ctx.lineTo(this.trail[i].x, this.trail[i].y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.globalAlpha = 1; ctx.strokeStyle = this.color; ctx.lineWidth = this.stroke; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const cx = this.pos.x, cy = this.pos.y; const s = this.size * 0.5;
    ctx.save(); ctx.translate(cx, cy);
    if (this.shape === 'arrow' && this.vel.mag() > 0.5) this.rotation = Math.atan2(this.vel.y, this.vel.x);
    if (this.shape === 'arrow') ctx.rotate(this.rotation);
    switch (this.shape) {
      case 'cross':
        ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(s, 0); ctx.moveTo(0, -s); ctx.lineTo(0, s); ctx.stroke(); break;
      case 'arrow':
        ctx.beginPath(); ctx.moveTo(-s * 0.8, -s * 0.6); ctx.lineTo(s * 0.6, 0); ctx.lineTo(-s * 0.8, s * 0.6); ctx.stroke(); break;
      case 'ibeam':
        const ib = s * 0.7; ctx.beginPath(); ctx.moveTo(-ib, -ib); ctx.lineTo(ib, -ib); ctx.moveTo(0, -ib); ctx.lineTo(0, ib); ctx.moveTo(-ib, ib); ctx.lineTo(ib, ib); ctx.stroke(); break;
      case 'pen':
        ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.8); ctx.lineTo(s * 0.8, -s * 0.3); ctx.lineTo(s * 0.3, s * 0.8); ctx.lineTo(-s * 0.8, s * 0.3); ctx.closePath(); ctx.stroke(); break;
      case 'ew':
        ctx.beginPath(); ctx.moveTo(-s, -s * 0.3); ctx.lineTo(-s * 0.4, -s * 0.3); ctx.lineTo(-s * 0.4, -s); ctx.lineTo(s * 0.4, -s); ctx.lineTo(s * 0.4, -s * 0.3); ctx.lineTo(s, -s * 0.3); ctx.lineTo(s, s * 0.3); ctx.lineTo(s * 0.4, s * 0.3); ctx.lineTo(s * 0.4, s); ctx.lineTo(-s * 0.4, s); ctx.lineTo(-s * 0.4, s * 0.3); ctx.lineTo(-s, s * 0.3); ctx.closePath(); ctx.stroke(); break;
    }
    ctx.restore();
    if (this.state === 'build' && this.task) this.renderBuild(ctx);
  }

  renderBuild(ctx) {
    if (!this.task) return;
    const t = this.task.rect; const eased = Utils.easeOutCubic(this.taskProgress); const s = this.size * 0.5;
    ctx.strokeStyle = this.color; ctx.lineWidth = this.stroke; ctx.lineCap = 'round'; ctx.globalAlpha = 0.9;
    if (this.task.type === 'rect' && this.buildRect) {
      const w = this.buildRect.w, h = this.buildRect.h, x = t.x - w / 2, y = t.y - h / 2;
      if (eased < 0.9) {
        const corners = [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }];
        const ci = Math.floor(eased * 4);
        for (let i = 0; i <= ci && i < 4; i++) { const c = corners[i]; const cs = s * 0.5; ctx.beginPath(); ctx.moveTo(c.x - cs, c.y); ctx.lineTo(c.x + cs, c.y); ctx.moveTo(c.x, c.y - cs); ctx.lineTo(c.x, c.y + cs); ctx.stroke(); }
      }
      ctx.beginPath(); ctx.rect(x, y, w, h); ctx.stroke();
      if (eased > 0.35) { ctx.font = '10px "JetBrains Mono", monospace'; ctx.fillStyle = this.color; ctx.textAlign = 'center'; ctx.fillText(`${Math.round(w)} x ${Math.round(h)}`, t.x, y - 8); }
    } else if (this.task.type === 'text' && this.buildText) {
      if (this.buildText.caret && Math.floor(Utils.now() / 500) % 2 === 0) {
        ctx.font = '13px "JetBrains Mono", monospace'; ctx.fillStyle = this.color; const tw = ctx.measureText(this.buildText.typed).width; const x = t.x - tw / 2; const y = t.y + 6; ctx.fillRect(x + tw + 1, y - 12, 2, 16);
      }
    } else if (this.task.type === 'line' || this.task.type === 'guide') {
      const p = this.buildLine.progress; const x1 = t.x - t.w / 2, y1 = t.y, x2 = t.x + t.w / 2, y2 = t.y;
      const cx2 = x1 + (x2 - x1) * p, cy2 = y1 + (y2 - y1) * p;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(cx2, cy2); ctx.stroke();
      ctx.beginPath(); ctx.arc(x1, y1, 2.5, 0, Math.PI * 2); ctx.arc(cx2, cy2, 2.5, 0, Math.PI * 2); ctx.stroke();
      if (this.task.type === 'guide') { ctx.strokeStyle = '#F24822'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(cx2, t.y - t.h / 2 - 18); ctx.lineTo(cx2, t.y + t.h / 2 + 18); ctx.stroke(); ctx.setLineDash([]); }
    }
    ctx.globalAlpha = 1;
  }

  resize(canvasRect) { this.canvasRect = canvasRect; }
}





class TaskQueue {
  constructor(elements, config) {
    this.config = config;
    this.elements = elements;
    this.tasks = [];
    this.completed = 0;
    this.onProgress = null;
    this.onComplete = null;
    this.prepareTasks();
  }

  prepareTasks() {
    this.tasks = this.elements.map((el, index) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      let type = 'rect'; let text = '';
      if (el.tagName === 'IMG' || el.tagName === 'VIDEO' || el.tagName === 'CANVAS' || el.classList.contains('card-icon')) { type = 'rect'; }
      else if (el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3' || el.classList.contains('hero-title') || el.classList.contains('section-title')) { type = 'text'; text = el.textContent; el.textContent = ''; }
      else if (el.tagName === 'P' || el.tagName === 'SPAN' || el.classList.contains('hero-subtitle') || el.classList.contains('section-desc') || el.classList.contains('card-desc')) { type = 'text'; text = el.textContent; el.textContent = ''; }
      else if (el.tagName === 'A' || el.tagName === 'BUTTON' || el.classList.contains('btn') || el.classList.contains('nav-link') || el.classList.contains('card-link')) { type = 'text'; text = el.textContent; el.textContent = ''; }
      else if (el.classList.contains('skill-bar') || el.classList.contains('skill-fill') || el.classList.contains('highlight') || el.classList.contains('stat') || el.classList.contains('logo') || el.classList.contains('logo-mark')) { type = 'rect'; }
      else if (el.tagName === 'HR' || el.classList.contains('divider')) { type = 'line'; }
      else { const hasText = el.textContent.trim().length > 0 && el.children.length === 0; type = hasText ? 'text' : 'rect'; if (type === 'text') { text = el.textContent; el.textContent = ''; } }
      return { element: el, index, type, text, rect: { x: cx, y: cy, w: r.width, h: r.height }, delay: index * this.config.staggerBase, onComplete: null };
    });
    this.tasks.sort((a, b) => { const ay = a.rect.y, by = b.rect.y; if (Math.abs(ay - by) > 80) return ay - by; return a.rect.x - b.rect.x; });
    this.tasks.forEach((task, i) => { task.delay = i * this.config.staggerBase; task.onComplete = () => this.markComplete(task); });
  }

  getNextTask() { return this.tasks.shift() || null; }
  markComplete(task) { this.completed++; if (this.onProgress) this.onProgress(this.completed, this.elements.length); if (this.completed >= this.elements.length && this.onComplete) this.onComplete(); }
  getTotal() { return this.elements.length; } getCompleted() { return this.completed; } hasTasks() { return this.tasks.length > 0; }
}





class CursorSwarm {
  constructor(options = {}) {
    this.cfg = { ...SwarmConfig, ...options };
    this.canvas = null; this.ctx = null; this.agents = []; this.taskQueue = null; this.targets = [];
    this.isRunning = false; this.isPaused = false; this.animId = null; this.lastTime = 0;
    this.startTime = 0; this.completeCb = null; this.mousePos = null; this.phase = 'intro';
    this.resizeHandler = this.onResize.bind(this); this.visibilityHandler = this.onVisibility.bind(this); this.mouseHandler = this.onMouse.bind(this);
    this.fps = 60; this.frameCount = 0; this.lastFpsCheck = 0; this.savedScroll = 0;
  }

  init() {
    if (this.cfg.selector === false) return false;
    if (Utils.reduceMotion()) return false;
    if (Utils.isTouch() && this.cfg.maxAgents > this.cfg.minAgents) this.cfg.maxAgents = this.cfg.minAgents;
    this.createCanvas();
    this.findTargets();
    if (this.targets.length === 0) return false;
    this.createAgents();
    this.setupTaskQueue();
    this.bindEvents();
    this.targets.forEach(el => { el.style.visibility = 'hidden'; el.style.opacity = '0'; el.style.pointerEvents = 'none'; });
    return true;
  }

  createCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'swarm-canvas';
    this.canvas.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 100; opacity: 0; transition: opacity 200ms ease; background: transparent;`;
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d', { alpha: true, desynchronized: true });
    this.resizeCanvas();
  }

  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr; this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + 'px'; this.canvas.style.height = window.innerHeight + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.canvasRect = { width: window.innerWidth, height: window.innerHeight };
    this.agents.forEach(a => a.resize(this.canvasRect));
  }

  findTargets() { this.targets = Array.from(document.querySelectorAll(this.cfg.selector || '[data-swarm-target]')); }
  createAgents() { const count = Math.min(this.cfg.introAgents, this.cfg.maxAgents, this.targets.length); this.agents = []; for (let i = 0; i < count; i++) this.agents.push(new Agent(i, this.cfg, this.canvasRect, this)); }
  setupTaskQueue() { this.taskQueue = new TaskQueue(this.targets, this.cfg); this.taskQueue.onComplete = () => this.onAllTasksDone(); }
  bindEvents() { window.addEventListener('resize', this.resizeHandler, { passive: true }); document.addEventListener('visibilitychange', this.visibilityHandler); document.addEventListener('mousemove', this.mouseHandler, { passive: true }); }
  unbindEvents() { window.removeEventListener('resize', this.resizeHandler); document.removeEventListener('visibilitychange', this.visibilityHandler); document.removeEventListener('mousemove', this.mouseHandler); }
  onResize() { if (!this.isRunning) return; this.resizeCanvas(); if (this.taskQueue) { this.taskQueue.tasks.forEach(task => { const r = task.element.getBoundingClientRect(); task.rect = { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; }); } }
  onVisibility() { if (this.cfg.pauseWhenHidden) { if (document.hidden) this.pause(); else if (this.isPaused) this.resume(); } }
  onMouse(e) { this.mousePos = new Vec2(e.clientX, e.clientY); }

  start(onComplete) {
    if (this.isRunning) return; if (!this.targets.length) { onComplete?.(); return; }
    this.savedScroll = window.scrollY || 0;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = -this.savedScroll + 'px';
    document.body.style.width = '100%';
    this.completeCb = onComplete; this.isRunning = true; this.isPaused = false; this.startTime = Utils.now(); this.lastTime = this.startTime; this.phase = 'intro';
    requestAnimationFrame(() => { this.canvas.style.opacity = '1'; });
    this.assignInitialTasks(); this.animate(this.startTime);
  }

  assignInitialTasks() { const n = Math.min(this.agents.length, this.taskQueue.getTotal()); for (let i = 0; i < n; i++) { const task = this.taskQueue.getNextTask(); if (task) this.agents[i].assignTask(task); } }

  animate(currentTime) {
    if (!this.isRunning || this.isPaused) return;
    const dt = currentTime - this.lastTime; this.lastTime = currentTime;
    this.frameCount++; if (currentTime - this.lastFpsCheck >= 1000) { this.fps = this.frameCount; this.frameCount = 0; this.lastFpsCheck = currentTime; this.adaptQuality(); }
    this.update(currentTime, dt); this.render();
    this.animId = requestAnimationFrame(t => this.animate(t));
  }

  update(currentTime, dt) {
    let active = 0;
    this.agents.forEach(a => { const sa = a.update(this.canvasRect, this.mousePos, this.agents, dt); if (sa) active++; if (a.state === 'done' && this.taskQueue.hasTasks()) { const task = this.taskQueue.getNextTask(); if (task) a.assignTask(task); } });
    if (this.phase === 'intro' && currentTime - this.startTime > this.cfg.introDuration) { this.phase = 'build'; while (this.agents.length < Math.min(this.cfg.maxAgents, this.taskQueue.getTotal())) { const a = new Agent(this.agents.length, this.cfg, this.canvasRect, this); this.agents.push(a); const task = this.taskQueue.getNextTask(); if (task) a.assignTask(task); } }
    if (!this.taskQueue.hasTasks() && this.taskQueue.getCompleted() >= this.taskQueue.getTotal()) { if (this.phase !== 'finale') { this.phase = 'finale'; this.startFinale(); } }
  }

  startFinale() { this.agents.forEach(a => { a.state = 'flock'; a.shape = 'arrow'; }); setTimeout(() => { if (this.isRunning) this.finish(); }, 1800); }
  render() { const ctx = this.ctx; const { width, height } = this.canvasRect; ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = 'rgba(0, 0, 0, 0.03)'; ctx.fillRect(0, 0, width, height); ctx.globalCompositeOperation = 'source-over'; this.agents.forEach(a => a.render(ctx)); }
  adaptQuality() { if (!this.cfg.adaptiveQuality) return; if (this.fps < 45 && this.agents.length > this.cfg.minAgents) { const r = Math.ceil(this.agents.length * 0.25); this.agents.splice(0, r); } }
  onAllTasksDone() {}
  finish() { this.isRunning = false; this.canvas.style.opacity = '0'; this.targets.forEach(el => { el.style.visibility = 'visible'; el.style.opacity = '1'; el.style.pointerEvents = 'auto'; el.classList.add('swarm-reveal', 'built'); }); document.documentElement.style.overflow = ''; document.body.style.overflow = ''; document.body.style.position = ''; document.body.style.top = ''; document.body.style.width = ''; window.scrollTo(0, this.savedScroll); setTimeout(() => { this.destroy(); this.completeCb?.(); (this.cfg && this.cfg.onComplete)?.(); }, 300); }
  pause() { this.isPaused = true; if (this.animId) { cancelAnimationFrame(this.animId); this.animId = null; } }
  resume() { if (!this.isPaused) return; this.isPaused = false; this.lastTime = Utils.now(); this.animate(this.lastTime); }
  destroy() { document.documentElement.style.overflow = ''; document.body.style.overflow = ''; document.body.style.position = ''; document.body.style.top = ''; document.body.style.width = ''; this.unbindEvents(); if (this.animId) cancelAnimationFrame(this.animId); if (this.canvas?.parentNode) this.canvas.parentNode.removeChild(this.canvas); this.canvas = this.ctx = null; this.agents = []; this.taskQueue = this.targets = []; this.isRunning = false; }
  static async run(options = {}) { const swarm = new CursorSwarm(options); if (!swarm.init()) { const targets = document.querySelectorAll(options.selector || '[data-swarm-target]'); targets.forEach(el => { el.style.visibility = 'visible'; el.style.opacity = '1'; el.style.pointerEvents = 'auto'; el.classList.add('swarm-reveal', 'built'); }); options.onComplete?.(); return null; } return new Promise(resolve => swarm.start(() => resolve(swarm))); }
}

export { CursorSwarm, Agent, TaskQueue, Vec2, Utils, SwarmConfig };
