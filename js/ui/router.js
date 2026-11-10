/**
 * @file router.js
 * @description Enrutador por hash para la consola Backoffice de PayGraph.
 * Gestiona las 6 vistas independientes (Panel General, Operar Transferencia, Red Interbancaria,
 * Paso a Paso, Fundamentos Matemáticos y Auditoría) con transiciones suaves y soporte file://.
 */
(function (root, factory) {
  'use strict';
  const namespace = (root.PayGraph = root.PayGraph || {});
  namespace.RouterUI = factory(namespace.LatexUI);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (LatexUI) {
  'use strict';

  const METADATOS_VISTAS = Object.freeze({
    panel: {
      id: 'panel',
      hash: '#/panel',
      titulo: 'Panel General · Tesorería y Liquidez',
      subtitulo: 'Monitoreo en tiempo real del invariante monetario, saldos bancarios y libro mayor de operaciones'
    },
    operar: {
      id: 'operar',
      hash: '#/operar',
      titulo: 'Terminal de Órdenes · Liquidación de Pagos',
      subtitulo: 'Ejecución de transferencias interbancarias con cifrado RSA por bloques, enrutamiento óptimo y filtro IA'
    },
    red: {
      id: 'red',
      hash: '#/red',
      titulo: 'Topología de Red Interbancaria · Grafo G = (V, E, w)',
      subtitulo: 'Inspección espacial de nodos, matriz de adyacencia M, matriz de costos mínimos D y relajación de Dijkstra'
    },
    pasos: {
      id: 'pasos',
      hash: '#/pasos',
      titulo: 'Inspector Paso a Paso · Trazabilidad de la Operación',
      subtitulo: 'Desglose secuencial con sustitución en LaTeX de los valores reales de la última transferencia ejecutada'
    },
    fundamentos: {
      id: 'fundamentos',
      hash: '#/fundamentos',
      titulo: 'Fundamentos Matemáticos y Arquitectura Formal',
      subtitulo: 'Definiciones axiomáticas, teoremas y demostraciones independientes de la operación activa'
    },
    auditoria: {
      id: 'auditoria',
      hash: '#/auditoria',
      titulo: 'Bitácora de Auditoría y Trazas Criptográficas',
      subtitulo: 'Registro inmutable de eventos del motor transaccional con enmascaramiento estricto de credenciales'
    }
  });

  /**
   * Inicializa el enrutador de vistas del Backoffice.
   *
   * @param {{
   *   botonesNav: NodeListOf<HTMLElement>|Array<HTMLElement>,
   *   seccionesVista: Object<string, HTMLElement>,
   *   tituloCabecera: HTMLElement,
   *   subtituloCabecera: HTMLElement,
   *   alCambiarVista: Function
   * }} opciones
   * @returns {Object} API del enrutador.
   */
  function crearRouter(opciones) {
    const botonesNav = Array.prototype.slice.call(opciones.botonesNav || []);
    const secciones = opciones.seccionesVista || {};
    const tituloEl = opciones.tituloCabecera;
    const subtituloEl = opciones.subtituloCabecera;
    const alCambiar = opciones.alCambiarVista;

    let vistaActual = 'operar';

    function normalizarHash(hashCrudo) {
      const limpio = String(hashCrudo || '')
        .replace(/^#\/?/, '')
        .trim()
        .toLowerCase();
      return METADATOS_VISTAS[limpio] ? limpio : '';
    }

    function activarVista(idVista, actualizarHashUrl) {
      const meta = METADATOS_VISTAS[idVista] || METADATOS_VISTAS.operar;
      vistaActual = meta.id;

      // Actualizar paneles de vista
      Object.keys(secciones).forEach(function (clave) {
        const seccion = secciones[clave];
        if (!seccion) {
          return;
        }
        const esActiva = clave === vistaActual;
        seccion.hidden = !esActiva;
        seccion.setAttribute('aria-hidden', esActiva ? 'false' : 'true');
        if (esActiva && LatexUI && typeof LatexUI.animarEntradaSuave === 'function') {
          LatexUI.animarEntradaSuave(seccion, 0);
        }
      });

      // Actualizar botones de navegación lateral y móvil
      botonesNav.forEach(function (btn) {
        const destino = btn.getAttribute('data-vista');
        const activo = destino === vistaActual;
        btn.setAttribute('aria-current', activo ? 'page' : 'false');
        btn.classList.toggle('pg-nav-active', activo);
      });

      // Actualizar títulos de la barra superior del Backoffice
      if (tituloEl) {
        tituloEl.textContent = meta.titulo;
      }
      if (subtituloEl) {
        subtituloEl.textContent = meta.subtitulo;
      }

      if (actualizarHashUrl && typeof window !== 'undefined' && window.history) {
        try {
          window.history.replaceState(null, '', meta.hash);
        } catch (_err) {
          window.location.hash = meta.hash;
        }
      }

      if (typeof alCambiar === 'function') {
        alCambiar(vistaActual, meta);
      }
    }

    botonesNav.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const destino = btn.getAttribute('data-vista');
        if (destino && METADATOS_VISTAS[destino]) {
          activarVista(destino, true);
        }
      });
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', function () {
        const desdeHash = normalizarHash(window.location.hash);
        if (desdeHash && desdeHash !== vistaActual) {
          activarVista(desdeHash, false);
        }
      });
    }

    // Vista inicial: si hay hash válido en la URL, respetarlo; de lo contrario iniciar en 'operar'
    const hashInicial =
      typeof window !== 'undefined' ? normalizarHash(window.location.hash) : '';
    activarVista(hashInicial || 'operar', false);

    return Object.freeze({
      irAVista: function (idVista) {
        if (METADATOS_VISTAS[idVista]) {
          activarVista(idVista, true);
        }
      },
      obtenerVistaActual: function () {
        return vistaActual;
      },
      METADATOS_VISTAS: METADATOS_VISTAS
    });
  }

  return Object.freeze({
    crearRouter: crearRouter,
    METADATOS_VISTAS: METADATOS_VISTAS
  });
});
