(function () {
  let currentScript = document.currentScript;

  function findScriptElement() {
    if (currentScript && document.contains(currentScript)) {
      return currentScript;
    }
    const scripts = Array.from(document.querySelectorAll('script'));
    return (
      scripts.find(s => s.src && s.src.includes('donate-widget')) ||
      scripts.find(
        s =>
          s.dataset &&
          (s.dataset.position ||
            s.dataset.right ||
            s.dataset.left ||
            s.dataset.top ||
            s.dataset.bottom ||
            s.dataset.lang ||
            s.dataset.title)
      ) ||
      null
    );
  }

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        display: block;
        position: fixed;
        top: var(--nargan-top, auto);
        bottom: var(--nargan-bottom, auto);
        left: var(--nargan-left, auto);
        right: var(--nargan-right, auto);
        z-index: 10000;
        pointer-events: auto;
      }

      .donate-button {
        display: block;
        width: 44px;
        height: 44px;
        position: relative;
        transition: transform 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
        text-decoration: none;
        outline: none;
      }

      .donate-button:hover {
        transform: scale(1.15);
      }

      .donate-button img,
      .donate-button video {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: contain;
        image-rendering: pixelated;
        transition: opacity 0.2s ease-in-out;
        border: 0;
        margin: 0;
        padding: 0;
      }

      .donate-button video {
        opacity: 0;
        pointer-events: none;
      }

      .donate-button:hover img {
        opacity: 0;
      }

      .donate-button:hover video {
        opacity: 1;
      }

      .donate-button:focus-visible {
        outline: 2px solid #9ab87a;
        outline-offset: 4px;
        border-radius: 4px;
      }

      @media (prefers-reduced-motion: reduce) {
        .donate-button {
          transition: none;
        }
      }
    </style>
    <a href="https://boosty.to/nargan/donate" target="_blank" rel="noopener noreferrer" class="donate-button" id="donate-link">
      <img src="https://cdn.jsdelivr.net/gh/Nergan/media@main/donate-img.webp" alt="Donate">
      <video src="https://cdn.jsdelivr.net/gh/Nergan/media@main/donate-animation.webm" autoplay loop muted playsinline></video>
    </a>
  `;

  class NarganDonate extends HTMLElement {
    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.appendChild(TEMPLATE.content.cloneNode(true));
      this.linkEl = shadow.getElementById('donate-link');
    }

    connectedCallback() {
      this.updateTitle();
      this.updatePosition();
    }

    static get observedAttributes() {
      return ['lang', 'title', 'position', 'top', 'bottom', 'left', 'right'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      this.updateTitle();
      this.updatePosition();
    }

    updateTitle() {
      if (!this.linkEl) return;

      const customTitle = this.getAttribute('title');
      if (customTitle) {
        this.linkEl.setAttribute('title', customTitle);
        return;
      }

      const langAttr = this.getAttribute('lang');
      const navLang = navigator.language || navigator.userLanguage || 'en';
      const effectiveLang = (langAttr || navLang).toLowerCase();

      const isRu = effectiveLang.startsWith('ru');
      const titleText = isRu
        ? "Поддержать на Boosty"
        : "support me on boosty plsss <3";

      this.linkEl.setAttribute('title', titleText);
    }

    updatePosition() {
      const position = this.getAttribute('position') || 'bottom-right';
      const top = this.getAttribute('top');
      const bottom = this.getAttribute('bottom');
      const left = this.getAttribute('left');
      const right = this.getAttribute('right');

      let defaultTop = 'auto';
      let defaultBottom = 'auto';
      let defaultLeft = 'auto';
      let defaultRight = 'auto';

      switch (position) {
        case 'top-left':
          defaultTop = '18px';
          defaultLeft = '16px';
          break;
        case 'top-right':
          defaultTop = '18px';
          defaultRight = '16px';
          break;
        case 'bottom-left':
          defaultBottom = '18px';
          defaultLeft = '16px';
          break;
        case 'bottom-right':
        default:
          defaultBottom = '18px';
          defaultRight = '16px';
          break;
      }

      const finalTop = top !== null ? top : defaultTop;
      const finalBottom = bottom !== null ? bottom : defaultBottom;
      const finalLeft = left !== null ? left : defaultLeft;
      const finalRight = right !== null ? right : defaultRight;

      this.style.top = finalTop;
      this.style.bottom = finalBottom;
      this.style.left = finalLeft;
      this.style.right = finalRight;

      this.style.setProperty('--nargan-top', finalTop);
      this.style.setProperty('--nargan-bottom', finalBottom);
      this.style.setProperty('--nargan-left', finalLeft);
      this.style.setProperty('--nargan-right', finalRight);
    }
  }

  if (!customElements.get('nargan-donate')) {
    customElements.define('nargan-donate', NarganDonate);
  }

  function getScriptConfig() {
    const config = {};

    if (window.NARGAN_DONATE_CONFIG && typeof window.NARGAN_DONATE_CONFIG === 'object') {
      Object.assign(config, window.NARGAN_DONATE_CONFIG);
    }

    const scriptEl = findScriptElement();
    if (!scriptEl) return config;

    try {
      if (scriptEl.src) {
        const url = new URL(scriptEl.src, window.location.href);
        url.searchParams.forEach((value, key) => {
          config[key] = value;
        });
      }
    } catch (e) {}

    if (scriptEl.dataset) {
      for (const [key, value] of Object.entries(scriptEl.dataset)) {
        config[key] = value;
      }
    }

    return config;
  }

  function autoInject() {
    let widget = document.querySelector('nargan-donate');
    const config = getScriptConfig();

    if (!widget) {
      widget = document.createElement('nargan-donate');
      for (const [key, value] of Object.entries(config)) {
        if (value !== undefined && value !== null) {
          widget.setAttribute(key, value);
        }
      }
      document.body.appendChild(widget);
    } else {
      for (const [key, value] of Object.entries(config)) {
        if (value !== undefined && value !== null && !widget.hasAttribute(key)) {
          widget.setAttribute(key, value);
        }
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInject);
  } else {
    autoInject();
  }
})();