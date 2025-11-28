// oops.js - final cleaned & enhanced version

(() => {
  // --- DOM references ---
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d', { alpha: false });

  // Player modal & inputs
  const playerModal = document.getElementById('playerModal');
  const savePlayer = document.getElementById('savePlayer');
  const playerNameInput = document.getElementById('playerName');
  const formError = document.getElementById('formError');

  // UI elements
  const startBtn = document.getElementById('startBtn');
  const uiScore = document.getElementById('ui-score');
  const uiHigh = document.getElementById('ui-high');
  const hudScore = document.getElementById('hud-score') || document.getElementById('ui-score');
  const hudName = document.getElementById('hud-name');
  const hudTime = document.getElementById('hud-time');
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modalTitle');
  const modalText = document.getElementById('modalText');
  const modalPrimary = document.getElementById('modalPrimary');
  const modalSecondary = document.getElementById('modalSecondary');
  const modalScoreWrap = document.getElementById('modalScoreWrap');
  const modalScore = document.getElementById('modalScore');
  const modalTime = document.getElementById('modalTime');
  const speedRange = document.getElementById('speedRange');
  const speedVal = document.getElementById('speedVal');
  const wrapBtn = document.getElementById('wrapBtn');

  // Theme
  const THEME = {
    accent: { r: 126, g: 249, b: 199 },
    accent2: { r: 59, g: 224, b: 122 },
    cyan: { r: 25, g: 208, b: 255 },
    danger: { r: 255, g: 107, b: 107 }
  };

  // Game settings/state
  let gridSize = 20;
  let cellPixels = 32;
  let tickSpeed = speedRange ? Number(speedRange.value) : 8;
  let allowWrap = false;

  let snake = [];
  let dir = { x: 1, y: 0 };
  let nextDir = { ...dir };
  let food = null;
  let score = 0;
  let highScore = Number(localStorage.getItem('snake_high') || 0);
  if (uiHigh) uiHigh.textContent = highScore;

  let running = false;
  let paused = false;
  let lastTick = 0;
  let tickInterval = 1000 / tickSpeed;
  let animationFrameId = null;

  // Timer & player
  let playerName = 'Guest';
  let playerGender = 'Unknown';
  let startTime = 0;
  let nowTime = 0;

  // Resize canvas
  function resizeCanvas() {
    const parent = canvas.parentElement || document.body;
    const max = Math.min(parent.clientWidth - 36, 740);
    const size = Math.max(320, Math.min(max, 680));
    canvas.width = size;
    canvas.height = size;
    cellPixels = Math.floor(canvas.width / gridSize);
    const cw = canvas.closest('.canvas-wrap');
    if (cw) cw.classList.toggle('playing', running);
  }
  window.addEventListener('resize', () => { resizeCanvas(); draw(); });

  // Utils
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  // Reset/start
  function resetGame() {
    score = 0;
    if (uiScore) uiScore.textContent = score;
    if (hudScore) hudScore.textContent = score;

    snake = [];
    const mid = Math.floor(gridSize / 2);
    snake.push({ x: mid - 1, y: mid });
    snake.push({ x: mid - 2, y: mid });
    snake.push({ x: mid - 3, y: mid });

    dir = { x: 1, y: 0 };
    nextDir = { ...dir };
    placeFood();

    running = true;
    paused = false;

    startTime = performance.now();
    lastTick = performance.now();
    tickInterval = 1000 / tickSpeed;
    if (modal) modal.style.display = 'none';
    if (hudName) hudName.textContent = playerName;
    const cw = canvas.closest('.canvas-wrap');
    if (cw) cw.classList.add('playing');
  }

  function placeFood() {
    let tries = 0;
    while (true) {
      tries++;
      const fx = randInt(1, gridSize - 2);
      const fy = randInt(1, gridSize - 2);
      let coll = snake.some(s => s.x === fx && s.y === fy);
      if (!coll) {
        food = { x: fx, y: fy, born: performance.now() };
        break;
      }
      if (tries > 1000) {
        food = { x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2), born: performance.now() };
        break;
      }
    }
  }

  function setDirection(x, y) {
    if ((x === -dir.x && y === -dir.y) || (x === dir.x && y === dir.y)) return;
    nextDir = { x, y };
  }

  function tick() {
    dir = { ...nextDir };
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    if (allowWrap) {
      if (head.x < 0) head.x = gridSize - 1;
      if (head.x >= gridSize) head.x = 0;
      if (head.y < 0) head.y = gridSize - 1;
      if (head.y >= gridSize) head.y = 0;
    } else {
      if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) return gameOver();
    }

    if (snake.some(s => s.x === head.x && s.y === head.y)) return gameOver();

    snake.unshift(head);

    if (food && head.x === food.x && head.y === food.y) {
      score += 10;
      if (uiScore) uiScore.textContent = score;
     if (hudScore) hudScore.textContent = score;
      placeFood();
    } else {
      snake.pop();
    }
  }

  function gameOver() {
    running = false;
    const endTime = performance.now();
    const totalMs = Math.max(0, endTime - startTime);
    const totalSec = Math.floor(totalMs / 1000);
    const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
    const ss = String(totalSec % 60).padStart(2, '0');

    if (modal) {
      modal.style.display = 'flex';
      if (modalTitle) modalTitle.textContent = `${playerName} — Game Over!`;
      if (modalText) modalText.textContent = `You survived ${mm}:${ss}`;
      if (modalScoreWrap) modalScoreWrap.style.display = 'block';
      if (modalScore) modalScore.textContent = score;
      if (modalTime) modalTime.textContent = `${mm}:${ss}`;
      if (modalPrimary) modalPrimary.textContent = 'Play Again';
    }

    if (score > highScore) {
      highScore = score;
      localStorage.setItem('snake_high', highScore);
      if (uiHigh) uiHigh.textContent = highScore;
    }

    const cw = canvas.closest('.canvas-wrap');
    if (cw) cw.classList.remove('playing');
  }

  // Rendering helpers
  function clearScreen() {
    ctx.fillStyle = '#051015';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawGrid() {
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 1;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
  }

  function drawFood() {
    if (!food) return;
    const age = (nowTime - (food.born || nowTime)) / 1000;
    const pulse = (Math.sin(age * 6) + 1) / 2;
    const base = Math.max(4, Math.floor(cellPixels * 0.28));
    const extra = Math.floor(pulse * Math.max(2, cellPixels * 0.18));
    const size = base + extra;

    const x = (food.x * cellPixels) + cellPixels / 2;
    const y = (food.y * cellPixels) + cellPixels / 2;

    const g = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
    g.addColorStop(0, `rgba(${THEME.danger.r}, ${THEME.danger.g}, ${THEME.danger.b}, 0.95)`);
    g.addColorStop(0.35, `rgba(${THEME.danger.r}, ${THEME.danger.g}, ${THEME.danger.b}, 0.6)`);
    g.addColorStop(1, `rgba(${THEME.danger.r}, ${THEME.danger.g}, ${THEME.danger.b}, 0)`);
    ctx.beginPath();
    ctx.fillStyle = g;
    ctx.arc(x, y, size * 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = `rgba(${THEME.danger.r}, ${THEME.danger.g}, ${THEME.danger.b}, 1)`;
    ctx.arc(x, y, Math.max(4, size * 0.9), 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.arc(x - size * 0.35, y - size * 0.45, Math.max(2, size * 0.28), 0, Math.PI * 2);
    ctx.fill();
  }

  function drawSnake() {
    ctx.save();
    for (let i = snake.length - 1; i >= 0; i--) {
      const s = snake[i];
      const x = Math.floor(s.x * cellPixels);
      const y = Math.floor(s.y * cellPixels);
      const inset = Math.max(1, Math.floor(cellPixels * 0.08));
      const w = Math.max(4, cellPixels - inset * 2);
      const h = w;
      const t = i / Math.max(1, snake.length - 1);

      const r1 = Math.floor(THEME.accent.r * (1 - t) + THEME.accent2.r * t);
      const g1 = Math.floor(THEME.accent.g * (1 - t) + THEME.accent2.g * t);
      const b1 = Math.floor(THEME.accent.b * (1 - t) + THEME.accent2.b * t);
      const r2 = Math.floor(THEME.accent2.r * (1 - t) + THEME.cyan.r * t);
      const g2 = Math.floor(THEME.accent2.g * (1 - t) + THEME.cyan.g * t);
      const b2 = Math.floor(THEME.accent2.b * (1 - t) + THEME.cyan.b * t);

      const grad = ctx.createLinearGradient(x, y, x + w, y + h);
      grad.addColorStop(0, `rgba(${r1},${g1},${b1},1)`);
      grad.addColorStop(1, `rgba(${r2},${g2},${b2},1)`);

      ctx.shadowColor = `rgba(${r1},${g1},${b1},0.28)`;
      ctx.shadowBlur = Math.max(6, Math.floor(cellPixels * 0.12));
      ctx.fillStyle = grad;
      roundRect(ctx, x + inset, y + inset, w, h, Math.max(3, Math.floor(w * 0.18)), true, false);

      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      roundRect(ctx, x + inset + 2, y + inset + 2, w - 4, Math.max(4, Math.floor(h / 3.2)), 4, true, false);
    }

    const head = snake[0];
    if (head) {
      const hx = Math.floor(head.x * cellPixels);
      const hy = Math.floor(head.y * cellPixels);
      const pad = Math.max(2, Math.floor(cellPixels * 0.08));
      const size = Math.max(6, cellPixels - pad * 2);
      const cx = hx + cellPixels / 2;
      const cy = hy + cellPixels / 2;

      const headGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 2.4);
      headGrad.addColorStop(0, `rgba(${THEME.accent2.r},${THEME.accent2.g},${THEME.accent2.b},0.95)`);
      headGrad.addColorStop(0.4, `rgba(${THEME.accent.r},${THEME.accent.g},${THEME.accent.b},0.45)`);
      headGrad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.beginPath();
      ctx.fillStyle = headGrad;
      ctx.arc(cx, cy, size * 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = `rgba(${THEME.accent2.r},${THEME.accent2.g},${THEME.accent2.b},0.9)`;
      ctx.shadowBlur = Math.max(10, Math.floor(cellPixels * 0.25));
      ctx.fillStyle = `rgba(${THEME.accent2.r},${THEME.accent2.g},${THEME.accent2.b},1)`;
      roundRect(ctx, hx + pad, hy + pad, size, size, Math.max(3, Math.floor(size * 0.15)), true, false);

      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.arc(cx + size * 0.18, cy - size * 0.18, Math.max(1, Math.floor(size * 0.12)), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    if (typeof r === 'undefined') r = 5;
    if (typeof stroke === 'undefined') stroke = true;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  function clearScreen() {
    ctx.fillStyle = '#051015';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function draw() {
    clearScreen();
    drawGrid();
    drawFood();
    drawSnake();
  }

  function drawGrid() {
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 1;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
  }

  function loop(now) {
    animationFrameId = requestAnimationFrame(loop);
    nowTime = now;
    if (running && startTime && hudTime) {
      const elapsedMs = Math.max(0, nowTime - startTime);
      const elapsedSec = Math.floor(elapsedMs / 1000);
      const mm = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
      const ss = String(elapsedSec % 60).padStart(2, '0');
      hudTime.textContent = `${mm}:${ss}`;
    }

    if (!running || paused) {
      draw();
      return;
    }
    if (now - lastTick >= tickInterval) {
      lastTick = now;
      tick();
    }
    draw();
  }

  // Input handlers
  window.addEventListener('keydown', (e) => {
    if (!running && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || ['w','a','s','d','W','A','S','D'].includes(e.key))) {
      return startGame();
    }
    switch (e.key) {
      case 'ArrowUp': case 'w': case 'W': setDirection(0, -1); break;
      case 'ArrowDown': case 's': case 'S': setDirection(0, 1); break;
      case 'ArrowLeft': case 'a': case 'A': setDirection(-1, 0); break;
      case 'ArrowRight': case 'd': case 'D': setDirection(1, 0); break;
      case 'p': case 'P':
        if (running) {
          paused = !paused;
          if (modal) modal.style.display = paused ? 'flex' : 'none';
        }
        break;
    }
  });

  document.querySelectorAll('.dpad button').forEach(btn => {
    btn.addEventListener('touchstart', ev => { ev.preventDefault(); const d = btn.dataset.dir; if (d === 'up') setDirection(0, -1); if (d === 'down') setDirection(0, 1); if (d === 'left') setDirection(-1, 0); if (d === 'right') setDirection(1, 0); });
    btn.addEventListener('mousedown', ev => { const d = btn.dataset.dir; if (d === 'up') setDirection(0, -1); if (d === 'down') setDirection(0, 1); if (d === 'left') setDirection(-1, 0); if (d === 'right') setDirection(1, 0); });
  });

  // Buttons wiring
  if (startBtn) startBtn.addEventListener('click', () => startGame());
  if (modalPrimary) modalPrimary.addEventListener('click', () => startGame());
  if (modalSecondary) modalSecondary.addEventListener('click', () => { if (modal) modal.style.display = 'none'; paused = false; });

  if (speedRange) {
    speedRange.addEventListener('input', () => {
      tickSpeed = Number(speedRange.value);
      if (speedVal) speedVal.textContent = tickSpeed;
      tickInterval = 1000 / tickSpeed;
    });
  }

  if (wrapBtn) {
    wrapBtn.addEventListener('click', () => {
      allowWrap = !allowWrap;
      wrapBtn.textContent = allowWrap ? 'Wall Collisions: Off' : 'Wall Collisions: On';
    });
  }

  // Save Player
  if (savePlayer) {
    savePlayer.addEventListener('click', () => {
      const name = (playerNameInput && playerNameInput.value) ? playerNameInput.value.trim() : '';
      const genderRadio = document.querySelector("input[name='gender']:checked");
      if (!name || !genderRadio) {
        if (formError) { formError.style.display = 'block'; setTimeout(() => { if (formError) formError.style.display = 'none'; }, 1500); }
        return;
      }
      playerName = name;
      playerGender = genderRadio.value;
      try { localStorage.setItem('snake_player', JSON.stringify({ name: playerName, gender: playerGender })); } catch (e) {}
      if (playerModal) playerModal.style.display = 'none';
      if (modal) { modal.style.display = 'flex'; if (modalTitle) modalTitle.textContent = `Welcome, ${playerName}`; if (modalText) modalText.textContent = 'Ready to start?'; }
    });
  }

  // Start game wrapper
  function startGame() {
    // try to load saved player if not set
    if (!playerName || playerName === 'Guest') {
      const saved = localStorage.getItem('snake_player');
      if (saved) {
        try {
          const p = JSON.parse(saved);
          if (p.name) playerName = p.name;
          if (p.gender) playerGender = p.gender;
        } catch (e) { /* ignore */ }
      }
      if (!playerName || playerName === 'Guest') {
        if (playerModal) playerModal.style.display = 'flex';
        return;
      }
    }
    resizeCanvas();
    resetGame();
    if (modal) modal.style.display = 'none';
    cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(loop);
  }

  // Prefill saved
  (function maybePrefill() {
    const saved = localStorage.getItem('snake_player');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.name && playerNameInput) playerNameInput.value = p.name;
        if (p.gender) {
          const sel = document.querySelector(input[name="gender"][value="${p.gender}"]);
          if (sel) sel.checked = true;
          playerName = p.name || playerName;
          playerGender = p.gender || playerGender;
        }
      } catch (e) { /* ignore */ }
    }
    if (playerModal) playerModal.style.display = 'flex';
    if (modal) modal.style.display = 'none';
  })();

  // Init
  resizeCanvas();
  animationFrameId = requestAnimationFrame(loop);

  // Expose for debugging
  window._snakeGame = {
    start: startGame,
    pause: () => { paused = true; if (modal) { modal.style.display = 'flex'; if (modalTitle) modalTitle.textContent = 'Paused'; if (modalText) modalText.textContent = 'Press P to resume'; } },
    resume: () => { paused = false; if (modal) modal.style.display = 'none'; },
    setPlayer: (n, g) => { playerName = n; playerGender = g; if (hudName) hudName.textContent = playerName; try { localStorage.setItem('snake_player', JSON.stringify({ name: n, gender: g })); } catch(e){} }
  };

})();