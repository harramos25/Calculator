const exprEl = document.getElementById("expr");
const resultEl = document.getElementById("result");
const overlay = document.getElementById("overlay");
const closeBtn = document.getElementById("closeBtn");
const toast = document.getElementById("toast");
const processing = document.getElementById("processing");
const confetti = document.getElementById("confetti");

let expr = "0";
let pendingAnswer = null;

// Audio Context for "Boop"
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

const playBoop = () => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'square'; // 8-bit vibe
  osc.frequency.setValueAtTime(440, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.1);

  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
};

const safeEval = (s) => {
  // allow digits, operators, parentheses, decimal, spaces
  if (!/^[0-9+\-*/().\s]+$/.test(s)) throw new Error("Invalid");
  // eslint-disable-next-line no-new-func
  const val = Function('"use strict";return (' + s + ')')();
  if (!Number.isFinite(val)) throw new Error("Math error");
  return val;
};

const render = () => {
  exprEl.textContent = expr;
};

const setResult = (text) => {
  resultEl.textContent = text;
};

const pressValue = (v) => {
  if (expr === "0" && /[0-9.]/.test(v)) expr = v === "." ? "0." : v;
  else expr += v;
  render();
};

const backspace = () => {
  if (expr.length <= 1) expr = "0";
  else expr = expr.slice(0, -1);
  render();
};

const clearAll = () => {
  expr = "0";
  pendingAnswer = null;
  setResult("\u00A0");
  resultEl.classList.remove("pop");
  render();
};

const openPaywall = () => {
  // compute answer but don't show yet
  try {
    const val = safeEval(expr.replaceAll("×", "*").replaceAll("÷", "/"));
    pendingAnswer = Number.isInteger(val) ? String(val) : String(+val.toFixed(10)).replace(/\.?0+$/, "");
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");
  } catch (e) {
    setResult("error 😭");
  }
};

const closePaywall = () => {
  overlay.classList.remove("show");
  overlay.setAttribute("aria-hidden", "true");
  // reset selection
  document.querySelectorAll(".paybtn").forEach(b => b.classList.remove("selected"));
};

const showToast = (msg) => {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1400);
};

const burstConfetti = (count = 26) => {
  confetti.innerHTML = "";
  confetti.classList.add("show");

  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    p.className = "piece";
    const left = Math.random() * 100;
    const delay = Math.random() * 0.15;
    const dur = 0.9 + Math.random() * 0.7;

    // random pastel colors without hardcoding a palette list
    const hue = Math.floor(Math.random() * 360);
    p.style.left = left + "vw";
    p.style.animationDelay = delay + "s";
    p.style.animationDuration = dur + "s";
    p.style.background = `hsl(${hue} 90% 70%)`;

    // random size
    const w = 8 + Math.random() * 10;
    const h = 10 + Math.random() * 14;
    p.style.width = w + "px";
    p.style.height = h + "px";

    confetti.appendChild(p);
  }

  setTimeout(() => confetti.classList.remove("show"), 1500);
};

const fakePay = async (btn) => {
  const method = btn.dataset.pay;

  // Visual selection logic
  document.querySelectorAll(".paybtn").forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");

  // Short delay to see selection before processing
  await new Promise(r => setTimeout(r, 400));

  // "processing" overlay on the calculator display
  closePaywall();
  processing.classList.add("show");

  const messages = {
    gcash: "Sending to GCash… 💙",
    card: "Swiping card… 💳",
    maya: "Maya magic… 💚",
    cod: "Rider is on the way… 🛵"
  };
  // Show a cute little status on result line
  setResult(messages[method] || "Processing…");

  await new Promise(r => setTimeout(r, 900));

  processing.classList.remove("show");
  setResult(pendingAnswer ?? "0");

  // Trigger result pop animation
  resultEl.classList.remove("pop");
  void resultEl.offsetWidth; // restart animation
  resultEl.classList.add("pop");

  showToast("Paid ✅ Answer unlocked 💗");
  burstConfetti();
};

document.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  // Play boop for all buttons
  playBoop();

  const value = btn.dataset.value;
  const action = btn.dataset.action;

  if (value) {
    // prevent double operators like ++ (keep it simple)
    pressValue(value);
    return;
  }

  if (action === "back") backspace();
  if (action === "clear") clearAll();
  if (action === "equals") openPaywall();
  if (action === "tip") showToast("Tip: pay to unlock math 🤭");
});

closeBtn.addEventListener("click", closePaywall);
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closePaywall();
});

document.querySelectorAll(".paybtn").forEach(b => {
  b.addEventListener("click", () => fakePay(b));
});

// init
render();
