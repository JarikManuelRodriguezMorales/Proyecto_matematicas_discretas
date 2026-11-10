/**
 * @file reglas.js
 * @description Motor de lógica proposicional y Árbol de Decisión de un umbral.
 * Implementa F(T) = A ∧ B ∧ ¬C, su negación por leyes de De Morgan ¬F(T) ≡ ¬A ∨ ¬B ∨ C,
 * la generación de la tabla de verdad de 8 filas y la evaluación sin cortocircuito.
 */
(function (root, factory) {
  'use strict';
  const namespace = (root.PayGraph = root.PayGraph || {});
  const datos =
    namespace.Datos ||
    (typeof require === 'function' ? require('./datos.js') : null);
  const modulo = factory(datos);
  namespace.Reglas = modulo;
  if (typeof module === 'object' && module.exports) {
    module.exports = modulo;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Datos) {
  'use strict';

  /**
   * Estructura explícita del Árbol de Decisión de un solo umbral definido por regla de negocio.
   * Raíz: evalúa la condición estricta (monto > 5.000.000 COP).
   * Hoja izquierda (falso): clase 0 (operación normal, C = 0).
   * Hoja derecha (verdadero): clase 1 (operación sospechosa, C = 1).
   */
  const ARBOL_DECISION_FRAUDE = Object.freeze({
    id: 'raiz_umbral_monto',
    esHoja: false,
    atributo: 'monto',
    operador: '>',
    umbral: Datos.UMBRAL_FRAUDE_COP,
    condicionTexto: 'monto > $5.000.000 COP',
    hijoVerdadero: Object.freeze({
      id: 'hoja_sospechosa',
      esHoja: true,
      clase: 1,
      alerta: true,
      etiqueta: 'Sospechosa (alerta de fraude)'
    }),
    hijoFalso: Object.freeze({
      id: 'hoja_normal',
      esHoja: true,
      clase: 0,
      alerta: false,
      etiqueta: 'Normal (operación estándar)'
    })
  });

  /**
   * Recorre recursivamente un árbol de decisión binario y clasifica la instancia.
   * Fórmula: C(T) = \mathbb{I}(\text{monto} > 5.000.000) \in \{0, 1\}
   *
   * @param {Object} nodo - Nodo actual del árbol (por defecto ARBOL_DECISION_FRAUDE).
   * @param {Object} variables - Diccionario de atributos de entrada, p. ej. { monto }.
   * @returns {{ clase: number, alerta: boolean, etiqueta: string, umbral: number, recorrido: Array<string> }}
   */
  function predecirArbolDecision(nodo, variables) {
    const raiz = nodo || ARBOL_DECISION_FRAUDE;
    const vars = variables || {};
    const recorrido = [];
    let actual = raiz;

    while (actual && !actual.esHoja) {
      const valorAtributo = Number(vars[actual.atributo]);
      let cumpleCondicion = false;
      if (actual.operador === '>') {
        cumpleCondicion = valorAtributo > actual.umbral;
      } else if (actual.operador === '>=') {
        cumpleCondicion = valorAtributo >= actual.umbral;
      }
      recorrido.push(
        actual.condicionTexto + ' → ' + (cumpleCondicion ? 'Sí (rama derecha)' : 'No (rama izquierda)')
      );
      actual = cumpleCondicion ? actual.hijoVerdadero : actual.hijoFalso;
    }

    recorrido.push('Hoja alcanzada: clase ' + actual.clase + ' (' + actual.etiqueta + ')');
    return {
      clase: actual.clase,
      alerta: Boolean(actual.alerta),
      etiqueta: actual.etiqueta,
      umbral: raiz.umbral,
      recorrido: recorrido
    };
  }

  /**
   * Evalúa la función booleana de autorización F(T) y su negación por De Morgan.
   * Fórmulas:
   *   F(T) = A \land B \land (\neg C)
   *   \neg F(T) \equiv (\neg A) \lor (\neg B) \lor C
   *
   * @param {boolean} A - Proposición A: saldo suficiente.
   * @param {boolean} B - Proposición B: PIN autenticado.
   * @param {boolean} C - Proposición C: alerta de fraude IA.
   * @returns {{
   *   A: boolean,
   *   B: boolean,
   *   C: boolean,
   *   noC: boolean,
   *   AyB: boolean,
   *   F: boolean,
   *   noF_DeMorgan: boolean
   * }}
   */
  function evaluarFormulaBooleana(A, B, C) {
    const propA = Boolean(A);
    const propB = Boolean(B);
    const propC = Boolean(C);
    const noC = !propC;
    const AyB = propA && propB;
    const F = AyB && noC;
    const noF_DeMorgan = !propA || !propB || propC;

    return {
      A: propA,
      B: propB,
      C: propC,
      noC: noC,
      AyB: AyB,
      F: F,
      noF_DeMorgan: noF_DeMorgan
    };
  }

  /**
   * Evalúa las tres proposiciones A, B y C SIEMPRE sin cortocircuito y construye
   * la lista exhaustiva de razones de rechazo cuando ¬F(T) es verdadera.
   * Fórmulas:
   *   A \iff (\text{saldoOrigen} \ge \text{monto} + \text{comision})
   *   B \iff (\text{PIN}_{\text{descifrado}} = \text{PIN}_{\text{registrado}})
   *   C \iff (\text{monto} > 5.000.000)
   *
   * @param {{ saldoOrigen: number, monto: number, comision: number, pinValido: boolean }} entrada
   * @returns {{
   *   A: boolean,
   *   B: boolean,
   *   C: boolean,
   *   F: boolean,
   *   totalRequerido: number,
   *   saldoOrigen: number,
   *   prediccionIA: Object,
   *   evaluacionLogica: Object,
   *   razonesRechazo: Array<string>,
   *   codigosRechazo: Array<string>
   * }}
   */
  function evaluarAutorizacionSinCortocircuito(entrada) {
    const saldoOrigen = Number(entrada.saldoOrigen);
    const monto = Number(entrada.monto);
    const comision = Number(entrada.comision);
    const totalRequerido = monto + comision;

    // 1. Proposición A: suficiencia presupuestaria
    const propA = saldoOrigen >= totalRequerido;

    // 2. Proposición B: correspondencia criptográfica del PIN
    const propB = Boolean(entrada.pinValido);

    // 3. Proposición C: evaluación explícita del Árbol de Decisión (sin cortocircuito)
    const prediccionIA = predecirArbolDecision(ARBOL_DECISION_FRAUDE, { monto: monto });
    const propC = prediccionIA.alerta;

    // 4. Evaluación booleana conjunta F(T) = A ∧ B ∧ ¬C
    const evaluacionLogica = evaluarFormulaBooleana(propA, propB, propC);

    // 5. Desglose de causas de rechazo por Ley de De Morgan: ¬F ≡ ¬A ∨ ¬B ∨ C
    const razonesRechazo = [];
    const codigosRechazo = [];

    if (!propA) {
      razonesRechazo.push(
        'Saldo insuficiente: necesitas ' +
          Datos.formatearMonedaCOP(totalRequerido) +
          ' (monto + comisión) y tienes ' +
          Datos.formatearMonedaCOP(saldoOrigen) +
          '.'
      );
      codigosRechazo.push('SALDO_INSUFICIENTE');
    }

    if (!propB) {
      razonesRechazo.push('PIN incorrecto.');
      codigosRechazo.push('PIN_INCORRECTO');
    }

    if (propC) {
      razonesRechazo.push(
        'Alerta de fraude (IA): monto superior a ' +
          Datos.formatearMonedaCOP(Datos.UMBRAL_FRAUDE_COP) +
          '.'
      );
      codigosRechazo.push('FRAUDE_IA');
    }

    return {
      A: propA,
      B: propB,
      C: propC,
      F: evaluacionLogica.F,
      totalRequerido: totalRequerido,
      saldoOrigen: saldoOrigen,
      prediccionIA: prediccionIA,
      evaluacionLogica: evaluacionLogica,
      razonesRechazo: razonesRechazo,
      codigosRechazo: codigosRechazo
    };
  }

  /**
   * Genera las 8 combinaciones canónicas (000 a 111) de la tabla de verdad de F(T).
   * Fórmula: 2^3 = 8 filas, donde F(A, B, C) = 1 únicamente en la tupla (1, 1, 0).
   *
   * @returns {Array<{ fila: number, A: number, B: number, C: number, noC: number, AyB: number, F: number, noF: number }>}
   */
  function generarTablaDeVerdad() {
    const tabla = [];
    for (let mascara = 0; mascara < 8; mascara += 1) {
      const bitA = (mascara >> 2) & 1;
      const bitB = (mascara >> 1) & 1;
      const bitC = mascara & 1;
      const evalFila = evaluarFormulaBooleana(bitA === 1, bitB === 1, bitC === 1);

      tabla.push({
        fila: mascara + 1,
        A: bitA,
        B: bitB,
        C: bitC,
        noC: evalFila.noC ? 1 : 0,
        AyB: evalFila.AyB ? 1 : 0,
        F: evalFila.F ? 1 : 0,
        noF: evalFila.noF_DeMorgan ? 1 : 0
      });
    }
    return tabla;
  }

  return Object.freeze({
    ARBOL_DECISION_FRAUDE: ARBOL_DECISION_FRAUDE,
    predecirArbolDecision: predecirArbolDecision,
    evaluarFormulaBooleana: evaluarFormulaBooleana,
    evaluarAutorizacionSinCortocircuito: evaluarAutorizacionSinCortocircuito,
    generarTablaDeVerdad: generarTablaDeVerdad
  });
});
