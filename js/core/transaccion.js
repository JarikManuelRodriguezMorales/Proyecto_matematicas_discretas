/**
 * @file transaccion.js
 * @description Orquestador del pipeline de transferencias y gestión del estado en memoria.
 * Ejecuta en orden estricto los 7 pasos del pipeline, conserva el invariante monetario
 * (Σ saldos + comisionesAcumuladas = constante) y genera las trazas paso a paso sin
 * exponer nunca el PIN en texto plano en los registros.
 */
(function (root, factory) {
  'use strict';
  const namespace = (root.PayGraph = root.PayGraph || {});
  const datos =
    namespace.Datos ||
    (typeof require === 'function' ? require('./datos.js') : null);
  const rsa =
    namespace.Rsa ||
    (typeof require === 'function' ? require('./rsa.js') : null);
  const grafo =
    namespace.Grafo ||
    (typeof require === 'function' ? require('./grafo.js') : null);
  const reglas =
    namespace.Reglas ||
    (typeof require === 'function' ? require('./reglas.js') : null);

  const modulo = factory(datos, rsa, grafo, reglas);
  namespace.Transaccion = modulo;
  if (typeof module === 'object' && module.exports) {
    module.exports = modulo;
  }
})(
  typeof globalThis !== 'undefined' ? globalThis : this,
  function (Datos, Rsa, Grafo, Reglas) {
    'use strict';

    /**
     * Obtiene una marca de tiempo de alta resolución en milisegundos.
     * Fórmula: t \in \mathbb{R}_{\ge 0} (ms).
     *
     * @returns {number} Marca de tiempo actual en ms.
     */
    function obtenerTiempoMs() {
      if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        return performance.now();
      }
      return Date.now();
    }

    /**
     * Paso 1 del pipeline: valida y normaliza las entradas de una transferencia.
     * Esto NO hace parte de la regla F(T); los errores de validación se muestran junto
     * al campo correspondiente y detienen la ejecución antes de invocar el modelo matemático.
     * Reglas:
     *   - origen ∈ {0..4}, destino ∈ {0..4}, origen ≠ destino
     *   - monto entero seguro positivo (≥ 1 COP, sin decimales)
     *   - pin cadena de exactamente 4 dígitos (/^\d{4}$/)
     *
     * @param {{ origen: any, destino: any, monto: any, pin: any }} entradaCruda
     * @returns {{
     *   esValido: boolean,
     *   erroresPorCampo: { origen: string|null, destino: string|null, monto: string|null, pin: string|null },
     *   mensajesError: Array<string>,
     *   datosNormalizados: { origen: number, destino: number, monto: number, pin: string }|null
     * }}
     */
    function validarEntradaTransferencia(entradaCruda) {
      const entrada = entradaCruda || {};
      const numCuentas = Datos.CUENTAS_SEMILLA.length;
      const erroresPorCampo = {
        origen: null,
        destino: null,
        monto: null,
        pin: null
      };
      const mensajesError = [];

      const origenNum =
        typeof entrada.origen === 'number'
          ? entrada.origen
          : typeof entrada.origen === 'string' && entrada.origen.trim() !== ''
            ? Number(entrada.origen)
            : NaN;

      const destinoNum =
        typeof entrada.destino === 'number'
          ? entrada.destino
          : typeof entrada.destino === 'string' && entrada.destino.trim() !== ''
            ? Number(entrada.destino)
            : NaN;

      if (!Number.isInteger(origenNum) || origenNum < 0 || origenNum >= numCuentas) {
        erroresPorCampo.origen = 'Selecciona una cuenta de origen válida (v0 a v4).';
        mensajesError.push(erroresPorCampo.origen);
      }

      if (!Number.isInteger(destinoNum) || destinoNum < 0 || destinoNum >= numCuentas) {
        erroresPorCampo.destino = 'Selecciona una cuenta de destino válida (v0 a v4).';
        mensajesError.push(erroresPorCampo.destino);
      }

      if (
        erroresPorCampo.origen === null &&
        erroresPorCampo.destino === null &&
        origenNum === destinoNum
      ) {
        erroresPorCampo.destino = 'La cuenta de destino debe ser distinta a la cuenta de origen.';
        mensajesError.push(erroresPorCampo.destino);
      }

      // Validación estricta del monto entero positivo en COP
      let montoNum = NaN;
      if (typeof entrada.monto === 'number') {
        montoNum = entrada.monto;
      } else if (typeof entrada.monto === 'string') {
        const limpio = entrada.monto.trim();
        if (/^\d+$/.test(limpio)) {
          montoNum = Number(limpio);
        }
      }

      if (
        !Number.isSafeInteger(montoNum) ||
        montoNum < Datos.LIMITES_MONTO.minimo ||
        montoNum > Datos.LIMITES_MONTO.maximo
      ) {
        erroresPorCampo.monto = 'Ingresa un monto entero positivo en COP (mínimo $1, sin decimales).';
        mensajesError.push(erroresPorCampo.monto);
      }

      // Validación estricta del PIN como cadena de 4 dígitos
      const pinCadena = typeof entrada.pin === 'string' ? entrada.pin : '';
      if (!Rsa.esPinFormatoValido(pinCadena)) {
        erroresPorCampo.pin = 'Ingresa un PIN de exactamente 4 dígitos numéricos (0000 a 9999).';
        mensajesError.push(erroresPorCampo.pin);
      }

      const esValido = mensajesError.length === 0;
      return {
        esValido: esValido,
        erroresPorCampo: erroresPorCampo,
        mensajesError: mensajesError,
        datosNormalizados: esValido
          ? {
              origen: origenNum,
              destino: destinoNum,
              monto: montoNum,
              pin: pinCadena
            }
          : null
      };
    }

    /**
     * Construye las tarjetas de pasos individuales para la reproducción interactiva
     * en el panel técnico (pestañas RSA, Grafo, Lógica e IA) y las líneas de la Terminal.
     * Garantía de privacidad: jamás incluye el PIN en texto plano en las cadenas generadas.
     *
     * @param {Object} contexto - Datos calculados durante el pipeline.
     * @returns {{ pasosRSA: Array<Object>, pasosGrafo: Array<Object>, pasosLogicaIA: Array<Object>, lineasTerminal: Array<string> }}
     */
    function construirTrazasDidacticas(contexto) {
      const cOrigen = contexto.cuentaOrigen;
      const cDestino = contexto.cuentaDestino;
      const cifrado = contexto.cifradoCliente;
      const rutaInfo = contexto.rutaDijkstra;
      const verifServidor = contexto.verificacionServidor;
      const evalReglas = contexto.evaluacionReglas;
      const montoTexto = Datos.formatearMonedaCOP(contexto.monto);
      const comisionTexto = Datos.formatearMonedaCOP(rutaInfo.costoTotal);
      const totalTexto = Datos.formatearMonedaCOP(evalReglas.totalRequerido);

      const etiquetasRuta = rutaInfo.ruta.map(function (idx) {
        const nodo = Datos.CUENTAS_SEMILLA[idx];
        return nodo.codigo + ' (' + nodo.nombre + ')';
      });

      const pasosRSA = [
        {
          paso: 1,
          titulo: 'Partición del PIN en 2 bloques de 2 dígitos',
          formula: 'PIN = d₁d₂d₃d₄ → [m₁, m₂] ∈ [0, 99]² (con mᵢ < n = 3233)',
          detalle:
            'El cliente divide los 4 dígitos en dos bloques enteros menores que n=3233 para evitar colisiones modulares. Bloques enmascarados: [••, ••].',
          bloquesDescifradosDemo: cifrado.bloquesDemostracion
        },
        {
          paso: 2,
          titulo: 'Cifrado modular en el cliente con clave pública (e = 17, n = 3233)',
          formula: 'cᵢ = mᵢ¹⁷ mod 3233',
          detalle:
            'Potenciación rápida (17 = 10001₂) produce el token cifrado ' +
            cifrado.tokenFormateado +
            ' que viaja por la red.',
          bloquesCifrados: cifrado.bloquesCifrados
        },
        {
          paso: 3,
          titulo: 'Descifrado y verificación en servidor simulado (clausura con d = 2753)',
          formula: 'mᵢ = cᵢ²⁷⁵³ mod 3233  ⇒  B = (PIN_reconstruido == PIN_registrado)',
          detalle:
            'El servidor descifra ' +
            cifrado.tokenFormateado +
            ' con su clave privada d=2753 y compara con la cuenta ' +
            cOrigen.codigo +
            ': resultado B = ' +
            (verifServidor.pinValido ? '1 (coincide)' : '0 (no coincide)') +
            '.',
          bloquesDescifradosDemo: verifServidor.bloquesDescifradosDemo,
          coincide: verifServidor.pinValido
        }
      ];

      const pasosGrafo = rutaInfo.iteraciones.map(function (iter) {
        const nodoInfo = Datos.CUENTAS_SEMILLA[iter.nodoFijado];
        const vectorTexto = iter.distancias
          .map(function (d, idx) {
            return 'v' + idx + ':' + (Number.isFinite(d) ? '$' + Datos.formatearNumeroCOP(d) : '∞');
          })
          .join(' · ');

        return {
          paso: iter.paso,
          titulo:
            'Iteración ' +
            iter.paso +
            ': fijar nodo ' +
            nodoInfo.codigo +
            ' (' +
            nodoInfo.nombre +
            ') con costo acumulado ' +
            Datos.formatearMonedaCOP(iter.costoFijado),
          formula: 'dist[v] = min(dist[v], dist[' + nodoInfo.codigo + '] + M[' + nodoInfo.codigo + '][v])',
          detalle: 'Vector de costos mínimos tentativos: [' + vectorTexto + ']',
          iteracionDatos: iter
        };
      });

      pasosGrafo.push({
        paso: pasosGrafo.length + 1,
        titulo: 'Reconstrucción de ruta óptima por predecesores',
        formula: 'W(P*) = Σ w(e) = ' + comisionTexto,
        detalle:
          'Camino óptimo: ' +
          etiquetasRuta.join(' → ') +
          '. Comisión total: ' +
          comisionTexto +
          (rutaInfo.ahorroFrenteADirecto > 0
            ? ' (ahorra ' +
              Datos.formatearMonedaCOP(rutaInfo.ahorroFrenteADirecto) +
              ' frente al enlace directo de ' +
              Datos.formatearMonedaCOP(rutaInfo.costoDirecto) +
              ').'
            : !Number.isFinite(rutaInfo.costoDirecto)
              ? ' (no existe canal directo entre ' + cOrigen.codigo + ' y ' + cDestino.codigo + ').'
              : ' (el canal directo ya es el óptimo).')
      });

      const pasosLogicaIA = [
        {
          paso: 1,
          titulo: 'Proposición A: Suficiencia de saldo en origen',
          formula: 'A ⇔ (saldo_origen ≥ monto + comisión)',
          detalle:
            'Saldo de ' +
            cOrigen.codigo +
            ': ' +
            Datos.formatearMonedaCOP(contexto.saldoOrigenAntes) +
            ' vs requerido ' +
            totalTexto +
            ' (' +
            montoTexto +
            ' + ' +
            comisionTexto +
            ') → A = ' +
            (evalReglas.A ? '1 (Verdadero)' : '0 (Falso)') +
            '.'
        },
        {
          paso: 2,
          titulo: 'Proposición B: Autenticación criptográfica RSA',
          formula: 'B ⇔ (PIN_descifrado == PIN_registrado)',
          detalle:
            'Token recibido ' +
            cifrado.tokenFormateado +
            ' comparado en el servidor simulado → B = ' +
            (evalReglas.B ? '1 (Verdadero)' : '0 (Falso)') +
            '.'
        },
        {
          paso: 3,
          titulo: 'Proposición C: Árbol de Decisión de un umbral (IA)',
          formula: 'C ⇔ (monto > $5.000.000 COP)',
          detalle:
            'Nodo raíz evalúa ' +
            montoTexto +
            ' > ' +
            Datos.formatearMonedaCOP(Datos.UMBRAL_FRAUDE_COP) +
            ' → Hoja clase ' +
            evalReglas.prediccionIA.clase +
            ' (' +
            evalReglas.prediccionIA.etiqueta +
            '), C = ' +
            (evalReglas.C ? '1 (Alerta activa)' : '0 (Normal)') +
            '.'
        },
        {
          paso: 4,
          titulo: 'Evaluación booleana F(T) y Ley de De Morgan',
          formula: 'F(T) = A ∧ B ∧ ¬C   |   ¬F(T) ≡ ¬A ∨ ¬B ∨ C',
          detalle:
            'Tupla (A, B, C) = (' +
            (evalReglas.A ? 1 : 0) +
            ', ' +
            (evalReglas.B ? 1 : 0) +
            ', ' +
            (evalReglas.C ? 1 : 0) +
            ') ⇒ F(T) = ' +
            (evalReglas.F ? '1 (APROBADA)' : '0 (RECHAZADA: ' + evalReglas.razonesRechazo.join(' ') + ')')
        }
      ];

      const lineasTerminal = [
        '[TX #' +
          contexto.idTransaccion +
          '] Solicitud: ' +
          cOrigen.codigo +
          ' (' +
          cOrigen.nombre +
          ') → ' +
          cDestino.codigo +
          ' (' +
          cDestino.nombre +
          ') por ' +
          montoTexto,
        '  1. Validación de entrada: OK (origen ≠ destino, monto entero seguro, PIN de 4 dígitos enmascarado ****).',
        '  2. Cliente RSA (e=17, n=3233): bloques [••, ••] → token cifrado ' + cifrado.tokenFormateado + '.',
        '  3. Grafo Dijkstra O(|V|²): ruta óptima ' +
          rutaInfo.ruta
            .map(function (n) {
              return 'v' + n;
            })
            .join('→') +
          ' con comisión mínima W = ' +
          comisionTexto +
          '.',
        '  4. Servidor simulado (d encapsulada): verificación de token ' +
          cifrado.tokenFormateado +
          ' → ' +
          (verifServidor.pinValido ? 'COINCIDE' : 'NO COINCIDE') +
          '.',
        '  5. Proposiciones sin cortocircuito: A=' +
          (evalReglas.A ? 1 : 0) +
          ' (saldo ' +
          Datos.formatearMonedaCOP(contexto.saldoOrigenAntes) +
          ' vs ' +
          totalTexto +
          '), B=' +
          (evalReglas.B ? 1 : 0) +
          ', C=' +
          (evalReglas.C ? 1 : 0) +
          ' (umbral > $5.000.000).',
        '  6. Regla F(T) = A ∧ B ∧ ¬C = ' +
          (evalReglas.A ? 1 : 0) +
          ' ∧ ' +
          (evalReglas.B ? 1 : 0) +
          ' ∧ ¬' +
          (evalReglas.C ? 1 : 0) +
          ' = ' +
          (evalReglas.F ? '1 (VERDADERA)' : '0 (FALSA)') +
          '.',
        evalReglas.F
          ? '  7. Liquidación APROBADA: ' +
            cOrigen.codigo +
            ' nuevo saldo ' +
            Datos.formatearMonedaCOP(contexto.saldoOrigenDespues) +
            ' | ' +
            cDestino.codigo +
            ' nuevo saldo ' +
            Datos.formatearMonedaCOP(contexto.saldoDestinoDespues) +
            ' | Comisiones acumuladas: ' +
            Datos.formatearMonedaCOP(contexto.comisionesAcumuladasDespues) +
            '.'
          : '  7. Transacción RECHAZADA (saldos sin cambios): ' + evalReglas.razonesRechazo.join(' | ')
      ];

      return {
        pasosRSA: pasosRSA,
        pasosGrafo: pasosGrafo,
        pasosLogicaIA: pasosLogicaIA,
        lineasTerminal: lineasTerminal
      };
    }

    /**
     * Crea un simulador de estado en memoria para ejecutar transferencias y verificar
     * el invariante de conservación monetaria.
     * Fórmula del invariante: \sum_{v \in V} \text{saldo}(v) + \text{comisionesAcumuladas} = M_0
     *
     * @param {Array<Object>} [cuentasBase=Datos.CUENTAS_SEMILLA] - Cuentas iniciales.
     * @returns {Object} API del simulador transaccional.
     */
    function crearSimulador(cuentasBase) {
      const plantillaCuentas = cuentasBase || Datos.CUENTAS_SEMILLA;
      const servidorSimulado = Rsa.crearServidorSimulado(plantillaCuentas);

      let masaMonetariaInicial = 0;
      for (let i = 0; i < plantillaCuentas.length; i += 1) {
        masaMonetariaInicial += plantillaCuentas[i].saldoInicial;
      }

      let cuentasEstado = [];
      let comisionesAcumuladas = 0;
      let contadorTx = 0;
      let historial = [];

      /**
       * Restaura los saldos en memoria y el acumulador de comisiones al estado semilla.
       *
       * @returns {Object} Instantánea del estado reiniciado.
       */
      function reiniciar() {
        cuentasEstado = plantillaCuentas.map(function (c) {
          return {
            id: c.id,
            codigo: c.codigo,
            nombre: c.nombre,
            tipo: c.tipo,
            saldoInicial: c.saldoInicial,
            saldo: c.saldoInicial,
            posX: c.posX,
            posY: c.posY
          };
        });
        comisionesAcumuladas = 0;
        contadorTx = 0;
        historial = [];
        return obtenerEstado();
      }

      /**
       * Retorna una copia inmutable del estado actual y verifica el invariante monetario.
       * Fórmula: \text{sumaSaldos} + \text{comisionesAcumuladas} == M_0
       *
       * @returns {{
       *   cuentas: Array<Object>,
       *   comisionesAcumuladas: number,
       *   sumaSaldos: number,
       *   masaMonetariaTotal: number,
       *   masaMonetariaInicial: number,
       *   invarianteCumplido: boolean,
       *   totalTransacciones: number,
       *   historial: Array<Object>
       * }}
       */
      function obtenerEstado() {
        let sumaSaldos = 0;
        const copiaCuentas = cuentasEstado.map(function (c) {
          sumaSaldos += c.saldo;
          return Object.assign({}, c);
        });
        const masaActual = sumaSaldos + comisionesAcumuladas;

        return {
          cuentas: copiaCuentas,
          comisionesAcumuladas: comisionesAcumuladas,
          sumaSaldos: sumaSaldos,
          masaMonetariaTotal: masaActual,
          masaMonetariaInicial: masaMonetariaInicial,
          invarianteCumplido: masaActual === masaMonetariaInicial,
          totalTransacciones: contadorTx,
          historial: historial.slice()
        };
      }

      /**
       * Ejecuta el pipeline completo de 7 pasos para una transferencia.
       * Fórmulas:
       *   Si F(T) = 1:
       *     saldo'[origen] = saldo[origen] - (monto + comision)
       *     saldo'[destino] = saldo[destino] + monto
       *     comisionesAcumuladas' = comisionesAcumuladas + comision
       *
       * @param {{ origen: number, destino: number, monto: number, pin: string }} solicitud
       * @returns {Object} Resultado detallado de la transferencia.
       */
      function ejecutarTransferencia(solicitud) {
        const tInicio = obtenerTiempoMs();

        // Paso 1: Validar entradas (no hace parte de F(T))
        const validacion = validarEntradaTransferencia(solicitud);
        if (!validacion.esValido) {
          const tFinVal = obtenerTiempoMs();
          return {
            validacionExitosa: false,
            aprobada: false,
            erroresPorCampo: validacion.erroresPorCampo,
            mensajesValidacion: validacion.mensajesError,
            tiempoCalculoMs: Number((tFinVal - tInicio).toFixed(3)),
            estado: obtenerEstado()
          };
        }

        const datos = validacion.datosNormalizados;
        const cuentaOrigen = cuentasEstado[datos.origen];
        const cuentaDestino = cuentasEstado[datos.destino];
        const saldoOrigenAntes = cuentaOrigen.saldo;
        const saldoDestinoAntes = cuentaDestino.saldo;

        // Paso 2: Cifrar el PIN en el cliente (2 bloques de 2 dígitos)
        const cifradoCliente = Rsa.cifrarPinPorBloques(datos.pin);

        // Paso 3: Calcular la ruta de comisión mínima con Dijkstra
        const rutaDijkstra = Grafo.dijkstra(
          Datos.MATRIZ_ADYACENCIA,
          datos.origen,
          datos.destino
        );
        const comision = rutaDijkstra.costoTotal;

        // Paso 4: Descifrar y comparar en el servidor simulado
        const verificacionServidor = servidorSimulado.verificarAutenticacionPin(
          datos.origen,
          cifradoCliente.bloquesCifrados
        );

        // Paso 5 y 6: Calcular A, B y C siempre los tres sin cortocircuito y evaluar F(T)
        const evaluacionReglas = Reglas.evaluarAutorizacionSinCortocircuito({
          saldoOrigen: saldoOrigenAntes,
          monto: datos.monto,
          comision: comision,
          pinValido: verificacionServidor.pinValido
        });

        // Paso 7: Liquidar o rechazar
        contadorTx += 1;
        if (evaluacionReglas.F) {
          cuentaOrigen.saldo -= datos.monto + comision;
          cuentaDestino.saldo += datos.monto;
          comisionesAcumuladas += comision;
        }

        const saldoOrigenDespues = cuentaOrigen.saldo;
        const saldoDestinoDespues = cuentaDestino.saldo;

        const trazas = construirTrazasDidacticas({
          idTransaccion: contadorTx,
          cuentaOrigen: cuentaOrigen,
          cuentaDestino: cuentaDestino,
          monto: datos.monto,
          saldoOrigenAntes: saldoOrigenAntes,
          saldoOrigenDespues: saldoOrigenDespues,
          saldoDestinoAntes: saldoDestinoAntes,
          saldoDestinoDespues: saldoDestinoDespues,
          comisionesAcumuladasDespues: comisionesAcumuladas,
          cifradoCliente: cifradoCliente,
          rutaDijkstra: rutaDijkstra,
          verificacionServidor: verificacionServidor,
          evaluacionReglas: evaluacionReglas
        });

        const tFin = obtenerTiempoMs();
        const tiempoCalculoMs = Number((tFin - tInicio).toFixed(3));
        const estadoActual = obtenerEstado();

        const registro = {
          idTransaccion: contadorTx,
          validacionExitosa: true,
          aprobada: evaluacionReglas.F,
          origen: datos.origen,
          destino: datos.destino,
          cuentaOrigenCodigo: cuentaOrigen.codigo,
          cuentaDestinoCodigo: cuentaDestino.codigo,
          cuentaOrigenNombre: cuentaOrigen.nombre,
          cuentaDestinoNombre: cuentaDestino.nombre,
          monto: datos.monto,
          comision: comision,
          totalDescontado: evaluacionReglas.F ? datos.monto + comision : 0,
          totalRequerido: evaluacionReglas.totalRequerido,
          ruta: rutaDijkstra.ruta,
          tramos: rutaDijkstra.tramos,
          iteracionesDijkstra: rutaDijkstra.iteraciones,
          costoDirecto: rutaDijkstra.costoDirecto,
          ahorroFrenteADirecto: rutaDijkstra.ahorroFrenteADirecto,
          bloquesCifrados: cifradoCliente.bloquesCifrados,
          tokenFormateado: cifradoCliente.tokenFormateado,
          bloquesDescifradosDemo: verificacionServidor.bloquesDescifradosDemo,
          trazaBloque1: cifradoCliente.trazaBloque1,
          trazaBloque2: cifradoCliente.trazaBloque2,
          proposiciones: {
            A: evaluacionReglas.A,
            B: evaluacionReglas.B,
            C: evaluacionReglas.C,
            F: evaluacionReglas.F
          },
          prediccionIA: evaluacionReglas.prediccionIA,
          razonesRechazo: evaluacionReglas.razonesRechazo,
          codigosRechazo: evaluacionReglas.codigosRechazo,
          saldosAntes: {
            origen: saldoOrigenAntes,
            destino: saldoDestinoAntes
          },
          saldosDespues: {
            origen: saldoOrigenDespues,
            destino: saldoDestinoDespues
          },
          trazas: trazas,
          tiempoCalculoMs: tiempoCalculoMs,
          estado: estadoActual
        };

        historial.push(registro);
        return registro;
      }

      reiniciar();

      return Object.freeze({
        reiniciar: reiniciar,
        obtenerEstado: obtenerEstado,
        ejecutarTransferencia: ejecutarTransferencia,
        validarEntrada: validarEntradaTransferencia
      });
    }

    return Object.freeze({
      validarEntradaTransferencia: validarEntradaTransferencia,
      crearSimulador: crearSimulador
    });
  }
);
