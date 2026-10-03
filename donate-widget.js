(function () {
  // 1. Capture current script securely, even if async/defer is used
  let currentScript = document.currentScript;
  if (!currentScript) {
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      if (script.src && script.src.includes('donate')) {
        currentScript = script;
        break;
      }
    }
  }

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        display: block;
        position: fixed;
        z-index: 10000;
        pointer-events: auto;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
      }

      .donate-button {
        display: block;
        width: 44px;
        height: 44px;
        position: relative;
        transition: transform 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
        text-decoration: none;
        outline: none;
        cursor: grab;
        touch-action: none;
        -webkit-user-drag: none;
        -webkit-touch-callout: none;
      }

      :host(.is-dragging) .donate-button {
        cursor: grabbing;
        transform: none;
        transition: none;
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
        pointer-events: none;
        -webkit-user-drag: none;
        user-select: none;
      }

      .donate-button video {
        opacity: 0;
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
    <a href="https://boosty.to/nargan/donate" target="_blank" rel="noopener noreferrer" class="donate-button" id="donate-link" draggable="false">
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
      this.setupDrag();
    }

    disconnectedCallback() {
      if (this._cancelDrag) this._cancelDrag();
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
      
      // Helper to auto-append 'px' if user forgets it (e.g. "70" -> "70px")
      const formatUnit = (val) => {
        if (val === null || val === undefined) return null;
        return !isNaN(val) && val.trim() !== '' ? val + 'px' : val;
      };

      const top = formatUnit(this.getAttribute('top'));
      const bottom = formatUnit(this.getAttribute('bottom'));
      const left = formatUnit(this.getAttribute('left'));
      const right = formatUnit(this.getAttribute('right'));

      // Reset inline styles
      this.style.top = 'auto';
      this.style.bottom = 'auto';
      this.style.left = 'auto';
      this.style.right = 'auto';

      // Set preset positions
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

      // Explicit offsets override default presets
      if (top !== null) this.style.top = top;
      if (bottom !== null) this.style.bottom = bottom;
      if (left !== null) this.style.left = left;
      if (right !== null) this.style.right = right;
    }

    setupDrag() {
      const link = this.linkEl;
      if (!link || this._dragReady) return;
      this._dragReady = true;
      this.ensureDragCursorStyle();

      const DRAG_THRESHOLD = 6;
      let pointerId = null;
      let startX = 0;
      let startY = 0;
      let originLeft = 0;
      let originTop = 0;
      let moved = false;
      let blockClick = false;
      let blockToken = 0;

      const onClick = (event) => {
        if (!blockClick) return;
        blockClick = false;
        event.preventDefault();
        event.stopPropagation();
      };

      const clampToViewport = (left, top) => {
        const width = this.offsetWidth || 44;
        const height = this.offsetHeight || 44;
        const viewport = window.visualViewport;
        const viewWidth = viewport ? viewport.width : (document.documentElement.clientWidth || window.innerWidth);
        const viewHeight = viewport ? viewport.height : (document.documentElement.clientHeight || window.innerHeight);
        const maxLeft = Math.max(0, viewWidth - width);
        const maxTop = Math.max(0, viewHeight - height);

        if (left < 0) left = 0;
        else if (left > maxLeft) left = maxLeft;
        if (top < 0) top = 0;
        else if (top > maxTop) top = maxTop;
        return { left, top };
      };

      const onPointerMove = (event) => {
        if (pointerId === null || event.pointerId !== pointerId) return;

        const dx = event.clientX - startX;
        const dy = event.clientY - startY;

        if (!moved) {
          if ((dx * dx + dy * dy) < DRAG_THRESHOLD * DRAG_THRESHOLD) return;
          moved = true;
          try {
            link.setPointerCapture(event.pointerId);
          } catch (e) {
            // Capture is optional; window listeners still track the gesture.
          }
          this.classList.add('is-dragging');
          this.style.right = 'auto';
          this.style.bottom = 'auto';
          document.documentElement.classList.add('nargan-donate-dragging');
        }

        event.preventDefault();

        const next = clampToViewport(originLeft + dx, originTop + dy);
        this.style.left = next.left + 'px';
        this.style.top = next.top + 'px';
      };

      const endDrag = (event) => {
        if (pointerId === null || event.pointerId !== pointerId) return;
        const activeId = pointerId;
        pointerId = null;
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', endDrag);
        window.removeEventListener('pointercancel', endDrag);
        this.classList.remove('is-dragging');
        document.documentElement.classList.remove('nargan-donate-dragging');
        try {
          link.releasePointerCapture(activeId);
        } catch (e) {
          // Pointer is already released.
        }

        if (moved) {
          blockClick = true;
          const token = ++blockToken;
          window.setTimeout(() => {
            if (blockToken === token) blockClick = false;
          }, 400);
        }
        moved = false;
      };

      this._cancelDrag = () => {
        if (pointerId === null) return;
        endDrag({ pointerId });
      };

      const onPointerDown = (event) => {
        if (event.button !== 0 || pointerId !== null) return;
        const rect = this.getBoundingClientRect();
        pointerId = event.pointerId;
        startX = event.clientX;
        startY = event.clientY;
        originLeft = rect.left;
        originTop = rect.top;
        moved = false;
        window.addEventListener('pointermove', onPointerMove, { passive: false });
        window.addEventListener('pointerup', endDrag);
        window.addEventListener('pointercancel', endDrag);
      };

      link.addEventListener('pointerdown', onPointerDown);
      link.addEventListener('click', onClick, true);
      link.addEventListener('dragstart', (event) => event.preventDefault());
    }

    ensureDragCursorStyle() {
      if (document.getElementById('nargan-donate-drag-style')) return;
      const style = document.createElement('style');
      style.id = 'nargan-donate-drag-style';
      style.textContent = 'html.nargan-donate-dragging, html.nargan-donate-dragging * { cursor: grabbing !important; user-select: none !important; -webkit-user-select: none !important; }';
      (document.head || document.documentElement).appendChild(style);
    }
  }

  if (!customElements.get('nargan-donate')) {
    customElements.define('nargan-donate', NarganDonate);
  }

  function getScriptConfig() {
    const config = {};
    if (!currentScript) return config;

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

    if (currentScript.dataset) {
      for (const [key, value] of Object.entries(currentScript.dataset)) {
        config[key] = value;
      }
    }

    return config;
  }

  function autoInject() {
    let widget = document.querySelector('nargan-donate');
    let isNew = false;
    
    // Create if not exists
    if (!widget) {
      widget = document.createElement('nargan-donate');
      isNew = true;
    }

    // Apply configuration from the script tag
    const config = getScriptConfig();
    for (const [key, value] of Object.entries(config)) {
      if (value !== undefined && value !== null && !widget.hasAttribute(key)) {
        widget.setAttribute(key, value);
      }
    }

    if (isNew) {
      document.body.appendChild(widget);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInject);
  } else {
    autoInject();
  }
})();