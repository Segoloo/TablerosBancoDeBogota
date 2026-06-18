'use strict';

class IndicatorsView {
  constructor(containerId, model) {
    this.containerId = containerId;
    this.model = model;
    
    this.activeSubTab = 'publicidad'; // Tab por defecto: Publicidad
    this.charts = {}; // Almacén de instancias de Chart.js
    this.currentPageRows = []; // Almacén de registros de la página activa
    
    // Callbacks del controlador
    this.filterChangeCallback = null;
    this.exportExcelCallback = null;
    
    // Paleta de Colores Oficial Banco de Bogotá
    this.colors = {
      blue: '#14327D',
      blueDark: '#001A3A',
      gold: '#D6A218',
      green: '#00876E',
      pink: '#CD5F8C',
      yellow: '#EBCD5A',
      red: '#CD3232',
      grey: '#94A3B8'
    };
  }

  bindFilterChange(callback) { this.filterChangeCallback = callback; }
  bindExportExcel(callback) { this.exportExcelCallback = callback; }

  // Obtiene el contenedor del contenido
  getContainer() {
    return document.getElementById(this.containerId);
  }

  // Renderizar la estructura general del Tablero Indicadores CB
  render(data) {
    const container = this.getContainer();
    if (!container) return;

    container.innerHTML = `
      <div class="indicators-dashboard-wrapper fade-in">
        <!-- HEADER DEL TABLERO -->
        <div class="board-header">
          <div class="board-title-row">
            <h2>📈 Indicadores CB</h2>
            <div class="board-tag">Tablero de Control Operativo · Banco de Bogotá</div>
          </div>
          
          <!-- SUB-PESTAÑAS (Navegación interna) -->
          <div class="sub-tab-bar" id="subTabBar">
            <button class="sub-tab-btn active" data-subtab="publicidad">📢 Publicidad</button>
            <button class="sub-tab-btn" data-subtab="capacitacion">🎓 Capacitación</button>
            <button class="sub-tab-btn" data-subtab="desinstalacion">🔄 Desinstalación Pub.</button>
          </div>
        </div>

        <!-- BARRA DE FILTROS GLOBALES (SLICERS) -->
        <div class="filters-panel">
          <div class="filters-header">Filtros de Búsqueda del Tablero</div>
          <div class="filters-grid">
            <div class="filter-group">
              <label>Departamento</label>
              <div class="excel-dropdown" id="ddDepto" data-filter="depto">
                <button class="excel-dropdown-btn">Todos</button>
                <div class="excel-dropdown-content hidden">
                  <input type="text" placeholder="Buscar..." class="excel-dropdown-search">
                  <div class="excel-dropdown-actions">
                    <button class="btn-dd-all">Todos</button>
                    <button class="btn-dd-none">Ninguno</button>
                  </div>
                  <div class="excel-dropdown-list"></div>
                </div>
              </div>
            </div>
            <div class="filter-group">
              <label>Zona Lineacom</label>
              <div class="excel-dropdown" id="ddZona" data-filter="zona">
                <button class="excel-dropdown-btn">Todos</button>
                <div class="excel-dropdown-content hidden">
                  <input type="text" placeholder="Buscar..." class="excel-dropdown-search">
                  <div class="excel-dropdown-actions">
                    <button class="btn-dd-all">Todos</button>
                    <button class="btn-dd-none">Ninguno</button>
                  </div>
                  <div class="excel-dropdown-list"></div>
                </div>
              </div>
            </div>
            <div class="filter-group">
              <label>Estado</label>
              <div class="excel-dropdown" id="ddEstado" data-filter="estado">
                <button class="excel-dropdown-btn">Todos</button>
                <div class="excel-dropdown-content hidden">
                  <input type="text" placeholder="Buscar..." class="excel-dropdown-search">
                  <div class="excel-dropdown-actions">
                    <button class="btn-dd-all">Todos</button>
                    <button class="btn-dd-none">Ninguno</button>
                  </div>
                  <div class="excel-dropdown-list"></div>
                </div>
              </div>
            </div>
            <div class="filter-group">
              <label>Cumple SLA</label>
              <div class="excel-dropdown" id="ddSLA" data-filter="sla">
                <button class="excel-dropdown-btn">Todos</button>
                <div class="excel-dropdown-content hidden">
                  <input type="text" placeholder="Buscar..." class="excel-dropdown-search">
                  <div class="excel-dropdown-actions">
                    <button class="btn-dd-all">Todos</button>
                    <button class="btn-dd-none">Ninguno</button>
                  </div>
                  <div class="excel-dropdown-list"></div>
                </div>
              </div>
            </div>
            <div class="filter-group">
              <label>Técnico / Ingeniero</label>
              <div class="excel-dropdown" id="ddTecnico" data-filter="tecnico">
                <button class="excel-dropdown-btn">Todos</button>
                <div class="excel-dropdown-content hidden">
                  <input type="text" placeholder="Buscar..." class="excel-dropdown-search">
                  <div class="excel-dropdown-actions">
                    <button class="btn-dd-all">Todos</button>
                    <button class="btn-dd-none">Ninguno</button>
                  </div>
                  <div class="excel-dropdown-list"></div>
                </div>
              </div>
            </div>
            <div class="filter-group">
              <label>Tipología</label>
              <div class="excel-dropdown" id="ddTipologia" data-filter="tipologia">
                <button class="excel-dropdown-btn">Todos</button>
                <div class="excel-dropdown-content hidden">
                  <input type="text" placeholder="Buscar..." class="excel-dropdown-search">
                  <div class="excel-dropdown-actions">
                    <button class="btn-dd-all">Todos</button>
                    <button class="btn-dd-none">Ninguno</button>
                  </div>
                  <div class="excel-dropdown-list"></div>
                </div>
              </div>
            </div>
            <div class="filter-group">
              <label>Forma de Atención</label>
              <div class="excel-dropdown" id="ddFormaAtencion" data-filter="formaAtencion">
                <button class="excel-dropdown-btn">Todos</button>
                <div class="excel-dropdown-content hidden">
                  <input type="text" placeholder="Buscar..." class="excel-dropdown-search">
                  <div class="excel-dropdown-actions">
                    <button class="btn-dd-all">Todos</button>
                    <button class="btn-dd-none">Ninguno</button>
                  </div>
                  <div class="excel-dropdown-list"></div>
                </div>
              </div>
            </div>
            <div class="filter-group">
              <label>Estado de la Visita</label>
              <div class="excel-dropdown" id="ddEstadoVisita" data-filter="estadoVisita">
                <button class="excel-dropdown-btn">Todos</button>
                <div class="excel-dropdown-content hidden">
                  <input type="text" placeholder="Buscar..." class="excel-dropdown-search">
                  <div class="excel-dropdown-actions">
                    <button class="btn-dd-all">Todos</button>
                    <button class="btn-dd-none">Ninguno</button>
                  </div>
                  <div class="excel-dropdown-list"></div>
                </div>
              </div>
            </div>
            <!-- Nuevos Filtros Avanzados -->
            <div class="filter-group">
              <label>Código de Punto (ID Sitio)</label>
              <input type="text" id="txtPunto" placeholder="Ej. 12345" class="table-search-box" style="width: 100%;">
            </div>
            <div class="filter-group">
              <label>Código de Tarea (TA)</label>
              <input type="text" id="txtTA" placeholder="Ej. T-1234" class="table-search-box" style="width: 100%;">
            </div>
            <div class="filter-group">
              <label>Código de Formulario (FO)</label>
              <input type="text" id="txtFO" placeholder="Ej. FO-1234" class="table-search-box" style="width: 100%;">
            </div>
            <div class="filter-actions" style="grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
              <button class="btn-apply-filters" id="btnApplyFilters">✦ Filtrar</button>
              <button class="btn-reset-filters" id="btnResetFilters">↺ Reiniciar</button>
            </div>
          </div>
        </div>

        <!-- CONTENEDOR DINÁMICO DE SUB-PESTAÑAS -->
        <div class="sub-tab-content" id="subTabContent">
          <!-- Renders dinámicos según sub-pestaña -->
        </div>
      </div>
    `;

    this.populateFilters(data);
    this.setupEvents();
    
    // Renderizar sub-pestaña activa por defecto
    this.renderActiveSubTab();
  }

  // Carga dinámica de listas desplegables y cajas de texto basadas en los filtros del modelo
  populateFilters(data) {
    if (!data) return;

    const deptos = new Set();
    const zonas = new Set();
    const tecnicos = new Set();
    const tipologias = new Set();
    const formasAtencion = new Set();
    const estadosVisita = new Set();

    // Extraer valores únicos de todas las secciones
    const scanRows = (rows) => {
      if (!Array.isArray(rows)) return;
      rows.forEach(r => {
        if (r['DEPARTAMENTO']) deptos.add(r['DEPARTAMENTO'].toString().trim());
        
        let zonaVal = r['ZONA LINEACOM'] || r['COORDINADOR ENCARGADO'];
        if (zonaVal) zonas.add(zonaVal.toString().trim());
        
        const tec = r['TECNICO'] || r['INGENIERO DE CAMPO'] || r['TÉCNICO'];
        if (tec) tecnicos.add(tec.toString().trim());

        const tipo = r['TIPOLOGIA'] || 'SIN TIPOLOGÍA';
        tipologias.add(tipo.toString().trim());

        if (r['FORMA DE ATENCION']) formasAtencion.add(r['FORMA DE ATENCION'].toString().trim());

        const estVis = this.model.getRecordVisitStatus(r);
        if (estVis) estadosVisita.add(estVis.toString().trim());
      });
    };

    if (data.implementacion) {
      scanRows(data.implementacion.bd);
      scanRows(data.implementacion.abiertos);
    }
    if (data.desinstalacion) {
      scanRows(data.desinstalacion.bd);
      scanRows(data.desinstalacion.abiertos);
    }

    // Inicializar los Excel multi-select dropdowns
    this.buildExcelDropdown('ddDepto', deptos, 'depto');
    this.buildExcelDropdown('ddZona', zonas, 'zona');
    
    const estados = new Set(['ABIERTO', 'CERRADO']);
    this.buildExcelDropdown('ddEstado', estados, 'estado');
    
    const slas = new Set(['SI', 'NO']);
    this.buildExcelDropdown('ddSLA', slas, 'sla');
    
    this.buildExcelDropdown('ddTecnico', tecnicos, 'tecnico');
    this.buildExcelDropdown('ddTipologia', tipologias, 'tipologia');
    this.buildExcelDropdown('ddFormaAtencion', formasAtencion, 'formaAtencion');
    this.buildExcelDropdown('ddEstadoVisita', estadosVisita, 'estadoVisita');

    // Sincronizar inputs de texto
    const txtPunto = document.getElementById('txtPunto');
    if (txtPunto) txtPunto.value = this.model.filters.punto || '';
    const txtTA = document.getElementById('txtTA');
    if (txtTA) txtTA.value = this.model.filters.ta || '';
    const txtFO = document.getElementById('txtFO');
    if (txtFO) txtFO.value = this.model.filters.fo || '';
  }

  // Construye y controla el comportamiento tipo Excel del dropdown multi-select (Enfoque MVC)
  buildExcelDropdown(ddId, values, modelField) {
    const dropdown = document.getElementById(ddId);
    if (!dropdown) return;

    const btn = dropdown.querySelector('.excel-dropdown-btn');
    const content = dropdown.querySelector('.excel-dropdown-content');
    const searchInput = dropdown.querySelector('.excel-dropdown-search');
    const listContainer = dropdown.querySelector('.excel-dropdown-list');
    const btnAll = dropdown.querySelector('.btn-dd-all');
    const btnNone = dropdown.querySelector('.btn-dd-none');

    // Limpiar manejadores previos clonando elementos si es necesario o limpiando listeners
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    const newBtnAll = btnAll.cloneNode(true);
    btnAll.parentNode.replaceChild(newBtnAll, btnAll);

    const newBtnNone = btnNone.cloneNode(true);
    btnNone.parentNode.replaceChild(newBtnNone, btnNone);

    // Cerrar si hace clic fuera
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) {
        content.classList.add('hidden');
      }
    });

    // Toggle dropdown
    newBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.excel-dropdown-content').forEach(c => {
        if (c !== content) c.classList.add('hidden');
      });
      content.classList.toggle('hidden');
      if (!content.classList.contains('hidden')) {
        searchInput.focus();
      }
    });

    // Cargar opciones
    const sortedValues = Array.from(values).sort();
    
    const renderList = (filterQuery = '') => {
      listContainer.innerHTML = '';
      const q = filterQuery.toLowerCase().trim();
      
      sortedValues.forEach(val => {
        if (q && !val.toLowerCase().includes(q)) return;
        
        const label = document.createElement('label');
        label.className = 'excel-dropdown-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = val;
        
        // Si el filtro en el modelo incluye este valor, o está vacío (todos seleccionados)
        const isChecked = this.model.filters[modelField].includes(val.toUpperCase()) || 
                          this.model.filters[modelField].length === 0;
        
        checkbox.checked = isChecked;
        
        checkbox.addEventListener('change', () => {
          this.updateFilterFromCheckboxes(dropdown, modelField);
        });
        
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(' ' + val));
        listContainer.appendChild(label);
      });
    };

    // Buscar
    searchInput.addEventListener('input', (e) => {
      renderList(e.target.value);
    });

    // Seleccionar Todos
    newBtnAll.addEventListener('click', (e) => {
      e.stopPropagation();
      listContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
      this.updateFilterFromCheckboxes(dropdown, modelField);
    });

    // Seleccionar Ninguno
    newBtnNone.addEventListener('click', (e) => {
      e.stopPropagation();
      listContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
      this.updateFilterFromCheckboxes(dropdown, modelField);
    });

    // Renderizado inicial de la lista
    renderList();
    this.updateDropdownButtonLabel(dropdown, modelField, sortedValues.length);
  }

  // Actualiza el filtro en el modelo basado en el estado actual de los checkboxes
  updateFilterFromCheckboxes(dropdown, modelField) {
    const listContainer = dropdown.querySelector('.excel-dropdown-list');
    const checkedCheckboxes = listContainer.querySelectorAll('input[type="checkbox"]:checked');
    const allCheckboxes = listContainer.querySelectorAll('input[type="checkbox"]');
    
    if (checkedCheckboxes.length === allCheckboxes.length) {
      this.model.filters[modelField] = [];
    } else {
      this.model.filters[modelField] = Array.from(checkedCheckboxes).map(cb => cb.value.toUpperCase());
    }
    
    this.updateDropdownButtonLabel(dropdown, modelField, allCheckboxes.length);
  }

  // Actualiza el texto del botón del dropdown según lo seleccionado
  updateDropdownButtonLabel(dropdown, modelField, totalItemsCount) {
    const btn = dropdown.querySelector('.excel-dropdown-btn');
    const selected = this.model.filters[modelField];
    
    if (selected.length === 0) {
      btn.textContent = 'Todos';
      btn.classList.remove('has-filter');
    } else if (selected.length === totalItemsCount) {
      btn.textContent = 'Todos';
      btn.classList.remove('has-filter');
    } else if (selected.length === 1) {
      const listContainer = dropdown.querySelector('.excel-dropdown-list');
      const checkedOne = listContainer.querySelector('input[type="checkbox"]:checked');
      btn.textContent = checkedOne ? checkedOne.value : '1 Seleccionado';
      btn.classList.add('has-filter');
    } else {
      btn.textContent = `${selected.length} seleccionados`;
      btn.classList.add('has-filter');
    }
  }

  setupEvents() {
    // 1. Manejo de Sub-Pestañas
    const buttons = document.querySelectorAll('#subTabBar .sub-tab-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        buttons.forEach(b => b.classList.remove('active'));
        const target = e.currentTarget;
        target.classList.add('active');
        
        this.activeSubTab = target.getAttribute('data-subtab');
        this.renderActiveSubTab();
      });
    });

    // 2. Manejo de Filtros
    document.getElementById('btnApplyFilters')?.addEventListener('click', () => {
      // Sincronizar inputs de texto con el modelo
      this.model.filters.punto = document.getElementById('txtPunto')?.value || '';
      this.model.filters.ta = document.getElementById('txtTA')?.value || '';
      this.model.filters.fo = document.getElementById('txtFO')?.value || '';
      
      if (this.filterChangeCallback) this.filterChangeCallback();
    });

    document.getElementById('btnResetFilters')?.addEventListener('click', () => {
      this.model.filters = {
        depto: [],
        zona: [],
        estado: [],
        sla: [],
        tecnico: [],
        tipologia: [],
        formaAtencion: [],
        estadoVisita: [],
        punto: '',
        ta: '',
        fo: ''
      };
      
      // Resetear inputs de texto
      const txtPunto = document.getElementById('txtPunto'); if (txtPunto) txtPunto.value = '';
      const txtTA = document.getElementById('txtTA'); if (txtTA) txtTA.value = '';
      const txtFO = document.getElementById('txtFO'); if (txtFO) txtFO.value = '';
      
      // Volver a poblar filtros
      const rawData = this.model.rawIndicators;
      if (rawData) {
        this.populateFilters(rawData);
      }
      
      if (this.filterChangeCallback) this.filterChangeCallback();
    });
  }

  // Renderizar la sección interna de la sub-pestaña activa
  renderActiveSubTab() {
    const content = document.getElementById('subTabContent');
    if (!content) return;

    // Obtener los datos crudos
    const data = this.model.rawIndicators;
    if (!data) {
      content.innerHTML = `<div class="empty-dashboard-state">No hay datos cargados en el tablero.</div>`;
      return;
    }

    // Identificar las listas de datos según sub-pestaña
    let rawList = [];
    let titleTab = '';
    let slaField = 'CUMPLE SLA';
    let respField = 'RESPONSABLE INCUMPLIMIENTO';

    if (this.activeSubTab === 'desinstalacion') {
      titleTab = 'Desinstalación de Publicidad';
      rawList = (data.desinstalacion?.bd || []).concat(data.desinstalacion?.abiertos || []);
      rawList = rawList.filter(r => {
        const t = (r['TIPO DE SERVICIO'] || '').toString().trim().toUpperCase();
        return t === 'CIERRES BANCO DE BOGOTA';
      });
      slaField = 'DENTRO DE LOS SLA';
    } else {
      if (this.activeSubTab === 'implementacion') {
        titleTab = 'Capacitación y Publicidad';
      } else if (this.activeSubTab === 'publicidad') {
        titleTab = 'Publicidad';
      } else if (this.activeSubTab === 'capacitacion') {
        titleTab = 'Capacitación';
      }
      rawList = (data.implementacion?.bd || []).concat(data.implementacion?.abiertos || []);
      rawList = rawList.filter(r => {
        const t = (r['TIPO DE SERVICIO'] || '').toString().trim().toUpperCase();
        return t === 'FORMATO CAPACITACION Y PUBLICIDAD BANCO DE BOGOTA';
      });
    }

    // Filtrar la lista actualizando slicers del modelo
    const filteredRows = this.model.filterList(rawList, this.activeSubTab);

    // Destruir gráficos anteriores
    this.destroyCharts();

    // Renderizar estructura base del sub-panel
    let chartsLayoutHtml = '';

    if (this.activeSubTab === 'implementacion' || this.activeSubTab === 'desinstalacion') {
      chartsLayoutHtml = `
        <div class="charts-layout">
          <!-- Gráfico de Línea - Tendencia -->
          <div class="chart-card">
            <div class="chart-title">Tendencia Mensual</div>
            <div class="chart-container-wrapper">
              <canvas id="chartTrend"></canvas>
            </div>
          </div>

          <!-- Gráfico de Donut - SLA -->
          <div class="chart-card">
            <div class="chart-title">Cumplimiento General SLA</div>
            <div class="chart-container-wrapper">
              <canvas id="chartSLA"></canvas>
            </div>
          </div>

          <!-- Gráfico de Barras Horizontal - Departamentos -->
          <div class="chart-card wide-chart">
            <div class="chart-title">Top 10 Departamentos</div>
            <div class="chart-container-wrapper" style="height: 250px;">
              <canvas id="chartDepto"></canvas>
            </div>
          </div>
        </div>
      `;
    } else if (this.activeSubTab === 'publicidad') {
      chartsLayoutHtml = `
        <div class="charts-layout">
          <!-- Elementos Instalados -->
          <div class="chart-card">
            <div class="chart-title">Elementos Kit Publicidad Instalados</div>
            <div class="chart-container-wrapper">
              <canvas id="chartKitPublicidad"></canvas>
            </div>
          </div>

          <!-- Distribución por Tipologías -->
          <div class="chart-card">
            <div class="chart-title">Distribución por Tipología</div>
            <div class="chart-container-wrapper">
              <canvas id="chartTipologia"></canvas>
            </div>
          </div>

          <!-- Estado de Visita -->
          <div class="chart-card">
            <div class="chart-title">Estado de las Visitas</div>
            <div class="chart-container-wrapper">
              <canvas id="chartEstadoVisita"></canvas>
            </div>
          </div>

          <!-- Distribución por Zona Lineacom -->
          <div class="chart-card">
            <div class="chart-title">Distribución por Zona Lineacom</div>
            <div class="chart-container-wrapper">
              <canvas id="chartZonaPublicidad"></canvas>
            </div>
          </div>

          <!-- Causales de No Instalación -->
          <div class="chart-card wide-chart">
            <div class="chart-title">Causales de No Instalación</div>
            <div class="chart-container-wrapper" style="height: 260px;">
              <canvas id="chartCausalNoInstalacion"></canvas>
            </div>
          </div>

          <!-- Elementos Instalados por Tipología (Barras Apiladas) -->
          <div class="chart-card wide-chart">
            <div class="chart-title">Elementos Instalados por Tipología</div>
            <div class="chart-container-wrapper" style="height: 280px;">
              <canvas id="chartElementosPorTipologia"></canvas>
            </div>
          </div>
        </div>
      `;
    } else if (this.activeSubTab === 'capacitacion') {
      chartsLayoutHtml = `
        <div class="charts-layout">
          <!-- Facturables vs Garantías -->
          <div class="chart-card">
            <div class="chart-title">Capacitación: Facturables vs Garantías</div>
            <div class="chart-container-wrapper">
              <canvas id="chartFacturablesGarantias"></canvas>
            </div>
          </div>

          <!-- Distribución por Tipologías -->
          <div class="chart-card">
            <div class="chart-title">Distribución por Tipología</div>
            <div class="chart-container-wrapper">
              <canvas id="chartTipologiaCapacitacion"></canvas>
            </div>
          </div>

          <!-- Estado y Causas de Falla en Capacitación -->
          <div class="chart-card wide-chart">
            <div class="chart-title">Estado y Causas de Visita de Capacitación</div>
            <div class="chart-container-wrapper" style="height: 250px;">
              <canvas id="chartEstadoCapacitacion"></canvas>
            </div>
          </div>
        </div>
      `;
    }

    content.innerHTML = `
      <div class="sub-tab-panel-container fade-in">
        <!-- Panel de Monitoreo Detallado por Punto (fuera de la rejilla de KPIs) -->
        <div id="pointKpiContainer"></div>

        <!-- KPIs Principales -->
        <div class="kpi-board" id="kpiBoard">
          <!-- Creados dinámicamente -->
        </div>

        <!-- Gráficos Dinámicos -->
        ${chartsLayoutHtml}

        <!-- Tabla de Detalle Completa -->
        <div class="table-section-card">
          <div class="table-section-header">
            <h3>Detalle de Registros (${titleTab})</h3>
            <div class="table-section-actions">
              <input type="text" id="tableSearchInput" placeholder="🔍 Buscar..." class="table-search-box">
              <button class="btn-export-excel" id="btnExportExcel">⬇ Exportar a Excel</button>
            </div>
          </div>
          <div class="table-responsive-wrapper" id="tableContentArea">
            <!-- Tabla cargada dinámicamente -->
          </div>
          <div class="table-pagination-footer" id="tablePaginationFooter">
            <!-- Paginador -->
          </div>
        </div>
      </div>
    `;

    // 1. Dibujar Tarjetas de KPIs y bindear clicks clickeables
    this.renderKPIs(filteredRows, slaField, respField);

    // 2. Inicializar Gráficos
    this.renderCharts(filteredRows, slaField);

    // 3. Dibujar Tabla y Paginador
    this.renderTable(filteredRows);

    // 4. Configurar eventos de la tabla (búsqueda, paginador, exportación y apertura de Wizard)
    this.setupTableEvents(filteredRows);
  }

  // Destruir instancias de gráficos para evitar fugas de memoria
  destroyCharts() {
    Object.keys(this.charts).forEach(key => {
      if (this.charts[key]) {
        this.charts[key].destroy();
      }
    });
    this.charts = {};
  }

  // Resuelve dinámicamente el estado de una visita buscando en las respuestas de formularios si está vacío en el registro
  getRecordVisitStatus(r) {
    let status = r['ESTADO DE LA VISITA'] || r['ESTADO'] || '';
    status = status.toString().trim().toUpperCase();
    
    if (!status && Array.isArray(r.FORMS)) {
      for (const f of r.FORMS) {
        const resps = f.RESPUESTAS || {};
        for (const [q, a] of Object.entries(resps)) {
          const qUp = q.toUpperCase().trim();
          const aStr = String(a).toUpperCase().trim();
          if (qUp === 'ESTADO' || qUp === 'ESTADO DE LA VISITA' || qUp === 'ESTADO RESULTADO ACTIVIDAD') {
            status = aStr;
            break;
          }
        }
        if (status) break;
      }
    }
    
    if (!status) return 'SIN REGISTRO';
    
    if (status.includes('NO_EXITOSO') || status.includes('NO EXITOSA') || status.includes('ILOCALIZADO') || status.includes('FALLIDA')) {
      return 'NO EXITOSA';
    }
    if (status.includes('EXITOSO') || status.includes('EXITOSA') || status === 'EJECUTADO') {
      return 'EXITOSA';
    }
    if (status.includes('CANCELADO') || status.includes('CANCELADA')) {
      return 'CANCELADA';
    }
    if (status.includes('TELEFONICA') || status.includes('TELEFÓNICA')) {
      return 'GESTIÓN TELEFÓNICA';
    }
    
    return status;
  }

  // Genera y renderiza las tarjetas de indicadores clave (KPIs)
  renderKPIs(rows, slaField, respField) {
    const container = document.getElementById('kpiBoard');
    if (!container) return;

    const total = rows.length;
    const abiertos = rows.filter(r => r._is_abierto).length;
    const cerrados = total - abiertos;

    // Calcular SLA General
    const cumpleSlaCount = rows.filter(r => (r[slaField] || '').toString().toUpperCase() === 'SI').length;
    const pctSla = total ? ((cumpleSlaCount / total) * 100).toFixed(1) + '%' : '100.0%';

    // Calcular SLA Ajustado (excluyendo retrasos atribuibles a la ENTIDAD u otros externos)
    const fallasLinea = rows.filter(r => 
      (r[slaField] || '').toString().toUpperCase().trim() === 'NO' &&
      this.model.isSameResp('LINEACOM', r[respField])
    ).length;

    const fallasEntidad = rows.filter(r => 
      (r[slaField] || '').toString().toUpperCase().trim() === 'NO' &&
      this.model.isSameResp('ENTIDAD', r[respField])
    ).length;

    const cumpleAjustado = total - fallasLinea;
    const pctAjustado = total ? ((cumpleAjustado / total) * 100).toFixed(1) + '%' : '100.0%';

    // KPI extra para Capacitación: % Garantías
    let garantiasKpiHtml = '';
    if (this.activeSubTab === 'capacitacion') {
      let facturables = 0;
      let garantias = 0;
      rows.forEach(r => {
        const forma = (r['FORMA DE ATENCION'] || '').trim().toUpperCase();
        if (forma === 'VISITA TECNICA' || forma === 'SOPORTE TELEFONICO') facturables++;
        else if (forma === 'GARANTIA') garantias++;
      });
      const totalAtencion = facturables + garantias;
      const pctGarantias = totalAtencion ? ((garantias / totalAtencion) * 100).toFixed(1) + '%' : '0.0%';
      garantiasKpiHtml = `
        <div class="kpi-card-dashboard clickable-kpi" id="kpiGarantiasCard" title="Porcentaje de garantías sobre total de atenciones" style="border-left: 3px solid var(--bdb-yellow-pref);">
          <div class="kpi-icon-db">🔄</div>
          <div class="kpi-val-db" style="color: var(--bdb-yellow-pref);">${pctGarantias}</div>
          <div class="kpi-lbl-db">% Garantías Capacitación</div>
          <div class="kpi-sub-db">${garantias.toLocaleString('es-CO')} garantías de ${totalAtencion.toLocaleString('es-CO')} atenciones</div>
        </div>
      `;
    }

    // HTML de las tarjetas
    let puntoKpiHtml = '';
    if (this.activeSubTab === 'publicidad' && (this.model.filters.punto || '').trim() !== '') {
      const puntoFilterVal = this.model.filters.punto.trim();
      
      puntoKpiHtml = `
        <div class="point-advertising-kpi-card fade-in" style="background: linear-gradient(135deg, rgba(0, 26, 58, 0.8) 0%, rgba(20, 50, 125, 0.45) 100%); border: 1.5px solid var(--bdb-gold); border-radius: 16px; padding: 22px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); margin-bottom: 16px; position: relative; overflow: hidden;">
          <div style="position: absolute; top: -20px; right: -20px; font-size: 120px; opacity: 0.03; pointer-events: none; transform: rotate(-15deg);">📍</div>
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid rgba(214, 162, 24, 0.25); padding-bottom: 14px; margin-bottom: 18px;">
            <div>
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--bdb-gold); letter-spacing: 1.2px; display: inline-flex; align-items: center; gap: 6px;">
                <span class="btn-spinner" style="width: 8px; height: 8px; border-width: 1px; animation-duration: 2s; border-color: var(--bdb-gold) transparent transparent transparent;"></span> Monitoreo Detallado de Publicidad por Punto
              </span>
              <h3 style="font-size: 20px; margin: 4px 0 0 0; color: #fff; font-weight: 800;">
                Código de Punto (ID Sitio): <span style="font-family: var(--font-sans); color: var(--bdb-yellow-pref); text-shadow: 0 0 8px rgba(235, 205, 90, 0.4);">${puntoFilterVal}</span>
              </h3>
            </div>
            <div style="text-align: right;">
              <span class="badge" style="background: rgba(214, 162, 24, 0.12); color: var(--bdb-gold); border: 1.5px solid rgba(214, 162, 24, 0.35); font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 20px;">
                ${total.toLocaleString('es-CO')} Actividad(es) Encontrada(s)
              </span>
            </div>
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 16px;">
      `;
      
      rows.forEach((r, idx) => {
        const taCode = r['CODIGO_TAREA'] || r['NRO PEDIDO / ORDEN DE COMPRA'] || '—';
        const fecha = r['FECHA LISTA'] || r['FECHA DE FIN'] || '—';
        const tipoLocal = r['TIPOLOGIA'] || '—';
        const estab = r['ESTABLECIMIENTO'] || '—';
        const tecnico = r['TECNICO'] || r['INGENIERO DE CAMPO'] || r['TÉCNICO'] || '—';
        const depto = r['DEPARTAMENTO'] || '—';
        
        puntoKpiHtml += `
          <div style="background: rgba(255, 255, 255, 0.02); border: 1.5px solid rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 16px; transition: border-color var(--transition-fast);" onmouseover="this.style.borderColor='var(--bdb-gold-glow)'" onmouseout="this.style.borderColor='rgba(255, 255, 255, 0.05)'">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; border-bottom: 1.5px solid rgba(255, 255, 255, 0.03); padding-bottom: 10px;">
              <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                <span style="background: var(--bdb-blue); color: #fff; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; font-family: var(--font-mono);">TAREA ${idx + 1}</span>
                <strong style="color: var(--bdb-gold); font-family: var(--font-mono); font-size: 14px; letter-spacing: 0.2px;">TA: ${taCode}</strong>
                <span style="font-size: 12px; color: var(--text-muted);">| Fecha: <span style="color: var(--text-normal); font-weight: 500;">${fecha}</span></span>
                <span style="font-size: 12px; color: var(--text-muted);">| Tipología: <span style="color: var(--bdb-yellow-pref); font-weight: 600;">${tipoLocal}</span></span>
                <span style="font-size: 12px; color: var(--text-muted);">| Técnico: <span style="color: var(--text-normal); font-weight: 500;">${tecnico}</span></span>
              </div>
              <div style="font-size: 12px; color: var(--text-muted); font-weight: 500; background: rgba(255,255,255,0.03); padding: 4px 10px; border-radius: 8px; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${estab} (${depto})">
                🏢 ${estab} (${depto})
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px;">
        `;
        
        const elementsList = [
          { label: 'Marquesina Exterior', install: 'SE_INSTALA_MARQUESINA', causal: 'CAUSAL_NO_INSTALA_MARQUESINA', icon: '🏪' },
          { label: 'Cartel Saliente', install: 'SE_INSTALA_CARTEL', causal: 'CAUSAL_NO_INSTALA_CARTEL', icon: '🪧' },
          { label: 'Sticker Vidrio', install: 'SE_INSTALA_STICKER_VIDRIO', causal: 'CAUSAL_NO_INSTALA_STICKER_VIDRIO', icon: '🔵' },
          { label: 'Sticker Muro', install: 'SE_INSTALA_STICKER_MURO', causal: 'CAUSAL_NO_INSTALA_STICKER_MURO', icon: '🟡' },
          { label: 'Hablador', install: 'SE_INSTALA_HABLADOR', causal: 'CAUSAL_NO_INSTALA_HABLADOR', icon: '📋' }
        ];
        
        elementsList.forEach(el => {
          const installVal = (r[el.install] || '').trim().toUpperCase();
          const causalVal = (r[el.causal] || '').trim();
          
          let statusBadge = '';
          
          if (installVal === 'SI') {
            statusBadge = `
              <div style="background: rgba(0, 135, 110, 0.08); border: 1.5px solid rgba(0, 135, 110, 0.35); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; height: 100%; min-height: 72px; justify-content: space-between; box-shadow: 0 4px 10px rgba(0, 135, 110, 0.05);">
                <div style="font-size: 12px; font-weight: 700; color: var(--text-normal); display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
                  <span style="font-size: 16px;">${el.icon}</span> <span>${el.label}</span>
                </div>
                <span style="font-size: 13px; font-weight: 800; color: #10b981; display: inline-flex; align-items: center; gap: 4px;">
                  <span style="display:inline-block; width: 6px; height: 6px; background: #10b981; border-radius: 50%; box-shadow: 0 0 8px #10b981;"></span> ✓ Instalado
                </span>
              </div>
            `;
          } else if (installVal === 'NO') {
            const motivo = causalVal && causalVal !== 'N/A' && causalVal !== 'null' ? causalVal : 'Sin motivo registrado';
            statusBadge = `
              <div style="background: rgba(205, 50, 50, 0.08); border: 1.5px solid rgba(205, 50, 50, 0.35); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; height: 100%; min-height: 72px; justify-content: space-between; box-shadow: 0 4px 10px rgba(205, 50, 50, 0.05);">
                <div style="font-size: 12px; font-weight: 700; color: var(--text-normal); display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                  <span style="font-size: 16px;">${el.icon}</span> <span>${el.label}</span>
                </div>
                <div>
                  <span style="font-size: 13px; font-weight: 800; color: #ff6b6b; display: inline-flex; align-items: center; gap: 4px;">
                    <span style="display:inline-block; width: 6px; height: 6px; background: #ff6b6b; border-radius: 50%; box-shadow: 0 0 8px #ff6b6b;"></span> ✗ No Instalado
                  </span>
                  <div style="font-size: 10.5px; color: var(--text-muted); margin-top: 4px; line-height: 1.3; background: rgba(0,0,0,0.15); padding: 4px 8px; border-radius: 6px; border-left: 2px solid #ff6b6b; word-break: break-word;">
                    ${motivo}
                  </div>
                </div>
              </div>
            `;
          } else {
            statusBadge = `
              <div style="background: rgba(255, 255, 255, 0.02); border: 1.5px solid rgba(255, 255, 255, 0.06); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; height: 100%; min-height: 72px; justify-content: space-between;">
                <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
                  <span style="font-size: 16px; opacity: 0.5;">${el.icon}</span> <span>${el.label}</span>
                </div>
                <span style="font-size: 13px; color: var(--text-muted); font-weight: 500;">— Sin Datos</span>
              </div>
            `;
          }
          
          puntoKpiHtml += `<div>${statusBadge}</div>`;
        });
        
        puntoKpiHtml += `
            </div>
          </div>
        `;
      });
      
      puntoKpiHtml += `
          </div>
        </div>
      `;
    }

    // Renderizar el bloque de punto fuera de la rejilla de KPIs para que no la deforme
    const pointKpiContainer = document.getElementById('pointKpiContainer');
    if (pointKpiContainer) {
      pointKpiContainer.innerHTML = puntoKpiHtml;
    }

    // HTML de las tarjetas
    container.innerHTML = `
      <!-- Total Registros -->
      <div class="kpi-card-dashboard clickable-kpi" id="kpiTotalCard" title="Ver lista completa">
        <div class="kpi-icon-db">📋</div>
        <div class="kpi-val-db" style="color: var(--bdb-gold);">${total.toLocaleString('es-CO')}</div>
        <div class="kpi-lbl-db">Total Actividades</div>
        <div class="kpi-sub-db">${cerrados.toLocaleString('es-CO')} cerrados · ${abiertos.toLocaleString('es-CO')} abiertos</div>
      </div>

      <!-- Cumplimiento General SLA -->
      <div class="kpi-card-dashboard clickable-kpi" id="kpiSlaCard" title="Ver actividades en plazo">
        <div class="kpi-icon-db">⏱️</div>
        <div class="kpi-val-db" style="color: var(--bdb-green-prem);">${pctSla}</div>
        <div class="kpi-lbl-db">Cumplimiento SLA</div>
        <div class="kpi-sub-db">${cumpleSlaCount.toLocaleString('es-CO')} de ${total.toLocaleString('es-CO')} en plazo</div>
      </div>

      <!-- Cumplimiento Ajustado -->
      <div class="kpi-card-dashboard premium-kpi clickable-kpi" id="kpiAjustadoCard" title="Ver SLA Ajustado (excluye entidad/externos)">
        <div class="kpi-icon-db glow-icon">🏆</div>
        <div class="kpi-val-db glow-text" style="color: #fff;">${pctAjustado}</div>
        <div class="kpi-lbl-db" style="color: var(--bdb-gold); font-weight: 700;">SLA Ajustado</div>
        <div class="kpi-sub-db" style="color: #e2e8f0;">Excluye demoras de la entidad / externos</div>
      </div>

      <!-- Responsabilidad de fallas -->
      <div class="kpi-card-dashboard clickable-kpi" id="kpiFallasCard" title="Ver fallas y retrasos registrados">
        <div class="kpi-icon-db">⚠</div>
        <div class="kpi-val-db" style="color: var(--bdb-red-sym);">${(fallasLinea + fallasEntidad).toLocaleString('es-CO')}</div>
        <div class="kpi-lbl-db">Fallas Registradas</div>
        <div class="kpi-sub-db" style="font-size: 10px;">Línea: ${fallasLinea.toLocaleString('es-CO')} · Entidad: ${fallasEntidad.toLocaleString('es-CO')}</div>
      </div>

      ${garantiasKpiHtml}
    `;

    // Bindear clicks interactivos a las tarjetas KPI
    document.getElementById('kpiTotalCard')?.addEventListener('click', () => {
      this.openKpiModal('Total de Actividades', rows);
    });

    document.getElementById('kpiSlaCard')?.addEventListener('click', () => {
      const records = rows.filter(r => (r[slaField] || '').toString().toUpperCase() === 'SI');
      this.openKpiModal('Actividades dentro de SLA', records);
    });

    document.getElementById('kpiAjustadoCard')?.addEventListener('click', () => {
      const records = rows.filter(r => 
        (r[slaField] || '').toString().toUpperCase() === 'SI' || 
        !this.model.isSameResp('LINEACOM', r[respField])
      );
      this.openKpiModal('Actividades que Cumplen SLA Ajustado', records);
    });

    document.getElementById('kpiFallasCard')?.addEventListener('click', () => {
      const records = rows.filter(r => (r[slaField] || '').toString().toUpperCase() === 'NO');
      this.openKpiModal('Fallas y Retrasos Registrados', records);
    });

    document.getElementById('kpiGarantiasCard')?.addEventListener('click', () => {
      const records = rows.filter(r => (r['FORMA DE ATENCION'] || '').trim().toUpperCase() === 'GARANTIA');
      this.openKpiModal('Garantías de Capacitación', records);
    });
  }

  // Genera los gráficos de Chart.js
  renderCharts(rows, slaField) {
    if (this.activeSubTab === 'implementacion' || this.activeSubTab === 'desinstalacion') {
      // ════ TAB DE IMPLEMENTACIÓN O DESINSTALACIÓN: TENDENCIA, SLA Y DEPTOS ════
      
      // 1. Gráfico de Línea - Tendencia Mensual
      const canvasTrend = document.getElementById('chartTrend');
      if (canvasTrend) {
        const byMonth = {};
        rows.forEach(r => {
          const dates = this.model.getRecordDates(r, this.activeSubTab);
          if (dates.start) {
            const key = `${dates.start.getFullYear()}-${String(dates.start.getMonth() + 1).padStart(2, '0')}`;
            byMonth[key] = (byMonth[key] || 0) + 1;
          }
        });

        const sortedMonths = Object.keys(byMonth).sort().slice(-12);
        const dataPoints = sortedMonths.map(m => byMonth[m]);

        this.charts.trend = new Chart(canvasTrend, {
          type: 'line',
          data: {
            labels: sortedMonths,
            datasets: [{
              label: 'Actividades',
              data: dataPoints,
              borderColor: this.colors.gold,
              backgroundColor: 'rgba(214, 162, 24, 0.1)',
              tension: 0.3,
              fill: true,
              pointRadius: 4,
              pointBackgroundColor: this.colors.gold
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { backgroundColor: this.colors.blueDark, titleColor: this.colors.gold, bodyColor: '#FAFAFA' }
            },
            scales: {
              x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.08)' } }
            }
          }
        });
      }

      // 2. Gráfico de Rosca - SLA
      const canvasSla = document.getElementById('chartSLA');
      if (canvasSla) {
        const cumple = rows.filter(r => (r[slaField] || '').toString().toUpperCase() === 'SI').length;
        const noCumple = rows.filter(r => (r[slaField] || '').toString().toUpperCase() === 'NO').length;
        const total = cumple + noCumple;

        this.charts.sla = new Chart(canvasSla, {
          type: 'doughnut',
          data: {
            labels: ['Dentro SLA', 'Fuera SLA'],
            datasets: [{
              data: [cumple, noCumple],
              backgroundColor: [this.colors.green, this.colors.red],
              borderColor: 'rgba(0, 26, 58, 0.8)',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'right', labels: { color: '#CBD5E1', font: { size: 10 } } },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const val = context.raw || 0;
                    const pct = total ? ((val / total) * 100).toFixed(1) + '%' : '0%';
                    return ` ${context.label}: ${val.toLocaleString('es-CO')} (${pct})`;
                  }
                }
              }
            },
            cutout: '65%'
          }
        });
      }

      // 3. Gráfico de Barras Horizontal - Departamentos
      const canvasDepto = document.getElementById('chartDepto');
      if (canvasDepto) {
        const counts = {};
        rows.forEach(r => {
          const d = r['DEPARTAMENTO'] || '(Sin departamento)';
          counts[d] = (counts[d] || 0) + 1;
        });

        const sortedDeptos = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);

        this.charts.depto = new Chart(canvasDepto, {
          type: 'bar',
          data: {
            labels: sortedDeptos.map(x => x[0]),
            datasets: [{
              label: 'Registros',
              data: sortedDeptos.map(x => x[1]),
              backgroundColor: 'rgba(20, 50, 125, 0.75)',
              borderColor: this.colors.blue,
              borderWidth: 1,
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
              legend: { display: false }
            },
            scales: {
              x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              y: { ticks: { color: '#FAFAFA' }, grid: { display: false } }
            }
          }
        });
      }
      
    } else if (this.activeSubTab === 'publicidad') {
      // ════ TAB DE PUBLICIDAD: ELEMENTOS INSTALADOS, NO-INSTALACION, TIPOLOGIA, ESTADO VISITA ════

      // A. Contar variables publicitarias
      let marquesinaCount = 0;
      let cartelCount = 0;
      let stickerVidrioCount = 0;
      let stickerMuroCount = 0;
      let habladorCount = 0;
      
      const causalesNoInstala = {};
      const tipologiaCounts = {};
      const estadoVisitaCounts = {};
      const zonaCounts = {};

      rows.forEach(r => {
        // Elementos instalados
        if ((r['SE_INSTALA_MARQUESINA'] || '').trim().toUpperCase() === 'SI') marquesinaCount++;
        if ((r['SE_INSTALA_CARTEL'] || '').trim().toUpperCase() === 'SI') cartelCount++;
        if ((r['SE_INSTALA_STICKER_VIDRIO'] || '').trim().toUpperCase() === 'SI') stickerVidrioCount++;
        if ((r['SE_INSTALA_STICKER_MURO'] || '').trim().toUpperCase() === 'SI') stickerMuroCount++;
        if ((r['SE_INSTALA_HABLADOR'] || '').trim().toUpperCase() === 'SI') habladorCount++;

        // Causales de no instalación (para elementos que digan "No")
        const checkNoCausal = (installCol, causalCol) => {
          if ((r[installCol] || '').trim().toUpperCase() === 'NO') {
            const causalVal = (r[causalCol] || '').trim();
            if (causalVal && causalVal !== 'N/A' && causalVal !== '—' && causalVal !== 'null') {
              causalesNoInstala[causalVal] = (causalesNoInstala[causalVal] || 0) + 1;
            }
          }
        };
        checkNoCausal('SE_INSTALA_MARQUESINA', 'CAUSAL_NO_INSTALA_MARQUESINA');
        checkNoCausal('SE_INSTALA_CARTEL', 'CAUSAL_NO_INSTALA_CARTEL');
        checkNoCausal('SE_INSTALA_STICKER_VIDRIO', 'CAUSAL_NO_INSTALA_STICKER_VIDRIO');
        checkNoCausal('SE_INSTALA_STICKER_MURO', 'CAUSAL_NO_INSTALA_STICKER_MURO');
        checkNoCausal('SE_INSTALA_HABLADOR', 'CAUSAL_NO_INSTALA_HABLADOR');

        // Tipología
        const tipo = (r['TIPOLOGIA'] || 'SIN TIPOLOGÍA').trim().toUpperCase();
        tipologiaCounts[tipo] = (tipologiaCounts[tipo] || 0) + 1;

        // Estado de Visita
        const estado = this.getRecordVisitStatus(r);
        estadoVisitaCounts[estado] = (estadoVisitaCounts[estado] || 0) + 1;

        // Zona Lineacom
        const zonaVal = (r['ZONA LINEACOM'] || r['COORDINADOR ENCARGADO'] || 'SIN ZONA').trim().toUpperCase();
        zonaCounts[zonaVal] = (zonaCounts[zonaVal] || 0) + 1;
      });

      // 1. Gráfico Kit Publicidad (Elementos Instalados)
      const canvasKit = document.getElementById('chartKitPublicidad');
      if (canvasKit) {
        this.charts.kitPublicidad = new Chart(canvasKit, {
          type: 'bar',
          data: {
            labels: ['Marquesina Exterior', 'Cartel Saliente', 'Sticker Vidrio', 'Sticker Muro', 'Hablador'],
            datasets: [{
              label: 'Cantidad Instalada',
              data: [marquesinaCount, cartelCount, stickerVidrioCount, stickerMuroCount, habladorCount],
              backgroundColor: this.colors.gold,
              borderColor: 'rgba(214, 162, 24, 0.9)',
              borderWidth: 1,
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              x: { 
                ticks: { 
                  color: '#94a3b8',
                  font: { size: 10, weight: '500' }
                }, 
                grid: { display: false } 
              },
              y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.06)' } }
            }
          }
        });
      }

      // 2. Gráfico Causal No Instalación
      const canvasNoInst = document.getElementById('chartCausalNoInstalacion');
      if (canvasNoInst) {
        const sortedNoInst = Object.entries(causalesNoInstala).sort((a,b) => b[1] - a[1]).slice(0, 6);
        this.charts.causalNoInst = new Chart(canvasNoInst, {
          type: 'bar',
          data: {
            labels: sortedNoInst.map(x => x[0]),
            datasets: [{
              label: 'Reportes',
              data: sortedNoInst.map(x => x[1]),
              backgroundColor: 'rgba(205, 95, 140, 0.85)',
              borderColor: this.colors.pink,
              borderWidth: 1,
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: this.colors.blueDark,
                titleColor: this.colors.gold,
                bodyColor: '#FAFAFA',
                padding: 10,
                cornerRadius: 8
              }
            },
            scales: {
              x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              y: { 
                ticks: { 
                  color: '#FAFAFA',
                  font: { size: 10.5 },
                  callback: function(value) {
                    const label = this.getLabelForValue(value);
                    if (label && label.length > 35) {
                      return label.substring(0, 35) + '...';
                    }
                    return label;
                  }
                }, 
                grid: { display: false } 
              }
            }
          }
        });
      }

      // 3. Gráfico de Tipología
      const canvasTipo = document.getElementById('chartTipologia');
      if (canvasTipo) {
        const entries = Object.entries(tipologiaCounts).filter(e => e[0] !== '' && e[0] !== 'SIN TIPOLOGÍA');
        this.charts.tipologia = new Chart(canvasTipo, {
          type: 'doughnut',
          data: {
            labels: entries.map(e => e[0]),
            datasets: [{
              data: entries.map(e => e[1]),
              backgroundColor: [this.colors.blue, this.colors.gold, this.colors.green, this.colors.pink, this.colors.yellow, this.colors.grey],
              borderColor: 'rgba(0, 26, 58, 0.8)',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'right', labels: { color: '#CBD5E1', font: { size: 10 } } }
            },
            cutout: '55%'
          }
        });
      }

      // 4. Gráfico Estado Visita
      const canvasEst = document.getElementById('chartEstadoVisita');
      if (canvasEst) {
        const entries = Object.entries(estadoVisitaCounts);
        this.charts.estadoVis = new Chart(canvasEst, {
          type: 'doughnut',
          data: {
            labels: entries.map(e => e[0]),
            datasets: [{
              data: entries.map(e => e[1]),
              backgroundColor: [this.colors.green, this.colors.red, this.colors.yellow, this.colors.blue, this.colors.grey],
              borderColor: 'rgba(0, 26, 58, 0.8)',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'right', labels: { color: '#CBD5E1', font: { size: 10 } } }
            },
            cutout: '55%'
          }
        });
      }

      // 4b. Gráfico Zona Lineacom
      const canvasZona = document.getElementById('chartZonaPublicidad');
      if (canvasZona) {
        const entries = Object.entries(zonaCounts).sort((a, b) => b[1] - a[1]);
        this.charts.zonaPub = new Chart(canvasZona, {
          type: 'doughnut',
          data: {
            labels: entries.map(e => e[0]),
            datasets: [{
              data: entries.map(e => e[1]),
              backgroundColor: [this.colors.blue, this.colors.gold, this.colors.green, this.colors.pink, this.colors.yellow, this.colors.grey],
              borderColor: 'rgba(0, 26, 58, 0.8)',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'right', labels: { color: '#CBD5E1', font: { size: 10 } } }
            },
            cutout: '55%'
          }
        });
      }

      // 5. Gráfico Elementos Instalados por Tipología (Barras Apiladas)
      const canvasElTipo = document.getElementById('chartElementosPorTipologia');
      if (canvasElTipo) {
        const tipologias = {};
        rows.forEach(r => {
          const tipo = (r['TIPOLOGIA'] || 'SIN TIPOLOGÍA').trim().toUpperCase();
          if (tipo === 'SIN TIPOLOGÍA' || tipo === '') return;
          if (!tipologias[tipo]) tipologias[tipo] = { marq: 0, cart: 0, stV: 0, stM: 0, habl: 0 };
          if ((r['SE_INSTALA_MARQUESINA'] || '').trim().toUpperCase() === 'SI') tipologias[tipo].marq++;
          if ((r['SE_INSTALA_CARTEL'] || '').trim().toUpperCase() === 'SI') tipologias[tipo].cart++;
          if ((r['SE_INSTALA_STICKER_VIDRIO'] || '').trim().toUpperCase() === 'SI') tipologias[tipo].stV++;
          if ((r['SE_INSTALA_STICKER_MURO'] || '').trim().toUpperCase() === 'SI') tipologias[tipo].stM++;
          if ((r['SE_INSTALA_HABLADOR'] || '').trim().toUpperCase() === 'SI') tipologias[tipo].habl++;
        });
        const tipoLabels = Object.keys(tipologias).sort();
        this.charts.elTipo = new Chart(canvasElTipo, {
          type: 'bar',
          data: {
            labels: tipoLabels,
            datasets: [
              { label: 'Marquesina', data: tipoLabels.map(t => tipologias[t].marq), backgroundColor: 'rgba(214, 162, 24, 0.85)', borderRadius: 3 },
              { label: 'Cartel', data: tipoLabels.map(t => tipologias[t].cart), backgroundColor: 'rgba(20, 50, 125, 0.85)', borderRadius: 3 },
              { label: 'Sticker Vidrio', data: tipoLabels.map(t => tipologias[t].stV), backgroundColor: 'rgba(0, 135, 110, 0.85)', borderRadius: 3 },
              { label: 'Sticker Muro', data: tipoLabels.map(t => tipologias[t].stM), backgroundColor: 'rgba(205, 95, 140, 0.85)', borderRadius: 3 },
              { label: 'Hablador', data: tipoLabels.map(t => tipologias[t].habl), backgroundColor: 'rgba(235, 205, 90, 0.85)', borderRadius: 3 }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'top', labels: { color: '#CBD5E1', font: { size: 10 }, boxWidth: 14 } }
            },
            scales: {
              x: { stacked: true, ticks: { color: '#94a3b8', font: { size: 9 } }, grid: { display: false } },
              y: { stacked: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.06)' } }
            }
          }
        });
      }

    } else if (this.activeSubTab === 'capacitacion') {
      // ════ TAB DE CAPACITACIÓN: FACTURABLES VS GARANTÍAS, TIPOLOGÍA, ESTADOS ════
      
      let facturables = 0;
      let garantias = 0;
      const tipologiaCounts = {};
      const estadoCapacitacion = {};
      const causalCapacitacion = {};

      rows.forEach(r => {
        // Relación Facturables vs Garantías
        const forma = (r['FORMA DE ATENCION'] || '').trim().toUpperCase();
        if (forma === 'VISITA TECNICA' || forma === 'SOPORTE TELEFONICO') {
          facturables++;
        } else if (forma === 'GARANTIA') {
          garantias++;
        }

        // Tipología
        const tipo = (r['TIPOLOGIA'] || 'SIN TIPOLOGÍA').trim().toUpperCase();
        tipologiaCounts[tipo] = (tipologiaCounts[tipo] || 0) + 1;

        // Estado y Causal
        const est = this.getRecordVisitStatus(r);
        estadoCapacitacion[est] = (estadoCapacitacion[est] || 0) + 1;

        const causalVal = (r['CAUSAL DE ESTADO'] || '').trim();
        if (causalVal && causalVal !== 'N/A' && causalVal !== '—' && causalVal !== 'null') {
          causalCapacitacion[causalVal] = (causalCapacitacion[causalVal] || 0) + 1;
        }
      });

      // 1. Gráfico Facturables vs Garantías
      const canvasFact = document.getElementById('chartFacturablesGarantias');
      if (canvasFact) {
        const total = facturables + garantias;

        this.charts.facturables = new Chart(canvasFact, {
          type: 'doughnut',
          data: {
            labels: ['Atención Facturable', 'Garantías (Reentren.)'],
            datasets: [{
              data: [facturables, garantias],
              backgroundColor: [this.colors.blue, this.colors.yellow],
              borderColor: 'rgba(0, 26, 58, 0.8)',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom', labels: { color: '#CBD5E1', font: { size: 10 } } },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const val = context.raw || 0;
                    const pct = total ? ((val / total) * 100).toFixed(1) + '%' : '0%';
                    return ` ${context.label}: ${val} (${pct})`;
                  }
                }
              }
            },
            cutout: '65%'
          }
        });
      }

      // 2. Gráfico Tipología Capacitación
      const canvasTipoCap = document.getElementById('chartTipologiaCapacitacion');
      if (canvasTipoCap) {
        const entries = Object.entries(tipologiaCounts).filter(e => e[0] !== '');
        this.charts.tipologiaCap = new Chart(canvasTipoCap, {
          type: 'doughnut',
          data: {
            labels: entries.map(e => e[0]),
            datasets: [{
              data: entries.map(e => e[1]),
              backgroundColor: [this.colors.blue, this.colors.gold, this.colors.green, this.colors.pink, this.colors.yellow, this.colors.grey],
              borderColor: 'rgba(0, 26, 58, 0.8)',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'right', labels: { color: '#CBD5E1', font: { size: 10 } } }
            },
            cutout: '55%'
          }
        });
      }

      // 3. Gráfico de Estados y Causal de Falla en Capacitación
      const canvasEstCap = document.getElementById('chartEstadoCapacitacion');
      if (canvasEstCap) {
        // Unir estados y causas de fallo importantes para visualización operativa
        const chartData = {};
        Object.entries(estadoCapacitacion).forEach(([k, v]) => {
          chartData[`Estado: ${k}`] = v;
        });
        Object.entries(causalCapacitacion).sort((a,b) => b[1]-a[1]).slice(0, 5).forEach(([k, v]) => {
          chartData[`Causal: ${k}`] = v;
        });

        const sortedEntries = Object.entries(chartData).sort((a,b) => b[1]-a[1]).slice(0, 10);

        this.charts.estCap = new Chart(canvasEstCap, {
          type: 'bar',
          data: {
            labels: sortedEntries.map(e => e[0]),
            datasets: [{
              label: 'Cantidad',
              data: sortedEntries.map(e => e[1]),
              backgroundColor: 'rgba(0, 135, 110, 0.75)',
              borderColor: this.colors.green,
              borderWidth: 1,
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: this.colors.blueDark,
                titleColor: this.colors.gold,
                bodyColor: '#FAFAFA',
                padding: 10,
                cornerRadius: 8
              }
            },
            scales: {
              x: { 
                ticks: { 
                  color: '#94a3b8', 
                  font: { size: 9 },
                  callback: function(value) {
                    const label = this.getLabelForValue(value);
                    if (label && label.length > 20) {
                      return label.substring(0, 20) + '...';
                    }
                    return label;
                  }
                }, 
                grid: { display: false } 
              },
              y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.06)' } }
            }
          }
        });
      }
    }
  }

  // Renderizar la tabla de registros paginada
  renderTable(rows) {
    const container = document.getElementById('tableContentArea');
    if (!container) return;

    if (rows.length === 0) {
      container.innerHTML = `<div class="empty-table-state">Sin registros coincidentes con los filtros seleccionados.</div>`;
      document.getElementById('tablePaginationFooter').innerHTML = '';
      this.currentPageRows = [];
      return;
    }

    // Identificar las columnas a renderizar según sub-pestaña
    let cols = [];
    if (this.activeSubTab === 'desinstalacion') {
      cols = [
        { label: 'TA', key: 'CODIGO_TAREA' },
        { label: 'Punto de Venta', key: 'NOMBRE PUNTO DE ATENCIÓN' },
        { label: 'ID Sitio', key: 'ID SITIO' },
        { label: 'Departamento', key: 'DEPARTAMENTO' },
        { label: 'Ciudad', key: 'CIUDAD' },
        { label: 'Zona Lineacom', key: 'ZONA LINEACOM' },
        { label: 'Técnico', key: 'TECNICO' },
        { label: 'Fecha Apertura', key: 'FECHA DE APERTURA (DD/MM/AAAA)' },
        { label: 'Fecha Límite', key: 'FECHA DE VENCIMIENTO (DD/MM/AAAA)' },
        { label: 'Estado Visita', key: 'ESTADO DE LA VISITA' },
        { label: 'Estado', key: '_is_abierto' },
        { label: 'SLA', key: 'DENTRO DE LOS SLA' },
        { label: 'Retraso', key: '_retraso' }
      ];
    } else if (this.activeSubTab === 'publicidad') {
      cols = [
        { label: 'TA', key: 'CODIGO_TAREA' },
        { label: 'Establecimiento', key: 'ESTABLECIMIENTO' },
        { label: 'ID Sitio', key: 'ID SITIO' },
        { label: 'Departamento', key: 'DEPARTAMENTO' },
        { label: 'Ciudad', key: 'CIUDAD' },
        { label: 'Zona Lineacom', key: 'ZONA LINEACOM' },
        { label: 'Técnico', key: 'TECNICO' },
        { label: 'Tipología', key: 'TIPOLOGIA' },
        { label: 'Marquesina', key: '_kit_marquesina' },
        { label: 'Cartel', key: '_kit_cartel' },
        { label: 'St. Vidrio', key: '_kit_sticker_vidrio' },
        { label: 'St. Muro', key: '_kit_sticker_muro' },
        { label: 'Hablador', key: '_kit_hablador' },
        { label: 'Estado', key: '_is_abierto' },
        { label: 'SLA', key: 'CUMPLE SLA' }
      ];
    } else {
      cols = [
        { label: 'TA', key: 'CODIGO_TAREA' },
        { label: 'Establecimiento', key: 'ESTABLECIMIENTO' },
        { label: 'ID Sitio', key: 'ID SITIO' },
        { label: 'Departamento', key: 'DEPARTAMENTO' },
        { label: 'Ciudad', key: 'CIUDAD' },
        { label: 'Zona Lineacom', key: 'ZONA LINEACOM' },
        { label: 'Técnico', key: 'TECNICO' },
        { label: 'Tipología', key: 'TIPOLOGIA' },
        { label: 'Forma Atención', key: 'FORMA DE ATENCION' },
        { label: 'Fecha Lista', key: 'FECHA LISTA' },
        { label: 'Fecha Límite', key: 'FECHA LIMITE' },
        { label: 'Estado Visita', key: 'ESTADO DE LA VISITA' },
        { label: 'Estado', key: '_is_abierto' },
        { label: 'SLA', key: 'CUMPLE SLA' },
        { label: 'Retraso', key: '_retraso' }
      ];
    }

    // Paginación
    const currentPage = this.model.pages[this.activeSubTab] || 1;
    const totalPages = Math.ceil(rows.length / this.model.pageSize);
    const startIdx = (currentPage - 1) * this.model.pageSize;
    const endIdx = Math.min(startIdx + this.model.pageSize, rows.length);
    const pageRows = rows.slice(startIdx, endIdx);
    
    // Almacenar registros de la página activa para usarlos al hacer clic
    this.currentPageRows = pageRows;

    // Armar tabla HTML
    let tableHtml = `
      <table class="indicators-table">
        <thead>
          <tr>
            ${cols.map(c => `<th>${c.label}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
    `;

    pageRows.forEach(r => {
      tableHtml += '<tr class="clickable-row">';
      cols.forEach(c => {
        let valHtml = '';
        
        if (c.key === '_is_abierto') {
          const isAb = !!r._is_abierto;
          valHtml = isAb
            ? `<span class="badge badge-open">Abierto</span>`
            : `<span class="badge badge-closed">Cerrado</span>`;
        } else if (c.key === 'DENTRO DE LOS SLA' || c.key === 'CUMPLE SLA') {
          const val = (r[c.key] || '').toString().trim().toUpperCase();
          if (val === 'SI') valHtml = `<span class="badge badge-sla-ok">Cumple</span>`;
          else if (val === 'NO') valHtml = `<span class="badge badge-sla-fail">Vencido</span>`;
          else valHtml = `<span class="badge badge-sla-na">N/A</span>`;
        } else if (c.key === '_retraso') {
          const delay = this.model.getDiasPostVencimiento(r, this.activeSubTab);
          valHtml = this.renderDelayPill(delay);
        } else if (c.key.startsWith('_kit_')) {
          valHtml = this.renderKitBadge(r, c.key);
        } else if (c.key === 'CODIGO_TAREA') {
          const code = r['CODIGO_TAREA'] || r['NRO PEDIDO / ORDEN DE COMPRA'] || '—';
          valHtml = `<strong style="font-family: var(--font-mono); font-size: 10.5px; color: var(--bdb-gold);">${code}</strong>`;
        } else {
          let rawVal = r[c.key];
          if (c.key === 'ZONA LINEACOM') {
            rawVal = r['ZONA LINEACOM'] || r['COORDINADOR ENCARGADO'];
          } else if (c.key === 'TECNICO') {
            rawVal = r['TECNICO'] || r['INGENIERO DE CAMPO'] || r['TÉCNICO'];
          } else if (c.key === 'ESTADO DE LA VISITA') {
            rawVal = this.getRecordVisitStatus(r);
          }
          valHtml = this.model.formatCellValue(c.key, rawVal);
        }
        
        tableHtml += `<td>${valHtml}</td>`;
      });
      tableHtml += '</tr>';
    });

    tableHtml += `
        </tbody>
      </table>
    `;

    container.innerHTML = tableHtml;

    // Renderizar paginador
    this.renderPaginator(rows.length, currentPage, totalPages);
  }

  // Helper para pintar la pastilla de retraso
  renderDelayPill(dias) {
    if (dias === null || dias <= 0) {
      return `<span class="pill pill-ok">En Plazo</span>`;
    }
    let text = '';
    if (dias < 1) {
      const hours = Math.round(dias * 24);
      text = hours >= 1 ? `${hours}h retraso` : `${Math.round(dias * 24 * 60) || 1}m retraso`;
    } else {
      text = `${Math.round(dias)}d retraso`;
    }
    const urgencyClass = dias <= 7 ? 'pill-warning' : 'pill-danger';
    return `<span class="pill ${urgencyClass}">⚠ ${text}</span>`;
  }

  // Helper para renderizar badge del kit publicitario en la tabla
  renderKitBadge(record, colKey) {
    const MAP = {
      '_kit_marquesina': { install: 'SE_INSTALA_MARQUESINA', causal: 'CAUSAL_NO_INSTALA_MARQUESINA' },
      '_kit_cartel': { install: 'SE_INSTALA_CARTEL', causal: 'CAUSAL_NO_INSTALA_CARTEL' },
      '_kit_sticker_vidrio': { install: 'SE_INSTALA_STICKER_VIDRIO', causal: 'CAUSAL_NO_INSTALA_STICKER_VIDRIO' },
      '_kit_sticker_muro': { install: 'SE_INSTALA_STICKER_MURO', causal: 'CAUSAL_NO_INSTALA_STICKER_MURO' },
      '_kit_hablador': { install: 'SE_INSTALA_HABLADOR', causal: 'CAUSAL_NO_INSTALA_HABLADOR' }
    };
    const mapping = MAP[colKey];
    if (!mapping) return '—';
    const val = (record[mapping.install] || '').trim().toUpperCase();
    if (val === 'SI') return `<span class="pub-kit-badge installed">✓ Sí</span>`;
    if (val === 'NO') {
      const causal = (record[mapping.causal] || '').trim();
      const motivo = causal && causal !== 'N/A' && causal !== 'null' ? causal : 'Sin motivo';
      return `<span class="pub-kit-badge not-installed" title="${motivo}">✗ No</span>`;
    }
    return `<span class="pub-kit-badge not-applicable">—</span>`;
  }

  // Genera el HTML del paginador
  renderPaginator(totalItems, currentPage, totalPages) {
    const container = document.getElementById('tablePaginationFooter');
    if (!container) return;

    container.innerHTML = `
      <div class="pagination-info">
        Mostrando registros <strong>${((currentPage - 1) * this.model.pageSize) + 1}</strong> al 
        <strong>${Math.min(currentPage * this.model.pageSize, totalItems)}</strong> 
        de un total de <strong>${totalItems}</strong>
      </div>
      <div class="pagination-buttons">
        <button class="btn-page" id="btnPrevPage" ${currentPage === 1 ? 'disabled' : ''}>◀ Anterior</button>
        <span class="page-current">${currentPage} de ${totalPages}</span>
        <button class="btn-page" id="btnNextPage" ${currentPage === totalPages ? 'disabled' : ''}>Siguiente ▶</button>
      </div>
    `;
  }

  // Configura los eventos del buscador interno, paginación y apertura del Wizard
  setupTableEvents(rows) {
    // 1. Buscador interno de la tabla
    const searchInput = document.getElementById('tableSearchInput');
    if (searchInput) {
      searchInput.value = this.model.searchTerms[this.activeSubTab] || '';
      searchInput.addEventListener('input', (e) => {
        this.model.searchTerms[this.activeSubTab] = e.target.value;
        this.model.pages[this.activeSubTab] = 1; // Resetear página a 1
        
        // Re-filtrar e imprimir
        const data = this.model.rawIndicators;
        let list = [];
        if (this.activeSubTab === 'desinstalacion') {
          list = (data.desinstalacion?.bd || []).concat(data.desinstalacion?.abiertos || []);
        } else {
          list = (data.implementacion?.bd || []).concat(data.implementacion?.abiertos || []);
        }

        const newFiltered = this.model.filterList(list, this.activeSubTab);
        this.renderTable(newFiltered);
        this.setupTableEvents(newFiltered);
      });
    }

    // 2. Paginador (Prev / Next)
    const prevBtn = document.getElementById('btnPrevPage');
    const nextBtn = document.getElementById('btnNextPage');

    prevBtn?.addEventListener('click', () => {
      if (this.model.pages[this.activeSubTab] > 1) {
        this.model.pages[this.activeSubTab]--;
        this.renderTable(rows);
        this.setupTableEvents(rows);
      }
    });

    nextBtn?.addEventListener('click', () => {
      const totalPages = Math.ceil(rows.length / this.model.pageSize);
      if (this.model.pages[this.activeSubTab] < totalPages) {
        this.model.pages[this.activeSubTab]++;
        this.renderTable(rows);
        this.setupTableEvents(rows);
      }
    });

    // 3. Exportar Excel
    document.getElementById('btnExportExcel')?.addEventListener('click', () => {
      if (this.exportExcelCallback) {
        this.exportExcelCallback(rows, `Indicadores_CB_${this.activeSubTab}`);
      }
    });

    // 4. Click en fila de la tabla principal para abrir el Wizard
    const tableRows = document.querySelectorAll('#tableContentArea .indicators-table tbody tr.clickable-row');
    tableRows.forEach((tr, idx) => {
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', (e) => {
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('a')) return;
        const record = this.currentPageRows[idx];
        if (record) {
          this.openTaskWizard(record);
        }
      });
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // MANEJO DE MODALES Y WIZARDS INTERACTIVOS
  // ══════════════════════════════════════════════════════════════════

  // Abre un modal con el listado de registros de un KPI específico
  openKpiModal(title, recordsList) {
    this.closeModal('customKpiModal');

    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';
    overlay.id = 'customKpiModal';

    overlay.innerHTML = `
      <div class="custom-modal-container">
        <div class="custom-modal-header">
          <h3>${title} (${recordsList.length})</h3>
          <button class="btn-close-modal" id="btnCloseKpiModal">✕</button>
        </div>
        <div class="custom-modal-body">
          <div class="modal-table-wrapper">
            <table class="modal-table">
              <thead>
                <tr>
                  <th>Código TA</th>
                  <th>ID Sitio</th>
                  <th>Establecimiento</th>
                  <th>Técnico</th>
                  <th>Estado</th>
                  <th>SLA</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody id="modalTableBody">
                <!-- Se llena dinámicamente -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const tbody = overlay.querySelector('#modalTableBody');
    if (recordsList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 20px;">No hay registros en esta categoría.</td></tr>`;
    } else {
      recordsList.forEach(r => {
        const tr = document.createElement('tr');
        const isAb = !!r._is_abierto;
        const stateBadge = isAb 
          ? `<span class="badge badge-open">Abierto</span>` 
          : `<span class="badge badge-closed">Cerrado</span>`;
        
        const slaField = this.activeSubTab === 'desinstalacion' ? 'DENTRO DE LOS SLA' : 'CUMPLE SLA';
        const slaVal = (r[slaField] || '').toString().toUpperCase().trim();
        const slaBadge = slaVal === 'SI' 
          ? `<span class="badge badge-sla-ok">Cumple</span>` 
          : (slaVal === 'NO' ? `<span class="badge badge-sla-fail">Vencido</span>` : `<span class="badge badge-sla-na">N/A</span>`);

        const taCode = r['CODIGO_TAREA'] || r['NRO PEDIDO / ORDEN DE COMPRA'] || '—';

        tr.innerHTML = `
          <td><strong>${taCode}</strong></td>
          <td>${r['ID SITIO'] || '—'}</td>
          <td>${r['ESTABLECIMIENTO'] || r['NOMBRE PUNTO DE ATENCIÓN'] || '—'}</td>
          <td>${r['TECNICO'] || '—'}</td>
          <td>${stateBadge}</td>
          <td>${slaBadge}</td>
          <td><button class="btn-view-wizard-link">Ver Wizard</button></td>
        `;

        tr.addEventListener('click', (e) => {
          this.closeModal('customKpiModal');
          this.openTaskWizard(r);
        });

        tbody.appendChild(tr);
      });
    }

    overlay.querySelector('#btnCloseKpiModal').addEventListener('click', () => {
      this.closeModal('customKpiModal');
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeModal('customKpiModal');
    });
  }

  // Abre el Wizard detallado de una tarea en específico (TA + FO)
  openTaskWizard(record) {
    this.closeModal('customWizardModal');

    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';
    overlay.id = 'customWizardModal';

    const taCode = record['CODIGO_TAREA'] || record['NRO PEDIDO / ORDEN DE COMPRA'] || '—';
    const estabName = record['ESTABLECIMIENTO'] || record['NOMBRE PUNTO DE ATENCIÓN'] || '—';

    overlay.innerHTML = `
      <div class="custom-modal-container" style="max-width: 1000px;">
        <div class="custom-modal-header">
          <h3>Wizard de Tarea (TA): ${taCode} · ${estabName}</h3>
          <button class="btn-close-modal" id="btnCloseWizardModal">✕</button>
        </div>
        <div class="custom-modal-body">
          <!-- Wizard Tabs -->
          <div class="custom-wizard-tabs">
            <button class="wizard-tab-btn active" id="tabBtnResumen" data-tab="resumen">📋 Resumen TA</button>
            <button class="wizard-tab-btn" id="tabBtnFormularios" data-tab="formularios">📄 Formularios FO (${Array.isArray(record.FORMS) ? record.FORMS.length : 0})</button>
          </div>

          <!-- Tab Resumen -->
          <div class="wizard-tab-panel" id="panelResumen">
            <div class="wizard-metadata-grid">
              <div class="metadata-item" style="border-left: 3px solid var(--bdb-gold);">
                <label>Código de Tarea (TA)</label>
                <span style="font-family: var(--font-mono); font-size: 15px; font-weight: 800; color: var(--bdb-gold);">${taCode}</span>
              </div>
              <div class="metadata-item">
                <label>ID Sitio / Punto</label>
                <span>${record['ID SITIO'] || '—'}</span>
              </div>
              <div class="metadata-item">
                <label>Establecimiento</label>
                <span>${estabName}</span>
              </div>
              <div class="metadata-item">
                <label>Ubicación</label>
                <span>${record['DEPARTAMENTO'] || '—'} · ${record['CIUDAD'] || '—'}</span>
              </div>
              <div class="metadata-item">
                <label>Técnico Encargado</label>
                <span>${record['TECNICO'] || '—'}</span>
              </div>
              <div class="metadata-item">
                <label>Zona Lineacom</label>
                <span>${record['ZONA LINEACOM'] || record['COORDINADOR ENCARGADO'] || '—'}</span>
              </div>
              <div class="metadata-item">
                <label>Fecha Solicitud (Lista)</label>
                <span>${record['FECHA LISTA'] || record['FECHA DE APERTURA (DD/MM/AAAA)'] || '—'}</span>
              </div>
              <div class="metadata-item">
                <label>Fecha Límite (Plan fin)</label>
                <span>${record['FECHA LIMITE'] || record['FECHA DE VENCIMIENTO (DD/MM/AAAA)'] || '—'}</span>
              </div>
              <div class="metadata-item">
                <label>Fecha Ejecución (Fin)</label>
                <span>${record['FECHA DE FIN'] || record['FECHA DE CIERRE (DD/MM/AAAA)'] || '—'}</span>
              </div>
              <div class="metadata-item">
                <label>Forma de Atención</label>
                <span>${record['FORMA DE ATENCION'] || '—'}</span>
              </div>
              <div class="metadata-item">
                <label>Estado Visita / Tarea</label>
                <span>${this.getRecordVisitStatus(record)}</span>
              </div>
              <div class="metadata-item">
                <label>Causal Estado / Falla</label>
                <span>${record['CAUSAL DE ESTADO'] || '—'}</span>
              </div>
              <div class="metadata-item">
                <label>Cumplimiento SLA</label>
                <span>${(record['CUMPLE SLA'] || record['DENTRO DE LOS SLA'] || '—') === 'SI' ? '✅ Cumple' : '❌ Vencido'}</span>
              </div>
              <div class="metadata-item" style="grid-column: 1 / -1;">
                <label>Responsable de Retraso</label>
                <span>${record['RESPONSABLE INCUMPLIMIENTO'] || 'Sin retrasos / No aplica'}</span>
              </div>
              <div class="metadata-item" style="grid-column: 1 / -1;">
                <label>Observaciones o Novedades Adicionales</label>
                <span>${record['OBSERVACIÓN ESTANDAR'] || '—'}</span>
              </div>
            </div>

            <!-- Kit de Publicidad (detalle visual) -->
            ${this.renderWizardKitSection(record)}
          </div>

          <!-- Tab Formularios -->
          <div class="wizard-tab-panel hidden" id="panelFormularios">
            <div class="wizard-forms-layout">
              <!-- Sidebar de Formularios -->
              <div class="wizard-forms-sidebar" id="wizardFormsSidebar">
                <!-- Se llena dinámicamente -->
              </div>
              
              <!-- Contenido de Formulario Seleccionado -->
              <div class="wizard-forms-content" id="wizardFormsContent">
                <!-- Respuestas se renderizan aquí -->
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Configurar Cambio de Pestañas
    const tabs = overlay.querySelectorAll('.wizard-tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        tabs.forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');

        const tabKey = e.currentTarget.getAttribute('data-tab');
        if (tabKey === 'resumen') {
          overlay.querySelector('#panelResumen').classList.remove('hidden');
          overlay.querySelector('#panelFormularios').classList.add('hidden');
        } else {
          overlay.querySelector('#panelResumen').classList.add('hidden');
          overlay.querySelector('#panelFormularios').classList.remove('hidden');
        }
      });
    });

    // Cargar Formularios
    const formsSidebar = overlay.querySelector('#wizardFormsSidebar');
    const formsContent = overlay.querySelector('#wizardFormsContent');
    const forms = record.FORMS || [];

    if (forms.length === 0) {
      formsSidebar.innerHTML = `<div style="font-size: 11px; color: var(--text-muted);">No hay formularios completados para esta tarea.</div>`;
      formsContent.innerHTML = `<div style="text-align: center; margin-top: 100px; color: var(--text-muted);">No hay respuestas disponibles.</div>`;
    } else {
      // Poblar Sidebar
      forms.forEach((f, idx) => {
        const item = document.createElement('button');
        item.className = `sidebar-form-item ${idx === 0 ? 'active' : ''}`;
        item.innerHTML = `
          <span class="form-title">${f.FORM_NAME || 'Formulario'}</span>
          <span class="form-subtitle">Código: ${f.FORM_CODE || 'FO'}</span>
        `;
        item.addEventListener('click', () => {
          overlay.querySelectorAll('.sidebar-form-item').forEach(i => i.classList.remove('active'));
          item.classList.add('active');
          this.renderFormResponses(f, formsContent);
        });
        formsSidebar.appendChild(item);
      });

      // Botón para mostrar todas las respuestas juntas
      const btnAll = document.createElement('button');
      btnAll.className = 'btn-show-all-answers';
      btnAll.textContent = 'Ver todas las respuestas';
      btnAll.addEventListener('click', () => {
        overlay.querySelectorAll('.sidebar-form-item').forEach(i => i.classList.remove('active'));
        this.renderAllFormResponses(forms, formsContent);
      });
      formsSidebar.appendChild(btnAll);

      // Renderizar el primer formulario por defecto
      this.renderFormResponses(forms[0], formsContent);
    }

    // Botones de Cierre
    overlay.querySelector('#btnCloseWizardModal').addEventListener('click', () => {
      this.closeModal('customWizardModal');
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeModal('customWizardModal');
    });
  }

  // Renderiza la sección del Kit de Publicidad dentro del Wizard
  renderWizardKitSection(record) {
    // Solo mostrar si hay datos de publicidad
    const elements = [
      { name: 'Marquesina Exterior', install: 'SE_INSTALA_MARQUESINA', causal: 'CAUSAL_NO_INSTALA_MARQUESINA', icon: '🏪' },
      { name: 'Cartel Saliente', install: 'SE_INSTALA_CARTEL', causal: 'CAUSAL_NO_INSTALA_CARTEL', icon: '🪧' },
      { name: 'Sticker Vidrio', install: 'SE_INSTALA_STICKER_VIDRIO', causal: 'CAUSAL_NO_INSTALA_STICKER_VIDRIO', icon: '🔵' },
      { name: 'Sticker Muro', install: 'SE_INSTALA_STICKER_MURO', causal: 'CAUSAL_NO_INSTALA_STICKER_MURO', icon: '🟡' },
      { name: 'Hablador', install: 'SE_INSTALA_HABLADOR', causal: 'CAUSAL_NO_INSTALA_HABLADOR', icon: '📋' }
    ];

    const hasAnyKitData = elements.some(el => {
      const v = (record[el.install] || '').trim().toUpperCase();
      return v === 'SI' || v === 'NO';
    });
    if (!hasAnyKitData) return '';

    let html = `
      <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.06);">
        <h4 style="font-size: 13px; font-weight: 700; color: var(--bdb-gold); margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.5px;">📢 Kit de Publicidad</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px;">
    `;

    elements.forEach(el => {
      const val = (record[el.install] || '').trim().toUpperCase();
      const causal = (record[el.causal] || '').trim();
      let statusHtml = '';
      let borderColor = 'rgba(255,255,255,0.05)';
      let bgColor = 'rgba(255,255,255,0.02)';

      if (val === 'SI') {
        statusHtml = `<span style="color: #10b981; font-weight: 700;">✓ Instalado</span>`;
        borderColor = 'rgba(16, 185, 129, 0.3)';
        bgColor = 'rgba(16, 185, 129, 0.04)';
      } else if (val === 'NO') {
        const motivo = causal && causal !== 'N/A' && causal !== 'null' ? causal : 'Sin motivo registrado';
        statusHtml = `<span style="color: #ff8b8b; font-weight: 700;">✗ No Instalado</span><div style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">Motivo: ${motivo}</div>`;
        borderColor = 'rgba(239, 68, 68, 0.3)';
        bgColor = 'rgba(239, 68, 68, 0.04)';
      } else {
        statusHtml = `<span style="color: var(--text-muted); font-weight: 500;">— Sin registro</span>`;
      }

      html += `
        <div style="background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 10px; padding: 12px 14px;">
          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; margin-bottom: 6px;">${el.icon} ${el.name}</div>
          ${statusHtml}
        </div>
      `;
    });

    html += `</div></div>`;
    return html;
  }

  // Renderiza respuestas de un formulario específico
  renderFormResponses(form, container) {
    const resps = form.RESPUESTAS || {};
    const entries = Object.entries(resps);

    let html = `
      <div class="responses-list-container fade-in">
        <h4 style="font-size: 13px; color: var(--bdb-gold); border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 8px; margin-bottom: 12px;">
          Respuestas de: ${form.FORM_NAME} (${form.FORM_CODE})
        </h4>
    `;

    if (entries.length === 0) {
      html += `<div style="text-align: center; color: var(--text-muted); font-size: 12px; margin-top: 50px;">El formulario no contiene respuestas registradas.</div>`;
    } else {
      entries.forEach(([q, val]) => {
        const valUpper = val.toString().toUpperCase().trim();
        let highlightClass = '';
        if (valUpper === 'SI' || valUpper === 'SÍ') highlightClass = 'yes-highlight';
        else if (valUpper === 'NO') highlightClass = 'no-highlight';

        html += `
          <div class="response-card-item ${highlightClass}">
            <div class="response-question">${q}</div>
            <div class="response-answer">${val}</div>
          </div>
        `;
      });
    }

    html += `</div>`;
    container.innerHTML = html;
  }

  // Renderiza todas las respuestas unificadas
  renderAllFormResponses(forms, container) {
    let html = `
      <div class="responses-list-container fade-in">
        <h4 style="font-size: 13px; color: var(--bdb-gold); border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 8px; margin-bottom: 12px;">
          Consolidado de Formularios de la Tarea (${forms.length} formularios)
        </h4>
    `;

    forms.forEach(f => {
      html += `
        <div style="margin-top: 16px; margin-bottom: 8px; font-weight: 700; font-size: 11px; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;">
          📄 ${f.FORM_NAME} (${f.FORM_CODE})
        </div>
      `;

      const entries = Object.entries(f.RESPUESTAS || {});
      if (entries.length === 0) {
        html += `<div style="color: var(--text-muted); font-size: 11px; padding: 4px 10px;">Sin respuestas registradas.</div>`;
      } else {
        entries.forEach(([q, val]) => {
          const valUpper = val.toString().toUpperCase().trim();
          let highlightClass = '';
          if (valUpper === 'SI' || valUpper === 'SÍ') highlightClass = 'yes-highlight';
          else if (valUpper === 'NO') highlightClass = 'no-highlight';

          html += `
            <div class="response-card-item ${highlightClass}" style="margin-left: 10px;">
              <div class="response-question">${q}</div>
              <div class="response-answer">${val}</div>
            </div>
          `;
        });
      }
    });

    html += `</div>`;
    container.innerHTML = html;
  }

  // Cierra un modal específico por ID
  closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.remove();
  }
}

// Exponer la clase a nivel global
window.IndicatorsView = IndicatorsView;
