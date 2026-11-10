/**
 * @file dashboard.js
 * @description Controlador del Panel General de Tesorería (KPIs animados, tabla de liquidez
 * con barras proporcionales y libro mayor de operaciones) y de los paneles matriciales
 * en LaTeX de la vista Red Interbancaria.
 */
(function (root, factory) {
  'use strict';
  const namespace = (root.PayGraph = root.PayGraph || {});
  namespace.DashboardUI = factory(
    namespace.Datos,
    namespace.Grafo,
    namespace.LatexUI
  );
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Datos, Grafo, LatexUI) {
  'use strict';

  function limpiar(el) {
    while (el && el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  function crearEl(tag, className, texto) {
    const el = document.createElement(tag);
    if (className) {
      el.className = className;
    }
    if (texto !== undefined && texto !== null) {
      el.textContent = String(texto);
    }
    return el;
  }

  /**
   * Construye el controlador del Panel General y de las matrices de la vista de Red.
   *
   * @param {Object} dom - Referencias DOM de las vistas Panel General y Red Interbancaria.
   * @returns {Object} API de actualización.
   */
  function crearDashboard(dom) {
    /**
     * Renderiza las fórmulas fijas en LaTeX de las tarjetas KPI y de las matrices M y D.
     */
    function inicializarFormulasEstaticas() {
      if (dom.formulaInvarianteKpi) {
        LatexUI.renderizarLatex(
          dom.formulaInvarianteKpi,
          '\\sum_{i=0}^{4} \\text{saldo}(v_i) + C_{\\text{acum}} = M_0',
          false,
          'Σ saldo(vᵢ) + C_acum = M₀'
        );
      }
      if (dom.formulaReglaKpi) {
        LatexUI.renderizarLatex(
          dom.formulaReglaKpi,
          'F(T) = A \\land B \\land \\neg C',
          false,
          'F(T) = A ∧ B ∧ ¬C'
        );
      }
      if (dom.formulaComplejidadKpi) {
        LatexUI.renderizarLatex(
          dom.formulaComplejidadKpi,
          'T(\\text{RSA}) + T(\\text{Dijkstra}) \\ll 100\\text{ ms}',
          false,
          'T(RSA) + T(Dijkstra) << 100 ms'
        );
      }

      // Matriz de adyacencia M en LaTeX dentro de la vista Red Interbancaria
      if (dom.contenedorMatrizM) {
        const filasLatexM = Datos.MATRIZ_ADYACENCIA.map(function (fila) {
          return fila
            .map(function (val) {
              return Number.isFinite(val) ? String(val) : '\\infty';
            })
            .join(' & ');
        }).join(' \\\\ ');

        const exprM =
          'M = \\begin{pmatrix} ' + filasLatexM + ' \\end{pmatrix}_{5 \\times 5}';
        LatexUI.renderizarLatex(
          dom.contenedorMatrizM,
          exprM,
          true,
          'Matriz de adyacencia M (5x5)'
        );
      }

      // Matriz de costos mínimos D (Dijkstra / Floyd-Warshall) en LaTeX
      if (dom.contenedorMatrizD) {
        const matrizD = Grafo.calcularMatrizCostosMinimos(Datos.MATRIZ_ADYACENCIA);
        const filasLatexD = matrizD
          .map(function (fila) {
            return fila
              .map(function (val) {
                return Number.isFinite(val) ? String(val) : '\\infty';
              })
              .join(' & ');
          })
          .join(' \\\\ ');

        const exprD =
          'D = \\begin{pmatrix} ' + filasLatexD + ' \\end{pmatrix}_{5 \\times 5}';
        LatexUI.renderizarLatex(
          dom.contenedorMatrizD,
          exprD,
          true,
          'Matriz de costos mínimos D (5x5)'
        );
      }
    }

    /**
     * Actualiza los KPIs animados, la tabla de liquidez por cuenta y el libro mayor.
     *
     * @param {Object} estadoSimulador - Instantánea devuelta por simulador.obtenerEstado().
     */
    function actualizarPanelGeneral(estadoSimulador) {
      if (!estadoSimulador) {
        return;
      }

      const historial = estadoSimulador.historial || [];
      const totalTx = historial.length;
      let aprobadas = 0;
      let sumaLatencia = 0;

      historial.forEach(function (tx) {
        if (tx.aprobada) {
          aprobadas += 1;
        }
        sumaLatencia += Number(tx.tiempoCalculoMs || 0);
      });

      const rechazadas = totalTx - aprobadas;
      const tasaAprobacion = totalTx > 0 ? Math.round((aprobadas / totalTx) * 100) : 100;
      const latenciaMedia = totalTx > 0 ? sumaLatencia / totalTx : 0;

      // 1. Animar contadores KPI
      if (dom.kpiMasaMonetaria) {
        LatexUI.animarValorNumerico(
          dom.kpiMasaMonetaria,
          estadoSimulador.sumaSaldos,
          function (v) {
            return Datos.formatearMonedaCOP(Math.round(v));
          },
          420
        );
      }

      if (dom.kpiComisiones) {
        LatexUI.animarValorNumerico(
          dom.kpiComisiones,
          estadoSimulador.comisionesAcumuladas,
          function (v) {
            return Datos.formatearMonedaCOP(Math.round(v));
          },
          420
        );
      }

      if (dom.kpiBadgeInvariante) {
        dom.kpiBadgeInvariante.textContent = estadoSimulador.invarianteCumplido
          ? '✓ Invariante exacto ($78.500.000)'
          : '⚠ Desviación detectada';
      }

      if (dom.kpiOperacionesTotal) {
        dom.kpiOperacionesTotal.textContent =
          totalTx + ' (' + aprobadas + ' OK · ' + rechazadas + ' Rech.)';
      }

      if (dom.kpiTasaAprobacion) {
        dom.kpiTasaAprobacion.textContent = 'Tasa de aprobación: ' + tasaAprobacion + '%';
      }

      if (dom.kpiLatenciaMedia) {
        dom.kpiLatenciaMedia.textContent = latenciaMedia.toFixed(2) + ' ms';
      }

      // 2. Renderizar tabla de saldos y liquidez por entidad con barras animadas
      if (dom.cuerpoTablaLiquidez) {
        limpiar(dom.cuerpoTablaLiquidez);
        const masaBase = Math.max(1, estadoSimulador.masaMonetariaInicial);

        estadoSimulador.cuentas.forEach(function (cuenta) {
          const tr = crearEl('tr', 'border-b border-slate-500/10 hover:bg-slate-500/5 transition-colors');

          // Entidad (icono + nombre sin vértice técnico)
          const tdEntidad = crearEl('td', 'py-3 px-3');
          const filaEntidad = crearEl('div', 'flex items-center gap-2.5');
          const badgeNodo = crearEl(
            'span',
            'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ' +
              (cuenta.tipo === 'banco'
                ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
                : 'bg-purple-500/15 text-purple-400 border border-purple-500/30')
          );
          badgeNodo.innerHTML =
            cuenta.tipo === 'banco'
              ? '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="21" x2="21" y2="21"></line><line x1="3" y1="10" x2="21" y2="10"></line><polyline points="5 6 12 3 19 6"></polyline><line x1="4" y1="10" x2="4" y2="21"></line><line x1="20" y1="10" x2="20" y2="21"></line></svg>'
              : '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';

          const infoTexto = crearEl('div', '');
          infoTexto.appendChild(crearEl('div', 'text-xs font-bold', cuenta.nombre));
          infoTexto.appendChild(
            crearEl(
              'div',
              'text-[10px] uppercase tracking-wider pg-text-muted',
              cuenta.tipo === 'banco' ? 'Cámara de Compensación' : 'Cuenta Personal'
            )
          );
          filaEntidad.appendChild(badgeNodo);
          filaEntidad.appendChild(infoTexto);
          tdEntidad.appendChild(filaEntidad);

          // Saldo inicial
          const tdInicial = crearEl(
            'td',
            'py-3 px-3 text-right font-mono-tabular text-xs pg-text-muted',
            Datos.formatearMonedaCOP(cuenta.saldoInicial)
          );

          // Saldo actual
          const tdActual = crearEl(
            'td',
            'py-3 px-3 text-right font-mono-tabular text-xs font-extrabold',
            Datos.formatearMonedaCOP(cuenta.saldo)
          );

          // Variación neta Δ
          const delta = cuenta.saldo - cuenta.saldoInicial;
          const signo = delta > 0 ? '+' : '';
          const claseDelta =
            delta > 0
              ? 'text-emerald-400'
              : delta < 0
              ? 'text-amber-400'
              : 'pg-text-muted';
          const tdDelta = crearEl(
            'td',
            'py-3 px-3 text-right font-mono-tabular text-xs font-bold ' + claseDelta,
            delta === 0 ? '$0' : signo + Datos.formatearMonedaCOP(delta)
          );

          // Barra de participación en la masa monetaria
          const porcentaje = Math.max(0, Math.min(100, (cuenta.saldo / masaBase) * 100));
          const tdBarra = crearEl('td', 'py-3 px-3 w-44');
          const wrapBarra = crearEl('div', 'flex items-center gap-2');
          const fondoBarra = crearEl('div', 'w-full h-2 rounded-full bg-slate-500/15 overflow-hidden');
          const rellenoBarra = crearEl(
            'div',
            'h-full rounded-full transition-all duration-500 ' +
              (cuenta.tipo === 'banco'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : 'bg-gradient-to-r from-purple-500 to-fuchsia-400')
          );
          rellenoBarra.style.width = porcentaje.toFixed(1) + '%';
          fondoBarra.appendChild(rellenoBarra);
          wrapBarra.appendChild(fondoBarra);
          wrapBarra.appendChild(
            crearEl('span', 'font-mono-tabular text-[11px] w-12 text-right', porcentaje.toFixed(1) + '%')
          );
          tdBarra.appendChild(wrapBarra);

          // Acción rápida para operar con esta cuenta
          const tdAccion = crearEl('td', 'py-3 px-3 text-right');
          const btnOperar = crearEl(
            'button',
            'pg-chip-action px-2.5 py-1 rounded-lg text-[11px] font-bold',
            'Usar como origen →'
          );
          btnOperar.type = 'button';
          btnOperar.addEventListener('click', function () {
            if (typeof dom.alElegirCuentaParaOperar === 'function') {
              dom.alElegirCuentaParaOperar(cuenta.id);
            }
          });
          tdAccion.appendChild(btnOperar);

          tr.appendChild(tdEntidad);
          tr.appendChild(tdInicial);
          tr.appendChild(tdActual);
          tr.appendChild(tdDelta);
          tr.appendChild(tdBarra);
          tr.appendChild(tdAccion);

          dom.cuerpoTablaLiquidez.appendChild(tr);
        });
      }

      // 3. Renderizar Libro Mayor de Operaciones Recientes (Ledger)
      if (dom.cuerpoLibroOperaciones) {
        limpiar(dom.cuerpoLibroOperaciones);

        if (historial.length === 0) {
          const trVacio = crearEl('tr', '');
          const tdVacio = crearEl(
            'td',
            'py-6 px-4 text-center text-xs pg-text-muted',
            'Aún no se han ejecutado órdenes en esta sesión. Ejecuta una transferencia o lanza uno de los escenarios S1–S4.'
          );
          tdVacio.colSpan = 7;
          trVacio.appendChild(tdVacio);
          dom.cuerpoLibroOperaciones.appendChild(trVacio);
          return;
        }

        historial
          .slice()
          .reverse()
          .forEach(function (tx) {
            const tr = crearEl(
              'tr',
              'border-b border-slate-500/10 hover:bg-slate-500/5 transition-colors text-xs'
            );

            const tdId = crearEl(
              'td',
              'py-2.5 px-3 font-mono-tabular font-bold',
              '#TX-' + String(tx.idTransaccion).padStart(3, '0')
            );

            // Ruta legible
            const tdRuta = crearEl('td', 'py-2.5 px-3');
            tdRuta.appendChild(
              crearEl(
                'div',
                'font-bold text-xs',
                tx.cuentaOrigenNombre + ' → ' + tx.cuentaDestinoNombre
              )
            );
            const tramosTexto = tx.ruta
              .map(function (idx) {
                return Datos.CUENTAS_SEMILLA[idx].nombre;
              })
              .join(' · ');
            tdRuta.appendChild(
              crearEl(
                'div',
                'text-[10.5px] pg-text-muted truncate max-w-[200px]',
                tramosTexto
              )
            );

            const tdMonto = crearEl(
              'td',
              'py-2.5 px-3 text-right font-mono-tabular font-bold',
              Datos.formatearMonedaCOP(tx.monto)
            );

            const tdComision = crearEl(
              'td',
              'py-2.5 px-3 text-right font-mono-tabular text-emerald-400 font-semibold',
              Datos.formatearMonedaCOP(tx.comision)
            );

            const tdToken = crearEl('td', 'py-2.5 px-3');
            const badgeToken = crearEl(
              'span',
              'px-2 py-0.5 rounded text-[10px] font-mono-tabular font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 inline-flex items-center gap-1',
              'Cifrado'
            );
            badgeToken.title = 'Token: ' + tx.tokenFormateado;
            tdToken.appendChild(badgeToken);

            const tdRegla = crearEl('td', 'py-2.5 px-3');
            let textoRegla = 'Aprobada';
            let claseRegla = 'text-emerald-400';
            if (!tx.proposiciones.B) {
              textoRegla = 'PIN inválido';
              claseRegla = 'text-rose-400';
            } else if (!tx.proposiciones.A) {
              textoRegla = 'Saldo insuficiente';
              claseRegla = 'text-amber-400';
            } else if (tx.proposiciones.C) {
              textoRegla = 'Alerta de fraude';
              claseRegla = 'text-purple-400';
            }
            tdRegla.appendChild(crearEl('span', 'text-xs font-bold ' + claseRegla, textoRegla));

            const tdEstado = crearEl('td', 'py-2.5 px-3 text-right');
            const badge = crearEl(
              'button',
              'px-2.5 py-1 rounded-full text-[11px] font-extrabold inline-flex items-center gap-1 ' +
                (tx.aprobada
                  ? 'pg-status-success'
                  : tx.proposiciones.C && tx.proposiciones.A && tx.proposiciones.B
                  ? 'pg-status-warning'
                  : 'pg-status-danger'),
              tx.aprobada ? '✓ APROBADA · Ver pasos' : '✕ RECHAZADA · Ver pasos'
            );
            badge.type = 'button';
            badge.addEventListener('click', function () {
              if (typeof dom.alInspeccionarTransaccion === 'function') {
                dom.alInspeccionarTransaccion(tx);
              }
            });
            tdEstado.appendChild(badge);

            tr.appendChild(tdId);
            tr.appendChild(tdRuta);
            tr.appendChild(tdMonto);
            tr.appendChild(tdComision);
            tr.appendChild(tdToken);
            tr.appendChild(tdRegla);
            tr.appendChild(tdEstado);

            dom.cuerpoLibroOperaciones.appendChild(tr);
          });
      }
    }

    /**
     * Actualiza la tabla de relajación de Dijkstra en la vista Red Interbancaria (#/red)
     * para el par (origen, destino) activo.
     *
     * @param {number} origen - Índice del nodo origen (0..4).
     * @param {number} destino - Índice del nodo destino (0..4).
     */
    function actualizarInspectorRed(origen, destino) {
      if (!dom.cuerpoTablaDijkstraRed) {
        return;
      }
      limpiar(dom.cuerpoTablaDijkstraRed);

      const o = origen >= 0 && origen <= 4 ? origen : 0;
      const d = destino >= 0 && destino <= 4 && destino !== o ? destino : o === 4 ? 0 : 4;
      const info = Grafo.dijkstra(Datos.MATRIZ_ADYACENCIA, o, d);

      if (dom.formulaRutaActivaRed) {
        const secuenciaLatex = info.ruta
          .map(function (idx) {
            return 'v_' + idx;
          })
          .join(' \\to ');
        const exprRuta =
          'P^*(v_' +
          o +
          ', v_' +
          d +
          ') = (' +
          secuenciaLatex +
          '), \\quad W(P^*) = \\$' +
          Datos.formatearNumeroCOP(info.costoTotal) +
          (Number.isFinite(info.costoDirecto)
            ? ', \\quad w(v_' +
              o +
              ', v_' +
              d +
              ') = \\$' +
              Datos.formatearNumeroCOP(info.costoDirecto)
            : ', \\quad w(v_' + o + ', v_' + d + ') = \\infty');

        LatexUI.renderizarLatex(
          dom.formulaRutaActivaRed,
          exprRuta,
          false,
          'P* = ' + info.ruta.join(' -> ') + ' | W(P*) = $' + info.costoTotal
        );
      }

      info.iteraciones.forEach(function (iter) {
        const tr = crearEl('tr', 'border-b border-slate-500/10 text-xs font-mono-tabular');
        tr.appendChild(crearEl('td', 'py-2 px-2.5 font-bold', 'k = ' + iter.paso));

        const tdNodo = crearEl('td', 'py-2 px-2.5');
        const cNodo = Datos.CUENTAS_SEMILLA[iter.nodoFijado];
        tdNodo.appendChild(
          LatexUI.crearNodoLatex(
            'u^* = v_' + iter.nodoFijado + '\\; (\\$' + Datos.formatearNumeroCOP(iter.costoFijado) + ')',
            false,
            'font-bold text-purple-400',
            cNodo.codigo + ' ($' + iter.costoFijado + ')'
          )
        );
        tr.appendChild(tdNodo);

        iter.distancias.forEach(function (val, idx) {
          const esFijado = idx === iter.nodoFijado;
          const tdDist = crearEl(
            'td',
            'py-2 px-2.5 text-center ' +
              (esFijado ? 'font-extrabold text-emerald-400 bg-emerald-500/10 rounded' : ''),
            Number.isFinite(val) ? '$' + Datos.formatearNumeroCOP(val) : '∞'
          );
          tr.appendChild(tdDist);
        });

        dom.cuerpoTablaDijkstraRed.appendChild(tr);
      });
    }

    inicializarFormulasEstaticas();

    return Object.freeze({
      actualizarPanelGeneral: actualizarPanelGeneral,
      actualizarInspectorRed: actualizarInspectorRed
    });
  }

  return Object.freeze({
    crearDashboard: crearDashboard
  });
});
