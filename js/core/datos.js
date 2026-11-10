/**
 * @file datos.js
 * @description Datos semilla, parámetros RSA públicos, matriz de adyacencia,
 * umbrales y escenarios didácticos de PayGraph.
 * Todas las constantes del dominio residen exclusivamente en este módulo.
 */
(function (root, factory) {
  'use strict';
  const namespace = (root.PayGraph = root.PayGraph || {});
  const modulo = factory();
  namespace.Datos = modulo;
  if (typeof module === 'object' && module.exports) {
    module.exports = modulo;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * Parámetros públicos del esquema RSA simplificado.
   * p = 61, q = 53, n = p * q = 3233, φ(n) = (p - 1)(q - 1) = 3120, e = 17.
   * Nota de seguridad: el exponente privado d = 2753 vive únicamente dentro de
   * la clausura del servidor simulado en rsa.js, nunca en este objeto público.
   */
  const RSA_PUBLICO = Object.freeze({
    p: 61,
    q: 53,
    n: 3233,
    phi: 3120,
    e: 17,
    longitudPin: 4,
    tamanoBloqueDigitos: 2,
    maximoValorBloque: 99
  });

  /**
   * Umbral estricto del Árbol de Decisión para alerta de fraude (proposición C).
   * C es verdadera sí y solo si: monto > UMBRAL_FRAUDE_COP.
   */
  const UMBRAL_FRAUDE_COP = 5000000;

  /**
   * Límites de validación para el monto de una transferencia en COP.
   */
  const LIMITES_MONTO = Object.freeze({
    minimo: 1,
    maximo: Number.MAX_SAFE_INTEGER
  });

  /**
   * Matriz de adyacencia ponderada M de tamaño 5x5 (costos de comisión en COP).
   * M es simétrica: cada canal representa un par de arcos dirigidos opuestos
   * con el mismo peso w(u, v) = w(v, u). Infinity indica ausencia de enlace directo.
   *
   * Nodos: v0, v1, v2, v3, v4.
   */
  const MATRIZ_ADYACENCIA = Object.freeze([
    Object.freeze([0, 300, 800, Infinity, 1200]),
    Object.freeze([300, 0, 200, 400, 500]),
    Object.freeze([800, 200, 0, 300, Infinity]),
    Object.freeze([Infinity, 400, 300, 0, 600]),
    Object.freeze([1200, 500, Infinity, 600, 0])
  ]);

  /**
   * Cuentas semilla del sistema (supuestos académicos editables en este archivo).
   * Los 5 nodos son cuentas seleccionables como origen o destino.
   * Se incluyen coordenadas relativas normalizadas [0..1] para el renderizado en el lienzo.
   */
  const CUENTAS_SEMILLA = Object.freeze([
    Object.freeze({
      id: 0,
      codigo: 'v0',
      nombre: 'Usuario A',
      tipo: 'usuario',
      saldoInicial: 8000000,
      pinSemilla: '1234',
      posX: 0.16,
      posY: 0.26
    }),
    Object.freeze({
      id: 1,
      codigo: 'v1',
      nombre: 'Banco Alfa',
      tipo: 'banco',
      saldoInicial: 40000000,
      pinSemilla: '2468',
      posX: 0.50,
      posY: 0.50
    }),
    Object.freeze({
      id: 2,
      codigo: 'v2',
      nombre: 'Usuario B',
      tipo: 'usuario',
      saldoInicial: 3500000,
      pinSemilla: '1357',
      posX: 0.84,
      posY: 0.26
    }),
    Object.freeze({
      id: 3,
      codigo: 'v3',
      nombre: 'Banco Beta',
      tipo: 'banco',
      saldoInicial: 25000000,
      pinSemilla: '9753',
      posX: 0.78,
      posY: 0.78
    }),
    Object.freeze({
      id: 4,
      codigo: 'v4',
      nombre: 'Usuario C',
      tipo: 'usuario',
      saldoInicial: 2000000,
      pinSemilla: '4096',
      posX: 0.22,
      posY: 0.78
    })
  ]);

  /**
   * Escenarios didácticos preconfigurados (RNF-02 y Apéndice B de la guía).
   */
  const ESCENARIOS_DIDACTICOS = Object.freeze([
    Object.freeze({
      id: 'S1',
      titulo: 'S1 · Pago exitoso',
      subtitulo: 'v0 → v4 · $500.000 · Ruta óptima por v1',
      descripcion: 'Cumple saldo (A=1), PIN válido (B=1) y monto normal (C=0). Comisión mínima: $800.',
      origen: 0,
      destino: 4,
      monto: 500000,
      pin: '1234',
      comisionEsperada: 800,
      aprobadaEsperada: true
    }),
    Object.freeze({
      id: 'S2',
      titulo: 'S2 · PIN incorrecto',
      subtitulo: 'v0 → v4 · $500.000 · PIN 1111',
      descripcion: 'Falla la autenticación RSA por bloques (B=0). Los saldos permanecen intactos.',
      origen: 0,
      destino: 4,
      monto: 500000,
      pin: '1111',
      comisionEsperada: 800,
      aprobadaEsperada: false
    }),
    Object.freeze({
      id: 'S3',
      titulo: 'S3 · Saldo insuficiente',
      subtitulo: 'v4 → v0 · $2.000.000 · Falta cubrir comisión',
      descripcion: 'Usuario C tiene $2.000.000 pero necesita $2.000.800 (monto + comisión de $800). Falla A=0.',
      origen: 4,
      destino: 0,
      monto: 2000000,
      pin: '4096',
      comisionEsperada: 800,
      aprobadaEsperada: false
    }),
    Object.freeze({
      id: 'S4',
      titulo: 'S4 · Alerta de fraude (IA)',
      subtitulo: 'v0 → v3 · $6.000.000 · Supera umbral',
      descripcion: 'Saldo y PIN son correctos (A=1, B=1), pero el Árbol de Decisión activa alerta C=1 (> $5.000.000).',
      origen: 0,
      destino: 3,
      monto: 6000000,
      pin: '1234',
      comisionEsperada: 700,
      aprobadaEsperada: false
    })
  ]);

  const formateadorNumeroCO = new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  });

  /**
   * Formatea un entero en pesos colombianos con separador de miles local (es-CO).
   * Fórmula: representación decimal entera sin centavos.
   *
   * @param {number} valor - Monto entero en COP.
   * @returns {string} Cadena formateada, por ejemplo "5.000.000".
   */
  function formatearNumeroCOP(valor) {
    if (!Number.isFinite(valor)) {
      return '∞';
    }
    return formateadorNumeroCO.format(Math.trunc(valor));
  }

  /**
   * Formatea un entero en pesos colombianos precedido por el símbolo "$".
   *
   * @param {number} valor - Monto entero en COP.
   * @returns {string} Cadena con símbolo de pesos, por ejemplo "$5.000.000".
   */
  function formatearMonedaCOP(valor) {
    if (!Number.isFinite(valor)) {
      return '∞';
    }
    return '$' + formatearNumeroCOP(valor);
  }

  /**
   * Calcula la suma inicial de todos los saldos semilla para verificar el invariante.
   * Fórmula: M_0 = \sum_{i=0}^{|V|-1} \text{saldoInicial}(v_i)
   *
   * @returns {number} Masa monetaria inicial en COP (78.500.000).
   */
  function calcularMasaMonetariaInicial() {
    let total = 0;
    for (let i = 0; i < CUENTAS_SEMILLA.length; i += 1) {
      total += CUENTAS_SEMILLA[i].saldoInicial;
    }
    return total;
  }

  return Object.freeze({
    RSA_PUBLICO,
    UMBRAL_FRAUDE_COP,
    LIMITES_MONTO,
    MATRIZ_ADYACENCIA,
    CUENTAS_SEMILLA,
    ESCENARIOS_DIDACTICOS,
    formatearNumeroCOP,
    formatearMonedaCOP,
    calcularMasaMonetariaInicial
  });
});
