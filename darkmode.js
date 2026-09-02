/* --- Darkmode.js အစ --- */

const modeToggle = document.getElementById('modeToggle');

// SVG ပုံများ
const sunSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;

const moonSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

const bookSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`;

// Mobile Status Bar အရောင် ပြောင်းပေးသည့် Function
function updateStatusBar(color) {
  const metaTheme = document.querySelector("meta[name='theme-color']");
  if (metaTheme) {
    metaTheme.setAttribute("content", color);
  }
}

// Mode အလိုက် SVG Icon နှင့် Status Bar အရောင်များကို Update လုပ်သည့် Function
function setIconAndStatusBar() {
  if (document.body.classList.contains('reading-mode')) {
    modeToggle.innerHTML = bookSVG;
    updateStatusBar('#f4ecd8'); // Reading Mode အတွက် ဝါညိုရောင်
  } else if (document.body.classList.contains('dark-mode')) {
    modeToggle.innerHTML = moonSVG;
    updateStatusBar('#000000'); // Dark Mode အတွက် အနက်ရောင်
  } else {
    modeToggle.innerHTML = sunSVG;
    updateStatusBar('#ffffff'); // Normal/Light Mode အတွက် အဖြူရောင်
  }
}

// စာမျက်နှာ စဖွင့်ချိန်တွင် အရင်ရွေးထားသော Mode ရှိမရှိ စစ်ဆေးခြင်း
const savedTheme = localStorage.getItem('theme-mode');
if (savedTheme === 'reading') {
  document.body.classList.add('reading-mode');
} else if (savedTheme === 'dark') {
  document.body.classList.add('dark-mode');
}

// စတင်ပွင့်ချိန်တွင် Icon နှင့် Status Bar ကို သတ်မှတ်ခြင်း
setIconAndStatusBar();

// ခလုတ်နှိပ်သည့်အခါ Mode များ အလှည့်ကျပြောင်းလဲပုံ
if (modeToggle) {
  modeToggle.addEventListener('click', () => {
    const body = document.body;

    if (!body.classList.contains('reading-mode') && !body.classList.contains('dark-mode')) {
      // ၁။ အဖြူရောင်မှ Reading Mode သို့ပြောင်းခြင်း
      body.classList.add('reading-mode');
      localStorage.setItem('theme-mode', 'reading');
    } 
    else if (body.classList.contains('reading-mode')) {
      // ၂။ Reading Mode မှ Dark Mode သို့ပြောင်းခြင်း
      body.classList.remove('reading-mode');
      body.classList.add('dark-mode');
      localStorage.setItem('theme-mode', 'dark');
    } 
    else {
      // ၃။ Dark Mode မှ အဖြူရောင် (Default) သို့ ပြန်သွားခြင်း
      body.classList.remove('dark-mode');
      localStorage.setItem('theme-mode', 'white');
    }

    setIconAndStatusBar(); // Icon နှင့် Status Bar ကို တစ်ပြိုင်နက် Update လုပ်ခြင်း
  });
}

/* --- Darkmode.js အဆုံး --- */
