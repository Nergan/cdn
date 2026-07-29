(function () {
  // Capture current script tag reference before async execution
  const currentScript = document.currentScript;

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        display: block;
        position: fixed;
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

      // Reset styles
      this.style.top = 'auto';
      this.style.bottom = 'auto';
      this.style.left = 'auto';
      this.style.right = 'auto';

      // Preset base positions
      switch (position) {
        case 'top-left':
          this.style.top = '18px';
          this.style.left = '16px';
          break;
        case 'top-right':
          this.style.top = '18px';
          this.style.right = '16px';
          break;
        case 'bottom-left':
          this.style.bottom = '18px';
          this.style.left = '16px';
          break;
        case 'bottom-right':
        default:
          this.style.bottom = '18px';
          this.style.right = '16px';
          break;
      }

      // Explicit pixel/rem offsets override default preset offsets
      if (top !== null) this.style.top = top;
      if (bottom !== null) this.style.bottom = bottom;
      if (left !== null) this.style.left = left;
      if (right !== null) this.style.right = right;
    }
  }

  if (!customElements.get('nargan-donate')) {
    customElements.define('nargan-donate', NarganDonate);
  }

  function getScriptConfig() {
    const config = {};
    if (!currentScript) return config;

    // 1. Parse URL query string parameters
    try {
      if (currentScript.src) {
        const url = new URL(currentScript.src, window.location.href);
        url.searchParams.forEach((value, key) => {
          config[key] = value;
        });
      }
    } catch (e) {
      // Ignore URL parsing errors
    }

    // 2. Parse data-* attributes (overrides query parameters)
    if (currentScript.dataset) {
      for (const [key, value] of Object.entries(currentScript.dataset)) {
        config[key] = value;
      }
    }

    return config;
  }

  function autoInject() {
    if (!document.querySelector('nargan-donate')) {
      const widget = document.createElement('nargan-donate');
      const config = getScriptConfig();

      for (const [key, value] of Object.entries(config)) {
        if (value !== undefined && value !== null) {
          widget.setAttribute(key, value);
        }
      }

      document.body.appendChild(widget);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInject);
  } else {
    autoInject();
  }
})();