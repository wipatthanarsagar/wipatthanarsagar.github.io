'use strict';

// 🌟 ptext.js နှင့် ptext1.js ထဲက စာသား Array များကို Import လုပ်ပါတယ်
import { ptextChapters } from './ptext.js';
import { ptextChapters1 } from './ptext1.js';

/* == GLOBAL STATE == */
let currentLineHeight = 2.0;
let currentLetterSpacing = 0;
let restoreTimer = null;
let fontResizeObserver = null; 

/* == SEMANTIC SYSTEM & DYNAMIC UI GENERATION == */
function buildSemanticParagraphs() {
    let globalIndex = 1;
    
    // စာသားတွေ dynamic ဝင်မယ့် အဓိက Container နှင့် မာတိကာ Container ကို ဖမ်းယူခြင်း
    const container = document.getElementById('js-audio-chapters-container') || document.querySelector('.audio-chapters-list');
    const tocList = document.getElementById('toc-list');
    
    if (!container) return;
    container.innerHTML = ''; // Container အဟောင်းကို ရှင်းထုတ်ခြင်း

    if (tocList) tocList.innerHTML = ''; // မာတိကာအဟောင်းကို ရှင်းထုတ်ခြင်း

    // 🌟 ptext.js ကော ptext1.js ကပါ Array များကို စုစည်းပေါင်းစပ်ခြင်း (မရှိခဲ့လျှင်လည်း Error မတက်အောင် ကာကွယ်ထားပါသည်)
    const chaptersPart1 = typeof ptextChapters !== 'undefined' ? ptextChapters : [];
    const chaptersPart2 = typeof ptextChapters1 !== 'undefined' ? ptextChapters1 : [];
    const allChapters = [...chaptersPart1, ...chaptersPart2];
    
    allChapters.forEach((chapter) => {
        // --- ၁။ HTML အတွင်း Section နှင့် ခေါင်းစဉ် (H1/H2/H3) ၊ အသံဖွင့်ခလုတ်ကို Dynamic ဆောက်ခြင်း ---
        const section = document.createElement('section');
        section.id = chapter.id;
        section.style.marginBottom = "25px";

        // 🌟 ptext.js က ပေးလိုက်တဲ့ headerTag (h1, h2, h3) အတိုင်း ယူပါမည်။ မပါရင် h3 လို့ ပုံမှန်အတိုင်း သတ်မှတ်ပါမည်။
        const headerTagName = chapter.headerTag || 'h3'; 
        const headerElement = document.createElement(headerTagName); 
        
        // အသံဖိုင်ရှိလျှင် ဖွင့်ရန် ခလုတ်ထည့်မည်
        if (chapter.audio) {
            const btn = document.createElement('button');
            btn.className = 'speaker-btn';
            btn.textContent = '🔊';
            
            // pati-audio.js ဘက်က Next/Prev စနစ်တွေအတွက် data attribute ထည့်ပေးထားခြင်း
            btn.setAttribute('data-src', chapter.audio);
            btn.setAttribute('data-title', chapter.title);
            
            btn.onclick = function() {
                if (typeof window.togglePaperAudio === 'function') {
                    window.togglePaperAudio(btn, chapter.audio, chapter.title);
                }
            };
            headerElement.appendChild(btn);
            headerElement.appendChild(document.createTextNode(' ' + chapter.title));
        } else {
            headerElement.textContent = chapter.title;
        }
        
        section.appendChild(headerElement);
        container.appendChild(section);

        // --- ၂။ မာတိကာ (TOC List) ကိုပါ Dynamic အလိုအလျောက် ထည့်သွင်းခြင်း ---
        if (tocList) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#${chapter.id}`;
            a.className = chapter.tocClass || 'title'; 
            a.textContent = chapter.title;
            a.onclick = function() {
                if (typeof window.toggleTOC === 'function') window.toggleTOC();
            };
            li.appendChild(a);
            tocList.appendChild(li);
        }

        // --- ၃။ ကျမ်းစာ စာပိုဒ်များကို ခွဲထုတ်တည်ဆောက်ခြင်း ---
        if (chapter.content) {
            const rawText = chapter.content.trim();
            const paragraphs = rawText
                .split(/\n\s*\n/)
                .filter(p => p.trim() !== '');

            paragraphs.forEach((text) => {
                const cleanText = text.trim();

                // ===== GAP SYSTEM =====
                if (cleanText === '@@gap') {
                    const gap = document.createElement('div');
                    gap.className = 'big-gap';
                    section.appendChild(gap);
                    return;
                }

                // ===== PARAGRAPH =====
                const p = document.createElement('p');
                p.setAttribute('data-p', globalIndex);
                p.textContent = cleanText;

                section.appendChild(p);
                globalIndex++;
            });
        }
    });
}

function saveReadingPosition() {
    const paragraphs = document.querySelectorAll('article p');
    let currentParagraph = null;
    let offsetRatio = 0;
    const viewportCenter = window.innerHeight / 2;

    paragraphs.forEach(p => {
        const rect = p.getBoundingClientRect();
        if (rect.top <= viewportCenter && rect.bottom >= viewportCenter) {
            currentParagraph = p.dataset.p;
            offsetRatio = (viewportCenter - rect.top) / rect.height;
        }
    });

    if (currentParagraph) {
        localStorage.setItem(
            'readingPosition',
            JSON.stringify({
                paragraph: currentParagraph,
                offsetRatio: offsetRatio
            })
        );
    }
}

function restoreReadingPosition() {
    const saved = localStorage.getItem('readingPosition');
    if (!saved) return;
    let data;
    try {
        data = JSON.parse(saved);
    } catch {
        return;
    }

    const target = document.querySelector(`[data-p="${data.paragraph}"]`);
    if (!target) return;
    
    const paragraphHeight = target.offsetHeight;
    const offsetInsideParagraph = paragraphHeight * (data.offsetRatio || 0);
    const absoluteTop = target.getBoundingClientRect().top + window.scrollY;
    
    const viewportCenter = window.innerHeight / 2;
    const finalY = absoluteTop + offsetInsideParagraph - viewportCenter;
    
    window.scrollTo({
        top: finalY,
        behavior: 'auto'
    });
}

function triggerLayoutObserver() {
    if (fontResizeObserver) {
        fontResizeObserver.disconnect();
    }

    const articleElement = document.querySelector('article');
    if (!articleElement) return;

    fontResizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
            restoreReadingPosition();
            fontResizeObserver.disconnect();
            fontResizeObserver = null;
        }
    });

    fontResizeObserver.observe(articleElement);
}

/* == TOGGLE SYSTEM == */
function toggleTOC() {
    const tocOverlay = document.getElementById('toc-overlay');
    if (!tocOverlay) return;
    const isOpening = tocOverlay.style.display !== 'block';
    if (isOpening) {
        tocOverlay.style.display = 'block';
        setTimeout(() => {
            const activeItem = document.querySelector('.active-chapter');
            const tocList = document.querySelector('.toc-list');
            if (activeItem && tocList) {
                activeItem.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }, 100);
    } else {
        tocOverlay.style.display = 'none';
        clearTOCSearch();
    }
}

function toggleSetting() {
    const settingOverlay = document.getElementById('setting-overlay');
    if (!settingOverlay) return;
    const isVisible = settingOverlay.style.display === 'block';
    settingOverlay.style.display = isVisible ? 'none' : 'block';
}

function downloadPDF() {
    toggleSetting();
    setTimeout(() => {
        window.print();
    }, 500);
}

function toggleReadingMode() {
    document.body.classList.toggle('focus-mode');
}




/*function toggleReadingMode() {
    document.body.classList.toggle('focus-mode');
    const fsBtn = document.getElementById('fs-btn');
    if (document.body.classList.contains('focus-mode')) {
        fsBtn.innerHTML = '✖';
        fsBtn.style.background = 'rgba(234, 222, 188, 0.2)';
    } else {
        fsBtn.innerHTML = '⛶';
        fsBtn.style.background = 'rgba(234, 222, 188, 0.4)';
    }
}*/

/* == LAST READ SYSTEM == */
function saveCurrentPage() {
    const activeChapterLink = document.querySelector('.active-chapter');
    if (activeChapterLink) {
        localStorage.setItem('lastReadTitle', activeChapterLink.textContent);
    } else {
        localStorage.setItem('lastReadTitle', document.title);
    }
    localStorage.setItem('lastReadUrl', window.location.href);
}

// သီးခြားခွဲထားသော Show Last Read Link Function
function showLastReadLink() {
    const lastTitle = localStorage.getItem('lastReadTitle');
    const lastUrl = localStorage.getItem('lastReadUrl');
    const lastReadContainer = document.getElementById('last-read-container');
    if (
        lastTitle &&
        lastUrl &&
        window.location.href !== lastUrl &&
        lastReadContainer
    ) {
        lastReadContainer.innerHTML = `
            <div style="background: #eadebc; border: 1px solid #443300; padding: 15px; margin: 10px; border-radius: 8px; text-align:center;">
                <p style="color: #443300; font-size: 14px; margin-bottom: 5px;">
                    သင်နောက်ဆုံး ဖတ်လက်စအပိုင်း -
                </p>
                <a href="${lastUrl}" style="color: #443300; font-weight: bold; text-decoration: none;">
                    📖 ${lastTitle} သို့ ပြန်သွားရန်
                </a>
            </div>
        `;
    }
}

/* == LINE HEIGHT SYSTEM == */
function applyLineHeight() {
    const content = document.getElementById('reading-content');
    if (content) {
        content.style.lineHeight = currentLineHeight;
    }
    const lhDisplay = document.getElementById('lh-display');
    if (lhDisplay) {
        lhDisplay.innerText = currentLineHeight.toFixed(1);
    }
    const lineButtons = document.querySelectorAll('.line-btn');
    lineButtons.forEach(btn => {
        btn.classList.remove('active-preset');
        if (parseFloat(btn.dataset.value) === currentLineHeight) {
            btn.classList.add('active-preset');
        }
    });
    localStorage.setItem('userLineHeight', currentLineHeight);
}

function adjustLineHeight(amount) {
    saveReadingPosition();
    let next = Math.round((currentLineHeight + amount) * 10) / 10;
    if (next >= 1.0 && next <= 100.0) {
        currentLineHeight = next;
        triggerLayoutObserver();
        applyLineHeight();
    }
}

/* == LETTER SPACING SYSTEM == */
function applyLetterSpacing() {
    const content = document.getElementById('reading-content');
    if (content) {
        content.style.letterSpacing = currentLetterSpacing + 'px';
    }
    const lsDisplay = document.getElementById('ls-display');
    if (lsDisplay) {
        lsDisplay.innerText = currentLetterSpacing;
    }
    const letterButtons = document.querySelectorAll('.letter-btn');
    letterButtons.forEach(btn => {
        btn.classList.remove('active-preset');
        if (parseFloat(btn.dataset.value) === currentLetterSpacing) {
            btn.classList.add('active-preset');
        }
    });
    localStorage.setItem('userLetterSpacing', currentLetterSpacing);
}

function adjustLetterSpacing(amount) {
    saveReadingPosition();
    let next = Math.round((currentLetterSpacing + amount) * 10) / 10;
    if (next >= 0 && next <= 10) {
        currentLetterSpacing = next;
        triggerLayoutObserver();
        applyLetterSpacing();
    }
}

/* == TOC SEARCH == */
function clearTOCSearch() {
    const tocSearch = document.getElementById('toc-search');
    const tocItems = document.querySelectorAll('.toc-list li');
    if (tocSearch) {
        tocSearch.value = '';
    }
    tocItems.forEach(item => {
        item.style.display = 'block';
    });
}

/* == FONT SIZE SYSTEM == */
let fontSize = parseInt(localStorage.getItem('userFontSize')) || 25;

function renderFontSize() {
    const articleElement = document.querySelector('article');
    if (articleElement) {
        articleElement.style.fontSize = fontSize + 'px';
    }
    const fontDisplay = document.getElementById('font-size-display');
    if (fontDisplay) {
        fontDisplay.textContent = fontSize;
    }
    const sizeTens = document.getElementById('size-tens');
    const sizeOnes = document.getElementById('size-ones');
    if (sizeTens) {
        sizeTens.textContent = Math.floor(fontSize / 10);
    }
    if (sizeOnes) {
        sizeOnes.textContent = fontSize % 10;
    }
    localStorage.setItem('userFontSize', fontSize);
}

function changeFontSize(amount) {
    saveReadingPosition();
    const next = fontSize + amount;
    if (next >= 10 && next <= 70) {
        fontSize = next;
        triggerLayoutObserver();
        renderFontSize();
    }
}

/* == FONT WEIGHT SYSTEM == */
let currentWeight = parseInt(localStorage.getItem('userFontWeight')) || 500;

function renderWeight() {
    const articleElement = document.querySelector('article');
    if (articleElement) {
        articleElement.style.fontWeight = currentWeight;
    }
    const hundreds = document.getElementById('digit-hundreds');
    const tens = document.getElementById('digit-tens');
    const ones = document.getElementById('digit-ones');
    if (hundreds) {
        hundreds.textContent = Math.floor(currentWeight / 100);
    }
    if (tens) {
        tens.textContent = Math.floor((currentWeight % 100) / 10);
    }
    if (ones) {
        ones.textContent = currentWeight % 10;
    }
    
    const weightButtons = document.querySelectorAll('#weight-buttons .preset-btn');
    weightButtons.forEach(btn => {
        btn.classList.toggle('active-preset', parseInt(btn.dataset.weight) === currentWeight);
    });
    localStorage.setItem('userFontWeight', currentWeight);
}

function changeWeight(amount) {
    saveReadingPosition();
    const next = currentWeight + amount;
    if (next >= 100 && next <= 900) {
        currentWeight = next;
        triggerLayoutObserver();
        renderWeight();
    }
}

/* == 🌟 CUSTOM COLOR PICKER & HISTORY SYSTEM == */
const HEX_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

function applyCustomColors(textColor, bgColor, saveToHistory = true) {
    const contentArea = document.getElementById('reading-content');
    if (contentArea) {
        contentArea.style.color = textColor;
    }
    document.body.style.backgroundColor = bgColor;
    
    // Dark/Reading mode overrides ကို တားဆီးရန် Flag သတ်မှတ်ခြင်း
    window.__customColorActive = true;
    localStorage.setItem('customColorActive', 'true');
    localStorage.setItem('customTextColor', textColor);
    localStorage.setItem('customBgColor', bgColor);

    if (saveToHistory) {
        addColorHistory(textColor, bgColor);
    }
}

function loadSavedCustomColors() {
    const isActive = localStorage.getItem('customColorActive');
    if (isActive === 'true') {
        const textCol = localStorage.getItem('customTextColor');
        const bgCol = localStorage.getItem('customBgColor');
        if (textCol && bgCol) {
            const contentArea = document.getElementById('reading-content');
            if (contentArea) contentArea.style.color = textCol;
            document.body.style.backgroundColor = bgCol;
            window.__customColorActive = true;
            
            const txtInput = document.getElementById('custom-text-color');
            const bgInput = document.getElementById('custom-bg-color');
            if (txtInput) txtInput.value = textCol;
            if (bgInput) bgInput.value = bgCol;
        }
    }
    renderColorHistory();
}

function addColorHistory(textColor, bgColor) {
    let history = JSON.parse(localStorage.getItem('colorHistoryList')) || [];
    // ထပ်နေတာရှိရင် ဖယ်မယ်
    history = history.filter(item => !(item.textColor === textColor && item.bgColor === bgColor));
    
    history.unshift({
        textColor: textColor,
        bgColor: bgColor,
        favorite: false
    });

    // မူလ History ၅ ခုထိန်းသိမ်းရန် (Favorite ပါလျှင် မဖျက်ဘဲ ဆက်ထားမည်)
    let favorites = history.filter(item => item.favorite);
    let nonFavorites = history.filter(item => !item.favorite);

    if (nonFavorites.length > 5) {
        nonFavorites = nonFavorites.slice(0, 5);
    }
    
    localStorage.setItem('colorHistoryList', JSON.stringify([...favorites, ...nonFavorites]));
    renderColorHistory();
}

function renderColorHistory() {
    const container = document.getElementById('color-chips-list');
    if (!container) return;
    container.innerHTML = '';

    let history = JSON.parse(localStorage.getItem('colorHistoryList')) || [];
    if (history.length === 0) {
        container.innerHTML = '<span style="font-size:12px; color:#443300; text-align:center; display:block;">မှတ်သားထားသော အရောင်များ မရှိသေးပါ</span>';
        return;
    }

    history.forEach((item, index) => {
        const chip = document.createElement('div');
        chip.className = 'color-chip-item';
        chip.style.backgroundColor = item.bgColor;
        chip.style.color = item.textColor;

        chip.innerHTML = `
            <div class="color-chip-info">
                <div class="color-preview-box" style="background:${item.bgColor}; color:${item.textColor}; border-color:${item.textColor};"></div>
                <span>စာ: ${item.textColor} | နောက်: ${item.bgColor}</span>
            </div>
            <div class="color-chip-actions">
                <button class="fav-btn" title="Favorite">${item.favorite ? '★' : '☆'}</button>
                <button class="del-btn" title="Delete">🗑</button>
            </div>
        `;

        // Chip ကို နှိပ်လျှင် အရောင် ತန်းပြောင်းရန်
        chip.querySelector('.color-chip-info').onclick = () => {
            const txtInput = document.getElementById('custom-text-color');
            const bgInput = document.getElementById('custom-bg-color');
            if (txtInput) txtInput.value = item.textColor;
            if (bgInput) bgInput.value = item.bgColor;
            applyCustomColors(item.textColor, item.bgColor, false);
        };

        // Favorite ခလုတ်
        chip.querySelector('.fav-btn').onclick = (e) => {
            e.stopPropagation();
            history[index].favorite = !history[index].favorite;
            localStorage.setItem('colorHistoryList', JSON.stringify(history));
            renderColorHistory();
        };

        // Delete ခလုတ် (Confirmation ပါဝင်သည်)
        chip.querySelector('.del-btn').onclick = (e) => {
            e.stopPropagation();
            if (confirm('ဤအရောင်ကို ဖျက်ရန် သေချာပါသလား?')) {
                history.splice(index, 1);
                localStorage.setItem('colorHistoryList', JSON.stringify(history));
                renderColorHistory();
            }
        };

        container.appendChild(chip);
    });
}

function resetCustomColors() {
    localStorage.removeItem('customColorActive');
    localStorage.removeItem('customTextColor');
    localStorage.removeItem('customBgColor');
    window.__customColorActive = false;

    const txtInput = document.getElementById('custom-text-color');
    const bgInput = document.getElementById('custom-bg-color');
    if (txtInput) txtInput.value = '';
    if (bgInput) bgInput.value = '';

    // မူလ Dark/Light/Reading Mode အခြေအနေသို့ ပြန်လည်သက်ရောက်စေရန်
    const contentArea = document.getElementById('reading-content');
    if (contentArea) contentArea.style.color = '';
    document.body.style.backgroundColor = '';
    location.reload();
}

/* == MAIN INIT == */
function init() {
    const article = document.querySelector('article');
    const tocSearch = document.getElementById('toc-search');
    
    // 🌟 Dynamic ပုံစံဖြင့် စာသား၊ ခေါင်းစဉ်နှင့် မာတိကာများကို ဆောက်လုပ်ခြင်း
    buildSemanticParagraphs();
    
    const tocItems = document.querySelectorAll('.toc-list li');

    /* ===== LOAD & APPLY ALL SAVED SETTINGS ===== */
    const savedLH = localStorage.getItem('userLineHeight');
    if (savedLH !== null) {
        currentLineHeight = parseFloat(savedLH);
    }
    applyLineHeight();
    
    const savedLS = localStorage.getItem('userLetterSpacing');
    if (savedLS !== null) {
        currentLetterSpacing = parseFloat(savedLS);
    }
    applyLetterSpacing();

    const savedFS = localStorage.getItem('userFontSize');
    if (savedFS !== null) {
        fontSize = parseInt(savedFS);
    }
    renderFontSize();

    const savedFW = localStorage.getItem('userFontWeight');
    if (savedFW !== null) {
        currentWeight = parseInt(savedFW);
    }
    renderWeight();
    
    // Custom Color ကို စတင်ချိန်တွင် စစ်ဆေးတင်ခြင်း
    loadSavedCustomColors();

    /* ===== CUSTOM COLOR EVENT LISTENERS ===== */
    const applyBtn = document.getElementById('apply-custom-color');
    const resetBtn = document.getElementById('reset-custom-color');
    
    if (applyBtn) {
        applyBtn.onclick = () => {
            const txtInput = document.getElementById('custom-text-color');
            const bgInput = document.getElementById('custom-bg-color');
            const txtVal = txtInput ? txtInput.value.trim() : '';
            const bgVal = bgInput ? bgInput.value.trim() : '';

            if (!HEX_REGEX.test(txtVal) || !HEX_REGEX.test(bgVal)) {
                alert('ကျေးဇူးပြု၍ မှန်ကန်သော Hex Color ကုဒ်များ (ဥပမာ - #5b4636 သို့မဟုတ် #fff) ကို ထည့်သွင်းပေးပါ။');
                return;
            }
            applyCustomColors(txtVal, bgVal, true);
        };
    }

    if (resetBtn) {
        resetBtn.onclick = () => {
            resetCustomColors();
        };
    }
    
    /* ===== LAST READ ===== */
    saveCurrentPage();
    showLastReadLink();

    /* ===== INITIAL RESTORE WITH OBSERVER ===== */
    triggerLayoutObserver(); 
    
    let readingTimer;
    window.addEventListener('scroll', () => {
        clearTimeout(readingTimer);
        readingTimer = setTimeout(() => {
            saveReadingPosition();
            saveCurrentPage(); 
        }, 200);
    });
    
    /* ===== TOC ACTIVE ===== */
    const sections = document.querySelectorAll('article section');
    const tocLinks = document.querySelectorAll('.toc-list li a');
    const observerOptions = {
        root: null,
        rootMargin: '-10% 0px -70% 0px',
        threshold: 0
    };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                tocLinks.forEach(link => {
                    link.classList.remove('active-chapter');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active-chapter');
                        localStorage.setItem('lastReadChapter', id);
                    }
                });
            }
        });
    }, observerOptions);
    sections.forEach(section => {
        observer.observe(section);
    });
    
    /* ===== LINE HEIGHT BUTTONS ===== */
    const lineButtons = document.querySelectorAll('.line-btn');
    lineButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            saveReadingPosition();
            currentLineHeight = parseFloat(btn.dataset.value);
            triggerLayoutObserver();
            applyLineHeight();
        });
    });
    
    /* ===== LETTER SPACING BUTTONS ===== */
    const letterButtons = document.querySelectorAll('.letter-btn');
    letterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            saveReadingPosition();
            currentLetterSpacing = parseFloat(btn.dataset.value);
            triggerLayoutObserver();
            applyLetterSpacing();
        });
    });
    
    /* ===== FONT SIZE BUTTON EVENTS ===== */
    const fontIncrease = document.getElementById('font-increase');
    if (fontIncrease) fontIncrease.onclick = () => { changeFontSize(1); };
    
    const fontDecrease = document.getElementById('font-decrease');
    if (fontDecrease) fontDecrease.onclick = () => { changeFontSize(-1); };
    
    const sizePlus10 = document.getElementById('size-plus-10');
    if (sizePlus10) sizePlus10.onclick = () => { changeFontSize(10); };
    
    const sizeMinus10 = document.getElementById('size-minus-10');
    if (sizeMinus10) sizeMinus10.onclick = () => { changeFontSize(-10); };
    
    const sizePlus1 = document.getElementById('size-plus-1');
    if (sizePlus1) sizePlus1.onclick = () => { changeFontSize(1); };
    
    const sizeMinus1 = document.getElementById('size-minus-1');
    if (sizeMinus1) sizeMinus1.onclick = () => { changeFontSize(-1); };
    
    /* ===== FONT WEIGHT BUTTON EVENTS ===== */
    const weightButtons = document.querySelectorAll('#weight-buttons .preset-btn');
    weightButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            saveReadingPosition();
            currentWeight = parseInt(btn.dataset.weight);
            triggerLayoutObserver();
            renderWeight();
        });
    });
    
    const weightPlus100 = document.getElementById('weight-plus-100');
    if (weightPlus100) weightPlus100.onclick = () => { changeWeight(100); };
    
    const weightMinus100 = document.getElementById('weight-minus-100');
    if (weightMinus100) weightMinus100.onclick = () => { changeWeight(-100); };
    
    const weightPlus10 = document.getElementById('weight-plus-10');
    if (weightPlus10) weightPlus10.onclick = () => { changeWeight(10); };
    
    const weightMinus10 = document.getElementById('weight-minus-10');
    if (weightMinus10) weightMinus10.onclick = () => { changeWeight(-10); };
    
    const weightPlus1 = document.getElementById('weight-plus-1');
    if (weightPlus1) weightPlus1.onclick = () => { changeWeight(1); };
    
    const weightMinus1 = document.getElementById('weight-minus-1');
    if (weightMinus1) weightMinus1.onclick = () => { changeWeight(-1); };
    
    /* ===== TOC TOP/BOTTOM ===== */
    const tocTopBtn = document.getElementById('toc-top-btn');
    const tocBottomBtn = document.getElementById('toc-bottom-btn');
    const tocContent = document.querySelector('.toc-list');
    if (tocTopBtn && tocContent) {
        tocTopBtn.addEventListener('click', () => {
            tocContent.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    if (tocBottomBtn && tocContent) {
        tocBottomBtn.addEventListener('click', () => {
            tocContent.scrollTo({ top: tocContent.scrollHeight, behavior: 'smooth' });
        });
    }
    
    /* ===== TOC SEARCH ===== */
    if (tocSearch) {
        tocSearch.addEventListener('input', () => {
            const searchText = tocSearch.value.toLowerCase();
            tocItems.forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(searchText) ? 'block' : 'none';
            });
        });
    }
    
    /* ===== LONG PRESS SELECT ===== */
    let timer;
    let isLongPressed = false;
    let startX, startY;
    if (article) {
        article.addEventListener('touchstart', e => {
            isLongPressed = false;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            timer = setTimeout(() => {
                isLongPressed = true;
                article.style.webkitUserSelect = 'text';
                article.style.userSelect = 'text';
            }, 500);
        });
        article.addEventListener('touchmove', e => {
            let moveX = e.touches[0].clientX;
            let moveY = e.touches[0].clientY;
            if (
                Math.abs(moveX - startX) > 10 ||
                Math.abs(moveY - startY) > 10
            ) {
                clearTimeout(timer);
            }
        });
        article.addEventListener('touchend', () => {
            clearTimeout(timer);
            if (!isLongPressed) {
                if (window.getSelection().toString() === '') {
                    article.style.webkitUserSelect = 'none';
                    article.style.userSelect = 'none';
                }
            }
        });
    }
    
    // 🌟 အားလုံးပြီးဆုံးကြောင်း အချက်ပေးခြင်း (Auto Play အတွက်)
    setTimeout(() => {
        document.dispatchEvent(new Event('paperReady'));
    }, 100);
}

/* ===== EXPORT FUNCTIONS TO GLOBAL WINDOW ===== */
window.toggleTOC = toggleTOC;
window.toggleSetting = toggleSetting;
window.downloadPDF = downloadPDF;
window.toggleReadingMode = toggleReadingMode;
window.adjustLineHeight = adjustLineHeight;
window.adjustLetterSpacing = adjustLetterSpacing;
window.changeFontSize = changeFontSize;
window.changeWeight = changeWeight;

/* == SINGLE DOMCONTENTLOADED == */
document.addEventListener('DOMContentLoaded', init);
