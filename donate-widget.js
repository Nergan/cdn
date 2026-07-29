(function () {
  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        display: block;
        position: fixed;
        bottom: 18px;
        right: 16px;
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
    }

    static get observedAttributes() {
      return ['lang', 'title'];
    }

    attributeChangedCallback() {
      this.updateTitle();
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
  }

  if (!customElements.get('nargan-donate')) {
    customElements.define('nargan-donate', NarganDonate);
  }

  function autoInject() {
    if (!document.querySelector('nargan-donate')) {
      const widget = document.createElement('nargan-donate');
      document.body.appendChild(widget);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInject);
  } else {
    autoInject();
  }
})();