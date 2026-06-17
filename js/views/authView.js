'use strict';

class AuthView {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.loginBtnCallback = null;
  }

  // Vincular la acción del botón de login con el controlador
  bindLoginClick(callback) {
    this.loginBtnCallback = callback;
  }

  // Renderiza la pantalla de login premium
  render() {
    this.container.innerHTML = `
      <div class="login-screen-wrapper fade-in">
        <!-- Fondos con Orbes Luminosos de Marca -->
        <div class="login-orb login-orb-bdb-blue"></div>
        <div class="login-orb login-orb-bdb-red"></div>
        <div class="login-orb login-orb-bdb-gold"></div>
        <div class="login-orb login-orb-linea-green"></div>
        <div class="login-grid-pattern"></div>
        <div class="login-scanline"></div>
        <div class="login-particles" id="loginParticles"></div>
        
        <div class="login-card">
          <!-- Co-branding Logotipos según Manual de Convivencia -->
          <div class="login-logos">
            <img src="assets/logo-linea-blanco.png" alt="Línea Comunicaciones" class="login-logo-linea">
            <div class="login-brand-divider"></div>
            <img src="assets/logo-bdb-sintexto.png" alt="Banco de Bogotá" class="login-logo-bdb">
          </div>
          
          <div class="login-header">
            <h1 class="login-title">DASHBOARDS INTELIGENTES</h1>
            <p class="login-subtitle">Línea Comunicaciones x Banco de Bogotá</p>
            <p class="login-subtitle">Developer: Sebastián Gómez López</p>
          </div>
          
          <!-- Mensaje de Error (Inicialmente oculto) -->
          <div class="login-error" id="login-error-msg" style="display: none;"></div>
          
          <button class="btn-login" id="msalLoginBtn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23" class="microsoft-icon">
              <rect x="1" y="1" width="10" height="10" fill="#f25022" />
              <rect x="12" y="1" width="10" height="10" fill="#7fba00" />
              <rect x="1" y="12" width="10" height="10" fill="#00a4ef" />
              <rect x="12" y="12" width="10" height="10" fill="#ffb900" />
            </svg>
            <span>Iniciar sesión con Microsoft</span>
          </button>
          
          <div class="login-footer-info">
            Acceso restringido a cuentas <strong style="color: var(--bdb-gold);">@lineacom.co</strong>
          </div>
        </div>
      </div>
    `;

    // Vincular evento de clic
    const btn = document.getElementById('msalLoginBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        this.showLoading();
        if (this.loginBtnCallback) this.loginBtnCallback();
      });
    }

    // Inicializar efectos de inclinación y partículas
    this.setupTiltAndGlow();
  }

  // Configurar inclinación 3D, Spotlight y partículas de fondo
  setupTiltAndGlow() {
    const card = this.container.querySelector('.login-card');
    const wrapper = this.container.querySelector('.login-screen-wrapper');
    if (!card || !wrapper) return;

    // Crear partículas flotantes
    const particlesContainer = document.getElementById('loginParticles');
    if (particlesContainer) {
      particlesContainer.innerHTML = ''; // Limpiar por si acaso
      const particleCount = 25;
      for (let i = 0; i < particleCount; i++) {
        const p = document.createElement('div');
        p.className = 'login-particle';
        p.style.left = `${Math.random() * 100}%`;
        p.style.top = `${Math.random() * 100 + 20}%`;
        p.style.width = `${Math.random() * 5 + 2}px`;
        p.style.height = p.style.width;
        p.style.animationDelay = `${Math.random() * -15}s`; // Negativo para que empiecen en posiciones variadas
        p.style.animationDuration = `${Math.random() * 20 + 15}s`;
        particlesContainer.appendChild(p);
      }
    }

    // Efecto de inclinación y foco de luz (spotlight)
    wrapper.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Guardar coordenadas en propiedades CSS de la tarjeta
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);

      // Calcular inclinación (Tilt 3D)
      const cardWidth = rect.width;
      const cardHeight = rect.height;
      const centerX = rect.left + cardWidth / 2;
      const centerY = rect.top + cardHeight / 2;
      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;

      // Rotación máxima de 6 grados para que sea sutil pero elegante
      const rotateX = (-mouseY / (cardHeight / 2)) * 6;
      const rotateY = (mouseX / (cardWidth / 2)) * 6;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
    });

    // Restaurar estado inicial al salir
    wrapper.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      card.style.setProperty('--mouse-x', `-500px`);
      card.style.setProperty('--mouse-y', `-500px`);
    });
  }

  // Mostrar indicador de carga en el botón
  showLoading() {
    const btn = document.getElementById('msalLoginBtn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `
        <div class="btn-spinner"></div>
        <span>Conectando con Microsoft...</span>
      `;
    }
    this.hideError();
  }

  // Ocultar indicador de carga y restaurar botón
  hideLoading() {
    const btn = document.getElementById('msalLoginBtn');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23" class="microsoft-icon">
          <rect x="1" y="1" width="10" height="10" fill="#f25022" />
          <rect x="12" y="1" width="10" height="10" fill="#7fba00" />
          <rect x="1" y="12" width="10" height="10" fill="#00a4ef" />
          <rect x="12" y="12" width="10" height="10" fill="#ffb900" />
        </svg>
        <span>Iniciar sesión con Microsoft</span>
      `;
    }
  }

  // Mostrar error
  showError(msg) {
    const errEl = document.getElementById('login-error-msg');
    if (errEl) {
      errEl.innerHTML = `⚠ ${msg}`;
      errEl.style.display = 'block';
      errEl.classList.add('shake');
      setTimeout(() => errEl.classList.remove('shake'), 500);
    }
    this.hideLoading();
  }

  // Ocultar error
  hideError() {
    const errEl = document.getElementById('login-error-msg');
    if (errEl) {
      errEl.style.display = 'none';
      errEl.textContent = '';
    }
  }

  // Ocultar pantalla de login con transición
  fadeOut(callback) {
    const wrapper = this.container.querySelector('.login-screen-wrapper');
    if (wrapper) {
      wrapper.classList.remove('fade-in');
      wrapper.classList.add('fade-out');
      setTimeout(() => {
        this.container.innerHTML = '';
        if (callback) callback();
      }, 500);
    } else {
      this.container.innerHTML = '';
      if (callback) callback();
    }
  }
}

// Exponer la clase a nivel global
window.AuthView = AuthView;
