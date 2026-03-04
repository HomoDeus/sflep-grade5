/* ============================================================
   Starter Unit — Join in Again  |  app.js
   All game logic: Alphabet Speed, Simon Says, Reading Quiz,
   Flashcards, Tab switching, Confetti, Audio
   ============================================================ */

'use strict';

// ─── Audio Engine ──────────────────────────────────────────
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioCtx();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playTone(freq, type = 'sine', dur = 0.15, vol = 0.3) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  } catch(e) {}
}

function sfxCorrect() {
  playTone(523, 'sine', 0.12, 0.25);
  setTimeout(() => playTone(659, 'sine', 0.12, 0.25), 100);
  setTimeout(() => playTone(784, 'sine', 0.18, 0.3), 200);
}

function sfxWrong() {
  playTone(220, 'sawtooth', 0.25, 0.3);
}

function sfxStart() {
  [261, 329, 392, 523].forEach((f, i) => setTimeout(() => playTone(f, 'sine', 0.1, 0.2), i * 80));
}

function sfxComplete() {
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 'triangle', 0.2, 0.35), i * 100));
}

// ─── Confetti ───────────────────────────────────────────────
function launchConfetti(count = 60) {
  const colors = ['#6c63ff','#fd79a8','#00cec9','#fdcb6e','#00b894','#a29bfe'];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.cssText = `
      left: ${Math.random() * 100}vw;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      width: ${6 + Math.random() * 8}px;
      height: ${6 + Math.random() * 8}px;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      animation-duration: ${1.5 + Math.random() * 2}s;
      animation-delay: ${Math.random() * 0.5}s;
    `;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

// ─── Tab Switching ──────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.game-section').forEach(s => s.style.display = 'none');
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).style.display = 'block';
  });
});

// ─── Utility ────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ═══════════════════════════════════════════════════════════
//  GAME 1 — ALPHABET SPEED CHALLENGE
// ═══════════════════════════════════════════════════════════
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const alphabetState = {
  score: 0,
  streak: 0,
  active: false,
  timeLeft: 3,
  timerInterval: null,
  roundTimeout: null,
  currentLetter: '',
  askUpper: false, // true = show lower, ask upper; false = show upper, ask lower
};

const scoreEl   = document.getElementById('scoreVal');
const streakEl  = document.getElementById('streakVal');
const promptEl  = document.getElementById('letterPrompt');
const labelEl   = document.getElementById('promptLabel');
const choiceGrid = document.getElementById('choiceGrid');
const resultEl  = document.getElementById('alphabetResult');
const startBtn  = document.getElementById('startAlphabetBtn');
const timerArc  = document.getElementById('timerArc');

function updateTimerArc(ratio) {
  const circ = 169.6;
  timerArc.style.strokeDashoffset = circ * (1 - ratio);
  timerArc.style.stroke = ratio > 0.5 ? '#6c63ff' : ratio > 0.25 ? '#fdcb6e' : '#d63031';
}

function newAlphabetRound() {
  if (!alphabetState.active) return;
  clearInterval(alphabetState.timerInterval);
  clearTimeout(alphabetState.roundTimeout);

  alphabetState.askUpper = Math.random() > 0.5;
  alphabetState.currentLetter = ALPHABET[Math.floor(Math.random() * 26)];
  const correct = alphabetState.currentLetter;

  if (alphabetState.askUpper) {
    promptEl.textContent = correct.toLowerCase();
    labelEl.textContent  = '找出对应的大写字母';
  } else {
    promptEl.textContent = correct;
    labelEl.textContent  = '找出对应的小写字母';
  }

  promptEl.classList.remove('pop');
  void promptEl.offsetWidth;
  promptEl.classList.add('pop');

  // Build choices: 1 correct + 3 wrong
  let pool = ALPHABET.filter(l => l !== correct);
  let wrongs = shuffle(pool).slice(0, 3);
  let choices = shuffle([correct, ...wrongs]);

  choiceGrid.innerHTML = '';
  resultEl.textContent = '';

  choices.forEach(letter => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = alphabetState.askUpper ? letter : letter.toLowerCase();
    btn.addEventListener('click', () => handleAlphabetChoice(btn, letter, correct));
    choiceGrid.appendChild(btn);
  });

  // Timer
  alphabetState.timeLeft = 3;
  updateTimerArc(1);
  alphabetState.timerInterval = setInterval(() => {
    alphabetState.timeLeft -= 0.1;
    updateTimerArc(alphabetState.timeLeft / 3);
    if (alphabetState.timeLeft <= 0) {
      clearInterval(alphabetState.timerInterval);
      timeoutAlphabet();
    }
  }, 100);
}

function handleAlphabetChoice(btn, chosen, correct) {
  if (!alphabetState.active) return;
  clearInterval(alphabetState.timerInterval);

  const isCorrect = chosen === correct;

  // Highlight all btns
  choiceGrid.querySelectorAll('.choice-btn').forEach(b => {
    const bLetter = alphabetState.askUpper ? b.textContent : b.textContent.toUpperCase();
    if (bLetter === correct) b.classList.add('correct');
  });

  if (isCorrect) {
    btn.classList.add('correct');
    alphabetState.score += 10 + alphabetState.streak * 2;
    alphabetState.streak++;
    sfxCorrect();
    resultEl.textContent = `✅ 正确！+${10 + (alphabetState.streak - 1) * 2}`;
    resultEl.style.color = 'var(--success)';
    if (alphabetState.streak > 0 && alphabetState.streak % 5 === 0) launchConfetti(30);
  } else {
    btn.classList.add('wrong');
    alphabetState.streak = 0;
    sfxWrong();
    resultEl.textContent = `❌ 错误！正确答案是 ${alphabetState.askUpper ? correct : correct.toLowerCase()}`;
    resultEl.style.color = 'var(--danger)';
  }

  scoreEl.textContent  = alphabetState.score;
  streakEl.textContent = alphabetState.streak;

  choiceGrid.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
  setTimeout(newAlphabetRound, 900);
}

function timeoutAlphabet() {
  alphabetState.streak = 0;
  sfxWrong();
  resultEl.textContent = '⏰ 超时！';
  resultEl.style.color = 'var(--warning-dark)';
  streakEl.textContent = 0;
  choiceGrid.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
  setTimeout(newAlphabetRound, 900);
}

startBtn.addEventListener('click', () => {
  if (alphabetState.active) {
    // Stop
    alphabetState.active = false;
    clearInterval(alphabetState.timerInterval);
    startBtn.textContent = '▶ 开始游戏';
    startBtn.classList.replace('btn-warning', 'btn-primary');
    resultEl.textContent = `游戏结束！最终得分：${alphabetState.score}`;
    if (alphabetState.score >= 50) { sfxComplete(); launchConfetti(); }
  } else {
    alphabetState.active = true;
    alphabetState.score  = 0;
    alphabetState.streak = 0;
    scoreEl.textContent  = 0;
    streakEl.textContent = 0;
    startBtn.textContent = '⏹ 结束游戏';
    startBtn.classList.replace('btn-primary', 'btn-warning');
    sfxStart();
    newAlphabetRound();
  }
});

// ═══════════════════════════════════════════════════════════
//  GAME 2 — SIMON SAYS
// ═══════════════════════════════════════════════════════════
const ACTIONS = [
  { en: 'Stand up',     zh: '站起来', emoji: '🧍' },
  { en: 'Sit down',     zh: '坐下',   emoji: '🪑' },
  { en: 'Clap hands',   zh: '拍手',   emoji: '👏' },
  { en: 'Touch your nose', zh: '摸鼻子', emoji: '👃' },
  { en: 'Jump',         zh: '跳跃',   emoji: '🦘' },
  { en: 'Spin around',  zh: '转圈',   emoji: '🌀' },
  { en: 'Wave hello',   zh: '招手',   emoji: '👋' },
  { en: 'Touch your head', zh: '摸头', emoji: '🤚' },
];

const simonState = {
  score: 0,
  lives: 3,
  round: 0,
  active: false,
  currentAction: null,
  isSimon: false,
  answered: false,
};

const simonScoreEl    = document.getElementById('simonScore');
const simonLivesEl    = document.getElementById('simonLives');
const simonRoundEl    = document.getElementById('simonRound');
const simonCommandEl  = document.getElementById('simonCommand');
const simonFeedbackEl = document.getElementById('simonFeedback');
const actionGrid      = document.getElementById('actionGrid');
const startSimonBtn   = document.getElementById('startSimonBtn');

function renderLives() {
  simonLivesEl.textContent = '❤️'.repeat(simonState.lives) + '🖤'.repeat(Math.max(0, 3 - simonState.lives));
}

function buildActionGrid() {
  actionGrid.innerHTML = '';
  shuffle(ACTIONS).slice(0, 6).forEach(action => {
    const btn = document.createElement('button');
    btn.className = 'action-btn';
    btn.dataset.action = action.en;
    btn.innerHTML = `<span class="action-emoji">${action.emoji}</span><span>${action.en}</span><span style="font-size:0.75rem;color:var(--text-light);font-weight:600;">${action.zh}</span>`;
    btn.addEventListener('click', () => handleSimonAction(btn, action.en));
    actionGrid.appendChild(btn);
  });
}

function newSimonRound() {
  if (!simonState.active) return;
  simonState.round++;
  simonState.answered = false;
  simonRoundEl.textContent = simonState.round;

  const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
  simonState.currentAction = action.en;
  simonState.isSimon = Math.random() > 0.35; // ~65% Simon says

  const commandText = simonState.isSimon
    ? `Simon says: ${action.en}!`
    : `${action.en}!`;

  simonCommandEl.textContent = commandText;
  simonCommandEl.className = 'simon-command ' + (simonState.isSimon ? 'simon' : 'not-simon');
  simonFeedbackEl.textContent = '';

  // Re-render grid with new shuffle
  buildActionGrid();
  actionGrid.querySelectorAll('.action-btn').forEach(b => b.disabled = false);

  playTone(440, 'sine', 0.08, 0.15);
}

function handleSimonAction(btn, actionName) {
  if (!simonState.active || simonState.answered) return;
  simonState.answered = true;
  actionGrid.querySelectorAll('.action-btn').forEach(b => b.disabled = true);

  const clickedCorrectAction = actionName === simonState.currentAction;

  let correct = false;
  if (simonState.isSimon) {
    // Must do the right action
    correct = clickedCorrectAction;
  } else {
    // Should NOT do anything — clicking anything is wrong
    correct = false;
  }

  if (correct) {
    btn.classList.add('hit-correct');
    simonState.score += 10;
    simonScoreEl.textContent = simonState.score;
    simonFeedbackEl.textContent = '✅ 正确！';
    simonFeedbackEl.style.color = 'var(--success)';
    sfxCorrect();
    if (simonState.score % 50 === 0) launchConfetti(25);
    setTimeout(newSimonRound, 1000);
  } else {
    btn.classList.add('hit-wrong');
    simonState.lives--;
    renderLives();
    sfxWrong();
    if (simonState.isSimon) {
      simonFeedbackEl.textContent = '❌ 做错动作了！';
    } else {
      simonFeedbackEl.textContent = '❌ Simon没说，不能动！';
    }
    simonFeedbackEl.style.color = 'var(--danger)';
    if (simonState.lives <= 0) {
      setTimeout(endSimon, 800);
    } else {
      setTimeout(newSimonRound, 1200);
    }
  }
}

function endSimon() {
  simonState.active = false;
  simonCommandEl.textContent = `游戏结束！最终得分：${simonState.score}`;
  simonCommandEl.className = 'simon-command idle';
  startSimonBtn.textContent = '▶ 再来一局';
  startSimonBtn.classList.replace('btn-warning', 'btn-primary');
  if (simonState.score >= 30) { sfxComplete(); launchConfetti(); }
}

startSimonBtn.addEventListener('click', () => {
  simonState.score  = 0;
  simonState.lives  = 3;
  simonState.round  = 0;
  simonState.active = true;
  simonScoreEl.textContent = 0;
  simonRoundEl.textContent = 0;
  renderLives();
  startSimonBtn.textContent = '⏹ 游戏中...';
  startSimonBtn.classList.replace('btn-primary', 'btn-warning');
  startSimonBtn.disabled = true;
  sfxStart();
  setTimeout(() => { startSimonBtn.disabled = false; }, 500);
  newSimonRound();
});

// ═══════════════════════════════════════════════════════════
//  GAME 3 — READING QUIZ
// ═══════════════════════════════════════════════════════════
const QUIZ = [
  {
    q: "What is the boy's name?",
    opts: ['Tom', 'Lucy', 'Miss Green', 'Jack'],
    ans: 0
  },
  {
    q: 'How old is Tom?',
    opts: ['8', '9', '10', '11'],
    ans: 2
  },
  {
    q: "What is the friend's name?",
    opts: ['Kate', 'Lucy', 'Ann', 'Mary'],
    ans: 1
  },
  {
    q: "What is the teacher's name?",
    opts: ['Miss White', 'Miss Black', 'Miss Green', 'Miss Blue'],
    ans: 2
  },
  {
    q: 'Are Tom and Lucy in the same class?',
    opts: ['Yes', 'No', 'Not mentioned', 'Maybe'],
    ans: 0
  }
];

const quizContainer   = document.getElementById('quizContainer');
const readingResultEl = document.getElementById('readingResult');
let quizAnswered = new Array(QUIZ.length).fill(false);

function buildQuiz() {
  quizContainer.innerHTML = '';
  QUIZ.forEach((q, qi) => {
    const card = document.createElement('div');
    card.className = 'question-card';
    card.innerHTML = `
      <div class="question-text">${qi + 1}. ${q.q}</div>
      <div class="options-grid" id="opts-${qi}"></div>
      <div id="qfeedback-${qi}" style="margin-top:0.5rem; font-size:0.85rem; font-weight:700; min-height:1.2rem;"></div>
    `;
    const grid = card.querySelector(`#opts-${qi}`);
    q.opts.forEach((opt, oi) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = opt;
      btn.addEventListener('click', () => handleQuizAnswer(qi, oi, btn, grid));
      grid.appendChild(btn);
    });
    quizContainer.appendChild(card);
  });
}

function handleQuizAnswer(qi, oi, btn, grid) {
  if (quizAnswered[qi]) return;
  quizAnswered[qi] = true;
  const correct = QUIZ[qi].ans === oi;
  grid.querySelectorAll('.option-btn').forEach((b, i) => {
    b.disabled = true;
    if (i === QUIZ[qi].ans) b.classList.add(correct ? 'correct' : 'reveal-correct');
  });
  if (!correct) btn.classList.add('wrong');
  const fb = document.getElementById(`qfeedback-${qi}`);
  if (correct) {
    fb.textContent = '✅ 正确！';
    fb.style.color = 'var(--success)';
    sfxCorrect();
  } else {
    fb.textContent = `❌ 正确答案是：${QUIZ[qi].opts[QUIZ[qi].ans]}`;
    fb.style.color  = 'var(--danger)';
    sfxWrong();
  }
  // Check all done
  if (quizAnswered.every(Boolean)) {
    const score = quizAnswered.filter((_, i) => QUIZ[i].ans === /* need to track */ 0).length;
    readingResultEl.innerHTML = `<div class="alert alert-success">🎉 全部完成！做得好！</div>`;
    sfxComplete(); launchConfetti();
  }
}

buildQuiz();

// ═══════════════════════════════════════════════════════════
//  GAME 4 — FLASHCARDS
// ═══════════════════════════════════════════════════════════
const FLASHCARDS = [
  { en: 'Hello',        zh: '你好' },
  { en: 'Goodbye',      zh: '再见' },
  { en: 'Thank you',    zh: '谢谢' },
  { en: 'Sorry',        zh: '对不起' },
  { en: 'Please',       zh: '请' },
  { en: 'Yes',          zh: '是的' },
  { en: 'No',           zh: '不' },
  { en: 'Friend',       zh: '朋友' },
  { en: 'Teacher',      zh: '老师' },
  { en: 'Student',      zh: '学生' },
];

let currentCard = 0;
const flashcard    = document.getElementById('flashcard');
const cardCounter  = document.getElementById('cardCounter');
const prevCardBtn  = document.getElementById('prevCard');
const nextCardBtn  = document.getElementById('nextCard');
const frontFace    = flashcard.querySelector('.flashcard-front');
const backFace     = flashcard.querySelector('.flashcard-back');

function renderCard() {
  const card = FLASHCARDS[currentCard];
  frontFace.textContent = card.en;
  backFace.innerHTML    = `<div>${card.zh}</div><div style="font-size:0.9rem;margin-top:0.5rem;opacity:0.8;">${card.en}</div>`;
  cardCounter.textContent = `${currentCard + 1} / ${FLASHCARDS.length}`;
  flashcard.classList.remove('flipped');
}

flashcard.addEventListener('click', () => {
  flashcard.classList.toggle('flipped');
  playTone(440, 'sine', 0.08, 0.15);
});

prevCardBtn.addEventListener('click', () => {
  currentCard = (currentCard - 1 + FLASHCARDS.length) % FLASHCARDS.length;
  renderCard();
  playTone(330, 'sine', 0.08, 0.15);
});

nextCardBtn.addEventListener('click', () => {
  currentCard = (currentCard + 1) % FLASHCARDS.length;
  renderCard();
  playTone(440, 'sine', 0.08, 0.15);
});

renderCard();
