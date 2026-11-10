/**
 * @file terminal.js
 * @description Controlador de la pestaña Terminal en el cajón técnico.
 * Mantiene el registro completo monoespaciado (aria-live="polite"), permite copiarlo
 * al portapapeles y limpiarlo, usando únicamente createElement y textContent.
 */
(function (root, factory) {
  'use strict';
  const namespace = (root.PayGraph = root.PayGraph || {});
  namespace.TerminalUI = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * Inicializa el componente de Terminal interactiva.
   *
   * @param {{
   *   contenedorLogs: HTMLElement,
   *   botonCopiar: HTMLButtonElement,
   *   botonLimpiar: HTMLButtonElement,
   *   estadoCopia: HTMLElement
   * }} elementos
   * @returns {Object} API pública de la terminal.
   */
  function crearTerminal(elementos) {
    const contenedor = elementos.contenedorLogs;
    const botonCopiar = elementos.botonCopiar;
    const botonLimpiar = elementos.botonLimpiar;
    const estadoCopia = elementos.estadoCopia;

    let historialLineas = [];

    function renderizarEstadoInicial() {
      while (contenedor.firstChild) {
        contenedor.removeChild(contenedor.firstChild);
      }
      if (historialLineas.length === 0) {
        const lineaVacia = document.createElement('div');
        lineaVacia.className = 'text-xs opacity-70 py-1';
        lineaVacia.textContent =
          '[PAYGRAPH READY] Ejecuta una transferencia o elige un escenario didáctico para registrar la traza paso a paso.';
        contenedor.appendChild(lineaVacia);
      } else {
        historialLineas.forEach(function (entrada) {
          const nodoLinea = document.createElement('div');
          nodoLinea.className = entrada.esEncabezado
            ? 'font-semibold pt-2 pb-0.5 border-t border-slate-700/30 mt-1'
            : 'pl-2 py-0.5 opacity-90';
          nodoLinea.textContent = entrada.texto;
          contenedor.appendChild(nodoLinea);
        });
      }
      contenedor.scrollTop = contenedor.scrollHeight;
    }

    /**
     * Agrega un bloque de líneas correspondiente a una transferencia procesada.
     *
     * @param {Array<string>} lineas - Líneas generadas por el núcleo sin PIN en claro.
     */
    function registrarTransferencia(lineas) {
      if (!Array.isArray(lineas)) {
        return;
      }
      lineas.forEach(function (linea, idx) {
        historialLineas.push({
          texto: String(linea),
          esEncabezado: idx === 0
        });
      });
      renderizarEstadoInicial();
    }

    /**
     * Agrega un mensaje informativo de sistema (p. ej. al reiniciar la simulación).
     *
     * @param {string} mensaje - Mensaje institucional o de sistema.
     */
    function registrarEventoSistema(mensaje) {
      historialLineas.push({
        texto: '[SISTEMA] ' + String(mensaje),
        esEncabezado: true
      });
      renderizarEstadoInicial();
    }

    /**
     * Limpia el historial visual de la terminal.
     */
    function limpiar() {
      historialLineas = [];
      renderizarEstadoInicial();
    }

    if (botonLimpiar) {
      botonLimpiar.addEventListener('click', function () {
        limpiar();
      });
    }

    if (botonCopiar) {
      botonCopiar.addEventListener('click', function () {
        const textoCompleto =
          historialLineas.length > 0
            ? historialLineas
                .map(function (item) {
                  return item.texto;
                })
                .join('\n')
            : '[PAYGRAPH] Sin registros en la terminal.';

        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          navigator.clipboard.writeText(textoCompleto).then(
            function () {
              if (estadoCopia) {
                estadoCopia.textContent = 'Copiado';
                setTimeout(function () {
                  estadoCopia.textContent = 'Copiar';
                }, 1500);
              }
            },
            function () {
              if (estadoCopia) {
                estadoCopia.textContent = 'Listo';
              }
            }
          );
        }
      });
    }

    renderizarEstadoInicial();

    return Object.freeze({
      registrarTransferencia: registrarTransferencia,
      registrarEventoSistema: registrarEventoSistema,
      limpiar: limpiar
    });
  }

  return Object.freeze({
    crearTerminal: crearTerminal
  });
});
