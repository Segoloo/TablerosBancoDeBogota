'use strict';

class AppController {
  constructor() {
    this.authModel = new window.AuthModel();
    this.dashboardModel = new window.DashboardModel();
    
    this.authView = new window.AuthView('login-container');
    this.dashboardView = new window.DashboardView('app-container');
    this.indicatorsView = null; // Creado dinámicamente al cargar tablero
  }

  // Inicialización de la aplicación
  async init() {
    // Desarrollo local: permitir bypass de login para pruebas visuales
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('bypass')) {
      const mockUser = {
        nombre: 'Desarrollador Línea',
        cargo: 'Administrador de Tableros',
        email: 'dev@lineacom.co',
        foto: null
      };
      sessionStorage.setItem('bdb_user_profile', JSON.stringify(mockUser));
    } else {
      // Limpiar sesión al cargar la página para exigir Auth MSAL en cada recarga
      sessionStorage.removeItem('bdb_user_profile');
    }

    try {
      // Intentar inicializar MSAL silenciosamente en segundo plano
      await this.authModel.initialize();
    } catch (err) {
      console.error('[AppController] Error al inicializar MSAL:', err);
    }

    const user = this.authModel.getCurrentUser();
    if (user) {
      // Sesión activa, cargar el dashboard directo
      this.showDashboard(user);
    } else {
      // Mostrar pantalla de Login
      this.showLogin();
    }
  }

  // Carga y renderizado de la pantalla de login
  showLogin() {
    document.getElementById('login-container').classList.remove('hidden');
    document.getElementById('app-container').classList.add('hidden');
    
    this.authView.render();
    this.authView.bindLoginClick(async () => {
      try {
        const user = await this.authModel.login();
        // Login exitoso, ocultar login y mostrar dashboard
        this.authView.fadeOut(() => {
          document.getElementById('login-container').classList.add('hidden');
          this.showDashboard(user);
        });
      } catch (err) {
        console.error('[AppController] Error en login:', err);
        this.authView.showError(err.message || 'Error al conectar con Microsoft. Intenta nuevamente.');
      }
    });
  }

  // Carga y renderizado del shell principal del dashboard
  showDashboard(user) {
    const appContainer = document.getElementById('app-container');
    appContainer.classList.remove('hidden');
    appContainer.classList.add('visible');

    this.dashboardView.render(user);
    
    // Bindear Logout
    this.dashboardView.bindLogout(async () => {
      await this.authModel.logout();
      window.location.reload();
    });

    // Bindear Selección de Tableros
    this.dashboardView.bindBoardSelect((boardKey) => {
      this.routeBoard(boardKey);
    });

    // Cargar por defecto la vista Home Hub
    this.dashboardView.renderHomeHub();
  }

  // Enrutador para cargar los diferentes tableros
  async routeBoard(boardKey) {
    if (boardKey === 'home') {
      this.dashboardView.renderHomeHub();
      return;
    }

    if (boardKey === 'indicadores') {
      await this.loadAndShowIndicators();
    }
  }

  // Cargar datos de indicadores con overlay de progreso, y renderizar la vista de Indicadores
  async loadAndShowIndicators() {
    // Si ya están precargados, dibujar directo
    if (this.dashboardModel.rawIndicators) {
      this.renderIndicatorsTab();
      return;
    }

    // Mostrar overlay de carga con actualizaciones de estado
    this.dashboardView.showLoader('Iniciando descarga de indicadores...');
    
    try {
      await this.dashboardModel.loadIndicatorsData((phase, statusMsg) => {
        let percent = 10;
        if (phase === 'loading') percent = 40;
        else if (phase === 'decompressing') percent = 80;
        else if (phase === 'done') percent = 100;
        
        this.dashboardView.updateLoader(statusMsg, percent);
      });
      
      // Simular una pequeña pausa final para que se visualice la transición al 100%
      setTimeout(() => {
        this.dashboardView.hideLoader();
        this.renderIndicatorsTab();
      }, 500);

    } catch (err) {
      console.error('[AppController] Error al descargar los indicadores:', err);
      this.dashboardView.updateLoader(`❌ Error: ${err.message}`, 100);
      setTimeout(() => this.dashboardView.hideLoader(), 3000);
    }
  }

  // Renderizar la vista de Indicadores en el contenedor de contenido
  renderIndicatorsTab() {
    this.indicatorsView = new window.IndicatorsView('contentArea', this.dashboardModel);
    
    // Bindear cambios de filtros
    this.indicatorsView.bindFilterChange(() => {
      this.indicatorsView.renderActiveSubTab();
    });

    // Bindear exportación de Excel
    this.indicatorsView.bindExportExcel((rows, filename) => {
      this.exportToExcel(rows, filename);
    });

    this.indicatorsView.render(this.dashboardModel.rawIndicators);
  }

  // Exportador genérico a Excel utilizando SheetJS
  exportToExcel(rows, filename) {
    if (!window.XLSX) {
      alert('Error: La librería de exportación a Excel no está disponible.');
      return;
    }

    try {
      // Mapear los datos para una visualización limpia en Excel (sin campos del sistema)
      const cleanData = rows.map(r => {
        const copy = { ...r };
        delete copy._is_abierto;
        // Si hay campos seriales, formatear
        for (let k in copy) {
          copy[k] = this.dashboardModel.formatCellValue(k, copy[k]);
        }
        return copy;
      });

      const worksheet = window.XLSX.utils.json_to_sheet(cleanData);
      const workbook = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(workbook, worksheet, 'Detalle');
      window.XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch (err) {
      console.error('[AppController] Error exportando Excel:', err);
      alert('Fallo al exportar el archivo Excel.');
    }
  }
}

// Exponer la clase a nivel global
window.AppController = AppController;
