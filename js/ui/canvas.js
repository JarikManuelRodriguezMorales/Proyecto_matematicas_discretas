/**
 * @file canvas.js
 * @description Renderizador e interacción en HTML5 Canvas 2D para el mapa de la red de pagos.
 * Diseñado con estética moderna de billetera digital: avatares limpios, tarjetas opacas bajo
 * cada nodo sin superposición vertical ni con las líneas de conexión, etiquetas de comisión
 * claras y animación fluida de la transferencia a 60 fps.
 */
(function (root, factory) {
  'use strict';
  const namespace = (root.PayGraph = root.PayGraph || {});
  namespace.CanvasGrafo = factory(namespace.Datos, namespace.Grafo);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Datos, Grafo) {
  'use strict';

  const RADIO_NODO_BASE = 20;
  const RADIO_HIT_MINIMO = 28;

  // Disposición espacial amplia para que las tarjetas nunca se toquen ni en escritorio ni en móvil
  const COORDENADAS_ARMONICAS = Object.freeze([
    Object.freeze({ x: 0.08, y: 0.14 }), // v0: Usuario A (Arriba izquierda)
    Object.freeze({ x: 0.50, y: 0.46 }), // v1: Banco Alfa (Centro)
    Object.freeze({ x: 0.92, y: 0.14 }), // v2: Usuario B (Arriba derecha)
    Object.freeze({ x: 0.92, y: 0.78 }), // v3: Banco Beta (Abajo derecha)
    Object.freeze({ x: 0.08, y: 0.78 })  // v4: Usuario C (Abajo izquierda)
  ]);

  function leerTokenCSS(nombreVariable, valorPorDefecto) {
    if (typeof window === 'undefined' || !document.documentElement) {
      return valorPorDefecto;
    }
    const valor = getComputedStyle(document.documentElement)
      .getPropertyValue(nombreVariable)
      .trim();
    return valor || valorPorDefecto;
  }

  function dibujarRectanguloRedondeado(ctx, x, y, w, h, r) {
    const radio = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radio, y);
    ctx.lineTo(x + w - radio, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radio);
    ctx.lineTo(x + w, y + h - radio);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radio, y + h);
    ctx.lineTo(x + radio, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radio);
    ctx.lineTo(x, y + radio);
    ctx.quadraticCurveTo(x, y, x + radio, y);
    ctx.closePath();
  }

  function distanciaPuntoASegmento(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const longitudCuadrada = dx * dx + dy * dy;
    if (longitudCuadrada === 0) {
      return Math.hypot(px - x1, py - y1);
    }
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / longitudCuadrada));
    const proyX = x1 + t * dx;
    const proyY = y1 + t * dy;
    return Math.hypot(px - proyX, py - proyY);
  }

  function crearControladorCanvas(canvas, callbacks) {
    const ctx = canvas.getContext('2d');
    const cbs = callbacks || {};

    let cuentas = Datos.CUENTAS_SEMILLA.map(function (c) {
      return {
        id: c.id,
        codigo: c.codigo,
        nombre: c.nombre,
        tipo: c.tipo,
        saldo: c.saldoInicial
      };
    });

    const aristas = [];
    for (let u = 0; u < Datos.MATRIZ_ADYACENCIA.length; u += 1) {
      for (let v = u + 1; v < Datos.MATRIZ_ADYACENCIA[u].length; v += 1) {
        const peso = Datos.MATRIZ_ADYACENCIA[u][v];
        if (Number.isFinite(peso) && peso > 0) {
          aristas.push({ u: u, v: v, peso: peso });
        }
      }
    }

    let nodoOrigen = 0;
    let nodoDestino = 4;
    let faseSeleccion = 2;
    let nodoHover = -1;
    let nodoFocoTeclado = 0;
    let aristaHover = null;
    let mostrarTodasLasComisiones = false;

    let rutaDestacada = [0, 1, 4];
    let estadoRuta = 'preview';
    let animacionActiva = null;
    let velocidadReproduccion = 1.0;

    function obtenerDimensionesCSS() {
      const rect = canvas.getBoundingClientRect();
      return {
        ancho: Math.max(260, rect.width || 640),
        alto: Math.max(210, rect.height || 260)
      };
    }

    function obtenerCoordenadasNodo(indice, ancho, alto) {
      const base = COORDENADAS_ARMONICAS[indice] || { x: 0.5, y: 0.5 };
      const padX = ancho < 420 ? 36 : 56;
      const padTop = 24;
      const padBottom = 48;
      const areaAncho = Math.max(120, ancho - padX * 2);
      const areaAlto = Math.max(90, alto - padTop - padBottom);
      return {
        x: padX + base.x * areaAncho,
        y: padTop + base.y * areaAlto
      };
    }

    function redimensionar() {
      const dim = obtenerDimensionesCSS();
      const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
      canvas.width = Math.round(dim.ancho * dpr);
      canvas.height = Math.round(dim.alto * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dibujar();
    }

    function esAristaEnRuta(u, v, ruta) {
      if (!Array.isArray(ruta) || ruta.length < 2) {
        return false;
      }
      for (let i = 0; i < ruta.length - 1; i += 1) {
        const a = ruta[i];
        const b = ruta[i + 1];
        if ((a === u && b === v) || (a === v && b === u)) {
          return true;
        }
      }
      return false;
    }

    function recalcularVistaPreviaRuta() {
      if (nodoOrigen !== -1 && nodoDestino !== -1 && nodoOrigen !== nodoDestino) {
        const resultado = Grafo.dijkstra(Datos.MATRIZ_ADYACENCIA, nodoOrigen, nodoDestino);
        rutaDestacada = resultado.ruta;
        estadoRuta = 'preview';
      } else {
        rutaDestacada = [];
        estadoRuta = 'idle';
      }
    }

    function dibujarPastillaTexto(texto, cx, cy, bgColor, textColor, borderColor, font) {
      ctx.save();
      ctx.font = font || '700 10px "JetBrains Mono", monospace';
      const padX = 7;
      const altoCaja = 18;
      const anchoTexto = ctx.measureText(texto).width;
      const anchoCaja = anchoTexto + padX * 2;

      dibujarRectanguloRedondeado(
        ctx,
        cx - anchoCaja / 2,
        cy - altoCaja / 2,
        anchoCaja,
        altoCaja,
        9
      );
      ctx.fillStyle = bgColor;
      ctx.fill();
      if (borderColor) {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(texto, cx, cy + 0.5);
      ctx.restore();
    }

    function dibujar() {
      const dim = obtenerDimensionesCSS();
      const ancho = dim.ancho;
      const alto = dim.alto;
      const esMovil = ancho < 420;
      const radioNodo = esMovil ? 17 : RADIO_NODO_BASE;

      ctx.clearRect(0, 0, ancho, alto);

      const colorSuperficie = leerTokenCSS('--pg-bg-surface', '#ffffff');
      const colorElevado = leerTokenCSS('--pg-bg-elevated', '#f1f5f9');
      const colorTexto = leerTokenCSS('--pg-text-primary', '#0f172a');
      const colorMuted = leerTokenCSS('--pg-text-muted', '#475569');
      const colorBorde = leerTokenCSS('--pg-border-subtle', '#e2e8f0');
      const colorAristaBase = leerTokenCSS('--pg-canvas-edge', '#cbd5e1');
      const colorPrimario = leerTokenCSS('--pg-accent-primary', '#4f46e5');
      const colorDestino = leerTokenCSS('--pg-accent-secondary', '#7c3aed');
      const colorBanco = leerTokenCSS('--pg-accent-bank', '#0d9488');
      const colorExito = leerTokenCSS('--pg-status-success', '#10b981');
      const colorPeligro = leerTokenCSS('--pg-status-danger', '#ef4444');
      const colorAdvertencia = leerTokenCSS('--pg-status-warning', '#f59e0b');

      const posiciones = cuentas.map(function (c) {
        return obtenerCoordenadasNodo(c.id, ancho, alto);
      });

      // 1. Dibujar líneas de conexión (aristas)
      aristas.forEach(function (arista) {
        const pU = posiciones[arista.u];
        const pV = posiciones[arista.v];
        const enRuta = esAristaEnRuta(arista.u, arista.v, rutaDestacada);
        const esHover =
          aristaHover && aristaHover.u === arista.u && aristaHover.v === arista.v;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pU.x, pU.y);
        ctx.lineTo(pV.x, pV.y);

        if (enRuta) {
          if (estadoRuta === 'success') {
            ctx.strokeStyle = colorExito;
          } else if (estadoRuta === 'rejected') {
            ctx.strokeStyle = colorPeligro;
          } else {
            ctx.strokeStyle = colorExito;
          }
          ctx.lineWidth = esMovil ? 2.5 : 3.2;
          if (estadoRuta === 'preview') {
            ctx.setLineDash([7, 5]);
          }
        } else if (esHover) {
          ctx.strokeStyle = colorPrimario;
          ctx.lineWidth = 2.4;
        } else {
          ctx.strokeStyle = colorAristaBase;
          ctx.lineWidth = 1.5;
        }

        ctx.stroke();
        ctx.restore();

        // Pastilla de comisión sobre la arista
        if (mostrarTodasLasComisiones || enRuta || esHover) {
          const tPos = (arista.u === 0 && arista.v === 4) || (arista.u === 2 && arista.v === 3) ? 0.5 : 0.46;
          const mx = pU.x + (pV.x - pU.x) * tPos;
          const my = pU.y + (pV.y - pU.y) * tPos;
          const textoPeso = '$' + arista.peso.toLocaleString('es-CO');
          const bgPastilla = enRuta
            ? estadoRuta === 'rejected'
              ? colorPeligro
              : colorExito
            : colorSuperficie;
          const txtPastilla = enRuta ? '#ffffff' : colorTexto;
          const bordePastilla = enRuta ? null : colorBorde;

          dibujarPastillaTexto(
            textoPeso,
            mx,
            my,
            bgPastilla,
            txtPastilla,
            bordePastilla,
            '700 10px "JetBrains Mono", monospace'
          );
        }
      });

      // 2. Partícula luminosa animada durante la transferencia
      if (animacionActiva && Array.isArray(animacionActiva.ruta) && animacionActiva.ruta.length >= 2) {
        const rutaAnim = animacionActiva.ruta;
        const totalSegmentos = rutaAnim.length - 1;
        const progresoGlobal = Math.max(0, Math.min(0.9999, animacionActiva.progreso));
        const segFloat = progresoGlobal * totalSegmentos;
        const segIdx = Math.floor(segFloat);
        const tLocal = segFloat - segIdx;

        const pInicio = posiciones[rutaAnim[segIdx]];
        const pFin = posiciones[rutaAnim[segIdx + 1]];
        const px = pInicio.x + (pFin.x - pInicio.x) * tLocal;
        const py = pInicio.y + (pFin.y - pInicio.y) * tLocal;

        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, 12, 0, Math.PI * 2);
        ctx.fillStyle = animacionActiva.aprobada
          ? 'rgba(16, 185, 129, 0.25)'
          : 'rgba(239, 68, 68, 0.25)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fillStyle = animacionActiva.aprobada ? colorExito : colorPeligro;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.restore();
      }

      // 3. Dibujar los 5 nodos y sus tarjetas opacas debajo
      cuentas.forEach(function (cuenta, idx) {
        const pos = posiciones[idx];
        const esOrigen = idx === nodoOrigen;
        const esDestino = idx === nodoDestino;
        const esIntermedioRuta =
          !esOrigen && !esDestino && Array.isArray(rutaDestacada) && rutaDestacada.indexOf(idx) !== -1;
        const esHover = idx === nodoHover;
        const esFoco = document.activeElement === canvas && idx === nodoFocoTeclado;

        let colorAcentoNodo = cuenta.tipo === 'banco' ? colorBanco : colorBorde;
        if (esOrigen) {
          colorAcentoNodo = colorPrimario;
        } else if (esDestino) {
          colorAcentoNodo = colorDestino;
        } else if (esIntermedioRuta) {
          colorAcentoNodo = colorBanco;
        }

        ctx.save();

        // Halo exterior para nodos activos
        if (esOrigen || esDestino || esIntermedioRuta || esHover || esFoco) {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, radioNodo + 5, 0, Math.PI * 2);
          ctx.fillStyle = esOrigen
            ? 'rgba(79, 70, 229, 0.14)'
            : esDestino
            ? 'rgba(124, 58, 237, 0.14)'
            : 'rgba(13, 148, 136, 0.14)';
          ctx.fill();
        }

        // Círculo avatar del nodo
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radioNodo, 0, Math.PI * 2);
        ctx.fillStyle = colorSuperficie;
        ctx.fill();
        ctx.lineWidth = esOrigen || esDestino || esIntermedioRuta ? 2.8 : 2;
        ctx.strokeStyle = colorAcentoNodo;
        ctx.stroke();

        // Código dentro del círculo (v0..v4)
        ctx.fillStyle = colorTexto;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = (esMovil ? '800 10px' : '800 11px') + ' "Plus Jakarta Sans", sans-serif';
        ctx.fillText(cuenta.codigo.toUpperCase(), pos.x, pos.y);

        // Insignia de rol en la esquina superior derecha del círculo (sin chocar con nodos vecinos)
        if (esOrigen || esDestino || esIntermedioRuta) {
          const textoRol = esOrigen ? 'ENVÍA' : esDestino ? 'RECIBE' : 'PUENTE';
          const colorRol = esOrigen
            ? colorPrimario
            : esDestino
            ? colorDestino
            : colorBanco;
          dibujarPastillaTexto(
            textoRol,
            pos.x + (esMovil ? 24 : 30),
            pos.y - (esMovil ? 14 : 16),
            colorRol,
            '#ffffff',
            '#ffffff',
            '800 8.5px "Plus Jakarta Sans", sans-serif'
          );
        }

        // Tarjeta opaca bajo el círculo con Nombre y Saldo (evita que las líneas tachen el texto)
        const textoNombre = cuenta.nombre;
        const textoSaldo = Datos.formatearMonedaCOP(cuenta.saldo);

        ctx.font = (esMovil ? '700 10px' : '700 11px') + ' "Plus Jakarta Sans", sans-serif';
        const wNombre = ctx.measureText(textoNombre).width;
        ctx.font = (esMovil ? '600 9.5px' : '600 10.5px') + ' "JetBrains Mono", monospace';
        const wSaldo = ctx.measureText(textoSaldo).width;

        const wTarjeta = Math.max(wNombre, wSaldo) + (esMovil ? 14 : 18);
        const hTarjeta = esMovil ? 32 : 35;
        const xTarjeta = pos.x - wTarjeta / 2;
        const yTarjeta = pos.y + radioNodo + 4;

        dibujarRectanguloRedondeado(ctx, xTarjeta, yTarjeta, wTarjeta, hTarjeta, 9);
        ctx.fillStyle = colorSuperficie;
        ctx.fill();
        ctx.lineWidth = esOrigen || esDestino ? 1.5 : 1;
        ctx.strokeStyle = esOrigen || esDestino ? colorAcentoNodo : colorBorde;
        ctx.stroke();

        ctx.fillStyle = colorTexto;
        ctx.font = (esMovil ? '700 10px' : '700 11px') + ' "Plus Jakarta Sans", sans-serif';
        ctx.fillText(textoNombre, pos.x, yTarjeta + (esMovil ? 10 : 11));

        ctx.fillStyle = esOrigen ? colorPrimario : esDestino ? colorDestino : colorMuted;
        ctx.font = (esMovil ? '700 9.5px' : '700 10.5px') + ' "JetBrains Mono", monospace';
        ctx.fillText(textoSaldo, pos.x, yTarjeta + (esMovil ? 22 : 24));

        // Pulso de saldo al aprobarse una transferencia
        if (
          animacionActiva &&
          animacionActiva.aprobada &&
          animacionActiva.progreso > 0.72 &&
          (esOrigen || esDestino)
        ) {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, radioNodo + 9, 0, Math.PI * 2);
          ctx.strokeStyle = esDestino ? colorExito : colorAdvertencia;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        ctx.restore();
      });
    }

    function detectarNodoEnPunto(x, y) {
      const dim = obtenerDimensionesCSS();
      for (let i = 0; i < cuentas.length; i += 1) {
        const p = obtenerCoordenadasNodo(i, dim.ancho, dim.alto);
        if (Math.hypot(x - p.x, y - p.y) <= RADIO_HIT_MINIMO) {
          return i;
        }
        if (Math.abs(x - p.x) <= 46 && y >= p.y && y <= p.y + 58) {
          return i;
        }
      }
      return -1;
    }

    function detectarAristaEnPunto(x, y) {
      const dim = obtenerDimensionesCSS();
      for (let i = 0; i < aristas.length; i += 1) {
        const a = aristas[i];
        const pU = obtenerCoordenadasNodo(a.u, dim.ancho, dim.alto);
        const pV = obtenerCoordenadasNodo(a.v, dim.ancho, dim.alto);
        const dist = distanciaPuntoASegmento(x, y, pU.x, pU.y, pV.x, pV.y);
        if (dist <= 9) {
          return a;
        }
      }
      return null;
    }

    function gestionarClicEnNodo(indiceNodo) {
      if (indiceNodo < 0 || indiceNodo >= cuentas.length) {
        return;
      }

      if (faseSeleccion === 0 || faseSeleccion === 2) {
        nodoOrigen = indiceNodo;
        nodoDestino = -1;
        faseSeleccion = 1;
      } else if (faseSeleccion === 1) {
        if (indiceNodo === nodoOrigen) {
          nodoOrigen = -1;
          nodoDestino = -1;
          faseSeleccion = 0;
        } else {
          nodoDestino = indiceNodo;
          faseSeleccion = 2;
        }
      }

      recalcularVistaPreviaRuta();
      dibujar();

      if (typeof cbs.alCambiarSeleccion === 'function') {
        cbs.alCambiarSeleccion({
          origen: nodoOrigen,
          destino: nodoDestino,
          faseSeleccion: faseSeleccion
        });
      }
    }

    canvas.addEventListener('mousemove', function (evento) {
      const rect = canvas.getBoundingClientRect();
      const x = evento.clientX - rect.left;
      const y = evento.clientY - rect.top;

      const nuevoNodoHover = detectarNodoEnPunto(x, y);
      const nuevaAristaHover = nuevoNodoHover === -1 ? detectarAristaEnPunto(x, y) : null;

      if (nuevoNodoHover !== nodoHover || nuevaAristaHover !== aristaHover) {
        nodoHover = nuevoNodoHover;
        aristaHover = nuevaAristaHover;
        canvas.style.cursor = nuevoNodoHover !== -1 ? 'pointer' : 'default';
        dibujar();
      }
    });

    canvas.addEventListener('mouseleave', function () {
      nodoHover = -1;
      aristaHover = null;
      dibujar();
    });

    canvas.addEventListener('click', function (evento) {
      const rect = canvas.getBoundingClientRect();
      const x = evento.clientX - rect.left;
      const y = evento.clientY - rect.top;
      const idx = detectarNodoEnPunto(x, y);
      if (idx !== -1) {
        nodoFocoTeclado = idx;
        gestionarClicEnNodo(idx);
      }
    });

    canvas.addEventListener('keydown', function (evento) {
      if (evento.key === 'ArrowRight' || evento.key === 'ArrowDown') {
        evento.preventDefault();
        nodoFocoTeclado = (nodoFocoTeclado + 1) % cuentas.length;
        dibujar();
      } else if (evento.key === 'ArrowLeft' || evento.key === 'ArrowUp') {
        evento.preventDefault();
        nodoFocoTeclado = (nodoFocoTeclado - 1 + cuentas.length) % cuentas.length;
        dibujar();
      } else if (evento.key === 'Enter' || evento.key === ' ') {
        evento.preventDefault();
        gestionarClicEnNodo(nodoFocoTeclado);
      }
    });

    canvas.addEventListener('focus', dibujar);
    canvas.addEventListener('blur', dibujar);

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', redimensionar);
    }

    function animarResultadoTransferencia(registroTx, alTerminar) {
      cuentas = registroTx.estado.cuentas;
      nodoOrigen = registroTx.origen;
      nodoDestino = registroTx.destino;
      faseSeleccion = 2;
      rutaDestacada = registroTx.ruta;
      estadoRuta = registroTx.aprobada ? 'success' : 'rejected';

      const reducirMovimiento =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (reducirMovimiento || !Array.isArray(registroTx.ruta) || registroTx.ruta.length < 2) {
        animacionActiva = null;
        dibujar();
        if (typeof alTerminar === 'function') {
          alTerminar();
        }
        return;
      }

      const duracionMs = Math.max(240, Math.round(780 / velocidadReproduccion));
      const inicio = performance.now();

      animacionActiva = {
        ruta: registroTx.ruta,
        aprobada: registroTx.aprobada,
        progreso: 0
      };

      function frame(ahora) {
        if (!animacionActiva) {
          return;
        }
        const transcurrido = ahora - inicio;
        const p = Math.min(1, transcurrido / duracionMs);
        animacionActiva.progreso = p;
        dibujar();

        if (p < 1) {
          requestAnimationFrame(frame);
        } else {
          animacionActiva = null;
          dibujar();
          if (typeof alTerminar === 'function') {
            alTerminar();
          }
        }
      }

      requestAnimationFrame(frame);
    }

    return Object.freeze({
      redimensionar: redimensionar,
      redibujar: dibujar,
      actualizarCuentas: function (nuevasCuentas) {
        cuentas = nuevasCuentas;
        dibujar();
      },
      fijarSeleccionExterna: function (origenIdx, destinoIdx) {
        nodoOrigen = typeof origenIdx === 'number' ? origenIdx : -1;
        nodoDestino = typeof destinoIdx === 'number' ? destinoIdx : -1;
        if (nodoOrigen !== -1 && nodoDestino !== -1) {
          faseSeleccion = 2;
        } else if (nodoOrigen !== -1) {
          faseSeleccion = 1;
        } else {
          faseSeleccion = 0;
        }
        recalcularVistaPreviaRuta();
        dibujar();
      },
      fijarMostrarComisiones: function (mostrar) {
        mostrarTodasLasComisiones = Boolean(mostrar);
        dibujar();
      },
      fijarVelocidad: function (multiplicador) {
        if (typeof multiplicador === 'number' && multiplicador > 0) {
          velocidadReproduccion = multiplicador;
        }
      },
      animarResultadoTransferencia: animarResultadoTransferencia
    });
  }

  return Object.freeze({
    crearControladorCanvas: crearControladorCanvas
  });
});
