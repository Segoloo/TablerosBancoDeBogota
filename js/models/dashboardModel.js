'use strict';

class DashboardModel {
  constructor() {
    this.rawIndicators = null;
    
    // Filtros del tablero "Indicadores CB" (Slicers) - Cambiados a arrays para Excel-style multi-select
    this.filters = {
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
      if (Array.isArray(slicers.depto) && slicers.depto.length > 0) {
        const dep = (r['DEPARTAMENTO'] || '').toString().trim().toUpperCase();
        if (!slicers.depto.includes(dep)) return false;
      }

      // 2. Filtro Zona Lineacom
      if (Array.isArray(slicers.zona) && slicers.zona.length > 0) {
        const zonaVal = (r['ZONA LINEACOM'] || r['COORDINADOR ENCARGADO'] || '').toString().trim().toUpperCase();
        if (!slicers.zona.includes(zonaVal)) return false;
      }

      // 3. Filtro Estado (Abierto / Cerrado)
      if (Array.isArray(slicers.estado) && slicers.estado.length > 0) {
        const isAb = !!r._is_abierto;
        const estStr = isAb ? 'ABIERTO' : 'CERRADO';
        if (!slicers.estado.includes(estStr)) return false;
      }

      // 4. Filtro SLA
      if (Array.isArray(slicers.sla) && slicers.sla.length > 0) {
        const field = (tab === 'desinstalacion') ? 'DENTRO DE LOS SLA' : 'CUMPLE SLA';
        let val = (r[field] || '').toString().trim().toUpperCase();
        // Normalización rápida para SLAs
        if (val === 'SI' || val === 'CUMPLE') val = 'SI';
        else if (val === 'NO' || val === 'VENCIDO') val = 'NO';
        if (!slicers.sla.includes(val)) return false;
      }

      // 5. Filtro Técnico / Ingeniero de campo
      if (Array.isArray(slicers.tecnico) && slicers.tecnico.length > 0) {
        const tec = (r['TECNICO'] || r['INGENIERO DE CAMPO'] || r['TÉCNICO'] || '').toString().trim().toUpperCase();
        if (!slicers.tecnico.includes(tec)) return false;
      }

      // 5.1. Filtro por Tipología
      if (Array.isArray(slicers.tipologia) && slicers.tipologia.length > 0) {
        const tipo = (r['TIPOLOGIA'] || 'SIN TIPOLOGÍA').toString().trim().toUpperCase();
        if (!slicers.tipologia.includes(tipo)) return false;
      }

      // 5.2. Filtro por Forma de Atención
      if (Array.isArray(slicers.formaAtencion) && slicers.formaAtencion.length > 0) {
        const forma = (r['FORMA DE ATENCION'] || '').toString().trim().toUpperCase();
        if (!slicers.formaAtencion.includes(forma)) return false;
      }

      // 5.3. Filtro por Estado de la Visita
      if (Array.isArray(slicers.estadoVisita) && slicers.estadoVisita.length > 0) {
        const estVis = this.getRecordVisitStatus(r).toUpperCase();
        if (!slicers.estadoVisita.includes(estVis)) return false;
      }

      // 5.4. Filtro por Código de Punto (ID Sitio)
      if (slicers.punto) {
        const puntoVal = (r['ID SITIO'] || '').toString().trim().toUpperCase();
        if (!puntoVal.includes(slicers.punto.toUpperCase())) return false;
      }

      // 5.5. Filtro por Código de Tarea (TA)
      if (slicers.ta) {
        const taVal = (r['CODIGO_TAREA'] || r['NRO PEDIDO / ORDEN DE COMPRA'] || '').toString().trim().toUpperCase();
        if (!taVal.includes(slicers.ta.toUpperCase())) return false;
      }

      // 5.6. Filtro por Código de Formulario (FO)
      if (slicers.fo) {
        if (!Array.isArray(r['FORMS'])) return false;
        const foVal = slicers.fo.trim().toUpperCase();
        const hasFO = r['FORMS'].some(f => (f['FORM_CODE'] || '').toString().trim().toUpperCase().includes(foVal));
        if (!hasFO) return false;
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
