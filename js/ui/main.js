/**
 * @file main.js
 * @description Orquestador central de la consola PayGraph Backoffice.
 * Sincroniza el enrutador de las 6 vistas independientes, el simulador transaccional,
 * el panel de control (KPIs y libro mayor), el mapa del grafo con matrices M y D,
 * el inspector paso a paso en LaTeX, los fundamentos matemáticos y la bitácora de auditoría.
 */
(function (root, factory) {
  'use strict';
  const namespace = (root.PayGraph = root.PayGraph || {});
  factory(namespace);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (PayGraph) {
  'use strict';

  const Datos = PayGraph.Datos;
  const Rsa = PayGraph.Rsa;
  const Grafo = PayGraph.Grafo;
  const Reglas = PayGraph.Reglas;
  const Transaccion = PayGraph.Transaccion;

  // Mapa de auxilio didáctico para autocompletado en 1 clic
  const PINES_DEMO_POR_CUENTA = Object.freeze({
    0: '1234',
    1: '2468',
    2: '1357',
    3: '9753',
    4: '4096'
  });

  function limpiarNodo(el) {
    while (el && el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  function crearNodoTexto(tag, className, texto) {
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
   * Ejecuta en consola la suite completa de vectores de prueba de §7.
   *
   * @returns {Array<Object>} Resultados verificados.
   */
  function verificarVectoresEnConsola() {
    const filas = [];
    const sim = Transaccion.crearSimulador();

    const pinesPrueba = [
      { pin: '1234', esperado: '[1730, 180]' },
      { pin: '1111', esperado: '[3061, 3061]' },
      { pin: '2468', esperado: '[1639, 1759]' },
      { pin: '1357', esperado: '[47, 1175]' },
      { pin: '9753', esperado: '[1632, 1802]' },
      { pin: '4096', esperado: '[642, 494]' }
    ];

    pinesPrueba.forEach(function (item) {
      const obs = Rsa.cifrarPinPorBloques(item.pin).tokenFormateado;
      filas.push({
        Grupo: 'RSA Bloques',
        Caso: 'PIN ' + item.pin,
        Esperado: item.esperado,
        Observado: obs,
        Estado: obs === item.esperado ? 'OK' : 'FALLO'
      });
    });

    const col3300 = Rsa.demostrarDefectoPinSinBloques(3300).descifradoDefectuoso;
    const col4000 = Rsa.demostrarDefectoPinSinBloques(4000).descifradoDefectuoso;
    filas.push({
      Grupo: 'RSA Colisión m>=n',
      Caso: '3300 y 4000 sin bloques',
      Esperado: '67 y 767',
      Observado: col3300 + ' y ' + col4000,
      Estado: col3300 === 67 && col4000 === 767 ? 'OK' : 'FALLO'
    });

    const r02 = Grafo.dijkstra(Datos.MATRIZ_ADYACENCIA, 0, 2);
    const r03 = Grafo.dijkstra(Datos.MATRIZ_ADYACENCIA, 0, 3);
    const r04 = Grafo.dijkstra(Datos.MATRIZ_ADYACENCIA, 0, 4);
    filas.push({
      Grupo: 'Dijkstra v0',
      Caso: 'v0→v2, v0→v3, v0→v4',
      Esperado: '500 (0→1→2), 700 (0→1→3), 800 (0→1→4)',
      Observado:
        r02.costoTotal +
        ' (' +
        r02.ruta.join('→') +
        '), ' +
        r03.costoTotal +
        ' (' +
        r03.ruta.join('→') +
        '), ' +
        r04.costoTotal +
        ' (' +
        r04.ruta.join('→') +
        ')',
      Estado:
        r02.costoTotal === 500 && r03.costoTotal === 700 && r04.costoTotal === 800 ? 'OK' : 'FALLO'
    });

    Datos.ESCENARIOS_DIDACTICOS.forEach(function (esc) {
      sim.reiniciar();
      const res = sim.ejecutarTransferencia({
        origen: esc.origen,
        destino: esc.destino,
        monto: esc.monto,
        pin: esc.pin
      });
      filas.push({
        Grupo: 'Escenario ' + esc.id,
        Caso: esc.titulo,
        Esperado: (esc.aprobadaEsperada ? 'Aprobada' : 'Rechazada') + ' · Com $' + esc.comisionEsperada,
        Observado: (res.aprobada ? 'Aprobada' : 'Rechazada') + ' · Com $' + res.comision,
        Estado:
          res.aprobada === esc.aprobadaEsperada && res.comision === esc.comisionEsperada
            ? 'OK'
            : 'FALLO'
      });
    });

    if (typeof console !== 'undefined' && typeof console.table === 'function') {
      console.table(filas);
    }
    return filas;
  }

  PayGraph.verificar = verificarVectoresEnConsola;

  /**
   * Inicializa la consola completa una vez cargado el DOM.
   */
  function iniciarAplicacion() {
    const simulador = Transaccion.crearSimulador();

    // Referencias de navegación y vistas
    const sidebarEl = document.getElementById('sidebar-principal');
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');

    const vistasMap = {
      panel: document.getElementById('vista-panel'),
      operar: document.getElementById('vista-operar'),
      red: document.getElementById('vista-red'),
      pasos: document.getElementById('vista-pasos'),
      fundamentos: document.getElementById('vista-fundamentos'),
      auditoria: document.getElementById('vista-auditoria')
    };

    // Referencias de la terminal de órdenes
    const contenedorTarjetasCuentas = document.getElementById('contenedor-tarjetas-cuentas');
    const selectOrigen = document.getElementById('select-origen');
    const selectDestino = document.getElementById('select-destino');
    const btnInvertirCuentas = document.getElementById('btn-invertir-cuentas');
    const inputMonto = document.getElementById('input-monto');
    const inputPin = document.getElementById('input-pin');
    const btnAutocompletarPin = document.getElementById('btn-autocompletar-pin');
    const formTransferencia = document.getElementById('form-transferencia');
    const tarjetaTransferencia = document.getElementById('tarjeta-transferencia');

    const errorOrigen = document.getElementById('error-origen');
    const errorDestino = document.getElementById('error-destino');
    const errorMonto = document.getElementById('error-monto');
    const errorPin = document.getElementById('error-pin');

    const resumenCostoMonto = document.getElementById('resumen-costo-monto');
    const resumenCostoComision = document.getElementById('resumen-costo-comision');
    const resumenCostoTotal = document.getElementById('resumen-costo-total');

    const bannerEstado = document.getElementById('banner-resultado');
    const iconoEstado = document.getElementById('icono-resultado');
    const tituloEstado = document.getElementById('titulo-resultado');
    const listaRazonesEstado = document.getElementById('lista-razones-resultado');
    const chipLatencia = document.getElementById('chip-latencia');
    const chipInvariante = document.getElementById('chip-invariante');

    // Tarjetas de acceso a los 3 pilares
    const cardResumenRsa = document.getElementById('card-resumen-rsa');
    const cardResumenGrafo = document.getElementById('card-resumen-grafo');
    const cardResumenLogica = document.getElementById('card-resumen-logica');
    const textoResumenRsa = document.getElementById('texto-resumen-rsa');
    const subResumenRsa = document.getElementById('sub-resumen-rsa');
    const textoResumenGrafo = document.getElementById('texto-resumen-grafo');
    const subResumenGrafo = document.getElementById('sub-resumen-grafo');
    const textoResumenLogica = document.getElementById('texto-resumen-logica');
    const subResumenLogica = document.getElementById('sub-resumen-logica');

    // Referencias de la vista Red
    const canvasEl = document.getElementById('lienzo-grafo');
    const vistaPreviaRuta = document.getElementById('vista-previa-ruta');
    const chipAhorroRuta = document.getElementById('chip-ahorro-ruta');

    // Controles globales
    const btnReiniciar = document.getElementById('btn-reiniciar');
    const toggleComisiones = document.getElementById('toggle-comisiones');
    const btnTema = document.getElementById('btn-tema');
    const etiquetaTema = document.getElementById('etiqueta-tema');

    let controladorCanvas = null;
    let ultimoResultadoTx = null;

    // Configuración inicial de tema (oscuro por defecto)
    function fijarTema(tema) {
      document.documentElement.setAttribute('data-theme', tema);
      if (etiquetaTema) {
        etiquetaTema.textContent = tema === 'dark' ? 'Modo claro' : 'Modo oscuro';
      }
      if (btnTema) {
        btnTema.setAttribute(
          'aria-label',
          tema === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'
        );
      }
      if (controladorCanvas) {
        controladorCanvas.redibujar();
      }
    }
    fijarTema('dark');

    // Manejo de apertura/cierre de la barra lateral en pantallas táctiles y móviles
    function toggleSidebar(forzarCierre) {
      if (!sidebarEl) {
        return;
      }
      const estaAbierto = sidebarEl.classList.contains('pg-sidebar-open');
      const nuevoEstado = forzarCierre ? false : !estaAbierto;
      sidebarEl.classList.toggle('pg-sidebar-open', nuevoEstado);
      if (sidebarBackdrop) {
        sidebarBackdrop.classList.toggle('pg-backdrop-open', nuevoEstado);
      }
    }

    if (btnToggleSidebar) {
      btnToggleSidebar.addEventListener('click', function () {
        toggleSidebar(false);
      });
    }
    if (sidebarBackdrop) {
      sidebarBackdrop.addEventListener('click', function () {
        toggleSidebar(true);
      });
    }

    // Instanciar Terminales (tanto en Stepper como en la vista 6 de Auditoría)
    const terminalStepper = PayGraph.TerminalUI.crearTerminal({
      contenedorLogs: document.getElementById('terminal-logs'),
      botonCopiar: document.getElementById('btn-copiar-terminal'),
      botonLimpiar: document.getElementById('btn-limpiar-terminal'),
      estadoCopia: document.getElementById('texto-copiar-terminal')
    });

    const terminalAuditoria = PayGraph.TerminalUI.crearTerminal({
      contenedorLogs: document.getElementById('terminal-logs-auditoria'),
      botonCopiar: document.getElementById('btn-copiar-auditoria'),
      botonLimpiar: document.getElementById('btn-limpiar-auditoria'),
      estadoCopia: document.getElementById('texto-copiar-auditoria')
    });

    // Instanciar Inspector Paso a Paso
    const panelTecnico = PayGraph.PanelTecnicoUI.crearPanelTecnico({
      cajon: document.getElementById('cajon-tecnico'),
      botonAlternar: document.getElementById('btn-ver-como-funciona'),
      botonCerrarCajon: document.getElementById('btn-cerrar-cajon'),
      barraControlesPasos: document.getElementById('barra-controles-pasos'),
      indicadorPaso: document.getElementById('indicador-paso-actual'),
      botonPlayPause: document.getElementById('btn-play-pause'),
      botonSiguientePaso: document.getElementById('btn-siguiente-paso'),
      selectorVelocidad: document.getElementById('select-velocidad'),
      interruptorModoDidactico: document.getElementById('toggle-modo-didactico'),
      botonesPestana: {
        rsa: document.getElementById('tab-rsa'),
        grafo: document.getElementById('tab-grafo'),
        logica: document.getElementById('tab-logica'),
        terminal: document.getElementById('tab-terminal')
      },
      panelRSA: document.getElementById('panel-rsa'),
      panelGrafo: document.getElementById('panel-grafo'),
      panelLogica: document.getElementById('panel-logica'),
      panelTerminal: document.getElementById('panel-terminal'),
      alCambiarVelocidad: function (nuevaVel) {
        if (controladorCanvas) {
          controladorCanvas.fijarVelocidad(nuevaVel);
        }
      },
      alSolicitarIrAPasos: function () {
        if (router) {
          router.irAVista('pasos');
        }
      }
    });

    // Instanciar Panel General de Tesorería (Dashboard)
    const dashboardUI = PayGraph.DashboardUI.crearDashboard({
      formulaInvarianteKpi: document.getElementById('formula-invariante-kpi'),
      formulaReglaKpi: document.getElementById('formula-regla-kpi'),
      formulaComplejidadKpi: document.getElementById('formula-complejidad-kpi'),
      kpiMasaMonetaria: document.getElementById('kpi-masa-monetaria'),
      kpiBadgeInvariante: document.getElementById('kpi-badge-invariante'),
      kpiComisiones: document.getElementById('kpi-comisiones-total'),
      kpiOperacionesTotal: document.getElementById('kpi-operaciones-total'),
      kpiTasaAprobacion: document.getElementById('kpi-tasa-aprobacion'),
      kpiLatenciaMedia: document.getElementById('kpi-latencia-media'),
      cuerpoTablaLiquidez: document.getElementById('cuerpo-tabla-liquidez'),
      cuerpoLibroOperaciones: document.getElementById('cuerpo-libro-operaciones'),
      contenedorMatrizM: document.getElementById('matriz-m-latex'),
      contenedorMatrizD: document.getElementById('matriz-d-latex'),
      cuerpoTablaDijkstraRed: document.getElementById('cuerpo-dijkstra-red'),
      formulaRutaActivaRed: document.getElementById('formula-ruta-activa-red'),
      alElegirCuentaParaOperar: function (cuentaId) {
        selectOrigen.value = String(cuentaId);
        sincronizarDesdeSelectores();
        router.irAVista('operar');
      },
      alInspeccionarTransaccion: function (tx) {
        panelTecnico.cargarTransferencia(tx, false);
        router.irAVista('pasos');
      }
    });

    // Instanciar Fundamentos Matemáticos
    PayGraph.FundamentosUI.inicializarFundamentos(
      document.getElementById('vista-fundamentos-raiz')
    );

    // Instanciar Enrutador de las 6 Vistas
    const router = PayGraph.RouterUI.crearRouter({
      botonesNav: document.querySelectorAll('.pg-nav-btn'),
      seccionesVista: vistasMap,
      tituloCabecera: document.getElementById('cabecera-titulo'),
      subtituloCabecera: document.getElementById('cabecera-subtitulo'),
      alCambiarVista: function (idVista) {
        toggleSidebar(true);
        if (idVista === 'red' && controladorCanvas) {
          setTimeout(function () {
            controladorCanvas.redimensionar();
            const o = selectOrigen.value !== '' ? Number(selectOrigen.value) : 0;
            const d = selectDestino.value !== '' ? Number(selectDestino.value) : 4;
            dashboardUI.actualizarInspectorRed(o, d);
          }, 60);
        } else if (idVista === 'panel') {
          dashboardUI.actualizarPanelGeneral(simulador.obtenerEstado());
        }
      }
    });

    // Instanciar Lienzo del Grafo Interactivo
    controladorCanvas = PayGraph.CanvasGrafo.crearControladorCanvas(canvasEl, {
      alCambiarSeleccion: function (sel) {
        limpiarErroresValidacion();
        ultimoResultadoTx = null;
        if (sel.origen !== -1) {
          selectOrigen.value = String(sel.origen);
        } else {
          selectOrigen.value = '';
        }
        if (sel.destino !== -1) {
          selectDestino.value = String(sel.destino);
        } else {
          selectDestino.value = '';
        }

        actualizarResumenesEnVivo();

        if (sel.faseSeleccion === 1) {
          const cOrig = Datos.CUENTAS_SEMILLA[sel.origen];
          mostrarBannerEstado(
            'neutral',
            '◎',
            'Cuenta origen fijada: ' + cOrig.nombre + ' (' + cOrig.codigo + ')',
            ['Haz clic en un segundo nodo del grafo para establecer la cuenta de destino.']
          );
        } else if (sel.faseSeleccion === 2) {
          const cOrig = Datos.CUENTAS_SEMILLA[sel.origen];
          const cDest = Datos.CUENTAS_SEMILLA[sel.destino];
          const rutaPrev = Grafo.dijkstra(Datos.MATRIZ_ADYACENCIA, sel.origen, sel.destino);
          mostrarBannerEstado(
            'neutral',
            '⇄',
            'Canal establecido: ' + cOrig.nombre + ' → ' + cDest.nombre,
            [
              'Ruta óptima por Dijkstra: comisión mínima de ' +
                Datos.formatearMonedaCOP(rutaPrev.costoTotal) +
                '. Haz clic en «Liquidar transferencia» para ejecutar.'
            ]
          );
        }
      }
    });

    /**
     * Renderiza las tarjetas de cuentas billetera en la vista Operar.
     */
    function renderizarTarjetasCuentas() {
      if (!contenedorTarjetasCuentas) {
        return;
      }
      limpiarNodo(contenedorTarjetasCuentas);

      const estadoSim = simulador.obtenerEstado();
      const orig = selectOrigen.value !== '' ? Number(selectOrigen.value) : -1;
      const dest = selectDestino.value !== '' ? Number(selectDestino.value) : -1;
      let rutaActiva = [];
      if (orig !== -1 && dest !== -1 && orig !== dest) {
        rutaActiva = Grafo.dijkstra(Datos.MATRIZ_ADYACENCIA, orig, dest).ruta;
      }

      estadoSim.cuentas.forEach(function (cuenta) {
        const esOrigen = cuenta.id === orig;
        const esDestino = cuenta.id === dest;
        const esIntermedio = !esOrigen && !esDestino && rutaActiva.indexOf(cuenta.id) !== -1;

        let claseExtra = '';
        if (esOrigen) {
          claseExtra = 'pg-account-origin';
        } else if (esDestino) {
          claseExtra = 'pg-account-destination';
        }

        const tarjeta = crearNodoTexto(
          'button',
          'pg-account-pill rounded-2xl p-3 text-left flex flex-col justify-between gap-1.5 w-full ' +
            claseExtra
        );
        tarjeta.type = 'button';
        tarjeta.dataset.cuentaId = String(cuenta.id);

        const filaSup = crearNodoTexto('div', 'flex items-center justify-between gap-1 w-full');
        const grupoIzq = crearNodoTexto('div', 'flex items-center gap-2 min-w-0');
        const icono = document.createElement('span');
        icono.className =
          'w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ' +
          (cuenta.tipo === 'banco'
            ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
            : 'bg-purple-500/20 text-purple-400 border border-purple-500/30');
        icono.innerHTML =
          cuenta.tipo === 'banco'
            ? '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="21" x2="21" y2="21"></line><line x1="3" y1="10" x2="21" y2="10"></line><polyline points="5 6 12 3 19 6"></polyline><line x1="4" y1="10" x2="4" y2="21"></line><line x1="20" y1="10" x2="20" y2="21"></line></svg>'
            : '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';

        const textosCuenta = crearNodoTexto('div', 'min-w-0');
        textosCuenta.appendChild(
          crearNodoTexto('div', 'text-xs font-extrabold leading-tight truncate', cuenta.nombre)
        );
        textosCuenta.appendChild(
          crearNodoTexto(
            'div',
            'text-[10px] pg-text-muted leading-tight',
            cuenta.tipo === 'banco' ? 'Cámara de Compensación' : 'Cuenta Personal'
          )
        );

        grupoIzq.appendChild(icono);
        grupoIzq.appendChild(textosCuenta);
        filaSup.appendChild(grupoIzq);

        let textoRol = 'Elegir';
        let claseRol = 'pg-elevated pg-text-muted';
        if (esOrigen) {
          textoRol = 'ENVÍA';
          claseRol = 'bg-purple-600 text-white';
        } else if (esDestino) {
          textoRol = 'RECIBE';
          claseRol = 'bg-emerald-600 text-white';
        } else if (esIntermedio) {
          textoRol = 'PUENTE';
          claseRol = 'bg-teal-600 text-white';
        }

        const badgeRol = crearNodoTexto(
          'span',
          'text-[9.5px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ' + claseRol,
          textoRol
        );
        filaSup.appendChild(badgeRol);

        const filaInf = crearNodoTexto(
          'div',
          'pt-1.5 border-t border-slate-500/10 flex items-baseline justify-between gap-1 w-full'
        );
        filaInf.appendChild(crearNodoTexto('span', 'text-[10px] pg-text-muted font-medium', 'Saldo'));
        filaInf.appendChild(
          crearNodoTexto(
            'span',
            'text-xs sm:text-sm font-extrabold font-mono-tabular',
            Datos.formatearMonedaCOP(cuenta.saldo)
          )
        );

        tarjeta.appendChild(filaSup);
        tarjeta.appendChild(filaInf);

        tarjeta.addEventListener('click', function () {
          if (orig === -1 || (orig !== -1 && dest !== -1 && cuenta.id === orig)) {
            selectOrigen.value = String(cuenta.id);
          } else if (orig !== -1 && dest === -1 && cuenta.id !== orig) {
            selectDestino.value = String(cuenta.id);
          } else if (cuenta.id !== orig) {
            selectDestino.value = String(cuenta.id);
          }
          sincronizarDesdeSelectores();
        });

        contenedorTarjetasCuentas.appendChild(tarjeta);
      });
    }

    /**
     * Rellena las opciones de los selectores HTML.
     */
    function actualizarOpcionesSelectores(estadoSimulador, conservarSeleccion) {
      const valorOrigenPrevio = conservarSeleccion ? selectOrigen.value : '0';
      const valorDestinoPrevio = conservarSeleccion ? selectDestino.value : '4';

      [
        { select: selectOrigen, placeholder: 'Selecciona quién envía...' },
        { select: selectDestino, placeholder: 'Selecciona quién recibe...' }
      ].forEach(function (cfg) {
        limpiarNodo(cfg.select);
        const optVacia = document.createElement('option');
        optVacia.value = '';
        optVacia.textContent = cfg.placeholder;
        cfg.select.appendChild(optVacia);

        estadoSimulador.cuentas.forEach(function (c) {
          const opt = document.createElement('option');
          opt.value = String(c.id);
          opt.textContent =
            c.nombre + ' — ' + Datos.formatearMonedaCOP(c.saldo);
          cfg.select.appendChild(opt);
        });
      });

      selectOrigen.value = valorOrigenPrevio;
      selectDestino.value = valorDestinoPrevio;

      if (chipInvariante) {
        chipInvariante.textContent =
          'Comisiones red: ' + Datos.formatearMonedaCOP(estadoSimulador.comisionesAcumuladas);
        chipInvariante.title =
          'Invariante Σ saldos + comisiones = ' +
          Datos.formatearMonedaCOP(estadoSimulador.masaMonetariaTotal);
      }
    }

    /**
     * Actualiza el desglose financiero en vivo y las tarjetas de resumen de los 3 pilares.
     */
    function actualizarResumenesEnVivo() {
      const o = selectOrigen.value !== '' ? Number(selectOrigen.value) : -1;
      const d = selectDestino.value !== '' ? Number(selectDestino.value) : -1;
      const montoNum = Number(inputMonto.value) > 0 ? Math.floor(Number(inputMonto.value)) : 0;

      let infoRuta = null;
      let costoDirecto = Infinity;
      if (o !== -1 && d !== -1 && o !== d) {
        infoRuta = Grafo.dijkstra(Datos.MATRIZ_ADYACENCIA, o, d);
        costoDirecto = infoRuta.costoDirecto;
      }

      const comisionMin = infoRuta ? infoRuta.costoTotal : 0;
      const totalDescontar = montoNum + comisionMin;

      if (resumenCostoMonto) {
        resumenCostoMonto.textContent = Datos.formatearMonedaCOP(montoNum);
      }
      if (resumenCostoComision) {
        resumenCostoComision.textContent = infoRuta
          ? Datos.formatearMonedaCOP(comisionMin)
          : '$0';
      }
      if (resumenCostoTotal) {
        resumenCostoTotal.textContent = Datos.formatearMonedaCOP(totalDescontar);
      }

      if (btnAutocompletarPin) {
        const svgLlave =
          '<svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="7.5" cy="15.5" r="5.5"></circle><path d="m21 2-9.6 9.6"></path><path d="m15.5 7.5 3 3L22 7l-3-3"></path></svg>';
        if (o !== -1 && PINES_DEMO_POR_CUENTA[o]) {
          btnAutocompletarPin.innerHTML =
            svgLlave + '<span>Usar PIN (' + PINES_DEMO_POR_CUENTA[o] + ')</span>';
        } else {
          btnAutocompletarPin.innerHTML = svgLlave + '<span>Usar PIN</span>';
        }
      }

      if (vistaPreviaRuta) {
        if (infoRuta) {
          const nombresRuta = infoRuta.ruta
            .map(function (idx) {
              return Datos.CUENTAS_SEMILLA[idx].nombre;
            })
            .join(' → ');
          vistaPreviaRuta.textContent =
            'Ruta activa: ' +
            nombresRuta +
            ' · Comisión mínima: ' +
            Datos.formatearMonedaCOP(infoRuta.costoTotal);
        } else if (o !== -1 && o === d) {
          vistaPreviaRuta.textContent = 'Elige una cuenta de destino diferente a la de origen.';
        } else {
          vistaPreviaRuta.textContent = 'Selecciona origen y destino para calcular la ruta óptima.';
        }
      }

      if (chipAhorroRuta) {
        if (infoRuta && Number.isFinite(costoDirecto) && costoDirecto > infoRuta.costoTotal) {
          const ahorro = costoDirecto - infoRuta.costoTotal;
          chipAhorroRuta.textContent =
            '✦ Ahorras ' + Datos.formatearMonedaCOP(ahorro) + ' vs. canal directo';
          chipAhorroRuta.className = 'text-xs font-bold px-3 py-1 rounded-full pg-status-success';
        } else if (infoRuta && !Number.isFinite(costoDirecto)) {
          chipAhorroRuta.textContent = '✦ Enrutado por nodo puente bancario';
          chipAhorroRuta.className = 'text-xs font-bold px-3 py-1 rounded-full pg-status-neutral';
        } else {
          chipAhorroRuta.textContent = '✦ Conexión directa óptima';
          chipAhorroRuta.className = 'text-xs font-bold px-3 py-1 rounded-full pg-status-neutral';
        }
      }

      // Actualizar tarjetas de los 3 pilares con lenguaje claro y profesional sin fórmulas confusas
      if (ultimoResultadoTx && ultimoResultadoTx.validacionExitosa) {
        if (textoResumenRsa) {
          textoResumenRsa.textContent = 'Token Criptográfico Protegido';
        }
        if (subResumenRsa) {
          subResumenRsa.textContent = ultimoResultadoTx.proposiciones.B
            ? '✓ Identidad y clave verificadas'
            : '✕ Clave de seguridad no autorizada';
        }
      } else {
        if (textoResumenRsa) {
          textoResumenRsa.textContent = 'Token Criptográfico Protegido';
        }
        if (subResumenRsa) {
          subResumenRsa.textContent = 'Credenciales cifradas de extremo a extremo';
        }
      }

      if (infoRuta) {
        const nombresRuta = infoRuta.ruta
          .map(function (i) {
            return Datos.CUENTAS_SEMILLA[i].nombre;
          })
          .join(' → ');
        if (textoResumenGrafo) {
          textoResumenGrafo.textContent =
            'Comisión de red: ' + Datos.formatearMonedaCOP(infoRuta.costoTotal);
        }
        if (subResumenGrafo) {
          subResumenGrafo.textContent = nombresRuta;
        }
      } else {
        if (textoResumenGrafo) {
          textoResumenGrafo.textContent = 'Canal de Liquidación Óptimo';
        }
        if (subResumenGrafo) {
          subResumenGrafo.textContent = 'Ruta interbancaria de menor comisión';
        }
      }

      const superaUmbral = montoNum > Datos.UMBRAL_FRAUDE_COP;
      if (textoResumenLogica) {
        textoResumenLogica.textContent = superaUmbral
          ? '⚠ Alerta de fraude: monto inusual'
          : '✓ Monto verificado y seguro';
      }
      if (subResumenLogica) {
        subResumenLogica.textContent = superaUmbral
          ? 'Bloqueo preventivo por superar $5.000.000'
          : 'Validación de fondos, clave y riesgo';
      }

      renderizarTarjetasCuentas();
      dashboardUI.actualizarInspectorRed(o, d);
    }

    function sincronizarDesdeSelectores() {
      limpiarErroresValidacion();
      ultimoResultadoTx = null;
      const o = selectOrigen.value !== '' ? Number(selectOrigen.value) : -1;
      const d = selectDestino.value !== '' ? Number(selectDestino.value) : -1;
      controladorCanvas.fijarSeleccionExterna(o, d);
      actualizarResumenesEnVivo();
    }

    function limpiarErroresValidacion() {
      [
        { input: selectOrigen, err: errorOrigen },
        { input: selectDestino, err: errorDestino },
        { input: inputMonto, err: errorMonto },
        { input: inputPin, err: errorPin }
      ].forEach(function (par) {
        if (par.input) {
          par.input.setAttribute('aria-invalid', 'false');
        }
        if (par.err) {
          par.err.textContent = '';
          par.err.classList.add('hidden');
        }
      });
    }

    function mostrarErroresValidacionEnCampos(erroresPorCampo) {
      limpiarErroresValidacion();
      const mapa = [
        { clave: 'origen', input: selectOrigen, err: errorOrigen },
        { clave: 'destino', input: selectDestino, err: errorDestino },
        { clave: 'monto', input: inputMonto, err: errorMonto },
        { clave: 'pin', input: inputPin, err: errorPin }
      ];

      mapa.forEach(function (item) {
        const msg = erroresPorCampo[item.clave];
        if (msg && item.err && item.input) {
          item.input.setAttribute('aria-invalid', 'true');
          item.err.textContent = msg;
          item.err.classList.remove('hidden');
        }
      });
    }

    function mostrarBannerEstado(variante, simboloIcono, titulo, listaDetalles) {
      bannerEstado.className =
        'pg-voucher-card relative overflow-hidden rounded-3xl p-5 sm:p-6 text-xs space-y-3.5 transition-all shadow-md ';
      if (variante === 'success') {
        bannerEstado.className += 'pg-status-success';
      } else if (variante === 'warning') {
        bannerEstado.className += 'pg-status-warning';
      } else if (variante === 'danger') {
        bannerEstado.className += 'pg-status-danger';
      } else {
        bannerEstado.className += 'pg-status-neutral';
      }

      iconoEstado.textContent = simboloIcono;
      tituloEstado.textContent = titulo;

      limpiarNodo(listaRazonesEstado);

      if (Array.isArray(listaDetalles)) {
        listaDetalles.forEach(function (texto) {
          const li = document.createElement('li');
          li.textContent = texto;
          listaRazonesEstado.appendChild(li);
        });
      }
    }

    function vibrarTarjetaRechazo() {
      if (!tarjetaTransferencia) {
        return;
      }
      tarjetaTransferencia.classList.remove('pg-shake');
      void tarjetaTransferencia.offsetWidth;
      tarjetaTransferencia.classList.add('pg-shake');
    }

    /**
     * Procesa la orden de transferencia y sincroniza todos los módulos.
     */
    function procesarFormulario(esEscenarioDidactico) {
      limpiarErroresValidacion();

      const solicitud = {
        origen: selectOrigen.value,
        destino: selectDestino.value,
        monto: inputMonto.value,
        pin: inputPin.value
      };

      const resultado = simulador.ejecutarTransferencia(solicitud);
      if (chipLatencia) {
        chipLatencia.textContent = resultado.tiempoCalculoMs.toFixed(2) + ' ms';
      }

      if (!resultado.validacionExitosa) {
        mostrarErroresValidacionEnCampos(resultado.erroresPorCampo);
        mostrarBannerEstado(
          'danger',
          '✕',
          'Error en los parámetros de la solicitud',
          resultado.mensajesValidacion
        );
        vibrarTarjetaRechazo();
        return;
      }

      ultimoResultadoTx = resultado;

      // Actualizar estado general en todos los subsistemas
      actualizarOpcionesSelectores(resultado.estado, true);
      controladorCanvas.animarResultadoTransferencia(resultado);
      terminalStepper.registrarTransferencia(resultado.trazas.lineasTerminal);
      terminalAuditoria.registrarTransferencia(resultado.trazas.lineasTerminal);
      panelTecnico.cargarTransferencia(resultado, Boolean(esEscenarioDidactico));
      dashboardUI.actualizarPanelGeneral(resultado.estado);
      actualizarResumenesEnVivo();

      if (resultado.aprobada) {
        mostrarBannerEstado(
          'success',
          '✓',
          '¡Transferencia aprobada y liquidada!',
          [
            'Operación exitosa por ' +
              Datos.formatearMonedaCOP(resultado.monto) +
              ' (' +
              resultado.cuentaOrigenNombre +
              ' → ' +
              resultado.cuentaDestinoNombre +
              '). Comisión de red: ' +
              Datos.formatearMonedaCOP(resultado.comision) +
              '.',
            'Nuevo saldo de ' +
              resultado.cuentaOrigenNombre +
              ': ' +
              Datos.formatearMonedaCOP(resultado.saldosDespues.origen) +
              ' · Nuevo saldo de ' +
              resultado.cuentaDestinoNombre +
              ': ' +
              Datos.formatearMonedaCOP(resultado.saldosDespues.destino) +
              '.'
          ]
        );
      } else {
        const soloAlertaIA =
          resultado.proposiciones.A &&
          resultado.proposiciones.B &&
          resultado.proposiciones.C;

        const razonesLimpias = resultado.razonesRechazo.map(function (msg) {
          return msg.replace('Alerta de fraude (IA)', 'Alerta de fraude');
        });

        mostrarBannerEstado(
          soloAlertaIA ? 'warning' : 'danger',
          soloAlertaIA ? '⚠' : '✕',
          soloAlertaIA
            ? 'Operación bloqueada por alerta de fraude'
            : 'Transferencia rechazada',
          razonesLimpias
        );
        vibrarTarjetaRechazo();
      }
    }

    /**
     * Restaura los saldos y comisiones a sus valores semilla iniciales.
     */
    function reiniciarSimulacionCompleta() {
      const estadoInicial = simulador.reiniciar();
      ultimoResultadoTx = null;
      limpiarErroresValidacion();
      actualizarOpcionesSelectores(estadoInicial, false);
      inputMonto.value = '500000';
      inputPin.value = '1234';
      controladorCanvas.actualizarCuentas(estadoInicial.cuentas);
      controladorCanvas.fijarSeleccionExterna(0, 4);
      actualizarResumenesEnVivo();
      panelTecnico.limpiarTransferencia();
      dashboardUI.actualizarPanelGeneral(estadoInicial);
      terminalStepper.registrarEventoSistema(
        'Saldos reiniciados al estado semilla. Invariante $78.500.000 restaurado.'
      );
      terminalAuditoria.registrarEventoSistema(
        'Saldos reiniciados al estado semilla. Invariante $78.500.000 restaurado.'
      );
      if (chipLatencia) {
        chipLatencia.textContent = '0.00 ms';
      }
      mostrarBannerEstado(
        'neutral',
        '✓',
        'Consola reiniciada · Saldos semilla listos',
        ['Elige un caso didáctico o haz clic en «Liquidar transferencia» para operar.']
      );
    }

    // Inicializar botones de casos rápidos S1..S4
    PayGraph.EscenariosUI.inicializarEscenarios({
      contenedorBotones: document.getElementById('contenedor-escenarios'),
      botonMenuMovil: document.getElementById('btn-menu-escenarios'),
      panelDesplegable: document.getElementById('panel-escenarios'),
      alEjecutarEscenario: function (escenario) {
        const estadoSemilla = simulador.reiniciar();
        ultimoResultadoTx = null;
        actualizarOpcionesSelectores(estadoSemilla, false);
        controladorCanvas.actualizarCuentas(estadoSemilla.cuentas);

        selectOrigen.value = String(escenario.origen);
        selectDestino.value = String(escenario.destino);
        inputMonto.value = String(escenario.monto);
        inputPin.value = String(escenario.pin);
        controladorCanvas.fijarSeleccionExterna(escenario.origen, escenario.destino);
        actualizarResumenesEnVivo();
        if (router) {
          router.irAVista('operar');
        }
        procesarFormulario(true);
      }
    });

    // Botones de montos rápidos
    const botonesMontoRapido = document.querySelectorAll('[data-monto-rapido]');
    botonesMontoRapido.forEach(function (btn) {
      btn.addEventListener('click', function () {
        inputMonto.value = btn.getAttribute('data-monto-rapido');
        limpiarErroresValidacion();
        actualizarResumenesEnVivo();
      });
    });

    if (btnAutocompletarPin) {
      btnAutocompletarPin.addEventListener('click', function () {
        const o = selectOrigen.value !== '' ? Number(selectOrigen.value) : 0;
        inputPin.value = PINES_DEMO_POR_CUENTA[o] || '1234';
        limpiarErroresValidacion();
      });
    }

    if (btnInvertirCuentas) {
      btnInvertirCuentas.addEventListener('click', function () {
        const temp = selectOrigen.value;
        selectOrigen.value = selectDestino.value;
        selectDestino.value = temp;
        const o = selectOrigen.value !== '' ? Number(selectOrigen.value) : -1;
        if (o !== -1 && PINES_DEMO_POR_CUENTA[o]) {
          inputPin.value = PINES_DEMO_POR_CUENTA[o];
        }
        sincronizarDesdeSelectores();
      });
    }

    // Enlaces de las tarjetas de los 3 pilares hacia el inspector paso a paso
    if (cardResumenRsa) {
      cardResumenRsa.addEventListener('click', function () {
        router.irAVista('pasos');
        panelTecnico.cambiarPestana('rsa');
      });
    }
    if (cardResumenGrafo) {
      cardResumenGrafo.addEventListener('click', function () {
        router.irAVista('pasos');
        panelTecnico.cambiarPestana('grafo');
      });
    }
    if (cardResumenLogica) {
      cardResumenLogica.addEventListener('click', function () {
        router.irAVista('pasos');
        panelTecnico.cambiarPestana('logica');
      });
    }

    // Listeners del formulario y controles
    selectOrigen.addEventListener('change', function () {
      const o = selectOrigen.value !== '' ? Number(selectOrigen.value) : -1;
      if (o !== -1 && PINES_DEMO_POR_CUENTA[o]) {
        inputPin.value = PINES_DEMO_POR_CUENTA[o];
      }
      sincronizarDesdeSelectores();
    });

    selectDestino.addEventListener('change', sincronizarDesdeSelectores);
    inputMonto.addEventListener('input', actualizarResumenesEnVivo);

    formTransferencia.addEventListener('submit', function (ev) {
      ev.preventDefault();
      procesarFormulario(false);
    });

    if (btnReiniciar) {
      btnReiniciar.addEventListener('click', reiniciarSimulacionCompleta);
    }

    if (toggleComisiones) {
      toggleComisiones.addEventListener('change', function () {
        controladorCanvas.fijarMostrarComisiones(toggleComisiones.checked);
      });
    }

    if (btnTema) {
      btnTema.addEventListener('click', function () {
        const actual = document.documentElement.getAttribute('data-theme');
        fijarTema(actual === 'dark' ? 'light' : 'dark');
      });
    }

    // Arranque inicial de la aplicación
    const estadoArranque = simulador.obtenerEstado();
    actualizarOpcionesSelectores(estadoArranque, false);
    inputPin.value = '1234';
    controladorCanvas.actualizarCuentas(estadoArranque.cuentas);
    controladorCanvas.fijarSeleccionExterna(0, 4);
    actualizarResumenesEnVivo();
    dashboardUI.actualizarPanelGeneral(estadoArranque);

    // Registro inicial en bitácoras
    terminalStepper.registrarEventoSistema(
      'Motor transaccional inicializado. 5 cuentas conectadas. Invariante verificado en $78.500.000.'
    );
    terminalAuditoria.registrarEventoSistema(
      'Motor transaccional inicializado. 5 cuentas conectadas. Invariante verificado en $78.500.000.'
    );
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', iniciarAplicacion);
    } else {
      iniciarAplicacion();
    }
  }
});
