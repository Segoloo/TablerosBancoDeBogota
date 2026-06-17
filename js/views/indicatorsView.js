'use strict';

class IndicatorsView {
  constructor(containerId, model) {
    this.containerId = containerId;
    this.model = model;
    
    this.activeSubTab = 'cierres'; // Tab por defecto
    this.charts = {}; // Almacén de instancias de Chart.js
    
    // Callbacks del controlador
    this.filterChangeCallback = null;
    this.exportExcelCallback = null;
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
            <div class="board-tag">Tablero de Control Operativo</div>
          </div>
          
          <!-- SUB-PESTAÑAS (Navegación interna) -->
          <div class="sub-tab-bar" id="subTabBar">
            <button class="sub-tab-btn active" data-subtab="cierres">🔒 Cierres CB</button>
            <button class="sub-tab-btn" data-subtab="papeleria">📦 Papelería</button>
            <button class="sub-tab-btn" data-subtab="otras-oc">🔄 Otras OC</button>
            <button class="sub-tab-btn" data-subtab="implementacion">🔧 Implementación</button>
            <button class="sub-tab-btn" data-subtab="incidentes">🔔 Incidentes</button>
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
              <label>Red / Cliente</label>
              <select id="selRed">
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
    const redes = new Set();
    const tecnicos = new Set();

    // Extraer valores únicos de todas las secciones
    const scanRows = (rows) => {
      if (!Array.isArray(rows)) return;
      rows.forEach(r => {
        if (r['DEPARTAMENTO']) deptos.add(r['DEPARTAMENTO'].toString().trim());
        if (r['RED']) redes.add(r['RED'].toString().trim());
        if (r['GRUPO']) redes.add(r['GRUPO'].toString().trim());
        
        const tec = r['TECNICO'] || r['INGENIERO DE CAMPO'] || r['TÉCNICO'];
        if (tec) tecnicos.add(tec.toString().trim());
      });
    };

    if (data.implementacion) {
      scanRows(data.implementacion.bd);
      scanRows(data.implementacion.abiertos);
    }
    if (data.incidentes) {
      scanRows(data.incidentes.cerrados);
      scanRows(data.incidentes.abiertos);
    }
    if (data.oc_wompi) {
      scanRows(data.oc_wompi.cierres);
      scanRows(data.oc_wompi.cierres_abiertos);
      scanRows(data.oc_wompi.papeleria);
      scanRows(data.oc_wompi.papeleria_abiertos);
      scanRows(data.oc_wompi.otras_oc);
      scanRows(data.oc_wompi.otras_oc_abiertos);
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
    fillSelect('selRed', redes, 'red');
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
        red: document.getElementById('selRed')?.value || '',
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
      this.model.filters = { depto: '', red: '', estado: '', sla: '', tecnico: '' };
      
      // Resetear inputs visualmente
      const selDepto = document.getElementById('selDepto'); if (selDepto) selDepto.value = '';
      const selRed = document.getElementById('selRed'); if (selRed) selRed.value = '';
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
    let slaField = 'DENTRO DE LOS SLA';
    let respField = 'RESPONSABLE INCUMPLIMIENTO';

    if (this.activeSubTab === 'cierres') {
      titleTab = 'Cierres de CB';
      rawList = (data.oc_wompi?.cierres || []).concat(data.oc_wompi?.cierres_abiertos || []);
    } else if (this.activeSubTab === 'papeleria') {
      titleTab = 'Papelería';
      rawList = (data.oc_wompi?.papeleria || []).concat(data.oc_wompi?.papeleria_abiertos || []);
    } else if (this.activeSubTab === 'otras-oc') {
      titleTab = 'Otras OC';
      rawList = (data.oc_wompi?.otras_oc || []).concat(data.oc_wompi?.otras_oc_abiertos || []);
    } else if (this.activeSubTab === 'implementacion') {
      titleTab = 'Implementación';
      rawList = (data.implementacion?.bd || []).concat(data.implementacion?.abiertos || []);
      slaField = 'CUMPLE SLA';
      respField = 'OBSERVACIÓN ESTANDAR'; // En implementación, esto tiene el responsable de retraso
    } else if (this.activeSubTab === 'incidentes') {
      titleTab = 'Incidentes';
      rawList = (data.incidentes?.cerrados || []).concat(data.incidentes?.abiertos || []);
      slaField = 'DENTRO DE LOS SLAS';
      respField = 'RESPONSABLE DE INCUMPLIMIENTO';
    }

    // Filtrar la lista actualizando slicers del modelo
    const filteredRows = this.model.filterList(rawList, this.activeSubTab);

    // Destruir gráficos anteriores
    this.destroyCharts();

    // Renderizar estructura base del sub-panel
    content.innerHTML = `
      <div class="sub-tab-panel-container fade-in">
        <!-- KPIs Principales -->
        <div class="kpi-board" id="kpiBoard">
          <!-- Creados dinámicamente -->
        </div>

        <!-- Gráficos del Tablero -->
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

    // Calcular SLA Ajustado (excluyendo retrasos atribuidos a 'USUARIOS' o 'FACTOR_EXTERNO')
    const fallasWompi = rows.filter(r => 
      (r[slaField] || '').toString().toUpperCase().trim() === 'NO' &&
      this.model.isSameResp('WOMPI', r[respField])
    ).length;

    const fallasLinea = rows.filter(r => 
      (r[slaField] || '').toString().toUpperCase().trim() === 'NO' &&
      this.model.isSameResp('LINEACOM', r[respField])
    ).length;

    const cumpleAjustado = total - fallasWompi - fallasLinea;
    const pctAjustado = total ? ((cumpleAjustado / total) * 100).toFixed(1) + '%' : '100.0%';

    // HTML de las tarjetas
    container.innerHTML = `
      <!-- Total Registros -->
      <div class="kpi-card-dashboard">
        <div class="kpi-icon-db">📋</div>
        <div class="kpi-val-db" style="color: var(--bdb-gold);">${total.toLocaleString('es-CO')}</div>
        <div class="kpi-lbl-db">Total Registros</div>
        <div class="kpi-sub-db">${cerrados.toLocaleString('es-CO')} cerrados · ${abiertos.toLocaleString('es-CO')} abiertos</div>
      </div>

      <!-- Cumplimiento General SLA -->
      <div class="kpi-card-dashboard">
        <div class="kpi-icon-db">⏱️</div>
        <div class="kpi-val-db" style="color: var(--linea-green);">${pctSla}</div>
        <div class="kpi-lbl-db">Cumplimiento SLA</div>
        <div class="kpi-sub-db">${cumpleSlaCount.toLocaleString('es-CO')} de ${total.toLocaleString('es-CO')} dentro del plazo</div>
      </div>

      <!-- Cumplimiento Ajustado -->
      <div class="kpi-card-dashboard premium-kpi">
        <div class="kpi-icon-db glow-icon">🏆</div>
        <div class="kpi-val-db glow-text" style="color: #fff;">${pctAjustado}</div>
        <div class="kpi-lbl-db" style="color: var(--bdb-gold); font-weight: 700;">SLA Ajustado</div>
        <div class="kpi-sub-db" style="color: #e2e8f0;">Excluye demoras del cliente / externos</div>
      </div>

      <!-- Responsabilidad de fallas -->
      <div class="kpi-card-dashboard">
        <div class="kpi-icon-db">⚠</div>
        <div class="kpi-val-db" style="color: #FF5C5C;">${(fallasWompi + fallasLinea).toLocaleString('es-CO')}</div>
        <div class="kpi-lbl-db">Fallas Atribuibles</div>
        <div class="kpi-sub-db" style="font-size: 10px;">Línea: ${fallasLinea.toLocaleString('es-CO')} · Wompi: ${fallasWompi.toLocaleString('es-CO')}</div>
      </div>
    `;
  }

  // Genera los gráficos de Chart.js
  renderCharts(rows, slaField) {
    // 1. Gráfico de Línea - Tendencia Mensual
    const renderTrendChart = () => {
      const canvas = document.getElementById('chartTrend');
      if (!canvas) return;

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

      this.charts.trend = new Chart(canvas, {
        type: 'line',
        data: {
          labels: sortedMonths,
          datasets: [{
            label: 'Registros Abiertos',
            data: dataPoints,
            borderColor: '#D6A218', // Oro BDB
            backgroundColor: 'rgba(214, 162, 24, 0.1)',
            tension: 0.3,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: '#D6A218'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: '#001A3A', titleColor: '#D6A218', bodyColor: '#FAFAFA' }
          },
          scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.08)' } }
          }
        }
      });
    };

    // 2. Gráfico de Rosca - SLA
    const renderSlaChart = () => {
      const canvas = document.getElementById('chartSLA');
      if (!canvas) return;

      const cumple = rows.filter(r => (r[slaField] || '').toString().toUpperCase() === 'SI').length;
      const noCumple = rows.filter(r => (r[slaField] || '').toString().toUpperCase() === 'NO').length;
      const total = cumple + noCumple;

      this.charts.sla = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: ['Dentro SLA', 'Fuera SLA'],
          datasets: [{
            data: [cumple, noCumple],
            backgroundColor: ['#00876E', '#CD3232'], // Verde Premium BDB y Rojo Símbolo BDB
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
    };

    // 3. Gráfico de Barras Horizontal - Departamentos
    const renderDeptoChart = () => {
      const canvas = document.getElementById('chartDepto');
      if (!canvas) return;

      const counts = {};
      rows.forEach(r => {
        const d = r['DEPARTAMENTO'] || '(Sin departamento)';
        counts[d] = (counts[d] || 0) + 1;
      });

      const sortedDeptos = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);

      this.charts.depto = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: sortedDeptos.map(x => x[0]),
          datasets: [{
            label: 'Registros',
            data: sortedDeptos.map(x => x[1]),
            backgroundColor: 'rgba(205, 95, 140, 0.75)', // Rosa Preferente BDB con opacidad
            borderColor: '#CD5F8C', // Rosa Preferente BDB
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
    };

    renderTrendChart();
    renderSlaChart();
    renderDeptoChart();
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
    if (this.activeSubTab === 'cierres' || this.activeSubTab === 'papeleria' || this.activeSubTab === 'otras-oc') {
      cols = [
        { label: 'OC / Pedido', key: 'NRO PEDIDO / ORDEN DE COMPRA' },
        { label: 'CB / Punto de Venta', key: 'NOMBRE PUNTO DE ATENCIÓN' },
        { label: 'Departamento', key: 'DEPARTAMENTO' },
        { label: 'Fecha Apertura', key: 'FECHA DE APERTURA (DD/MM/AAAA)' },
        { label: 'Fecha Límite', key: 'FECHA DE VENCIMIENTO (DD/MM/AAAA)' },
        { label: 'Estado', key: '_is_abierto' },
        { label: 'SLA', key: 'DENTRO DE LOS SLA' },
        { label: 'Retraso', key: '_retraso' }
      ];
    } else if (this.activeSubTab === 'implementacion') {
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
    } else if (this.activeSubTab === 'incidentes') {
      cols = [
        { label: 'Ticket Incidente', key: 'TICKET' },
        { label: 'CB / Punto', key: 'NOMBRE PUNTO DE ATENCIÓN' },
        { label: 'Departamento', key: 'DEPARTAMENTO' },
        { label: 'Fecha Apertura', key: 'FECHA APERTURA DEL INCIDENTE (DD/MM/AAAA)' },
        { label: 'Fecha Límite', key: 'FECHA VENCIMIENTO DEL INCIDENTE' },
        { label: 'Estado', key: '_is_abierto' },
        { label: 'SLA', key: 'DENTRO DE LOS SLAS' },
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
        } else if (c.key === 'DENTRO DE LOS SLA' || c.key === 'CUMPLE SLA' || c.key === 'DENTRO DE LOS SLAS') {
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
        const refreshedRows = this.model.filterList(
          this.model.rawIndicators[this.activeSubTab === 'cierres' || this.activeSubTab === 'papeleria' || this.activeSubTab === 'otras-oc' ? 'oc_wompi' : this.activeSubTab === 'implementacion' ? 'implementacion' : 'incidentes'], 
          this.activeSubTab
        );
        // Espera, queremos re-filtrar las filas de esta pestaña en particular.
        // Las filas ya filtradas se vuelven a filtrar:
        const data = this.model.rawIndicators;
        let list = [];
        if (this.activeSubTab === 'cierres') list = (data.oc_wompi?.cierres || []).concat(data.oc_wompi?.cierres_abiertos || []);
        else if (this.activeSubTab === 'papeleria') list = (data.oc_wompi?.papeleria || []).concat(data.oc_wompi?.papeleria_abiertos || []);
        else if (this.activeSubTab === 'otras-oc') list = (data.oc_wompi?.otras_oc || []).concat(data.oc_wompi?.otras_oc_abiertos || []);
        else if (this.activeSubTab === 'implementacion') list = (data.implementacion?.bd || []).concat(data.implementacion?.abiertos || []);
        else if (this.activeSubTab === 'incidentes') list = (data.incidentes?.cerrados || []).concat(data.incidentes?.abiertos || []);

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
