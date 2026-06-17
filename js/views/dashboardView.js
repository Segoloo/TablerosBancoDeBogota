'use strict';

class DashboardView {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.sidebarCollapsed = false;

    // Callbacks de interacción
    this.logoutCallback = null;
    this.boardSelectCallback = null;
  }

  bindLogout(callback) { this.logoutCallback = callback; }
  bindBoardSelect(callback) { this.boardSelectCallback = callback; }

  // Renderizar la estructura maestra del Shell
  render(userProfile) {
    const initials = (userProfile.nombre || 'U').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    const avatarHtml = userProfile.foto
      ? `<img src="${userProfile.foto}" class="user-chip-avatar" onerror="this.outerHTML='<div class=\\'user-chip-initials\\'>${initials}</div>'">`
      : `<div class="user-chip-initials">${initials}</div>`;

    this.container.innerHTML = `
      <div class="app-layout fade-in">
        <!-- Orbes de fondo -->
        <div class="dashboard-orb orb-bdb-dark"></div>
        <div class="dashboard-orb orb-bdb-red"></div>
        <div class="dashboard-orb orb-bdb-accent"></div>
        <div class="dashboard-orb orb-linea-accent"></div>
        <div class="dashboard-particles" id="dashboardParticles"></div>
        
        <!-- TOPBAR -->
        <header class="topbar">
          <div class="topbar-left">
            <div class="topbar-logos">
              <img src="assets/logo-linea-blanco.png" alt="Línea" class="topbar-logo-linea">
              <div class="topbar-divider"></div>
              <img src="assets/logo-bdb-sintexto.png" alt="Banco de Bogotá" class="topbar-logo-bdb" id="topbar-logo-bdb">
            </div>
            <div class="topbar-label" id="topbar-active-title">Panel de Control</div>
          </div>
          <div class="topbar-right">
            <!-- User Profile Chip -->
            <div class="user-chip" id="userProfileChip" title="Cerrar sesión">
              ${avatarHtml}
              <div class="user-chip-details">
                <div class="user-chip-name">${userProfile.nombre || ''}</div>
                <div class="user-chip-role">${userProfile.cargo || 'Colaborador'}</div>
              </div>
            </div>
            <button class="btn-logout-topbar" id="logoutBtn">Salir ↗</button>
          </div>
        </header>

        <div class="app-container">
          <!-- SIDEBAR -->
          <aside class="sidebar" id="sidebar">
            <div class="sidebar-toggle-row">
              <button class="btn-sidebar-toggle" id="sidebarToggleBtn" title="Colapsar panel">
                <span class="sidebar-toggle-icon">◀</span>
              </button>
            </div>
            
            <div class="sidebar-header-branding">
              <!-- Logotipo adaptable en sidebar -->
              <img src="assets/logo-bdb-sintexto.png" class="sidebar-brand-logo" id="sidebar-logo">
            </div>

            <div class="sidebar-section-label">Tableros Disponibles</div>
            <nav class="sidebar-menu">
              <!-- Tablero Home -->
              <div class="sidebar-item active" data-board="home">
                <span class="sidebar-icon">🏠</span>
                <span class="sidebar-label">Inicio Hub</span>
              </div>
              
              <!-- Tablero Indicadores CB -->
              <div class="sidebar-item" data-board="indicadores">
                <span class="sidebar-icon">📈</span>
                <span class="sidebar-label">Indicadores CB</span>
              </div>

              <!-- Tableros Futuros (Deshabilitados para expansión) -->
              <div class="sidebar-item disabled" title="Próximamente">
                <span class="sidebar-icon">🔍</span>
                <span class="sidebar-label">Prospección</span>
              </div>
              <div class="sidebar-item disabled" title="Próximamente">
                <span class="sidebar-icon">🔄</span>
                <span class="sidebar-label">Seguimiento transaccional</span>
              </div>
            </nav>

            <!-- Marca de Agua en Sidebar Footer -->
            <div class="sidebar-watermark-footer">
              <div class="wm-desc">Desarrollado por</div>
              <div class="wm-author">Sebastián Gómez López</div>
            </div>
          </aside>

          <!-- CONTENT AREA -->
          <main class="content-area" id="contentArea">
            <!-- Se cargará dinámicamente -->
          </main>
        </div>

        <!-- FOOTER -->
        <footer class="app-footer">
          <div class="footer-branding">
            <img src="assets/logo-linea-blanco.png" class="footer-logo-linea">
            <span>×</span>
            <img src="assets/logo-bdb-sintexto.png" class="footer-logo-bdb">
          </div>
          <div class="footer-version">Plataforma Unificada v3.0 · Desarrollado por Sebastián Gómez López</div>
        </footer>
      </div>

      <!-- OVERLAY DE CARGA (Para peticiones y descompresión) -->
      <div id="loadingOverlay" class="loading-overlay hidden">
        <div class="loader-card">
          <div class="loader-logos">
            <img src="assets/logo-linea-blanco.png" class="loader-logo-linea">
            <div class="loader-divider"></div>
            <img src="assets/logo-bdb-sintexto.png" class="loader-logo-bdb">
          </div>
          <div class="loader-title">Cargando Tablero</div>
          <div class="loader-spinner-container">
            <div class="loader-spinner"></div>
            <div class="loader-status" id="loaderStatus">Preparando descarga de datos...</div>
          </div>
          <div class="loader-progress-bar">
            <div class="loader-progress-fill" id="loaderProgressFill"></div>
          </div>
        </div>
      </div>
    `;

    this.setupEvents();
    this.setupParticles();
  }

  // Inicializar partículas flotantes lentas en el fondo del dashboard
  setupParticles() {
    const container = document.getElementById('dashboardParticles');
    if (container) {
      container.innerHTML = '';
      const particleCount = 35; // Mayor cantidad por ser un área más grande
      for (let i = 0; i < particleCount; i++) {
        const p = document.createElement('div');
        p.className = 'dashboard-particle';
        p.style.left = `${Math.random() * 100}%`;
        p.style.top = `${Math.random() * 100}%`;
        p.style.width = `${Math.random() * 5 + 2}px`;
        p.style.height = p.style.width;
        p.style.animationDelay = `${Math.random() * -25}s`;
        p.style.animationDuration = `${Math.random() * 30 + 20}s`; // Más lentas y suaves
        container.appendChild(p);
      }
    }
  }

  setupEvents() {
    // Evento Logout
    const logout = () => {
      if (confirm('¿Desea cerrar la sesión actual?')) {
        if (this.logoutCallback) this.logoutCallback();
      }
    };
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    document.getElementById('userProfileChip')?.addEventListener('click', logout);

    // Evento Toggle Sidebar
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    toggleBtn?.addEventListener('click', () => this.toggleSidebar());

    // Evento Selección de Tableros en el Sidebar
    const menuItems = this.container.querySelectorAll('.sidebar-item:not(.disabled)');
    menuItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const target = e.currentTarget;
        menuItems.forEach(i => i.classList.remove('active'));
        target.classList.add('active');

        const boardKey = target.getAttribute('data-board');

        // Actualizar título de Topbar
        const titleEl = document.getElementById('topbar-active-title');
        if (titleEl) {
          titleEl.textContent = boardKey === 'home' ? 'Panel de Control' : target.querySelector('.sidebar-label').textContent;
        }

        if (this.boardSelectCallback) this.boardSelectCallback(boardKey);
      });
    });

    // Evento Selección de Tableros desde el Home Hub (Hub Cards)
    this.container.addEventListener('click', (e) => {
      const card = e.target.closest('.hub-card:not(.disabled)');
      if (card) {
        const boardKey = card.getAttribute('data-board');
        if (boardKey) {
          // Activar visualmente en el sidebar
          const sidebarItem = this.container.querySelector(`.sidebar-item[data-board="${boardKey}"]`);
          if (sidebarItem) {
            menuItems.forEach(i => i.classList.remove('active'));
            sidebarItem.classList.add('active');
            
            // Actualizar título de Topbar
            const titleEl = document.getElementById('topbar-active-title');
            if (titleEl) {
              titleEl.textContent = sidebarItem.querySelector('.sidebar-label').textContent;
            }
          }
          if (this.boardSelectCallback) this.boardSelectCallback(boardKey);
        }
      }
    });
  }

  // Colapsar / Expandir barra lateral
  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    const logoImg = document.getElementById('sidebar-logo');
    const iconSpan = toggleBtn?.querySelector('.sidebar-toggle-icon');

    this.sidebarCollapsed = !this.sidebarCollapsed;

    if (sidebar) {
      if (this.sidebarCollapsed) {
        sidebar.classList.add('collapsed');
        if (iconSpan) iconSpan.textContent = '▶';
      } else {
        sidebar.classList.remove('collapsed');
        if (iconSpan) iconSpan.textContent = '◀';
      }
    }
  }

  // Métodos de control del Loading Overlay
  showLoader(initialStatus = 'Iniciando carga de datos...') {
    const overlay = document.getElementById('loadingOverlay');
    const statusEl = document.getElementById('loaderStatus');
    const progressFill = document.getElementById('loaderProgressFill');

    if (statusEl) statusEl.textContent = initialStatus;
    if (progressFill) progressFill.style.width = '10%';
    if (overlay) overlay.classList.remove('hidden');
  }

  updateLoader(status, progressPercent) {
    const statusEl = document.getElementById('loaderStatus');
    const progressFill = document.getElementById('loaderProgressFill');

    if (statusEl) statusEl.textContent = status;
    if (progressFill) progressFill.style.width = `${progressPercent}%`;
  }

  hideLoader() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }
  }

  // Renderizar la vista de bienvenida (Home Hub)
  renderHomeHub(onSelectBoard) {
    const content = document.getElementById('contentArea');
    if (!content) return;

    content.innerHTML = `
      <div class="home-hub-wrapper fade-in">
        <div class="home-hub-header">
          <div class="home-hub-welcome">¡Bienvenido a la Plataforma Unificada!</div>
          <div class="home-hub-sub">Línea Comunicaciones x Banco de Bogotá</div>
        </div>

        <!-- Panel de Estado y Telemetría del Sistema (Estilo Corporativo Premium) -->
        <div class="home-hub-status-panel">
          <div class="status-panel-item">
            <span class="status-dot green-glow"></span>
            <span class="status-label">Servicios:</span>
            <span class="status-value">Operativos</span>
          </div>
          <div class="status-panel-divider"></div>
          <div class="status-panel-item">
            <span class="status-dot green-glow"></span>
            <span class="status-label">Database:</span>
            <span class="status-value">Working</span>
          </div>
          <div class="status-panel-divider"></div>
          <div class="status-panel-item">
            <span class="status-dot green-glow"></span>
            <span class="status-label">Seguridad MSAL:</span>
            <span class="status-value">Activa</span>
          </div>
          <div class="status-panel-divider"></div>
          <div class="status-panel-item">
            <span class="status-label">Entorno:</span>
            <span class="status-value">Producción</span>
          </div>
        </div>

        <div class="home-hub-cards">
          <!-- Card de Indicadores CB -->
          <div class="hub-card" data-board="indicadores">
            <div class="hub-card-icon">📈</div>
            <h3 class="hub-card-title">Indicadores CB</h3>
            <p class="hub-card-desc">Control operativo y analítico de capacitación, instalación de publicidad y desinstalaciones de material en corresponsales bancarios.</p>
            <div class="hub-card-badge" style="background: rgba(0, 135, 110, 0.2); color: var(--bdb-green-prem); border-color: rgba(0, 135, 110, 0.4);">Activo</div>
          </div>

          <!-- Mocks de otros tableros -->
          <div class="hub-card disabled">
            <div class="hub-card-icon">🔍</div>
            <h3 class="hub-card-title">Prospección</h3>
            <p class="hub-card-desc">Módulo para identificar y gestionar oportunidades de nuevos puntos y comercios potenciales para la corresponsalía.</p>
            <div class="hub-card-badge">Próximamente</div>
          </div>

          <div class="hub-card disabled">
            <div class="hub-card-icon">🔄</div>
            <h3 class="hub-card-title">Seguimiento transaccional</h3>
            <p class="hub-card-desc">Monitoreo transaccional por Corresponsalía Bancaria, detectando volumen, cupos y comportamiento de operaciones.</p>
            <div class="hub-card-badge">Próximamente</div>
          </div>
        </div>

        <div class="home-hub-watermark-footer">
          Desarrollado por Sebastián Gómez López
        </div>
      </div>
    `;
  }
}

// Exponer la clase a nivel global
window.DashboardView = DashboardView;
