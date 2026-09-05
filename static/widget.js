(function() {
  'use strict';

  var _scriptSrc = (document.currentScript || {}).src || '';
  var _BASE = _scriptSrc ? new URL(_scriptSrc).origin : window.location.origin;

  const CONFIG = {
    apiUrl: _BASE + '/chat',
    inquiryUrl: _BASE + '/chat/inquiry',
    logoUrl: _BASE + '/static/logo.png',
    brandColor: '#5C7A35',
    brandColorHover: '#4A6228',
    accentColor: '#5C7A35',
    title: 'Kmetija Grobelnik',
    subtitle: 'Vaš pomočnik kmetije',
    placeholder: 'Vprašajte o nastanitvah, hrani, teambuildingu...',
    welcomeMessage: 'Pozdravljeni! Sem pomočnik Turistične kmetije Grobelnik v Posavju. Pomagam vam pri načrtovanju obiska, nastanitve ali teambuildinga. Kaj vas zanima?',
    mobileBreakpoint: 768,
    autoOpenDelay: 3000,
    maxStoredMessages: 50
  };

  const styles = `
    #kv-widget-container * {
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    #kv-widget-panel p,
    #kv-widget-panel li,
    #kv-widget-panel h1,
    #kv-widget-panel h2,
    #kv-widget-panel h3 {
      color: inherit;
      text-shadow: none;
      font-size: inherit;
      margin: 0;
    }

    .kv-bot .kv-message-bubble,
    .kv-bot .kv-message-bubble p,
    .kv-bot .kv-message-bubble li,
    .kv-bot .kv-message-bubble span {
      color: #1a1a1a !important;
    }

    .kv-user .kv-message-bubble,
    .kv-user .kv-message-bubble p,
    .kv-user .kv-message-bubble li,
    .kv-user .kv-message-bubble span {
      color: #ffffff !important;
    }

    #kv-launcher {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999999;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 10px;
      pointer-events: none;
    }
    #kv-launcher > * { pointer-events: all; }

    #kv-widget-bubble {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${CONFIG.brandColor};
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
      border: none;
      padding: 0;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      flex-shrink: 0;
      position: relative;
    }

    #kv-widget-bubble:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 24px rgba(0,0,0,0.25);
    }

    #kv-widget-bubble svg { width: 28px; height: 28px; fill: white; }

    #kv-widget-panel {
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 380px;
      height: 520px;
      max-height: calc(100vh - 120px);
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 999998;
      opacity: 0;
      visibility: hidden;
      transform: translateY(8px);
      transition: opacity 0.15s ease, transform 0.15s ease, visibility 0.15s;
    }

    #kv-widget-panel.kv-open {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    #kv-widget-panel.kv-minimized { height: auto !important; min-height: 0 !important; }
    #kv-widget-panel.kv-minimized #kv-widget-messages,
    #kv-widget-panel.kv-minimized #kv-widget-input-area,
    #kv-widget-panel.kv-minimized #kv-widget-disclaimer,
    #kv-widget-panel.kv-minimized #kv-widget-powered,
    #kv-widget-panel.kv-minimized #kv-scroll-down { display: none !important; }
    #kv-widget-panel.kv-minimized #kv-widget-header { border-radius: 16px !important; }
    #kv-widget-panel.kv-minimized #kv-widget-header::before { border-radius: 16px !important; }

    @media (max-width: ${CONFIG.mobileBreakpoint}px) {
      #kv-widget-panel {
        position: fixed !important; top: 0 !important; left: 0 !important;
        right: 0 !important; bottom: 0 !important; width: 100% !important;
        height: auto !important; max-height: none !important;
        border-radius: 0 !important; margin: 0 !important;
      }
      #kv-widget-panel.kv-open { opacity: 1 !important; visibility: visible !important; transform: translateY(0) !important; }
      #kv-widget-header { padding-top: max(16px, env(safe-area-inset-top)) !important; padding-left: max(16px, env(safe-area-inset-left)) !important; padding-right: max(16px, env(safe-area-inset-right)) !important; border-radius: 0 !important; }
      #kv-widget-messages { flex: 1 1 0 !important; min-height: 0 !important; overflow-y: auto !important; -webkit-overflow-scrolling: touch; padding-left: max(0px, env(safe-area-inset-left)); padding-right: max(0px, env(safe-area-inset-right)); }
      #kv-widget-input-area { padding-bottom: max(16px, env(safe-area-inset-bottom)) !important; padding-left: max(12px, env(safe-area-inset-left)) !important; padding-right: max(12px, env(safe-area-inset-right)) !important; flex-shrink: 0 !important; }
      #kv-widget-input { font-size: 16px !important; }
      #kv-widget-minimize { display: none !important; }
    }

    #kv-widget-header {
      background: linear-gradient(135deg, #5C7A35 0%, #4A6228 100%);
      color: #ffffff;
      padding: 16px 20px;
      display: flex; align-items: center; gap: 12px;
      flex-shrink: 0; min-height: 80px; position: relative;
      border-radius: 16px 16px 0 0;
    }

    #kv-widget-header-icon { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; }
    #kv-widget-header-icon img { width: 48px; height: 48px; object-fit: contain; }
    #kv-widget-header-text { flex: 1; }
    #kv-widget-header-text h3 { margin: 0; font-size: 16px; font-weight: 700; color: #ffffff; }
    #kv-widget-header-text p { margin: 2px 0 0; font-size: 12px; color: rgba(255,255,255,0.88); }

    .kv-header-btn { background: none; border: none; color: #ffffff; cursor: pointer; padding: 8px; border-radius: 8px; transition: background 0.15s; }
    .kv-header-btn:hover { background: rgba(255,255,255,0.18); }
    .kv-header-btn svg { width: 18px; height: 18px; fill: #ffffff; }

    #kv-widget-messages { flex: 1; overflow-y: auto; padding: 16px; background: #f9f7f5; position: relative; }

    .kv-message { margin-bottom: 12px; display: flex; flex-direction: column; }
    .kv-message.kv-bot { align-items: flex-start; }
    .kv-message.kv-user { align-items: flex-end; }

    .kv-message-bubble { max-width: 85%; padding: 12px 16px; border-radius: 16px; font-size: 14px; line-height: 1.5; word-wrap: break-word; }
    .kv-bot .kv-message-bubble { background: white; color: #1a1a1a; border-bottom-left-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .kv-user .kv-message-bubble { background: ${CONFIG.brandColor}; color: white; border-bottom-right-radius: 4px; }

    .kv-typing { display: flex; gap: 4px; padding: 12px 16px; }
    .kv-typing span { width: 8px; height: 8px; background: #999; border-radius: 50%; animation: kv-bounce 1.2s infinite; }
    .kv-typing span:nth-child(2) { animation-delay: 0.2s; }
    .kv-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes kv-bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }

    #kv-widget-input-area { padding: 12px 16px; background: white; border-top: 1px solid #eee; display: flex; gap: 10px; flex-shrink: 0; }
    #kv-widget-disclaimer { font-size: 11px; color: #999; line-height: 1.4; padding: 6px 14px 2px; background: white; text-align: center; }
    #kv-widget-disclaimer a { color: ${CONFIG.brandColor}; text-decoration: none; }
    #kv-widget-powered { text-align: center; font-size: 11px; color: #ccc; padding: 2px 0 6px; background: white; }
    #kv-widget-powered a { color: #bbb; text-decoration: none; }
    #kv-widget-powered a:hover { color: ${CONFIG.brandColor}; }

    #kv-widget-input { flex: 1; border: 1px solid #ddd; border-radius: 24px; padding: 12px 18px; font-size: 14px; outline: none; transition: border-color 0.15s; }
    #kv-widget-input:focus { border-color: ${CONFIG.brandColor}; }

    #kv-widget-send { width: 44px; height: 44px; border-radius: 50%; background: ${CONFIG.brandColor}; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.15s; flex-shrink: 0; }
    #kv-widget-send:hover { background: ${CONFIG.brandColorHover}; }
    #kv-widget-send:disabled { background: #ccc; cursor: not-allowed; }
    #kv-widget-send svg { width: 20px; height: 20px; fill: white !important; }
    #kv-widget-send svg path { fill: white !important; }

    #kv-scroll-down { position: sticky; bottom: 8px; left: 50%; transform: translateX(-50%); margin-left: auto; margin-right: auto; width: 36px; height: 36px; background: ${CONFIG.brandColor}; border-radius: 50%; display: none; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.2); z-index: 10; }
    #kv-scroll-down.kv-visible { display: flex; }
    #kv-scroll-down svg { width: 20px; height: 20px; fill: white !important; }

    #mo-inquiry-btn-bar { padding: 10px 16px 6px; background: white; border-top: 1px solid rgba(130,77,136,0.15); flex-shrink: 0; }
    #mo-inquiry-btn { width: 100%; background: ${CONFIG.accentColor}; color: #fff; border: none; border-radius: 10px; padding: 11px 16px; font-size: 14px; font-weight: 700; cursor: pointer; transition: background 0.15s; display: flex; align-items: center; justify-content: center; gap: 8px; }
    #mo-inquiry-btn:hover { background: ${CONFIG.brandColorHover}; }

    #mo-inquiry-form-view { display: none; flex-direction: column; flex: 1; overflow: hidden; }
    #mo-inquiry-form-view.kv-visible { display: flex; }
    #mo-inquiry-form-header { background: linear-gradient(135deg, #5C7A35 0%, #4A6228 100%); color: #fff; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
    #mo-inquiry-form-header span { font-size: 14px; font-weight: 700; }
    #mo-inquiry-back { background: none; border: none; color: #fff; cursor: pointer; font-size: 13px; padding: 4px 8px; border-radius: 6px; opacity: 0.9; }
    #mo-inquiry-back:hover { background: rgba(255,255,255,0.2); }
    #mo-inquiry-form-scroll { flex: 1; overflow-y: auto; padding: 14px 16px; background: #f9f7f5; }

    .kv-field { margin-bottom: 11px; }
    .kv-field label { display: block; font-size: 12px; font-weight: 600; color: #444; margin-bottom: 4px; }
    .kv-field label span { color: #e53; }
    .kv-field input, .kv-field textarea, .kv-field select { width: 100%; border: 1px solid #ddd; border-radius: 8px; padding: 9px 12px; font-size: 13px; outline: none; transition: border-color 0.15s; background: #fff; font-family: inherit; }
    .kv-field input:focus, .kv-field textarea:focus, .kv-field select:focus { border-color: ${CONFIG.accentColor}; }
    .kv-field select { appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24'%3E%3Cpath fill='%23888' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 30px; cursor: pointer; }
    .kv-field input[type=date] { cursor: pointer; }
    .kv-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    @media (max-width: 380px) { .kv-field-row { grid-template-columns: 1fr; } }
    .kv-field input[type=date], .kv-field select { font-size: 16px; }
    @media (min-width: 400px) { .kv-field input[type=date], .kv-field select, .kv-field input, .kv-field textarea { font-size: 13px; } }
    .kv-field textarea { resize: vertical; min-height: 60px; }

    .kv-checkboxes { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 4px; }
    .kv-checkbox-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #333; cursor: pointer; }
    .kv-checkbox-item input[type=checkbox] { width: 16px; height: 16px; accent-color: ${CONFIG.accentColor}; flex-shrink: 0; }

    #mo-inquiry-submit { width: 100%; background: ${CONFIG.brandColor}; color: #fff; border: none; border-radius: 10px; padding: 12px; font-size: 14px; font-weight: 700; cursor: pointer; margin-top: 4px; transition: background 0.15s; }
    #mo-inquiry-submit:hover { background: ${CONFIG.brandColorHover}; }
    #mo-inquiry-submit:disabled { background: #aaa; cursor: not-allowed; }

    #mo-inquiry-success { display: none; flex-direction: column; align-items: center; justify-content: center; flex: 1; padding: 32px 24px; text-align: center; background: #f9f7f5; }
    #mo-inquiry-success.kv-visible { display: flex; }
    #mo-inquiry-success .kv-success-icon { width: 56px; height: 56px; background: ${CONFIG.brandColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
    #mo-inquiry-success .kv-success-icon svg { width: 28px; height: 28px; fill: white; }
    #mo-inquiry-success h4 { color: ${CONFIG.brandColor}; font-size: 16px; margin: 0 0 8px; }
    #mo-inquiry-success p { color: #666; font-size: 13px; line-height: 1.5; margin: 0; }
  `;

  const icons = {
    chat: '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/><path d="M7 9h10v2H7zm0-3h10v2H7z"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
    send: '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>',
    refresh: '<svg viewBox="0 0 24 24"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>',
    minimize: '<svg viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>',
    restore: '<svg viewBox="0 0 24 24"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>',
    arrowDown: '<svg viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6 1.41-1.41z"/></svg>'
  };

  let sessionId = localStorage.getItem('mh_widget_session') || generateSessionId();
  localStorage.setItem('mh_widget_session', sessionId);

  let storedMessages = [];
  try {
    const stored = localStorage.getItem('mh_widget_messages');
    if (stored) storedMessages = JSON.parse(stored);
  } catch (e) { storedMessages = []; }

  function generateSessionId() {
    return 'mh_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  function saveMessages() {
    localStorage.setItem('mh_widget_messages', JSON.stringify(storedMessages.slice(-CONFIG.maxStoredMessages)));
  }

  function clearConversation() {
    storedMessages = [];
    localStorage.removeItem('mh_widget_messages');
    sessionId = generateSessionId();
    localStorage.setItem('mh_widget_session', sessionId);
    document.getElementById('kv-widget-messages').innerHTML = '';
    addMessage(CONFIG.welcomeMessage, 'bot', false);
  }

  function createWidget() {
    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);

    const launcher = document.createElement('div');
    launcher.id = 'kv-launcher';

    var cardStyle = ['display:block','background:#ffffff','color:#5C7A35','font-size:14px','font-family:-apple-system,BlinkMacSystemFont,sans-serif','font-weight:600','padding:10px 16px','border-radius:18px 18px 4px 18px','box-shadow:0 2px 12px rgba(0,0,0,0.13)','cursor:pointer','border:1px solid rgba(130,77,136,0.2)','max-width:240px','text-align:right','touch-action:manipulation','-webkit-tap-highlight-color:transparent','margin-bottom:8px','line-height:1.4'].join(';');

    var closeStyle = ['display:block','background:#fff','color:#5C7A35','border:1px solid rgba(130,77,136,0.2)','border-radius:50%','width:24px','height:24px','font-size:13px','cursor:pointer','touch-action:manipulation','-webkit-tap-highlight-color:transparent','margin-bottom:6px','margin-left:auto','line-height:22px','text-align:center','padding:0'].join(';');

    const greetingCards = document.createElement('div');
    greetingCards.id = 'kv-greeting-cards';
    greetingCards.setAttribute('style', ['position:fixed','bottom:90px','right:0','z-index:2147483647','display:none','flex-direction:column','align-items:flex-end','padding-right:0'].join(';'));

    var xBtn = document.createElement('button');
    xBtn.setAttribute('style', closeStyle + ';margin-right:6px');
    xBtn.textContent = '✕';
    xBtn.onclick = function(e) { e.stopPropagation(); e.preventDefault(); hideCards(); };
    greetingCards.appendChild(xBtn);

    ['Pozdravljeni 👋', 'Kakšne nastanitve imate?', 'Zanima me teambuilding!'].forEach(function(text) {
      var btn = document.createElement('button');
      btn.setAttribute('style', cardStyle);
      btn.textContent = text;
      btn.onclick = function(e) { e.stopPropagation(); e.preventDefault(); setTimeout(openPanel, 0); };
      greetingCards.appendChild(btn);
    });

    const bubble = document.createElement('button');
    bubble.id = 'kv-widget-bubble';
    if (CONFIG.logoUrl) {
      var logoImg = document.createElement('img');
      logoImg.src = CONFIG.logoUrl;
      logoImg.alt = 'Kmetija Grobelnik';
      logoImg.style.cssText = 'width:50px;height:50px;object-fit:contain;border-radius:50%;background:white;padding:5px;';
      logoImg.onerror = function() { bubble.innerHTML = icons.chat; };
      bubble.appendChild(logoImg);
    } else {
      bubble.innerHTML = icons.chat;
    }
    bubble.onclick = function(e) { e.stopPropagation(); e.preventDefault(); setTimeout(togglePanel, 0); };

    const panel = document.createElement('div');
    panel.id = 'kv-widget-panel';
    panel.innerHTML = `
      <div id="kv-widget-header">
        <div id="kv-widget-header-icon"><img src="${CONFIG.logoUrl}" alt="Kmetija Grobelnik" style="width:48px;height:48px;object-fit:contain;border-radius:8px;background:white;padding:4px;" onerror="this.style.display='none'"></div>
        <div id="kv-widget-header-text">
          <h3>${CONFIG.title}</h3>
          <p>${CONFIG.subtitle}</p>
        </div>
        <button class="kv-header-btn" id="kv-widget-refresh" title="Nov pogovor">${icons.refresh}</button>
        <button class="kv-header-btn" id="kv-widget-minimize" title="Minimiziraj">${icons.minimize}</button>
        <button class="kv-header-btn" id="kv-widget-close" title="Zapri">${icons.close}</button>
      </div>
      <div id="kv-chat-view" style="display:flex;flex-direction:column;flex:1;overflow:hidden;min-height:0;">
        <div id="kv-widget-messages">
          <div id="kv-scroll-down" title="Scroll dol">${icons.arrowDown}</div>
        </div>
        <div id="mo-inquiry-btn-bar">
          <button id="mo-inquiry-btn">
            <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:white;flex-shrink:0;"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
            Rezerviraj termin
          </button>
        </div>
        <div id="kv-widget-input-area">
          <input type="text" id="kv-widget-input" placeholder="${CONFIG.placeholder}">
          <button id="kv-widget-send">${icons.send}</button>
        </div>
        <div id="kv-widget-disclaimer">&#x1F916; AI asistent (EU AI Act, cl. 50). Za rezervacijo: <a href="tel:+38631683787">041 335 257</a>.</div>
        <div id="kv-widget-powered">built by: <a href="https://spoznaj-ai.si" target="_blank">spoznaj-ai.si</a></div>
      </div>
      <div id="mo-inquiry-form-view">
        <div id="mo-inquiry-form-header">
          <span>Rezervacija termina</span>
          <button id="mo-inquiry-back">&larr; Nazaj</button>
        </div>
        <div id="mo-inquiry-form-scroll">
          <div class="kv-field">
            <label>Ime in priimek <span>*</span></label>
            <input type="text" id="jf-ime" placeholder="Vaše ime">
          </div>
          <div class="kv-field">
            <label>Telefon <span>*</span></label>
            <input type="tel" id="jf-telefon" placeholder="+386 ...">
          </div>
          <div class="kv-field">
            <label>Storitev</label>
            <select id="jf-storitev">
              <option value="">-- Izberite povpraševanje --</option>
              <optgroup label="Nastanitve">
                <option>Soba z zajtrkom (85 EUR / noc)</option>
                <option>Paket Pobeg v Posavje</option>
              </optgroup>
              <optgroup label="Hrana in degustacija">
                <option>Degustacija vin s sommelierjem</option>
                <option>Pogostitev / zasebna vecerja</option>
              </optgroup>
              <optgroup label="Teambuilding programi">
                <option>Teambuilding - Trgatev</option>
                <option>Teambuilding - Martinovanje</option>
                <option>Teambuilding - Vinograd in vinska klet (1 dan)</option>
                <option>Teambuilding - Vinograd in vinska klet (2 dni)</option>
              </optgroup>
              <optgroup label="Pogostitve in praznovanja">
                <option>Poroka / porocna pogostitev</option>
                <option>Obletnica / rojstni dan</option>
                <option>Krstina / zasebna proslava</option>
              </optgroup>
              <optgroup label="Aktivnosti">
                <option>Kolesarjenje / najem e-kolesa</option>
                <option>Ribolov (reka Sava)</option>
                <option>Pohod / izlet v okolici</option>
              </optgroup>
              <optgroup label="Ostalo">
                <option>Hisna prodajalna (vina, pridelki)</option>
                <option>Splosno povprasevanje</option>
              </optgroup>
            </select>
          </div>
          <div class="kv-field-row">
            <div class="kv-field">
              <label>Datum</label>
              <input type="date" id="jf-datum">
            </div>
            <div class="kv-field">
              <label>Želena ura</label>
              <select id="jf-ura">
                <option value="">-- Ura --</option>
                <option>9:00</option>
                <option>10:00</option>
                <option>11:00</option>
                <option>12:00</option>
                <option>13:00</option>
                <option>14:00</option>
                <option>15:00</option>
                <option>16:00</option>
                <option>17:00</option>
                <option>18:00</option>
                <option>19:00</option>
                <option>20:00</option>
              </select>
            </div>
          </div>
          <div class="kv-field">
            <label>Sporočilo (neobvezno)</label>
            <textarea id="jf-sporocilo" placeholder="Posebne želje, število oseb..."></textarea>
          </div>
          <button id="mo-inquiry-submit">Pošlji rezervacijo</button>
        </div>
        <div id="mo-inquiry-success">
          <div class="kv-success-icon">
            <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
          </div>
          <h4>Rezervacija poslana!</h4>
          <p>Kontaktirali vas bomo v najkrajšem moznem casu.<br><br>
          Tel: <a href="tel:+38631683787" style="color:#5C7A35;">041 335 257</a><br>info@grobelnik.si</p>
        </div>
      </div>
    `;

    launcher.appendChild(bubble);
    document.body.appendChild(launcher);
    document.body.appendChild(greetingCards);
    document.body.appendChild(panel);

    panel.addEventListener('click', function(e) { e.stopPropagation(); });
    greetingCards.addEventListener('click', function(e) { e.stopPropagation(); });
    launcher.addEventListener('click', function(e) { e.stopPropagation(); });

    document.getElementById('kv-widget-close').onclick = closePanel;
    document.getElementById('kv-widget-refresh').onclick = clearConversation;
    document.getElementById('kv-widget-minimize').onclick = toggleMinimize;
    document.getElementById('kv-widget-send').onclick = sendMessage;
    document.getElementById('kv-widget-input').onkeypress = function(e) { if (e.key === 'Enter') sendMessage(); };
    document.getElementById('mo-inquiry-btn').onclick = openInquiryForm;
    document.getElementById('mo-inquiry-back').onclick = closeInquiryForm;
    document.getElementById('mo-inquiry-submit').onclick = submitInquiryForm;

    document.getElementById('kv-widget-input').addEventListener('focus', function() {
      setTimeout(function() { var m = document.getElementById('kv-widget-messages'); if (m) m.scrollTop = m.scrollHeight; }, 350);
    });

    const messagesEl = document.getElementById('kv-widget-messages');
    const scrollArrow = document.getElementById('kv-scroll-down');
    scrollArrow.onclick = function() { messagesEl.scrollTop = messagesEl.scrollHeight; };
    messagesEl.onscroll = function() {
      if (messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight < 50) scrollArrow.classList.remove('kv-visible');
    };

    if (storedMessages.length > 0) {
      storedMessages.forEach(function(msg) { addMessageToUI(msg.text, msg.sender, false); });
    } else {
      addMessageToUI(CONFIG.welcomeMessage, 'bot', false);
    }

    setTimeout(function() { if (!panelOpen) showCards(); }, CONFIG.autoOpenDelay);
  }

  var panelOpen = false;
  var panelMinimized = false;

  function toggleMinimize() {
    var panel = document.getElementById('kv-widget-panel');
    var btn = document.getElementById('kv-widget-minimize');
    panelMinimized = !panelMinimized;
    if (panelMinimized) { panel.classList.add('kv-minimized'); btn.innerHTML = icons.restore; btn.title = 'Razpri'; }
    else { panel.classList.remove('kv-minimized'); btn.innerHTML = icons.minimize; btn.title = 'Minimiziraj'; }
  }

  function showCards() { var c = document.getElementById('kv-greeting-cards'); if (c) c.style.display = 'flex'; }
  function hideCards() { var c = document.getElementById('kv-greeting-cards'); if (c) c.style.display = 'none'; }
  function togglePanel() { if (panelOpen) closePanel(); else openPanel(); }

  function onViewportResize() {
    if (!panelOpen || window.innerWidth > CONFIG.mobileBreakpoint) return;
    var vv = window.visualViewport;
    if (!vv) return;
    var panel = document.getElementById('kv-widget-panel');
    panel.style.top = vv.offsetTop + 'px';
    panel.style.height = vv.height + 'px';
    panel.style.bottom = 'auto';
  }
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', onViewportResize);
    window.visualViewport.addEventListener('scroll', onViewportResize);
  }

  function openPanel() {
    if (panelOpen) return;
    panelOpen = true;
    var panel = document.getElementById('kv-widget-panel');
    panel.classList.add('kv-open');
    if (window.innerWidth <= CONFIG.mobileBreakpoint) {
      panel.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;width:100%;max-height:none;border-radius:0;';
      document.body.style.overflow = 'hidden';
      document.getElementById('kv-launcher').style.display = 'none';
      if (window.visualViewport) onViewportResize();
    }
    hideCards();
    document.getElementById('kv-widget-input').focus();
    localStorage.setItem('mh_widget_open', 'true');
    var messages = document.getElementById('kv-widget-messages');
    if (messages.scrollHeight > messages.clientHeight) document.getElementById('kv-scroll-down').classList.add('kv-visible');
  }

  function closePanel() {
    if (!panelOpen) return;
    panelOpen = false; panelMinimized = false;
    var panel = document.getElementById('kv-widget-panel');
    panel.classList.remove('kv-open', 'kv-minimized');
    panel.style.cssText = '';
    document.body.style.overflow = '';
    document.getElementById('kv-launcher').style.display = 'flex';
    var btn = document.getElementById('kv-widget-minimize');
    if (btn) { btn.innerHTML = icons.minimize; btn.title = 'Minimiziraj'; }
    localStorage.setItem('mh_widget_open', 'false');
    showCards();
  }

  function addMessageToUI(text, sender, autoScroll) {
    if (autoScroll === undefined) autoScroll = true;
    const messages = document.getElementById('kv-widget-messages');
    const scrollArrow = document.getElementById('kv-scroll-down');
    const msg = document.createElement('div');
    msg.className = 'kv-message kv-' + sender;
    msg.innerHTML = sender === 'bot'
      ? '<div class="kv-message-bubble">' + renderMarkdown(text) + '</div>'
      : '<div class="kv-message-bubble">' + escapeHtml(text) + '</div>';
    messages.appendChild(msg);
    if (!autoScroll) return;
    if (sender === 'user') {
      msg.scrollIntoView({ block: 'start', behavior: 'smooth' });
      if (scrollArrow) scrollArrow.classList.remove('kv-visible');
    } else {
      var userMsgs = messages.querySelectorAll('.kv-user');
      var lastUser = userMsgs[userMsgs.length - 1];
      if (lastUser) lastUser.scrollIntoView({ block: 'start', behavior: 'smooth' });
      setTimeout(function() {
        if (messages.scrollHeight - messages.scrollTop - messages.clientHeight > 40 && scrollArrow)
          scrollArrow.classList.add('kv-visible');
      }, 350);
    }
  }

  function addMessage(text, sender, save) {
    if (save === undefined) save = true;
    addMessageToUI(text, sender);
    if (save) { storedMessages.push({ text: text, sender: sender, time: Date.now() }); saveMessages(); }
  }

  function showTyping() {
    const messages = document.getElementById('kv-widget-messages');
    const typing = document.createElement('div');
    typing.id = 'kv-typing-indicator';
    typing.className = 'kv-message kv-bot';
    typing.innerHTML = '<div class="kv-message-bubble kv-typing"><span></span><span></span><span></span></div>';
    messages.appendChild(typing);
    var userMsgs = messages.querySelectorAll('.kv-user');
    var lastUser = userMsgs[userMsgs.length - 1];
    if (lastUser) lastUser.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  function hideTyping() { var t = document.getElementById('kv-typing-indicator'); if (t) t.remove(); }

  function escapeHtml(text) {
    var d = document.createElement('div'); d.textContent = text;
    return d.innerHTML.replace(/\n/g, '<br>');
  }

  function renderMarkdown(text) {
    var escaped = (function(t) { var d = document.createElement('div'); d.textContent = t; return d.innerHTML; })(text);
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:#5C7A35;text-decoration:underline;">$1</a>');
    escaped = escaped.replace(/(?<!=["'])(https?:\/\/[^\s<>"')\]]+)/g, '<a href="$1" target="_blank" rel="noopener" style="color:#5C7A35;text-decoration:underline;">$1</a>');
    escaped = escaped.replace(/(?<![/"'=])(www\.[a-zA-Z0-9][^\s<>"')\]]+)/g, '<a href="https://$1" target="_blank" rel="noopener" style="color:#5C7A35;text-decoration:underline;">$1</a>');
    // Klikljivi emaili (pred telefoni, da @ ne zmoti regex)
    escaped = escaped.replace(/([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/g, '<a href="mailto:$1" style="color:#5C7A35;text-decoration:underline;">$1</a>');
    // Klikljivi telefoni (format: 041 335 257 ali 031683787 ali +38631683787)
    escaped = escaped.replace(/\b(\+386\s?\d{2}\s?\d{3}\s?\d{3})\b/g, function(m) {
      var d = m.replace(/\s/g, ''); return '<a href="tel:' + d + '" style="color:#5C7A35;text-decoration:underline;">' + m + '</a>';
    });
    escaped = escaped.replace(/\b(0\d{2})[\s]?(\d{3})[\s]?(\d{3})\b/g, function(m, a, b, c) {
      var intl = '+386' + a.substring(1) + b + c;
      return '<a href="tel:' + intl + '" style="color:#5C7A35;text-decoration:underline;">' + m + '</a>';
    });
    escaped = escaped.replace(/((?:^|\n)- [^\n]+)+/g, function(block) {
      var items = block.trim().split(/\n/).map(function(line) { return '<li>' + line.replace(/^- /, '') + '</li>'; }).join('');
      return '<ul style="margin:6px 0 6px 16px;padding:0;">' + items + '</ul>';
    });
    escaped = escaped.replace(/\n\n+/g, '</p><p style="margin:6px 0;">');
    escaped = escaped.replace(/\n/g, '<br>');
    return '<p style="margin:0;">' + escaped + '</p>';
  }

  async function sendMessage() {
    const input = document.getElementById('kv-widget-input');
    const sendBtn = document.getElementById('kv-widget-send');
    const text = input.value.trim();
    if (!text) return;
    addMessage(text, 'user');
    input.value = '';
    sendBtn.disabled = true;
    showTyping();
    try {
      const response = await fetch(CONFIG.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: sessionId })
      });
      hideTyping();
      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      addMessage(data.reply || 'Oprostite, prislo je do napake.', 'bot');
    } catch (err) {
      hideTyping();
      addMessage('Oprostite, trenutno ni možno vzpostaviti povezave. Pokličite: 041 335 257.', 'bot');
    }
    sendBtn.disabled = false;
    input.focus();
  }

  function openInquiryForm() {
    document.getElementById('kv-chat-view').style.display = 'none';
    document.getElementById('mo-inquiry-form-view').classList.add('kv-visible');
    document.getElementById('mo-inquiry-success').classList.remove('kv-visible');
    document.getElementById('mo-inquiry-form-scroll').style.display = 'block';
    var datEl = document.getElementById('jf-datum');
    if (datEl) {
      var today = new Date().toISOString().slice(0, 10);
      var max = new Date(); max.setMonth(max.getMonth() + 3);
      datEl.min = today;
      datEl.max = max.toISOString().slice(0, 10);
    }
  }

  function closeInquiryForm() {
    document.getElementById('kv-chat-view').style.display = 'flex';
    document.getElementById('mo-inquiry-form-view').classList.remove('kv-visible');
  }

  async function submitInquiryForm() {
    var ime = document.getElementById('jf-ime').value.trim();
    var telefon = document.getElementById('jf-telefon').value.trim();
    if (!ime || !telefon) { alert('Prosimo, vnesite ime in telefonsko številko.'); return; }
    var storitev = document.getElementById('jf-storitev').value;
    var datum = document.getElementById('jf-datum').value;
    var ura = document.getElementById('jf-ura').value;
    var sporocilo = document.getElementById('jf-sporocilo').value.trim();
    var termin = [datum, ura].filter(Boolean).join(' ob ');
    var sporociloCelota = [termin ? 'Termin: ' + termin : '', sporocilo].filter(Boolean).join('\n');
    var payload = { ime: ime, telefon: telefon, email: '', tip: storitev || null, sporocilo: sporociloCelota || null };
    var btn = document.getElementById('mo-inquiry-submit');
    btn.disabled = true; btn.textContent = 'Posiljam...';
    try {
      var res = await fetch(CONFIG.inquiryUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('server error');
      document.getElementById('mo-inquiry-form-scroll').style.display = 'none';
      document.getElementById('mo-inquiry-success').classList.add('kv-visible');
    } catch (e) {
      alert('Napaka pri pošiljanju. Pokličite: 041 335 257');
      btn.disabled = false; btn.textContent = 'Pošlji rezervacijo';
    }
  }

  function initWidget() {
    if (document.getElementById('kv-greeting-cards')) return;
    createWidget();
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initWidget); }
  else { requestAnimationFrame(initWidget); }
})();
