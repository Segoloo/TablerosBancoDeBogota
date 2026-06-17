'use strict';

class IndicatorsView {
  constructor(containerId, model) {
    this.containerId = containerId;
    this.model = model;
    
    this.activeSubTab = 'implementacion'; // Tab por defecto: Cap. y Publicidad
    this.charts = {}; // Almacén de instancias de Chart.js
    
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
            <button class="sub-tab-btn active" data-subtab="implementacion">🔧 Cap. y Publicidad</button>
            <button class="sub-tab-btn" data-subtab="publicidad">📢 Publicidad</button>
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
              <select id="selDepto">
                <option value="">Todos</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Zona Lineacom</label>
              <select id="selZona">
                <option value="">Todos</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Estado</label>
              <select id="selEstado">
                <option value="">Todos</option>
                <option value="abierto">Abiertos</option>
                <option value="cerrado">Cerrados</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Cumple SLA</label>
              <select id="selSLA">
                <option value="">Todos</option>
                <option value="si">Cumple SLA (SI)</option>
                <option value="no">Fuera de SLA (NO)</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Técnico / Ingeniero</label>
              <select id="selTecnico">
                <option value="">Todos</option>
              </select>
            </div>
            <div class="filter-actions">
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

  // Carga dinámica de listas desplegables basadas en los datos
  populateFilters(data) {
    if (!data) return;

    const deptos = new Set();
    const zonas = new Set();
    const tecnicos = new Set();

    // Extraer valores únicos de todas las secciones
    const scanRows = (rows) => {
      if (!Array.isArray(rows)) return;
      rows.forEach(r => {
        if (r['DEPARTAMENTO']) deptos.add(r['DEPARTAMENTO'].toString().trim());
        if (r['ZONA LINEACOM']) zonas.add(r['ZONA LINEACOM'].toString().trim());
        else if (r['COORDINADOR ENCARGADO']) zonas.add(r['COORDINADOR ENCARGADO'].toString().trim());
        
        const tec = r['TECNICO'] || r['INGENIERO DE CAMPO'] || r['TÉCNICO'];
        if (tec) tecnicos.add(tec.toString().trim());
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

    const fillSelect = (selectId, values, modelField) => {
      const select = document.getElementById(selectId);
      if (!select) return;
      
      // Limpiar opciones previas
      select.innerHTML = '<option value="">Todos</option>';
      
      Array.from(values).sort().forEach(val => {
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = val;
        if (this.model.filters[modelField] === val) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });
    };

    fillSelect('selDepto', deptos, 'depto');
    fillSelect('selZona', zonas, 'zona');
    fillSelect('selTecnico', tecnicos, 'tecnico');

    // Sincronizar filtros fijos (Estado y SLA)
    const selEstado = document.getElementById('selEstado');
    if (selEstado) selEstado.value = this.model.filters.estado;
    const selSLA = document.getElementById('selSLA');
    if (selSLA) selSLA.value = this.model.filters.sla;
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
    const getFilters = () => {
      return {
        depto: document.getElementById('selDepto')?.value || '',
        zona: document.getElementById('selZona')?.value || '',
        estado: document.getElementById('selEstado')?.value || '',
        sla: document.getElementById('selSLA')?.value || '',
        tecnico: document.getElementById('selTecnico')?.value || ''
      };
    };

    document.getElementById('btnApplyFilters')?.addEventListener('click', () => {
      this.model.filters = getFilters();
      if (this.filterChangeCallback) this.filterChangeCallback();
    });

    document.getElementById('btnResetFilters')?.addEventListener('click', () => {
      this.model.filters = { depto: '', zona: '', estado: '', sla: '', tecnico: '' };
      
      // Resetear inputs visualmente
      const selDepto = document.getElementById('selDepto'); if (selDepto) selDepto.value = '';
      const selZona = document.getElementById('selZona'); if (selZona) selZona.value = '';
      const selEstado = document.getElementById('selEstado'); if (selEstado) selEstado.value = '';
      const selSLA = document.getElementById('selSLA'); if (selSLA) selSLA.value = '';
      const selTecnico = document.getElementById('selTecnico'); if (selTecnico) selTecnico.value = '';
      
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
      slaField = 'DENTRO DE LOS SLA';
    } else {
      // implementacion, publicidad, capacitacion usan la lista general de implementacion
      if (this.activeSubTab === 'implementacion') {
        titleTab = 'Capacitación y Publicidad';
      } else if (this.activeSubTab === 'publicidad') {
        titleTab = 'Publicidad';
      } else if (this.activeSubTab === 'capacitacion') {
        titleTab = 'Capacitación';
      }
      rawList = (data.implementacion?.bd || []).concat(data.implementacion?.abiertos || []);
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

          <!-- Causales de No Instalación -->
          <div class="chart-card">
            <div class="chart-title">Causales de No Instalación</div>
            <div class="chart-container-wrapper">
              <canvas id="chartCausalNoInstalacion"></canvas>
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

    // 1. Dibujar Tarjetas de KPIs
    this.renderKPIs(filteredRows, slaField, respField);

    // 2. Inicializar Gráficos
    this.renderCharts(filteredRows, slaField);

    // 3. Dibujar Tabla y Paginador
    this.renderTable(filteredRows);

    // 4. Configurar eventos de la tabla (búsqueda, paginador, exportación)
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
    // Es decir, solo las fallas atribuidas explícitamente a LINEACOM reducen este SLA.
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

    const fallasOtros = total - cumpleSlaCount - fallasLinea - fallasEntidad;

    // HTML de las tarjetas
    container.innerHTML = `
      <!-- Total Registros -->
      <div class="kpi-card-dashboard">
        <div class="kpi-icon-db">📋</div>
        <div class="kpi-val-db" style="color: var(--bdb-gold);">${total.toLocaleString('es-CO')}</div>
        <div class="kpi-lbl-db">Total Actividades</div>
        <div class="kpi-sub-db">${cerrados.toLocaleString('es-CO')} cerrados · ${abiertos.toLocaleString('es-CO')} abiertos</div>
      </div>

      <!-- Cumplimiento General SLA -->
      <div class="kpi-card-dashboard">
        <div class="kpi-icon-db">⏱️</div>
        <div class="kpi-val-db" style="color: var(--bdb-green-prem);">${pctSla}</div>
        <div class="kpi-lbl-db">Cumplimiento SLA</div>
        <div class="kpi-sub-db">${cumpleSlaCount.toLocaleString('es-CO')} de ${total.toLocaleString('es-CO')} en plazo</div>
      </div>

      <!-- Cumplimiento Ajustado -->
      <div class="kpi-card-dashboard premium-kpi">
        <div class="kpi-icon-db glow-icon">🏆</div>
        <div class="kpi-val-db glow-text" style="color: #fff;">${pctAjustado}</div>
        <div class="kpi-lbl-db" style="color: var(--bdb-gold); font-weight: 700;">SLA Ajustado</div>
        <div class="kpi-sub-db" style="color: #e2e8f0;">Excluye demoras de la entidad / externos</div>
      </div>

      <!-- Responsabilidad de fallas -->
      <div class="kpi-card-dashboard">
        <div class="kpi-icon-db">⚠</div>
        <div class="kpi-val-db" style="color: var(--bdb-red-sym);">${(fallasLinea + fallasEntidad).toLocaleString('es-CO')}</div>
        <div class="kpi-lbl-db">Fallas Registradas</div>
        <div class="kpi-sub-db" style="font-size: 10px;">Línea: ${fallasLinea.toLocaleString('es-CO')} · Entidad: ${fallasEntidad.toLocaleString('es-CO')}</div>
      </div>
    `;
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
        const estado = (r['ESTADO DE LA VISITA'] || r['ESTADO'] || 'SIN REGISTRO').trim().toUpperCase();
        estadoVisitaCounts[estado] = (estadoVisitaCounts[estado] || 0) + 1;
      });

      // 1. Gráfico Kit Publicidad (Elementos Instalados)
      const canvasKit = document.getElementById('chartKitPublicidad');
      if (canvasKit) {
        this.charts.kitPublicidad = new Chart(canvasKit, {
          type: 'bar',
          data: {
            labels: ['Marquesina Ext.', 'Cartel Saliente', 'Sticker Vidrio', 'Sticker Muro', 'Hablador'],
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
              x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
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
            labels: sortedNoInst.map(x => x[0].substring(0, 25) + (x[0].length > 25 ? '...' : '')),
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
              legend: { display: false }
            },
            scales: {
              x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              y: { ticks: { color: '#FAFAFA' }, grid: { display: false } }
            }
          }
        });
      }

      // 3. Gráfico de Tipología
      const canvasTipo = document.getElementById('chartTipologia');
      if (canvasTipo) {
        const entries = Object.entries(tipologiaCounts).filter(e => e[0] !== '');
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
        const est = (r['ESTADO DE LA VISITA'] || r['ESTADO'] || 'SIN REGISTRO').trim().toUpperCase();
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
        const pctGarantia = total ? ((garantias / total) * 100).toFixed(1) + '%' : '0%';

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
              legend: { display: false }
            },
            scales: {
              x: { ticks: { color: '#94a3b8', font: { size: 9 } }, grid: { display: false } },
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
      return;
    }

    // Identificar las columnas a renderizar según sub-pestaña
    let cols = [];
    if (this.activeSubTab === 'desinstalacion') {
      cols = [
        { label: 'OC / Pedido', key: 'NRO PEDIDO / ORDEN DE COMPRA' },
        { label: 'Punto de Venta', key: 'NOMBRE PUNTO DE ATENCIÓN' },
        { label: 'Departamento', key: 'DEPARTAMENTO' },
        { label: 'Fecha Apertura', key: 'FECHA DE APERTURA (DD/MM/AAAA)' },
        { label: 'Fecha Límite', key: 'FECHA DE VENCIMIENTO (DD/MM/AAAA)' },
        { label: 'Estado', key: '_is_abierto' },
        { label: 'SLA', key: 'DENTRO DE LOS SLA' },
        { label: 'Retraso', key: '_retraso' }
      ];
    } else {
      // implementacion, publicidad, capacitacion
      cols = [
        { label: 'ID Sitio', key: 'ID SITIO' },
        { label: 'Establecimiento', key: 'ESTABLECIMIENTO' },
        { label: 'Departamento', key: 'DEPARTAMENTO' },
        { label: 'Fecha Lista', key: 'FECHA LISTA' },
        { label: 'Fecha Límite', key: 'FECHA LIMITE' },
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
      tableHtml += '<tr>';
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
        } else {
          valHtml = this.model.formatCellValue(c.key, r[c.key]);
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

  // Configura los eventos del buscador interno, paginación y exportación a Excel
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
  }
}

// Exponer la clase a nivel global
window.IndicatorsView = IndicatorsView;
