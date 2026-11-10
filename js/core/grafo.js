/**
 * @file grafo.js
 * @description Módulo de teoría de grafos y optimización de rutas interbancarias.
 * Implementa el algoritmo de Dijkstra en versión matriz O(|V|^2) con reconstrucción
 * de camino por predecesores, registro de iteraciones y verificación por Floyd-Warshall.
 */
(function (root, factory) {
  'use strict';
  const namespace = (root.PayGraph = root.PayGraph || {});
  const datos =
    namespace.Datos ||
    (typeof require === 'function' ? require('./datos.js') : null);
  const modulo = factory(datos);
  namespace.Grafo = modulo;
  if (typeof module === 'object' && module.exports) {
    module.exports = modulo;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Datos) {
  'use strict';

  /**
   * Valida que una matriz de adyacencia sea cuadrada no vacía con pesos no negativos.
   * Fórmula: M \in (\mathbb{R}_{\ge 0} \cup \{\infty\})^{|V| \times |V|}
   *
   * @param {Array<Array<number>>} matriz - Matriz de adyacencia M.
   */
  function validarMatriz(matriz) {
    if (!Array.isArray(matriz) || matriz.length === 0) {
      throw new TypeError('La matriz de adyacencia debe ser un arreglo cuadrado no vacío.');
    }
    const n = matriz.length;
    for (let i = 0; i < n; i += 1) {
      if (!Array.isArray(matriz[i]) || matriz[i].length !== n) {
        throw new TypeError('La matriz de adyacencia debe tener dimensión |V| x |V|.');
      }
      for (let j = 0; j < n; j += 1) {
        const peso = matriz[i][j];
        if (typeof peso !== 'number' || Number.isNaN(peso) || peso < 0) {
          throw new RangeError('Los pesos de la matriz deben ser números no negativos o Infinity.');
        }
      }
    }
  }

  /**
   * Comprueba si la matriz de adyacencia es simétrica con diagonal nula.
   * Fórmula: \forall i, j \in V:\; M[i][j] = M[j][i] \;\land\; M[i][i] = 0
   *
   * @param {Array<Array<number>>} [matriz=Datos.MATRIZ_ADYACENCIA] - Matriz a evaluar.
   * @returns {boolean} true si es simétrica y su diagonal principal es cero.
   */
  function esMatrizSimetrica(matriz) {
    const M = matriz || Datos.MATRIZ_ADYACENCIA;
    validarMatriz(M);
    const n = M.length;
    for (let i = 0; i < n; i += 1) {
      if (M[i][i] !== 0) {
        return false;
      }
      for (let j = i + 1; j < n; j += 1) {
        if (M[i][j] !== M[j][i]) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Selecciona el vértice no visitado con la menor distancia tentativa actual.
   * Fórmula: u = \arg\min_{v \in V \setminus S} \text{dist}[v]
   *
   * @param {Array<number>} distancias - Vector de distancias tentativas.
   * @param {Array<boolean>} visitados - Vector booleano de vértices ya fijados.
   * @returns {number} Índice del nodo elegido o -1 si los restantes son inalcanzables.
   */
  function seleccionarMinimoNoVisitado(distancias, visitados) {
    let menorDistancia = Infinity;
    let nodoElegido = -1;
    for (let v = 0; v < distancias.length; v += 1) {
      if (!visitados[v] && distancias[v] < menorDistancia) {
        menorDistancia = distancias[v];
        nodoElegido = v;
      }
    }
    return nodoElegido;
  }

  /**
   * Reconstruye el camino mínimo desde el origen hasta el destino usando el vector de predecesores.
   * Fórmula: P = (v_0 = \text{origen}, \dots, v_k = \text{destino}) \text{ tal que } \text{prev}[v_i] = v_{i-1}
   *
   * @param {Array<number|null>} predecesores - Vector de nodos previos.
   * @param {number} origen - Nodo inicial.
   * @param {number} destino - Nodo final.
   * @param {number} distanciaDestino - Distancia calculada hacia el destino.
   * @returns {Array<number>} Secuencia de vértices de la ruta óptima, o [] si es inalcanzable.
   */
  function reconstruirRuta(predecesores, origen, destino, distanciaDestino) {
    if (!Number.isFinite(distanciaDestino)) {
      return [];
    }
    const ruta = [];
    let actual = destino;
    let pasosSeguridad = 0;
    const limite = predecesores.length + 1;

    while (actual !== null && pasosSeguridad <= limite) {
      ruta.unshift(actual);
      if (actual === origen) {
        return ruta;
      }
      actual = predecesores[actual];
      pasosSeguridad += 1;
    }
    return [];
  }

  /**
   * Ejecuta el algoritmo de Dijkstra sobre matriz de adyacencia con complejidad O(|V|^2).
   * Relajación: \text{dist}[v] = \min\big(\text{dist}[v],\; \text{dist}[u] + M[u][v]\big)
   * Comisión total de la ruta: W(P) = \sum_{i=0}^{k-1} M[v_i][v_{i+1}]
   *
   * @param {Array<Array<number>>} matriz - Matriz de adyacencia M de tamaño |V|x|V|.
   * @param {number} origen - Índice del vértice origen en [0, |V|-1].
   * @param {number} destino - Índice del vértice destino en [0, |V|-1].
   * @returns {{
   *   origen: number,
   *   destino: number,
   *   alcanzable: boolean,
   *   costoTotal: number,
   *   costoDirecto: number,
   *   ahorroFrenteADirecto: number,
   *   ruta: Array<number>,
   *   tramos: Array<{ desde: number, hacia: number, comision: number }>,
   *   distanciasFinales: Array<number>,
   *   predecesores: Array<number|null>,
   *   iteraciones: Array<Object>
   * }}
   */
  function dijkstra(matriz, origen, destino) {
    const M = matriz || Datos.MATRIZ_ADYACENCIA;
    validarMatriz(M);
    const numNodos = M.length;

    if (
      !Number.isInteger(origen) ||
      !Number.isInteger(destino) ||
      origen < 0 ||
      origen >= numNodos ||
      destino < 0 ||
      destino >= numNodos
    ) {
      throw new RangeError('Los índices de origen y destino deben pertenecer a [0, |V|-1].');
    }

    const distancias = new Array(numNodos).fill(Infinity);
    const predecesores = new Array(numNodos).fill(null);
    const visitados = new Array(numNodos).fill(false);
    const iteraciones = [];

    distancias[origen] = 0;

    for (let paso = 0; paso < numNodos; paso += 1) {
      const u = seleccionarMinimoNoVisitado(distancias, visitados);
      if (u === -1) {
        break;
      }

      visitados[u] = true;
      const relajacionesPaso = [];

      for (let v = 0; v < numNodos; v += 1) {
        const pesoArco = M[u][v];
        if (!visitados[v] && Number.isFinite(pesoArco) && u !== v) {
          const distanciaCandidata = distancias[u] + pesoArco;
          const distanciaAnterior = distancias[v];
          const mejoro = distanciaCandidata < distanciaAnterior;

          if (mejoro) {
            distancias[v] = distanciaCandidata;
            predecesores[v] = u;
          }

          relajacionesPaso.push({
            desde: u,
            hacia: v,
            pesoArco: pesoArco,
            distanciaPrevia: distanciaAnterior,
            distanciaCandidata: distanciaCandidata,
            actualizado: mejoro
          });
        }
      }

      const listaVisitados = [];
      for (let idx = 0; idx < numNodos; idx += 1) {
        if (visitados[idx]) {
          listaVisitados.push(idx);
        }
      }

      iteraciones.push({
        paso: paso + 1,
        nodoFijado: u,
        costoFijado: distancias[u],
        distancias: distancias.slice(),
        predecesores: predecesores.slice(),
        visitados: listaVisitados,
        relajaciones: relajacionesPaso
      });
    }

    const costoTotal = distancias[destino];
    const alcanzable = Number.isFinite(costoTotal);
    const ruta = reconstruirRuta(predecesores, origen, destino, costoTotal);
    const tramos = [];

    for (let i = 0; i < ruta.length - 1; i += 1) {
      const desde = ruta[i];
      const hacia = ruta[i + 1];
      tramos.push({
        desde: desde,
        hacia: hacia,
        comision: M[desde][hacia]
      });
    }

    const costoDirecto = M[origen][destino];
    const ahorroFrenteADirecto =
      Number.isFinite(costoDirecto) && alcanzable ? costoDirecto - costoTotal : 0;

    return {
      origen: origen,
      destino: destino,
      alcanzable: alcanzable,
      costoTotal: costoTotal,
      costoDirecto: costoDirecto,
      ahorroFrenteADirecto: ahorroFrenteADirecto,
      ruta: ruta,
      tramos: tramos,
      distanciasFinales: distancias,
      predecesores: predecesores,
      iteraciones: iteraciones
    };
  }

  /**
   * Construye la matriz completa D de costos mínimos ejecutando Dijkstra desde cada nodo.
   * Fórmula: D[i][j] = \min_{P: v_i \leadsto v_j} W(P)
   *
   * @param {Array<Array<number>>} [matriz=Datos.MATRIZ_ADYACENCIA] - Matriz de adyacencia M.
   * @returns {Array<Array<number>>} Matriz D de costos mínimos |V|x|V|.
   */
  function calcularMatrizCostosMinimos(matriz) {
    const M = matriz || Datos.MATRIZ_ADYACENCIA;
    validarMatriz(M);
    const n = M.length;
    const D = [];
    for (let i = 0; i < n; i += 1) {
      const resultadoOrigen = dijkstra(M, i, 0);
      D.push(resultadoOrigen.distanciasFinales);
    }
    return D;
  }

  /**
   * Algoritmo de Floyd-Warshall O(|V|^3) para verificar todos los pares de caminos mínimos.
   * Fórmula: D^{(k)}[i][j] = \min\big(D^{(k-1)}[i][j],\; D^{(k-1)}[i][k] + D^{(k-1)}[k][j]\big)
   *
   * @param {Array<Array<number>>} [matriz=Datos.MATRIZ_ADYACENCIA] - Matriz de adyacencia M.
   * @returns {Array<Array<number>>} Matriz de distancias mínimas entre todos los pares.
   */
  function floydWarshall(matriz) {
    const M = matriz || Datos.MATRIZ_ADYACENCIA;
    validarMatriz(M);
    const n = M.length;
    const dist = M.map(function (fila) {
      return fila.slice();
    });

    for (let k = 0; k < n; k += 1) {
      for (let i = 0; i < n; i += 1) {
        for (let j = 0; j < n; j += 1) {
          if (dist[i][k] + dist[k][j] < dist[i][j]) {
            dist[i][j] = dist[i][k] + dist[k][j];
          }
        }
      }
    }
    return dist;
  }

  return Object.freeze({
    validarMatriz: validarMatriz,
    esMatrizSimetrica: esMatrizSimetrica,
    dijkstra: dijkstra,
    calcularMatrizCostosMinimos: calcularMatrizCostosMinimos,
    floydWarshall: floydWarshall
  });
});
