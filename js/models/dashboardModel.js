'use strict';

class DashboardModel {
  constructor() {
    this.rawIndicators = null;
    
    // Filtros del tablero "Indicadores CB" (Slicers)
    this.filters = {
      depto: '',
      zona: '', // Renombrado de Red/Coordinador a Zona Lineacom
      estado: '',
      sla: '',
      tecnico: ''
    };

    // Términos de búsqueda por sub-sección
    this.searchTerms = {
      implementacion: '',
      publicidad: '',
      capacitacion: '',
      desinstalacion: ''
    };

    // Paginación por sub-sección
    this.pages = {
      implementacion: 1,
      publicidad: 1,
      capacitacion: 1,
      desinstalacion: 1
    };

    this.pageSize = 50;
  }

  // Cargar y descomprimir los datos de indicadores (GZIP)
  async loadIndicatorsData(onProgress) {
    if (this.rawIndicators) return this.rawIndicators;
    
    if (onProgress) onProgress('loading', 'Descargando indicadores...');
    
    const url = window.APP_CONFIG.dataSources.indicadores;
    const res = await fetch(url + '?t=' + Date.now());
    if (!res.ok) throw new Error(`Fallo al descargar datos: HTTP ${res.status}`);
    
    if (onProgress) onProgress('decompressing', 'Descomprimiendo datos...');
    
    const buf = await res.arrayBuffer();
    const ds = new DecompressionStream('gzip');
    const writer = ds.writable.getWriter();
    writer.write(new Uint8Array(buf));
    writer.close();
    
    const decompressedBuffer = await new Response(ds.readable).arrayBuffer();
    const textData = new TextDecoder().decode(decompressedBuffer);
    const data = JSON.parse(textData);
    
    // Normalizaciones y preprocesamiento de datos
    this.preprocessData(data);
    
    this.rawIndicators = data;
    if (onProgress) onProgress('done', `${this.getTotalRows(data).toLocaleString('es-CO')} filas cargadas`);
    return this.rawIndicators;
  }

  // Normalizar campos y asignar flag de abierto/cerrado para consistencia
  preprocessData(data) {
    // 1. Implementación
    if (data.implementacion) {
      if (Array.isArray(data.implementacion.bd)) data.implementacion.bd.forEach(r => r._is_abierto = false);
      if (Array.isArray(data.implementacion.abiertos)) data.implementacion.abiertos.forEach(r => r._is_abierto = true);
    }
    
    // 2. Desinstalación
    if (data.desinstalacion) {
      if (Array.isArray(data.desinstalacion.bd)) data.desinstalacion.bd.forEach(r => r._is_abierto = false);
      if (Array.isArray(data.desinstalacion.abiertos)) data.desinstalacion.abiertos.forEach(r => r._is_abierto = true);
    }
  }

  // Contar número total de registros
  getTotalRows(data) {
    let count = 0;
    if (!data) return 0;
    ['implementacion', 'desinstalacion'].forEach(s => {
      const sec = data[s];
      if (!sec) return;
      Object.values(sec).forEach(arr => {
        if (Array.isArray(arr)) count += arr.length;
      });
    });
    return count;
  }

  // ─── UTILITIES Y CONVERSORES DE DATOS ───
  parseDate(value) {
    if (!value) return null;
    if (typeof value === 'number') {
      const d = new Date(1970, 0, 1);
      d.setDate(d.getDate() + Math.floor(value - 25569));
      const ms = Math.round((value % 1) * 86400000);
      if (ms > 0) d.setMilliseconds(d.getMilliseconds() + ms);
      return isNaN(d) ? null : d;
    }
    const s = String(value).trim();
    // DD/MM/AAAA [HH:MM:SS]
    const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (m) {
      const y = m[3].length === 2 ? 2000 + parseInt(m[3]) : parseInt(m[3]);
      const hr = m[4] ? parseInt(m[4]) : 0;
      const min = m[5] ? parseInt(m[5]) : 0;
      const sec = m[6] ? parseInt(m[6]) : 0;
      return new Date(y, parseInt(m[2]) - 1, parseInt(m[1]), hr, min, sec);
    }
    return null;
  }

  // Formatear celda y validar fechas en formato serial de Excel
  formatCellValue(key, value) {
    if (value === null || value === undefined || value === '') return '—';
    const k = (key || '').toUpperCase();
    const isDateCol = k.includes('FECHA') || k.includes('LIMITE') || k.includes('VENCIMIENTO');
    if (isDateCol && typeof value === 'number' && value > 30000 && value < 60000) {
      const d = new Date((value - 25569) * 86400000);
      if (!isNaN(d)) {
        return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
      }
    }
    if (isDateCol && typeof value === 'string') {
      const n = parseFloat(value);
      if (!isNaN(n) && n > 30000 && n < 60000 && /^\d+(\.\d+)?$/.test(value.trim())) {
        const d = new Date((n - 25569) * 86400000);
        if (!isNaN(d)) {
          return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
        }
      }
    }
    return value.toString();
  }

  // Obtener fechas de inicio y cierre de un registro en función de la pestaña
  getRecordDates(r, tab) {
    let startVal = null;
    let endVal = null;
    
    if (tab === 'desinstalacion') {
      startVal = r['FECHA DE APERTURA (DD/MM/AAAA)'];
      endVal = r['FECHA DE CIERRE (DD/MM/AAAA)'];
    } else {
      startVal = r['FECHA LISTA'];
      endVal = r['FECHA DE FIN'];
    }
    
    return {
      start: this.parseDate(startVal),
      end: this.parseDate(endVal)
    };
  }

  // Calcular días de retraso con respecto a la fecha límite
  getDiasPostVencimiento(r, tab) {
    let deadlineVal = null;
    if (tab === 'desinstalacion') {
      deadlineVal = r['FECHA DE VENCIMIENTO (DD/MM/AAAA)'];
    } else {
      deadlineVal = r['FECHA LIMITE EXTRAORDINARIA'] || r['FECHA LIMITE'];
    }
    const deadline = this.parseDate(deadlineVal);
    if (!deadline) return null;

    let refDate;
    if (r._is_abierto) {
      refDate = new Date();
    } else {
      let closeVal = null;
      if (tab === 'desinstalacion') {
        closeVal = r['FECHA DE CIERRE (DD/MM/AAAA)'];
      } else {
        closeVal = r['FECHA DE FIN'];
      }
      refDate = this.parseDate(closeVal);
      if (!refDate) refDate = new Date();
    }

    let dias = (refDate - deadline) / 86400000;
    
    // Forzar mínimo de 1 día de retraso si el indicador dice que no cumple SLA
    if (dias <= 0) {
      const sla = (r['DENTRO DE LOS SLA'] || r['CUMPLE SLA'] || '').toString().toUpperCase().trim();
      if (sla === 'NO') return 1;
      return dias;
    }
    return dias;
  }

  // Compara si la columna de responsable coincide con ENTIDAD o LINEACOM
  isSameResp(target, current) {
    if (!target || !current) return false;
    const a = target.toString().toUpperCase().trim().replace(/[\s\-_]/g, '');
    const b = current.toString().toUpperCase().trim().replace(/[\s\-_]/g, '');
    
    const isEntidadA = (a === 'ENTIDAD' || a === 'BANCO' || a === 'BDB' || a === 'CLIENTE' || a === 'AVAL');
    const isEntidadB = (b === 'ENTIDAD' || b === 'BANCO' || b === 'BDB' || b === 'CLIENTE' || b === 'AVAL');
    if (isEntidadA && isEntidadB) return true;
    
    const isLineaA = (a === 'LINEA' || a === 'LINEACOM' || a === 'LINEACOMUNICACIONES');
    const isLineaB = (b === 'LINEA' || b === 'LINEACOM' || b === 'LINEACOMUNICACIONES');
    if (isLineaA && isLineaB) return true;
    
    return a === b;
  }

  // Filtrado general de una lista en base a slicers y búsqueda
  filterList(list, tab, slicers = this.filters, query = this.searchTerms[tab]) {
    if (!Array.isArray(list)) return [];
    
    return list.filter(r => {
      // 1. Filtro Departamento
      if (slicers.depto) {
        const dep = (r['DEPARTAMENTO'] || '').toString().trim().toUpperCase();
        if (dep !== slicers.depto.toUpperCase()) return false;
      }

      // 2. Filtro Zona Lineacom
      if (slicers.zona) {
        const zonaVal = (r['ZONA LINEACOM'] || r['COORDINADOR ENCARGADO'] || '').toString().trim().toUpperCase();
        if (zonaVal !== slicers.zona.toUpperCase()) return false;
      }

      // 3. Filtro Estado (Abierto / Cerrado)
      if (slicers.estado) {
        const isAb = !!r._is_abierto;
        if (slicers.estado === 'abierto' && !isAb) return false;
        if (slicers.estado === 'cerrado' && isAb) return false;
      }

      // 4. Filtro SLA
      if (slicers.sla) {
        const field = (tab === 'desinstalacion') ? 'DENTRO DE LOS SLA' : 'CUMPLE SLA';
        const val = (r[field] || '').toString().trim().toUpperCase();
        if (slicers.sla.toUpperCase() !== val) return false;
      }

      // 5. Filtro Técnico / Ingeniero de campo
      if (slicers.tecnico) {
        const tec = (r['TECNICO'] || r['INGENIERO DE CAMPO'] || r['TÉCNICO'] || '').toString().trim().toUpperCase();
        if (tec !== slicers.tecnico.toUpperCase()) return false;
      }

      // 6. Búsqueda de texto libre
      if (query) {
        const q = query.toLowerCase().trim();
        const rowStr = Object.values(r).join(' ').toLowerCase();
        if (!rowStr.includes(q)) return false;
      }

      return true;
    });
  }
}

// Exponer la clase a nivel global
window.DashboardModel = DashboardModel;
