/**
 * @file panel.js
 * @description Controlador de la vista dedicada "Inspector Paso a Paso" (#/pasos).
 * Renderiza una línea de tiempo vertical interactiva con ecuaciones en LaTeX donde se
 * sustituyen los valores reales de la transferencia activa (RSA, Dijkstra y Lógica/IA),
 * controles de reproducción paso a paso (▶ ⏸ ⏭ y velocidad) y modo de demostración académica.
 */
(function (root, factory) {
  'use strict';
  const namespace = (root.PayGraph = root.PayGraph || {});
  namespace.PanelTecnicoUI = factory(
    namespace.Datos,
    namespace.Reglas,
    namespace.LatexUI
  );
})(typeof globalThis !== 'undefined' ? globalThis : this, function (
  Datos,
  Reglas,
  LatexUI
) {
  'use strict';

  function limpiarNodo(elemento) {
    while (elemento && elemento.firstChild) {
      elemento.removeChild(elemento.firstChild);
    }
  }

  function crearEl(etiqueta, clase, texto) {
    const el = document.createElement(etiqueta);
    if (clase) {
      el.className = clase;
    }
    if (texto !== undefined && texto !== null) {
      el.textContent = String(texto);
    }
    return el;
  }

  /**
   * Construye la expresión LaTeX enriquecida con los valores reales de la operación
   * para cada paso de RSA, Grafo o Lógica/IA.
   */
  function construirLatexPasoReal(pestana, indicePaso, pasoObj, tx, modoDidactico) {
    if (!tx) {
      return pasoObj.formula || '';
    }

    if (pestana === 'rsa') {
      const c1 = tx.bloquesCifrados[0];
      const c2 = tx.bloquesCifrados[1];
      const b1 = String(tx.bloquesDescifradosDemo[0]).padStart(2, '0');
      const b2 = String(tx.bloquesDescifradosDemo[1]).padStart(2, '0');

      if (indicePaso === 0) {
        if (modoDidactico) {
          return (
            '\\text{PIN} \\longrightarrow [m_1 = ' +
            b1 +
            ',\\; m_2 = ' +
            b2 +
            '] \\in \\{0, \\dots, 99\\}^2 \\quad (m_i < n = 3233)'
          );
        }
        return '\\text{PIN} = d_1 d_2 d_3 d_4 \\longrightarrow [m_1, m_2] \\in \\{0, \\dots, 99\\}^2 \\quad (\\forall i,\\; m_i < 3233)';
      }
      if (indicePaso === 1) {
        if (modoDidactico) {
          return (
            'c_1 = ' +
            Number(b1) +
            '^{17} \\bmod 3233 = \\mathbf{' +
            c1 +
            '}, \\qquad c_2 = ' +
            Number(b2) +
            '^{17} \\bmod 3233 = \\mathbf{' +
            c2 +
            '}'
          );
        }
        return (
          'c_1 = m_1^{17} \\bmod 3233 = \\mathbf{' +
          c1 +
          '}, \\qquad c_2 = m_2^{17} \\bmod 3233 = \\mathbf{' +
          c2 +
          '}'
        );
      }
      return (
        '\\hat{m}_1 = ' +
        c1 +
        '^{2753} \\bmod 3233,\\; \\hat{m}_2 = ' +
        c2 +
        '^{2753} \\bmod 3233 \\implies B = \\mathbf{' +
        (tx.proposiciones.B ? '1' : '0') +
        '}'
      );
    }

    if (pestana === 'grafo') {
      if (pasoObj.iteracionDatos) {
        const it = pasoObj.iteracionDatos;
        const vecLatex = it.distancias
          .map(function (d) {
            return Number.isFinite(d) ? String(d) : '\\infty';
          })
          .join(',\\; ');
        return (
          'u^* = v_{' +
          it.nodoFijado +
          '}\\;(\\$' +
          Datos.formatearNumeroCOP(it.costoFijado) +
          '), \\quad \\text{dist}^{(k)} = [' +
          vecLatex +
          ']'
        );
      }
      const rutaLatex = tx.ruta
        .map(function (n) {
          return 'v_' + n;
        })
        .join(' \\to ');
      return (
        'P^* = (' +
        rutaLatex +
        '), \\qquad W(P^*) = \\sum_{e \\in P^*} w(e) = \\mathbf{\\$' +
        Datos.formatearNumeroCOP(tx.comision) +
        '}'
      );
    }

    if (pestana === 'logica') {
      const valA = tx.proposiciones.A ? 1 : 0;
      const valB = tx.proposiciones.B ? 1 : 0;
      const valC = tx.proposiciones.C ? 1 : 0;
      const valNoC = valC === 1 ? 0 : 1;
      const valF = tx.proposiciones.F ? 1 : 0;

      if (indicePaso === 0) {
        const op = tx.proposiciones.A ? '\\ge' : '<';
        return (
          'A \\iff \\$' +
          Datos.formatearNumeroCOP(tx.saldosAntes.origen) +
          ' ' +
          op +
          ' (\\$' +
          Datos.formatearNumeroCOP(tx.monto) +
          ' + \\$' +
          Datos.formatearNumeroCOP(tx.comision) +
          ') = \\$' +
          Datos.formatearNumeroCOP(tx.totalRequerido) +
          ' \\implies A = \\mathbf{' +
          valA +
          '}'
        );
      }
      if (indicePaso === 1) {
        return (
          'B \\iff \\text{Dec}_{2753}([' +
          tx.bloquesCifrados[0] +
          ', ' +
          tx.bloquesCifrados[1] +
          ']) ' +
          (tx.proposiciones.B ? '=' : '\\neq') +
          ' \\text{PIN}(v_{' +
          tx.origen +
          '}) \\implies B = \\mathbf{' +
          valB +
          '}'
        );
      }
      if (indicePaso === 2) {
        const cmp = tx.proposiciones.C ? '>' : '\\le';
        return (
          'C \\iff \\$' +
          Datos.formatearNumeroCOP(tx.monto) +
          ' ' +
          cmp +
          ' \\$5.000.000 \\implies C = \\mathbf{' +
          valC +
          '} \\implies \\neg C = \\mathbf{' +
          valNoC +
          '}'
        );
      }
      return (
        'F(T) = A \\land B \\land \\neg C = ' +
        valA +
        ' \\land ' +
        valB +
        ' \\land ' +
        valNoC +
        ' = \\mathbf{' +
        valF +
        '}'
      );
    }

    return pasoObj.formula || '';
  }

  /**
   * Crea el controlador del Inspector Paso a Paso.
   *
   * @param {Object} dom - Referencias DOM del inspector.
   * @returns {Object} API del inspector.
   */
  function crearPanelTecnico(dom) {
    let abierto = true;
    let pestanaActiva = 'rsa';
    let modoDidactico = false;
    let ultimoRegistro = null;

    let indicePasoActual = 0;
    let reproduciendo = false;
    let velocidad = 1.0;
    let temporizadorPaso = null;

    function obtenerListaPasosActiva() {
      if (!ultimoRegistro || !ultimoRegistro.trazas) {
        return [];
      }
      if (pestanaActiva === 'rsa') {
        return ultimoRegistro.trazas.pasosRSA || [];
      }
      if (pestanaActiva === 'grafo') {
        return ultimoRegistro.trazas.pasosGrafo || [];
      }
      if (pestanaActiva === 'logica') {
        return ultimoRegistro.trazas.pasosLogicaIA || [];
      }
      return [];
    }

    function detenerTemporizador() {
      reproduciendo = false;
      if (temporizadorPaso !== null) {
        clearTimeout(temporizadorPaso);
        temporizadorPaso = null;
      }
      actualizarEstadoControlesReproduccion();
    }

    function actualizarEstadoControlesReproduccion() {
      const pasos = obtenerListaPasosActiva();
      const total = pasos.length;
      if (dom.indicadorPaso) {
        dom.indicadorPaso.textContent =
          total > 0 ? 'Paso ' + (indicePasoActual + 1) + ' de ' + total : 'Sin operación activa';
      }
      if (dom.botonPlayPause) {
        dom.botonPlayPause.textContent = reproduciendo ? '⏸ Pausar' : '▶ Reproducir pasos';
        dom.botonPlayPause.setAttribute(
          'aria-label',
          reproduciendo ? 'Pausar reproducción de pasos' : 'Reproducir pasos uno a uno'
        );
      }
    }

    function programarSiguientePaso() {
      if (!reproduciendo) {
        return;
      }
      const pasos = obtenerListaPasosActiva();
      if (pasos.length === 0) {
        detenerTemporizador();
        return;
      }
      const intervaloMs = Math.round(1350 / velocidad);
      temporizadorPaso = setTimeout(function () {
        if (indicePasoActual < pasos.length - 1) {
          indicePasoActual += 1;
          renderizarContenidoPestanaActiva();
          programarSiguientePaso();
        } else {
          detenerTemporizador();
        }
      }, intervaloMs);
    }

    function iniciarReproduccionPasos() {
      const pasos = obtenerListaPasosActiva();
      if (pasos.length === 0) {
        return;
      }
      if (indicePasoActual >= pasos.length - 1) {
        indicePasoActual = 0;
      }
      reproduciendo = true;
      renderizarContenidoPestanaActiva();
      programarSiguientePaso();
    }

    /**
     * Construye la línea de tiempo (stepper vertical) y la tarjeta de detalle con LaTeX.
     */
    function crearStepperDePasos(pasos) {
      const contenedor = crearEl('div', 'space-y-4');

      if (!pasos || pasos.length === 0) {
        const aviso = crearEl('div', 'pg-elevated rounded-2xl p-6 space-y-2 border border-slate-500/15');
        aviso.appendChild(
          crearEl(
            'div',
            'text-sm font-extrabold',
            'Aún no hay una operación cargada en el inspector paso a paso'
          )
        );
        aviso.appendChild(
          crearEl(
            'p',
            'text-xs pg-text-muted leading-relaxed',
            'Ejecuta una transferencia en «2. Operar» o haz clic en cualquiera de los escenarios S1–S4 de la barra superior para inspeccionar aquí cada paso con sus ecuaciones en LaTeX y valores reales sustituidos.'
          )
        );
        contenedor.appendChild(aviso);
        return contenedor;
      }

      const idxSeguro = Math.max(0, Math.min(pasos.length - 1, indicePasoActual));
      const pasoActivo = pasos[idxSeguro];

      // 1. Barra de navegación rápida entre pasos
      const barraPasos = crearEl('div', 'flex items-center gap-2 flex-wrap');
      pasos.forEach(function (p, idx) {
        const esActual = idx === idxSeguro;
        const completado = idx < idxSeguro;
        const btn = crearEl(
          'button',
          'px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 ' +
            (esActual
              ? 'pg-btn-primary shadow-sm'
              : completado
              ? 'pg-status-success'
              : 'pg-btn-secondary opacity-80'),
          (completado ? '✓ ' : '') + 'Paso ' + (idx + 1)
        );
        btn.type = 'button';
        btn.addEventListener('click', function () {
          detenerTemporizador();
          indicePasoActual = idx;
          renderizarContenidoPestanaActiva();
        });
        barraPasos.appendChild(btn);
      });
      contenedor.appendChild(barraPasos);

      // 2. Tarjeta principal del paso activo con fórmula LaTeX sustituida
      const tarjetaActiva = crearEl(
        'div',
        'pg-elevated rounded-2xl p-5 space-y-3.5 border border-purple-500/30'
      );
      const filaCabecera = crearEl('div', 'flex items-center justify-between gap-2');
      filaCabecera.appendChild(
        crearEl(
          'span',
          'text-[11px] font-extrabold uppercase tracking-wider text-purple-400',
          'Paso activo ' + (idxSeguro + 1) + ' de ' + pasos.length
        )
      );
      if (ultimoRegistro) {
        filaCabecera.appendChild(
          crearEl(
            'span',
            'font-mono-tabular text-[11px] pg-text-muted',
            'Operación #TX-' + String(ultimoRegistro.idTransaccion).padStart(3, '0')
          )
        );
      }
      tarjetaActiva.appendChild(filaCabecera);

      tarjetaActiva.appendChild(
        crearEl('h4', 'text-sm sm:text-base font-extrabold leading-snug', pasoActivo.titulo)
      );

      const exprLatex = construirLatexPasoReal(
        pestanaActiva,
        idxSeguro,
        pasoActivo,
        ultimoRegistro,
        modoDidactico
      );
      const bloqueFormula = LatexUI.crearNodoLatex(
        exprLatex,
        true,
        'pg-surface rounded-xl p-3.5 text-xs sm:text-sm border border-slate-500/15',
        pasoActivo.formula
      );
      tarjetaActiva.appendChild(bloqueFormula);

      tarjetaActiva.appendChild(
        crearEl('p', 'text-xs sm:text-sm pg-text-muted leading-relaxed', pasoActivo.detalle)
      );

      if (
        pestanaActiva === 'rsa' &&
        modoDidactico &&
        Array.isArray(pasoActivo.bloquesDescifradosDemo)
      ) {
        const b0 = String(pasoActivo.bloquesDescifradosDemo[0]).padStart(2, '0');
        const b1 = String(pasoActivo.bloquesDescifradosDemo[1]).padStart(2, '0');
        tarjetaActiva.appendChild(
          crearEl(
            'div',
            'pg-status-warning rounded-xl p-3 text-xs font-mono-tabular',
            '[DEMOSTRACIÓN ACADÉMICA] Bloques en claro recuperados: [' +
              b0 +
              ', ' +
              b1 +
              ']. En producción bancaria la clave privada d jamás abandona el módulo HSM.'
          )
        );
      }

      contenedor.appendChild(tarjetaActiva);
      LatexUI.animarEntradaSuave(tarjetaActiva, 0);

      // 3. Línea de tiempo vertical compacta de todos los pasos de esta fase
      const listaTimeline = crearEl('div', 'space-y-2 pt-1');
      pasos.forEach(function (pasoItem, idx) {
        const activo = idx === idxSeguro;
        const item = crearEl(
          'div',
          'rounded-xl p-3 text-xs flex items-start gap-3 cursor-pointer transition-all ' +
            (activo
              ? 'pg-surface border border-purple-500/40'
              : 'pg-elevated opacity-75 hover:opacity-100')
        );
        const circulo = crearEl(
          'span',
          'w-6 h-6 rounded-full flex items-center justify-center font-mono-tabular text-[11px] font-extrabold shrink-0 ' +
            (activo ? 'pg-btn-primary' : 'pg-surface'),
          String(idx + 1)
        );
        const cuerpoItem = crearEl('div', 'min-w-0 flex-1 space-y-0.5');
        cuerpoItem.appendChild(crearEl('div', 'font-bold truncate', pasoItem.titulo));
        cuerpoItem.appendChild(crearEl('div', 'text-[11px] pg-text-muted truncate', pasoItem.detalle));

        item.appendChild(circulo);
        item.appendChild(cuerpoItem);
        item.addEventListener('click', function () {
          detenerTemporizador();
          indicePasoActual = idx;
          renderizarContenidoPestanaActiva();
        });
        listaTimeline.appendChild(item);
      });
      contenedor.appendChild(listaTimeline);

      return contenedor;
    }

    function renderizarPestanaRSA() {
      limpiarNodo(dom.panelRSA);
      const pasos = obtenerListaPasosActiva();
      const vista = crearEl('div', 'grid grid-cols-1 lg:grid-cols-12 gap-5 items-start');

      const colIzq = crearEl('div', 'lg:col-span-7');
      colIzq.appendChild(crearStepperDePasos(pasos));
      vista.appendChild(colIzq);

      const colDer = crearEl('div', 'lg:col-span-5 pg-elevated rounded-2xl p-5 space-y-3.5');
      colDer.appendChild(
        crearEl(
          'h4',
          'text-xs font-extrabold uppercase tracking-wider text-purple-400',
          'Estado Criptográfico de la Operación'
        )
      );
      colDer.appendChild(
        LatexUI.crearNodoLatex(
          '(e, n) = (17, 3233), \\quad \\varphi(n) = 3120, \\quad d = 2753',
          true,
          'pg-surface rounded-xl p-3 text-xs',
          '(e, n) = (17, 3233), φ(n) = 3120, d = 2753'
        )
      );

      if (ultimoRegistro) {
        const cajaResumen = crearEl('div', 'pg-surface rounded-xl p-3.5 space-y-2 text-xs');
        cajaResumen.appendChild(
          crearEl(
            'div',
            'font-mono-tabular font-bold',
            'Token transmitido: ' + ultimoRegistro.tokenFormateado
          )
        );
        cajaResumen.appendChild(
          crearEl(
            'div',
            'font-bold ' +
              (ultimoRegistro.proposiciones.B ? 'text-emerald-400' : 'text-rose-400'),
            ultimoRegistro.proposiciones.B
              ? '✓ Autenticación exitosa en servidor: B = 1'
              : '✕ Autenticación fallida en servidor: B = 0'
          )
        );
        colDer.appendChild(cajaResumen);
      }

      vista.appendChild(colDer);
      dom.panelRSA.appendChild(vista);
    }

    function renderizarPestanaGrafo() {
      limpiarNodo(dom.panelGrafo);
      const pasos = obtenerListaPasosActiva();
      const vista = crearEl('div', 'grid grid-cols-1 lg:grid-cols-12 gap-5 items-start');

      const colIzq = crearEl('div', 'lg:col-span-7');
      colIzq.appendChild(crearStepperDePasos(pasos));
      vista.appendChild(colIzq);

      const colDer = crearEl('div', 'lg:col-span-5 pg-elevated rounded-2xl p-5 space-y-3.5');
      colDer.appendChild(
        crearEl(
          'h4',
          'text-xs font-extrabold uppercase tracking-wider text-emerald-400',
          'Resumen de Enrutamiento Óptimo (Dijkstra)'
        )
      );

      if (ultimoRegistro) {
        const rutaLatex = ultimoRegistro.ruta
          .map(function (idx) {
            return 'v_' + idx;
          })
          .join(' \\to ');
        colDer.appendChild(
          LatexUI.crearNodoLatex(
            'P^* = (' +
              rutaLatex +
              '), \\quad W(P^*) = \\$' +
              Datos.formatearNumeroCOP(ultimoRegistro.comision),
            true,
            'pg-surface rounded-xl p-3 text-xs',
            'P* = ' + ultimoRegistro.ruta.join(' -> ')
          )
        );

        const fichaTramos = crearEl('div', 'pg-surface rounded-xl p-3.5 space-y-1.5 text-xs');
        fichaTramos.appendChild(
          crearEl(
            'div',
            'font-bold text-emerald-400',
            'Comisión mínima liquidada: ' + Datos.formatearMonedaCOP(ultimoRegistro.comision)
          )
        );
        fichaTramos.appendChild(
          crearEl(
            'div',
            'pg-text-muted font-mono-tabular',
            'Costo de enlace directo: ' +
              (Number.isFinite(ultimoRegistro.costoDirecto)
                ? Datos.formatearMonedaCOP(ultimoRegistro.costoDirecto)
                : '∞ (sin canal directo)')
          )
        );
        colDer.appendChild(fichaTramos);
      } else {
        colDer.appendChild(
          crearEl(
            'p',
            'text-xs pg-text-muted leading-relaxed',
            'Ejecuta una transferencia para inspeccionar aquí el vector de distancias tentativas en cada iteración de Dijkstra.'
          )
        );
      }

      vista.appendChild(colDer);
      dom.panelGrafo.appendChild(vista);
    }

    function crearVisualizacionArbolDecision() {
      const contenedorArbol = crearEl('div', 'pg-elevated rounded-2xl p-5 space-y-3.5');
      contenedorArbol.appendChild(
        crearEl(
          'h4',
          'text-xs font-extrabold uppercase tracking-wider text-amber-400',
          'Árbol de Decisión IA y Fila Activa en la Tabla de Verdad'
        )
      );

      const alertaActiva = ultimoRegistro ? Boolean(ultimoRegistro.proposiciones.C) : null;
      const montoEvaluado = ultimoRegistro
        ? '\\$' + Datos.formatearNumeroCOP(ultimoRegistro.monto)
        : '\\text{monto}';

      const nodoRaiz = crearEl('div', 'pg-tree-node text-center text-xs font-bold');
      nodoRaiz.appendChild(
        LatexUI.crearNodoLatex(
          '\\text{Raíz IA: ¿}' + montoEvaluado + ' > \\$5.000.000\\text{ COP?}',
          false,
          '',
          'Raíz IA: ¿monto > $5.000.000 COP?'
        )
      );
      contenedorArbol.appendChild(nodoRaiz);

      const filaRamas = crearEl('div', 'grid grid-cols-2 gap-3 pt-1');

      const hojaIzq = crearEl(
        'div',
        'pg-tree-node text-xs space-y-1 ' +
          (alertaActiva === false ? 'pg-tree-node-active-normal' : '')
      );
      hojaIzq.appendChild(crearEl('div', 'font-mono-tabular font-bold', 'NO (≤ $5.000.000)'));
      hojaIzq.appendChild(crearEl('div', 'font-semibold', 'Hoja 0: Operación normal'));
      hojaIzq.appendChild(
        LatexUI.crearNodoLatex('C = 0 \\implies \\neg C = 1', false, 'text-[11px]', 'C = 0 => ¬C = 1')
      );

      const hojaDer = crearEl(
        'div',
        'pg-tree-node text-xs space-y-1 ' +
          (alertaActiva === true ? 'pg-tree-node-active-fraud' : '')
      );
      hojaDer.appendChild(crearEl('div', 'font-mono-tabular font-bold', 'SÍ (> $5.000.000)'));
      hojaDer.appendChild(crearEl('div', 'font-semibold', 'Hoja 1: Alerta antifraude'));
      hojaDer.appendChild(
        LatexUI.crearNodoLatex('C = 1 \\implies \\neg C = 0', false, 'text-[11px]', 'C = 1 => ¬C = 0')
      );

      filaRamas.appendChild(hojaIzq);
      filaRamas.appendChild(hojaDer);
      contenedorArbol.appendChild(filaRamas);

      // Tabla de verdad con resaltado de la tupla activa
      const tablaContenedor = crearEl('div', 'pt-2 overflow-x-auto');
      const tabla = crearEl('table', 'w-full text-xs font-mono-tabular text-center border-collapse');
      const thead = document.createElement('thead');
      const trHead = crearEl('tr', '');
      ['A', 'B', 'C', '\\neg C', 'F = A \\land B \\land \\neg C'].forEach(function (col) {
        const th = crearEl('th', 'py-1.5 px-2 border-b border-slate-500/25 font-bold');
        th.appendChild(LatexUI.crearNodoLatex(col, false, '', col));
        trHead.appendChild(th);
      });
      thead.appendChild(trHead);
      tabla.appendChild(thead);

      const tbody = document.createElement('tbody');
      Reglas.generarTablaDeVerdad().forEach(function (f) {
        const coincideActual =
          ultimoRegistro &&
          (ultimoRegistro.proposiciones.A ? 1 : 0) === f.A &&
          (ultimoRegistro.proposiciones.B ? 1 : 0) === f.B &&
          (ultimoRegistro.proposiciones.C ? 1 : 0) === f.C;

        const tr = crearEl(
          'tr',
          coincideActual
            ? f.F === 1
              ? 'pg-status-success font-extrabold'
              : 'pg-status-danger font-extrabold'
            : 'opacity-75'
        );
        [f.A, f.B, f.C, f.noC, f.F].forEach(function (val) {
          tr.appendChild(crearEl('td', 'py-1 px-2 border-b border-slate-500/10', String(val)));
        });
        tbody.appendChild(tr);
      });
      tabla.appendChild(tbody);
      tablaContenedor.appendChild(tabla);
      contenedorArbol.appendChild(tablaContenedor);

      return contenedorArbol;
    }

    function renderizarPestanaLogicaIA() {
      limpiarNodo(dom.panelLogica);
      const pasos = obtenerListaPasosActiva();
      const vista = crearEl('div', 'grid grid-cols-1 lg:grid-cols-12 gap-5 items-start');

      const colIzq = crearEl('div', 'lg:col-span-6');
      colIzq.appendChild(crearStepperDePasos(pasos));
      vista.appendChild(colIzq);

      const colDer = crearEl('div', 'lg:col-span-6');
      colDer.appendChild(crearVisualizacionArbolDecision());
      vista.appendChild(colDer);

      dom.panelLogica.appendChild(vista);
    }

    function renderizarContenidoPestanaActiva() {
      actualizarEstadoControlesReproduccion();
      if (pestanaActiva === 'rsa') {
        renderizarPestanaRSA();
      } else if (pestanaActiva === 'grafo') {
        renderizarPestanaGrafo();
      } else if (pestanaActiva === 'logica') {
        renderizarPestanaLogicaIA();
      }
    }

    function cambiarPestana(idPestana) {
      detenerTemporizador();
      pestanaActiva = idPestana;
      indicePasoActual = 0;

      const mapaPaneles = {
        rsa: dom.panelRSA,
        grafo: dom.panelGrafo,
        logica: dom.panelLogica,
        terminal: dom.panelTerminal
      };

      Object.keys(dom.botonesPestana).forEach(function (clave) {
        const btn = dom.botonesPestana[clave];
        const activa = clave === idPestana;
        if (btn) {
          btn.setAttribute('aria-selected', activa ? 'true' : 'false');
        }
        const panel = mapaPaneles[clave];
        if (panel) {
          panel.hidden = !activa;
        }
      });

      if (dom.barraControlesPasos) {
        dom.barraControlesPasos.style.display = idPestana === 'terminal' ? 'none' : 'flex';
      }

      renderizarContenidoPestanaActiva();
    }

    function fijarApertura(estadoAbierto) {
      abierto = Boolean(estadoAbierto);
      if (dom.cajon) {
        dom.cajon.setAttribute('data-open', abierto ? 'true' : 'false');
        dom.cajon.setAttribute('aria-hidden', abierto ? 'false' : 'true');
      }
      if (dom.botonAlternar) {
        dom.botonAlternar.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      }
      if (!abierto) {
        detenerTemporizador();
      }
    }

    Object.keys(dom.botonesPestana).forEach(function (clave) {
      const btn = dom.botonesPestana[clave];
      if (btn) {
        btn.addEventListener('click', function () {
          cambiarPestana(clave);
        });
      }
    });

    if (dom.botonPlayPause) {
      dom.botonPlayPause.addEventListener('click', function () {
        if (reproduciendo) {
          detenerTemporizador();
        } else {
          iniciarReproduccionPasos();
        }
      });
    }

    if (dom.botonSiguientePaso) {
      dom.botonSiguientePaso.addEventListener('click', function () {
        detenerTemporizador();
        const pasos = obtenerListaPasosActiva();
        if (pasos.length > 0) {
          indicePasoActual = (indicePasoActual + 1) % pasos.length;
          renderizarContenidoPestanaActiva();
        }
      });
    }

    if (dom.selectorVelocidad) {
      dom.selectorVelocidad.addEventListener('change', function () {
        const nuevaVel = Number(dom.selectorVelocidad.value);
        if (nuevaVel > 0) {
          velocidad = nuevaVel;
          if (typeof dom.alCambiarVelocidad === 'function') {
            dom.alCambiarVelocidad(velocidad);
          }
        }
      });
    }

    if (dom.interruptorModoDidactico) {
      dom.interruptorModoDidactico.addEventListener('change', function () {
        modoDidactico = Boolean(dom.interruptorModoDidactico.checked);
        renderizarContenidoPestanaActiva();
      });
    }

    if (dom.botonAlternar) {
      dom.botonAlternar.addEventListener('click', function () {
        fijarApertura(true);
        if (typeof dom.alSolicitarIrAPasos === 'function') {
          dom.alSolicitarIrAPasos();
        }
      });
    }

    renderizarContenidoPestanaActiva();

    return Object.freeze({
      abrir: function () {
        fijarApertura(true);
      },
      cerrar: function () {
        fijarApertura(false);
      },
      estaAbierto: function () {
        return abierto;
      },
      cambiarPestana: cambiarPestana,
      cargarTransferencia: function (registroTx, reproducirAutomaticamente) {
        detenerTemporizador();
        ultimoRegistro = registroTx;
        indicePasoActual = 0;
        renderizarContenidoPestanaActiva();
        if (reproducirAutomaticamente && abierto && pestanaActiva !== 'terminal') {
          iniciarReproduccionPasos();
        }
      },
      limpiarTransferencia: function () {
        detenerTemporizador();
        ultimoRegistro = null;
        indicePasoActual = 0;
        renderizarContenidoPestanaActiva();
      }
    });
  }

  return Object.freeze({
    crearPanelTecnico: crearPanelTecnico
  });
});
