/**
 * @file latex.js
 * @description Utilidades de renderizado matemático con KaTeX (sin eval ni innerHTML inseguro)
 * y animaciones suaves para contadores numéricos y transiciones de elementos.
 */
(function (root, factory) {
  'use strict';
  const namespace = (root.PayGraph = root.PayGraph || {});
  namespace.LatexUI = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * Comprueba si el usuario prefiere reducir el movimiento en el sistema operativo.
   *
   * @returns {boolean}
   */
  function prefiereMovimientoReducido() {
    return Boolean(
      typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  /**
   * Renderiza una expresión LaTeX dentro de un elemento DOM usando KaTeX.
   * Si KaTeX no está disponible, escribe el texto de respaldo mediante textContent.
   *
   * @param {HTMLElement} elemento - Contenedor destino.
   * @param {string} expresionLatex - Fórmula en sintaxis LaTeX.
   * @param {boolean} [modoDisplay=false] - true para bloque centrado, false para inline.
   * @param {string} [textoRespaldo] - Texto legible si KaTeX no está cargado.
   */
  function renderizarLatex(elemento, expresionLatex, modoDisplay, textoRespaldo) {
    if (!elemento) {
      return;
    }
    const formula = String(expresionLatex || '');
    const respaldo = textoRespaldo !== undefined ? String(textoRespaldo) : formula;

    if (
      typeof window !== 'undefined' &&
      window.katex &&
      typeof window.katex.render === 'function'
    ) {
      try {
        window.katex.render(formula, elemento, {
          displayMode: Boolean(modoDisplay),
          throwOnError: false,
          strict: 'ignore',
          trust: false
        });
        return;
      } catch (_err) {
        // Degradación controlada a texto plano si ocurre un error de sintaxis
      }
    }

    while (elemento.firstChild) {
      elemento.removeChild(elemento.firstChild);
    }
    elemento.textContent = respaldo;
  }

  /**
   * Crea un elemento DOM con una fórmula LaTeX ya renderizada.
   *
   * @param {string} expresionLatex - Fórmula en sintaxis LaTeX.
   * @param {boolean} [modoDisplay=false] - true para div en bloque, false para span inline.
   * @param {string} [claseExtra=''] - Clases CSS adicionales.
   * @param {string} [textoRespaldo] - Texto alternativo en caso de fallo.
   * @returns {HTMLElement}
   */
  function crearNodoLatex(expresionLatex, modoDisplay, claseExtra, textoRespaldo) {
    const etiqueta = modoDisplay ? 'div' : 'span';
    const nodo = document.createElement(etiqueta);
    nodo.className =
      (modoDisplay ? 'pg-math-block overflow-x-auto py-1 ' : 'pg-math-inline ') +
      (claseExtra || '');
    renderizarLatex(nodo, expresionLatex, modoDisplay, textoRespaldo);
    return nodo;
  }

  /**
   * Anima suavemente un cambio numérico en un elemento DOM usando interpolación cúbica.
   *
   * @param {HTMLElement} elemento - Nodo cuyo textContent se actualizará.
   * @param {number} valorFinal - Valor numérico destino.
   * @param {Function} formateador - Función (numero) => string.
   * @param {number} [duracionMs=420] - Duración de la animación en milisegundos.
   */
  function animarValorNumerico(elemento, valorFinal, formateador, duracionMs) {
    if (!elemento) {
      return;
    }
    const fmt =
      typeof formateador === 'function'
        ? formateador
        : function (n) {
            return String(Math.round(n));
          };

    const previo = Number(elemento.dataset.valorNumerico);
    elemento.dataset.valorNumerico = String(valorFinal);

    if (
      prefiereMovimientoReducido() ||
      !Number.isFinite(previo) ||
      previo === valorFinal ||
      typeof requestAnimationFrame !== 'function'
    ) {
      elemento.textContent = fmt(valorFinal);
      return;
    }

    const duracion = duracionMs || 420;
    const inicio = performance.now();
    const delta = valorFinal - previo;

    function paso(ahora) {
      const t = Math.min(1, (ahora - inicio) / duracion);
      // Easing out cubic: 1 - (1 - t)^3
      const progreso = 1 - Math.pow(1 - t, 3);
      const actual = previo + delta * progreso;
      elemento.textContent = fmt(actual);
      if (t < 1) {
        requestAnimationFrame(paso);
      } else {
        elemento.textContent = fmt(valorFinal);
      }
    }

    requestAnimationFrame(paso);
  }

  /**
   * Ejecuta una animación suave de entrada (fade + desplazamiento sutil) usando Web Animations API.
   *
   * @param {HTMLElement} elemento - Elemento a animar.
   * @param {number} [retrasoMs=0] - Retraso opcional para efecto escalonado (stagger).
   */
  function animarEntradaSuave(elemento, retrasoMs) {
    if (!elemento || prefiereMovimientoReducido() || typeof elemento.animate !== 'function') {
      return;
    }
    try {
      elemento.animate(
        [
          { opacity: 0, transform: 'translateY(8px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ],
        {
          duration: 260,
          delay: retrasoMs || 0,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'both'
        }
      );
    } catch (_err) {
      // Ignorar en entornos sin soporte de Web Animations API
    }
  }

  return Object.freeze({
    prefiereMovimientoReducido: prefiereMovimientoReducido,
    renderizarLatex: renderizarLatex,
    crearNodoLatex: crearNodoLatex,
    animarValorNumerico: animarValorNumerico,
    animarEntradaSuave: animarEntradaSuave
  });
});
