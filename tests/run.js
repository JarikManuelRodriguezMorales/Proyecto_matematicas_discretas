/**
 * @file run.js
 * @description Suite de pruebas automatizadas del núcleo matemático de PayGraph.
 * Usa exclusivamente el módulo nativo `assert` de Node.js (cero dependencias externas)
 * y verifica todos los vectores de prueba de la sección §7.
 */
'use strict';

const assert = require('node:assert/strict');
const Datos = require('../js/core/datos.js');
const Rsa = require('../js/core/rsa.js');
const Grafo = require('../js/core/grafo.js');
const Reglas = require('../js/core/reglas.js');
const Transaccion = require('../js/core/transaccion.js');

const resultados = [];

function registrarPrueba(categoria, nombre, fn) {
  const inicio = performance.now();
  try {
    const detalle = fn();
    const duracionMs = Number((performance.now() - inicio).toFixed(2));
    resultados.push({
      Categoria: categoria,
      Prueba: nombre,
      Estado: 'PASÓ',
      Detalle: detalle || 'OK',
      TiempoMs: duracionMs
    });
  } catch (error) {
    const duracionMs = Number((performance.now() - inicio).toFixed(2));
    resultados.push({
      Categoria: categoria,
      Prueba: nombre,
      Estado: 'FALLÓ',
      Detalle: error.message,
      TiempoMs: duracionMs
    });
    throw error;
  }
}

// ============================================================================
// 1. PRUEBAS DE ARITMÉTICA MODULAR Y RSA POR BLOQUES
// ============================================================================

registrarPrueba('RSA', 'Derivación de d = 2753 con Euclides extendido', function () {
  const euclides = Rsa.euclidesExtendido(17, 3120);
  assert.equal(euclides.mcd, 1);
  assert.equal(euclides.inversoPositivo, 2753);
  assert.equal((17 * 2753) % 3120, 1);
  return '17 * 2753 = 46801 = 15 * 3120 + 1';
});

const vectoresPinRSA = [
  { pin: '1234', bloques: [12, 34], cifrados: [1730, 180] },
  { pin: '1111', bloques: [11, 11], cifrados: [3061, 3061] },
  { pin: '2468', bloques: [24, 68], cifrados: [1639, 1759] },
  { pin: '1357', bloques: [13, 57], cifrados: [47, 1175] },
  { pin: '9753', bloques: [97, 53], cifrados: [1632, 1802] },
  { pin: '4096', bloques: [40, 96], cifrados: [642, 494] }
];

vectoresPinRSA.forEach(function (v) {
  registrarPrueba('RSA Vectores', 'PIN ' + v.pin + ' → [' + v.cifrados.join(', ') + ']', function () {
    const bloques = Rsa.dividirPinEnBloques(v.pin);
    assert.deepEqual(bloques, v.bloques);
    const cifrado = Rsa.cifrarPinPorBloques(v.pin);
    assert.deepEqual(cifrado.bloquesCifrados, v.cifrados);
    return '[' + bloques.join(', ') + '] → [' + cifrado.bloquesCifrados.join(', ') + ']';
  });
});

registrarPrueba('RSA Biyectividad', 'Ida y vuelta exacta para todo m en [0, 3232]', function () {
  const servidor = Rsa.crearServidorSimulado();
  for (let m = 0; m < Datos.RSA_PUBLICO.n; m += 1) {
    const c = Rsa.cifrarEntero(m);
    const recuperado = servidor.descifrarEntero(c);
    assert.equal(recuperado, m, 'Fallo en m = ' + m);
  }
  return '3.233 mensajes verificados (0..3232)';
});

registrarPrueba('RSA 10.000 PIN', 'Ida y vuelta de los 10.000 PIN (0000 a 9999) con ceros a la izquierda', function () {
  const servidor = Rsa.crearServidorSimulado();
  // Pre-calculamos el cifrado y descifrado de los 100 bloques posibles [00..99]
  const tablaCifrado = new Array(100);
  const tablaDescifrado = new Map();
  for (let b = 0; b < 100; b += 1) {
    const c = Rsa.cifrarEntero(b);
    tablaCifrado[b] = c;
    tablaDescifrado.set(c, servidor.descifrarEntero(c));
  }

  for (let i = 0; i < 10000; i += 1) {
    const pinOriginal = String(i).padStart(4, '0');
    const bloques = Rsa.dividirPinEnBloques(pinOriginal);
    const c0 = tablaCifrado[bloques[0]];
    const c1 = tablaCifrado[bloques[1]];
    const m0 = tablaDescifrado.get(c0);
    const m1 = tablaDescifrado.get(c1);
    const pinReconstruido = Rsa.reconstruirPinDesdeBloques([m0, m1]);
    assert.equal(pinReconstruido, pinOriginal, 'Fallo en PIN ' + pinOriginal);
  }
  return '10.000 PIN reconstruidos sin pérdida de ceros iniciales';
});

registrarPrueba('RSA Defecto sin bloques', 'Colisión de PIN único >= 3233 (3300 → 67 y 4000 → 767)', function () {
  const caso3300 = Rsa.demostrarDefectoPinSinBloques(3300);
  const caso4000 = Rsa.demostrarDefectoPinSinBloques(4000);
  assert.equal(caso3300.descifradoDefectuoso, 67);
  assert.equal(caso4000.descifradoDefectuoso, 767);
  return '3300 descifra como ' + caso3300.descifradoDefectuoso + '; 4000 descifra como ' + caso4000.descifradoDefectuoso;
});

registrarPrueba('RSA Puntos fijos y Clausura', '25 puntos fijos y clave d oculta en clausura', function () {
  const puntosFijos = Rsa.obtenerPuntosFijosRSA();
  assert.equal(puntosFijos.length, 25);
  assert.ok(puntosFijos.includes(0) && puntosFijos.includes(1));

  const servidor = Rsa.crearServidorSimulado();
  assert.equal(Datos.RSA_PUBLICO.d, undefined);
  assert.equal(Rsa.d, undefined);
  assert.equal(servidor.d, undefined);
  assert.equal(servidor.CLAVE_PRIVADA_D, undefined);
  return '25 puntos fijos; propiedad d inaccesible fuera de la clausura';
});

// ============================================================================
// 2. PRUEBAS DE TEORÍA DE GRAFOS (DIJKSTRA Y FLOYD-WARSHALL)
// ============================================================================

const matrizCostosEsperada = [
  [0, 300, 500, 700, 800],
  [300, 0, 200, 400, 500],
  [500, 200, 0, 300, 700],
  [700, 400, 300, 0, 600],
  [800, 500, 700, 600, 0]
];

registrarPrueba('Grafo Simetría y Matriz D', 'Simetría de M y coincidencia de D con Floyd-Warshall en los 25 pares', function () {
  assert.equal(Grafo.esMatrizSimetrica(Datos.MATRIZ_ADYACENCIA), true);
  const D_Dijkstra = Grafo.calcularMatrizCostosMinimos(Datos.MATRIZ_ADYACENCIA);
  const D_Floyd = Grafo.floydWarshall(Datos.MATRIZ_ADYACENCIA);
  assert.deepEqual(D_Dijkstra, matrizCostosEsperada);
  assert.deepEqual(D_Dijkstra, D_Floyd);
  return '25 pares (v_i, v_j) idénticos entre Dijkstra y Floyd-Warshall';
});

registrarPrueba('Grafo Rutas desde v0', 'Rutas óptimas v0→v2 (0→1→2, $500), v0→v3 (0→1→3, $700) y v0→v4 (0→1→4, $800)', function () {
  const r02 = Grafo.dijkstra(Datos.MATRIZ_ADYACENCIA, 0, 2);
  assert.deepEqual(r02.ruta, [0, 1, 2]);
  assert.equal(r02.costoTotal, 500);
  assert.equal(r02.costoDirecto, 800);

  const r03 = Grafo.dijkstra(Datos.MATRIZ_ADYACENCIA, 0, 3);
  assert.deepEqual(r03.ruta, [0, 1, 3]);
  assert.equal(r03.costoTotal, 700);
  assert.equal(r03.costoDirecto, Infinity);

  const r04 = Grafo.dijkstra(Datos.MATRIZ_ADYACENCIA, 0, 4);
  assert.deepEqual(r04.ruta, [0, 1, 4]);
  assert.equal(r04.costoTotal, 800);
  assert.equal(r04.costoDirecto, 1200);
  return 'v0→v2: $500 | v0→v3: $700 | v0→v4: $800';
});

registrarPrueba('Grafo Iteraciones v0', 'Evolución del vector dist desde v0 tras fijar cada nodo', function () {
  const res = Grafo.dijkstra(Datos.MATRIZ_ADYACENCIA, 0, 4);
  assert.equal(res.iteraciones.length, 5);
  assert.deepEqual(res.iteraciones[0].distancias, [0, 300, 800, Infinity, 1200]);
  assert.deepEqual(res.iteraciones[1].distancias, [0, 300, 500, 700, 800]);
  assert.deepEqual(res.iteraciones[2].distancias, [0, 300, 500, 700, 800]);
  assert.deepEqual(res.iteraciones[3].distancias, [0, 300, 500, 700, 800]);
  assert.deepEqual(res.iteraciones[4].distancias, [0, 300, 500, 700, 800]);
  return 'Iter 1: [0,300,800,∞,1200] → Iter 2..5: [0,300,500,700,800]';
});

registrarPrueba('Grafo Nodo inalcanzable', 'Soporte de Infinity y destino desconectado', function () {
  const matrizDesconectada = [
    [0, 100, Infinity],
    [100, 0, Infinity],
    [Infinity, Infinity, 0]
  ];
  const res = Grafo.dijkstra(matrizDesconectada, 0, 2);
  assert.equal(res.alcanzable, false);
  assert.equal(res.costoTotal, Infinity);
  assert.deepEqual(res.ruta, []);
  return 'alcanzable=false, costoTotal=Infinity, ruta=[]';
});

// ============================================================================
// 3. PRUEBAS DE LÓGICA PROPOSICIONAL Y ÁRBOL DE DECISIÓN
// ============================================================================

registrarPrueba('Lógica Tabla de verdad', '8 combinaciones de (A,B,C); F=1 solo en (1,1,0) y equivalencia De Morgan', function () {
  const tabla = Reglas.generarTablaDeVerdad();
  assert.equal(tabla.length, 8);
  let conteoVerdaderos = 0;
  tabla.forEach(function (fila) {
    assert.equal(fila.noF, fila.F === 1 ? 0 : 1);
    if (fila.A === 1 && fila.B === 1 && fila.C === 0) {
      assert.equal(fila.F, 1);
      conteoVerdaderos += 1;
    } else {
      assert.equal(fila.F, 0);
    }
  });
  assert.equal(conteoVerdaderos, 1);
  return '8 filas verificadas; única fila verdadera: (A=1, B=1, C=0)';
});

// ============================================================================
// 4. ESCENARIOS DIDÁCTICOS (S1 A S4) Y CASOS LÍMITE
// ============================================================================

registrarPrueba('Escenario S1', 'v0→v4, $500.000, PIN 1234 → Aprobada (v0=$7.499.200, v4=$2.500.000)', function () {
  const sim = Transaccion.crearSimulador();
  const r = sim.ejecutarTransferencia({ origen: 0, destino: 4, monto: 500000, pin: '1234' });
  assert.equal(r.aprobada, true);
  assert.equal(r.comision, 800);
  assert.deepEqual(r.proposiciones, { A: true, B: true, C: false, F: true });
  assert.equal(r.saldosDespues.origen, 7499200);
  assert.equal(r.saldosDespues.destino, 2500000);
  assert.ok(r.tiempoCalculoMs < 100);
  return 'v0=' + r.saldosDespues.origen + ', v4=' + r.saldosDespues.destino + ' (' + r.tiempoCalculoMs + ' ms)';
});

registrarPrueba('Escenario S2', 'v0→v4, $500.000, PIN 1111 → Rechazada por PIN (B=0)', function () {
  const sim = Transaccion.crearSimulador();
  const r = sim.ejecutarTransferencia({ origen: 0, destino: 4, monto: 500000, pin: '1111' });
  assert.equal(r.aprobada, false);
  assert.equal(r.comision, 800);
  assert.deepEqual(r.proposiciones, { A: true, B: false, C: false, F: false });
  assert.deepEqual(r.razonesRechazo, ['PIN incorrecto.']);
  assert.equal(r.saldosDespues.origen, 8000000);
  assert.equal(r.saldosDespues.destino, 2000000);
  return r.razonesRechazo[0];
});

registrarPrueba('Escenario S3', 'v4→v0, $2.000.000, PIN 4096 → Rechazada por saldo (A=0)', function () {
  const sim = Transaccion.crearSimulador();
  const r = sim.ejecutarTransferencia({ origen: 4, destino: 0, monto: 2000000, pin: '4096' });
  assert.equal(r.aprobada, false);
  assert.equal(r.comision, 800);
  assert.deepEqual(r.proposiciones, { A: false, B: true, C: false, F: false });
  assert.deepEqual(r.razonesRechazo, [
    'Saldo insuficiente: necesitas $2.000.800 (monto + comisión) y tienes $2.000.000.'
  ]);
  assert.equal(r.saldosDespues.origen, 2000000);
  return r.razonesRechazo[0];
});

registrarPrueba('Escenario S4', 'v0→v3, $6.000.000, PIN 1234 → Rechazada solo por alerta de IA (A=1, B=1, C=1)', function () {
  const sim = Transaccion.crearSimulador();
  const r = sim.ejecutarTransferencia({ origen: 0, destino: 3, monto: 6000000, pin: '1234' });
  assert.equal(r.aprobada, false);
  assert.equal(r.comision, 700);
  assert.deepEqual(r.proposiciones, { A: true, B: true, C: true, F: false });
  assert.deepEqual(r.razonesRechazo, [
    'Alerta de fraude (IA): monto superior a $5.000.000.'
  ]);
  return r.razonesRechazo[0];
});

registrarPrueba('Límite del umbral IA', 'v0→v3 con $5.000.000 aprueba (C=0) y con $5.000.001 rechaza (C=1)', function () {
  const sim = Transaccion.crearSimulador();
  const rExacto = sim.ejecutarTransferencia({ origen: 0, destino: 3, monto: 5000000, pin: '1234' });
  assert.equal(rExacto.aprobada, true);
  assert.equal(rExacto.proposiciones.C, false);
  assert.equal(rExacto.saldosDespues.origen, 2999300);

  sim.reiniciar();
  const rExcede = sim.ejecutarTransferencia({ origen: 0, destino: 3, monto: 5000001, pin: '1234' });
  assert.equal(rExcede.aprobada, false);
  assert.equal(rExcede.proposiciones.C, true);
  return '$5.000.000 → C=0 (aprobada) | $5.000.001 → C=1 (rechazada)';
});

registrarPrueba('Rechazo múltiple sin cortocircuito', 'v4→v0, $6.000.000, PIN 0000 → A=0, B=0, C=1 lista las 3 razones', function () {
  const sim = Transaccion.crearSimulador();
  const r = sim.ejecutarTransferencia({ origen: 4, destino: 0, monto: 6000000, pin: '0000' });
  assert.equal(r.aprobada, false);
  assert.deepEqual(r.proposiciones, { A: false, B: false, C: true, F: false });
  assert.equal(r.razonesRechazo.length, 3);
  assert.equal(
    r.razonesRechazo[0],
    'Saldo insuficiente: necesitas $6.000.800 (monto + comisión) y tienes $2.000.000.'
  );
  assert.equal(r.razonesRechazo[1], 'PIN incorrecto.');
  assert.equal(r.razonesRechazo[2], 'Alerta de fraude (IA): monto superior a $5.000.000.');
  return '3 razones simultáneas verificadas sin cortocircuito';
});

registrarPrueba('Invariante de conservación', 'Σ saldos + comisionesAcumuladas = $78.500.000 tras 200 transferencias aleatorias', function () {
  const sim = Transaccion.crearSimulador();
  const masaInicial = sim.obtenerEstado().masaMonetariaInicial;
  assert.equal(masaInicial, 78500000);

  // Generador pseudoaleatorio determinista (LCG) para reproducibilidad en pruebas
  let semilla = 421337;
  function aleatorioEntero(max) {
    semilla = (semilla * 1664525 + 1013904223) >>> 0;
    return semilla % max;
  }

  const pinesReales = ['1234', '2468', '1357', '9753', '4096'];

  for (let paso = 0; paso < 200; paso += 1) {
    const origen = aleatorioEntero(5);
    const destino = (origen + 1 + aleatorioEntero(4)) % 5;
    const monto = 1 + aleatorioEntero(6500000);
    const usarPinCorrecto = aleatorioEntero(10) < 7;
    const pin = usarPinCorrecto ? pinesReales[origen] : '0000';

    const resultado = sim.ejecutarTransferencia({
      origen: origen,
      destino: destino,
      monto: monto,
      pin: pin
    });

    assert.equal(resultado.estado.invarianteCumplido, true);
    assert.equal(
      resultado.estado.sumaSaldos + resultado.estado.comisionesAcumuladas,
      masaInicial
    );
  }

  const estadoFinal = sim.obtenerEstado();
  return (
    'Σ saldos ($' +
    Datos.formatearNumeroCOP(estadoFinal.sumaSaldos) +
    ') + comisiones ($' +
    Datos.formatearNumeroCOP(estadoFinal.comisionesAcumuladas) +
    ') = $' +
    Datos.formatearNumeroCOP(estadoFinal.masaMonetariaTotal)
  );
});

registrarPrueba('Validación y Privacidad', 'Entradas inválidas bloqueadas y PIN ausente en logs de terminal', function () {
  const sim = Transaccion.crearSimulador();
  assert.equal(sim.ejecutarTransferencia({ origen: 1, destino: 1, monto: 1000, pin: '2468' }).validacionExitosa, false);
  assert.equal(sim.ejecutarTransferencia({ origen: 0, destino: 1, monto: 0, pin: '1234' }).validacionExitosa, false);
  assert.equal(sim.ejecutarTransferencia({ origen: 0, destino: 1, monto: -50, pin: '1234' }).validacionExitosa, false);
  assert.equal(sim.ejecutarTransferencia({ origen: 0, destino: 1, monto: 12.5, pin: '1234' }).validacionExitosa, false);
  assert.equal(sim.ejecutarTransferencia({ origen: 0, destino: 1, monto: 1000, pin: '123' }).validacionExitosa, false);
  assert.equal(sim.ejecutarTransferencia({ origen: 0, destino: 1, monto: 1000, pin: '12a4' }).validacionExitosa, false);

  const txValida = sim.ejecutarTransferencia({ origen: 0, destino: 4, monto: 500000, pin: '1234' });
  const textoTerminal = txValida.trazas.lineasTerminal.join('\n');
  assert.equal(textoTerminal.includes('1234'), false, 'El PIN en claro no debe aparecer en la terminal');
  return 'Validaciones en borde OK y PIN enmascarado en trazas';
});

console.log('\n================================================================================');
console.log(' PAYGRAPH · SUITE DE VERIFICACIÓN MATEMÁTICA Y TRANSACCIONAL (Fase 1)');
console.log('================================================================================');
console.table(resultados);
console.log('Total pruebas ejecutadas: ' + resultados.length + ' | Fallidas: 0');
