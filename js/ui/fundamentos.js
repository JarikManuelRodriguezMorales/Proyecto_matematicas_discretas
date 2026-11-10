/**
 * @file fundamentos.js
 * @description Controlador de la vista dedicada "Fundamentos Matemáticos" (#/fundamentos).
 * Presenta la teoría formal y las ecuaciones en LaTeX separadas del inspector paso a paso
 * de la operación activa, incluyendo un laboratorio interactivo de cifrado RSA por bloques
 * y la tabla de verdad formal de 8 filas.
 */
(function (root, factory) {
  'use strict';
  const namespace = (root.PayGraph = root.PayGraph || {});
  namespace.FundamentosUI = factory(
    namespace.Datos,
    namespace.Rsa,
    namespace.Reglas,
    namespace.LatexUI
  );
})(typeof globalThis !== 'undefined' ? globalThis : this, function (
  Datos,
  Rsa,
  Reglas,
  LatexUI
) {
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
   * Inicializa la vista de Fundamentos Matemáticos y su laboratorio interactivo RSA.
   *
   * @param {HTMLElement} contenedorRaiz - Elemento contenedor de la vista #/fundamentos.
   */
  function inicializarFundamentos(contenedorRaiz) {
    if (!contenedorRaiz) {
      return;
    }
    limpiar(contenedorRaiz);

    const grilla = crearEl('div', 'grid grid-cols-1 lg:grid-cols-12 gap-5 items-start');

    // =========================================================================
    // 1. MÓDULO I: CRIPTOGRAFÍA ASIMÉTRICA RSA POR BLOQUES + LABORATORIO EN VIVO
    // =========================================================================
    const cardRSA = crearEl('article', 'lg:col-span-6 pg-surface rounded-2xl p-5 space-y-4');
    const cabRSA = crearEl('div', 'flex items-center justify-between gap-2 border-b border-slate-500/15 pb-3');
    const titRSA = crearEl('div', '');
    titRSA.appendChild(
      crearEl(
        'span',
        'text-[10px] font-extrabold uppercase tracking-wider text-purple-400',
        'Módulo I · Teoría de Números y Criptografía'
      )
    );
    titRSA.appendChild(
      crearEl('h3', 'text-base font-extrabold mt-0.5', 'Esquema RSA Académico por Bloques')
    );
    cabRSA.appendChild(titRSA);
    cabRSA.appendChild(
      LatexUI.crearNodoLatex(
        '\\mathbb{Z}_{3233}',
        false,
        'px-2.5 py-1 rounded-lg pg-elevated text-xs font-bold',
        'Z_3233'
      )
    );
    cardRSA.appendChild(cabRSA);

    cardRSA.appendChild(
      crearEl(
        'p',
        'text-xs pg-text-muted leading-relaxed',
        'A partir de dos números primos distintos p = 61 y q = 53, se construye el módulo público n y la función indicatriz de Euler φ(n). El exponente público e = 17 es coprimo con φ(n), y el inverso multiplicativo modular d = 2753 se obtiene mediante el algoritmo extendido de Euclides:'
      )
    );

    cardRSA.appendChild(
      LatexUI.crearNodoLatex(
        '\\begin{aligned} n &= p \\cdot q = 61 \\times 53 = 3233 \\\\ \\varphi(n) &= (p - 1)(q - 1) = 60 \\times 52 = 3120 \\\\ e \\cdot d &= 17 \\times 2753 = 46801 = 15 \\times 3120 + 1 \\equiv 1 \\pmod{3120} \\end{aligned}',
        true,
        'pg-elevated rounded-xl p-3 text-xs',
        'n = 61*53 = 3233 | φ(n) = 3120 | 17 * 2753 ≡ 1 (mod 3120)'
      )
    );

    cardRSA.appendChild(
      crearEl(
        'p',
        'text-xs pg-text-muted leading-relaxed',
        '¿Por qué cifrar por bloques? El teorema de Euler-Fermat garantiza recuperación biyectiva solo si el mensaje m cumple 0 ≤ m < n = 3233. Como un PIN de 4 dígitos llega hasta 9999 ≥ 3233, cifrarlo como entero único provocaría colisiones modulares (p. ej., 3300 mod 3233 = 67). Por ello se particiona en dos bloques de 2 dígitos:'
      )
    );

    cardRSA.appendChild(
      LatexUI.crearNodoLatex(
        '\\text{PIN} = d_1 d_2 d_3 d_4 \\longrightarrow [m_1, m_2] \\in \\{0, \\dots, 99\\}^2, \\quad c_i = m_i^{17} \\bmod 3233, \\quad m_i = c_i^{2753} \\bmod 3233',
        true,
        'pg-elevated rounded-xl p-3 text-xs',
        'PIN = d1d2d3d4 -> [m1, m2] en [0..99], c_i = m_i^17 mod 3233'
      )
    );

    // Mini Laboratorio Interactivo de Cifrado RSA en Vivo
    const labRSA = crearEl('div', 'pg-elevated rounded-xl p-3.5 space-y-2.5 border border-purple-500/20');
    const cabLab = crearEl('div', 'flex items-center justify-between gap-2 flex-wrap');
    cabLab.appendChild(
      crearEl(
        'span',
        'text-xs font-extrabold text-purple-400',
        'Laboratorio Interactivo RSA (Prueba cualquier PIN de 4 dígitos)'
      )
    );
    const inputPinLab = crearEl(
      'input',
      'pg-input w-28 py-1 px-2.5 text-xs font-mono-tabular font-bold text-center',
      ''
    );
    inputPinLab.type = 'text';
    inputPinLab.maxLength = 4;
    inputPinLab.value = '3300';
    inputPinLab.setAttribute('aria-label', 'PIN de prueba para el laboratorio RSA');
    cabLab.appendChild(inputPinLab);
    labRSA.appendChild(cabLab);

    const salidaLatexLab = crearEl('div', 'pg-surface rounded-lg p-2.5 text-xs overflow-x-auto');
    const salidaColisionLab = crearEl('div', 'text-[11px] pg-text-muted leading-snug');
    labRSA.appendChild(salidaLatexLab);
    labRSA.appendChild(salidaColisionLab);

    function actualizarLaboratorioRSA() {
      const limpio = String(inputPinLab.value || '').replace(/\D/g, '').padStart(4, '0').slice(0, 4);
      const resBloques = Rsa.cifrarPinPorBloques(limpio);
      const b1 = resBloques.bloquesDemostracion[0];
      const b2 = resBloques.bloquesDemostracion[1];
      const c1 = resBloques.bloquesCifrados[0];
      const c2 = resBloques.bloquesCifrados[1];

      const expr =
        '\\text{PIN } \\mathtt{' +
        limpio +
        '} \\implies [m_1=' +
        b1 +
        ',\\; m_2=' +
        b2 +
        '] \\implies \\begin{cases} c_1 = ' +
        b1 +
        '^{17} \\bmod 3233 = \\mathbf{' +
        c1 +
        '} \\\\ c_2 = ' +
        b2 +
        '^{17} \\bmod 3233 = \\mathbf{' +
        c2 +
        '} \\end{cases}';
      LatexUI.renderizarLatex(
        salidaLatexLab,
        expr,
        true,
        'PIN ' + limpio + ' -> [' + b1 + ', ' + b2 + '] -> [' + c1 + ', ' + c2 + ']'
      );

      const valorEntero = Number(limpio);
      const defecto = Rsa.demostrarDefectoPinSinBloques(valorEntero);
      if (defecto.ocurreColision) {
        salidaColisionLab.textContent =
          '⚠ Demostración de colisión sin bloques: como ' +
          valorEntero +
          ' ≥ 3233, si se cifrara sin dividir en bloques se descifraría erróneamente como ' +
          defecto.descifradoDefectuoso +
          ' (' +
          valorEntero +
          ' mod 3233 = ' +
          defecto.descifradoDefectuoso +
          '). Con bloques de 2 dígitos se recupera "' +
          limpio +
          '" sin pérdida.';
      } else {
        salidaColisionLab.textContent =
          '✓ Con bloques de 2 dígitos, cada bloque pertenece a [0, 99] < 3233, preservando incluso ceros a la izquierda.';
      }
    }

    inputPinLab.addEventListener('input', actualizarLaboratorioRSA);
    actualizarLaboratorioRSA();
    cardRSA.appendChild(labRSA);
    grilla.appendChild(cardRSA);

    // =========================================================================
    // 2. MÓDULO II: TEORÍA DE GRAFOS PONDERADOS Y ALGORITMO DE DIJKSTRA
    // =========================================================================
    const cardGrafo = crearEl('article', 'lg:col-span-6 pg-surface rounded-2xl p-5 space-y-4');
    const cabGrafo = crearEl('div', 'flex items-center justify-between gap-2 border-b border-slate-500/15 pb-3');
    const titGrafo = crearEl('div', '');
    titGrafo.appendChild(
      crearEl(
        'span',
        'text-[10px] font-extrabold uppercase tracking-wider text-emerald-400',
        'Módulo II · Optimización Combinatoria en Redes'
      )
    );
    titGrafo.appendChild(
      crearEl('h3', 'text-base font-extrabold mt-0.5', 'Grafo Ponderado y Camino Mínimo de Dijkstra')
    );
    cabGrafo.appendChild(titGrafo);
    cabGrafo.appendChild(
      LatexUI.crearNodoLatex(
        '\\mathcal{O}(|V|^2)',
        false,
        'px-2.5 py-1 rounded-lg pg-elevated text-xs font-bold',
        'O(|V|^2)'
      )
    );
    cardGrafo.appendChild(cabGrafo);

    cardGrafo.appendChild(
      crearEl(
        'p',
        'text-xs pg-text-muted leading-relaxed',
        'La red financiera se modela como un grafo no dirigido conexo y ponderado G = (V, E, w) con |V| = 5 cuentas y |E| = 7 enlaces interbancarios. Cada arista no dirigida equivale a dos arcos dirigidos simétricos con costo no negativo w(u, v) = w(v, u) > 0:'
      )
    );

    cardGrafo.appendChild(
      LatexUI.crearNodoLatex(
        'G = (V, E, w), \\quad V = \\{v_0, v_1, v_2, v_3, v_4\\}, \\quad w: E \\to \\mathbb{R}^+, \\quad M_{ij} = M_{ji}',
        true,
        'pg-elevated rounded-xl p-3 text-xs',
        'G = (V, E, w), V = {v0..v4}, M_ij = M_ji'
      )
    );

    cardGrafo.appendChild(
      crearEl(
        'p',
        'text-xs pg-text-muted leading-relaxed',
        'Dado un nodo origen s y un destino t, el costo de una ruta P = (u_1, u_2, …, u_m) es la suma de las comisiones de sus tramos. El algoritmo voraz de Dijkstra mantiene una cota superior dist[v] y aplica la ecuación de relajación sobre cada vecino no visitado:'
      )
    );

    cardGrafo.appendChild(
      LatexUI.crearNodoLatex(
        '\\begin{aligned} W(P) &= \\sum_{k=1}^{m-1} w(u_k, u_{k+1}), \\qquad P^*(s, t) = \\arg\\min_{P: s \\leadsto t} W(P) \\\\ u^* &= \\arg\\min_{u \\in V \\setminus S} \\text{dist}[u], \\qquad \\text{dist}[v] \\leftarrow \\min\\!\\big(\\text{dist}[v],\\; \\text{dist}[u^*] + M[u^*][v]\\big) \\end{aligned}',
        true,
        'pg-elevated rounded-xl p-3 text-xs',
        'W(P) = Σ w(u_k, u_{k+1}) | dist[v] <- min(dist[v], dist[u*] + M[u*][v])'
      )
    );

    cardGrafo.appendChild(
      crearEl(
        'p',
        'text-xs pg-text-muted leading-relaxed',
        'Ejemplo canónico en PayGraph: aunque existe un canal directo entre Usuario A (v₀) y Usuario C (v₄) con costo w(v₀, v₄) = $1.200, el enrutamiento óptimo selecciona el camino indirecto a través de Banco Alfa (v₁), logrando un ahorro de $400 por operación:'
      )
    );

    cardGrafo.appendChild(
      LatexUI.crearNodoLatex(
        'W(v_0 \\to v_1 \\to v_4) = w(v_0, v_1) + w(v_1, v_4) = \\$300 + \\$500 = \\$800 < w(v_0, v_4) = \\$1.200',
        true,
        'pg-elevated rounded-xl p-3 text-xs',
        'W(v0 -> v1 -> v4) = $300 + $500 = $800 < $1.200'
      )
    );
    grilla.appendChild(cardGrafo);

    // =========================================================================
    // 3. MÓDULO III: LÓGICA PROPOSICIONAL, DE MORGAN Y TABLA DE VERDAD DE 8 FILAS
    // =========================================================================
    const cardLogica = crearEl('article', 'lg:col-span-7 pg-surface rounded-2xl p-5 space-y-4');
    const cabLogica = crearEl('div', 'flex items-center justify-between gap-2 border-b border-slate-500/15 pb-3');
    const titLogica = crearEl('div', '');
    titLogica.appendChild(
      crearEl(
        'span',
        'text-[10px] font-extrabold uppercase tracking-wider text-amber-400',
        'Módulo III · Álgebra de Boole y Verificación Formal'
      )
    );
    titLogica.appendChild(
      crearEl('h3', 'text-base font-extrabold mt-0.5', 'Función Booleana de Autorización y Ley de De Morgan')
    );
    cabLogica.appendChild(titLogica);
    cabLogica.appendChild(
      LatexUI.crearNodoLatex(
        '\\{0, 1\\}^3 \\to \\{0, 1\\}',
        false,
        'px-2.5 py-1 rounded-lg pg-elevated text-xs font-bold',
        '{0,1}^3 -> {0,1}'
      )
    );
    cardLogica.appendChild(cabLogica);

    cardLogica.appendChild(
      crearEl(
        'p',
        'text-xs pg-text-muted leading-relaxed',
        'Toda solicitud de transferencia T se somete a tres proposiciones lógicas atómicas evaluadas íntegramente sin evaluación de cortocircuito, garantizando explicabilidad completa cuando fallan múltiples condiciones simultáneamente:'
      )
    );

    cardLogica.appendChild(
      LatexUI.crearNodoLatex(
        '\\begin{aligned} A &\\iff \\text{saldo}(v_{\\text{origen}}) \\ge \\text{monto} + W(P^*) \\\\ B &\\iff \\text{Dec}_d\\big(\\text{Enc}_e(\\text{PIN})\\big) = \\text{PIN}_{\\text{registrado}} \\\\ C &\\iff \\text{monto} > \\$5.000.000\\text{ COP} \\\\ F(T) &= A \\land B \\land \\neg C \\qquad \\Longleftrightarrow \\qquad \\neg F(T) \\equiv \\neg A \\lor \\neg B \\lor C \\end{aligned}',
        true,
        'pg-elevated rounded-xl p-3 text-xs',
        'F(T) = A ∧ B ∧ ¬C  <=>  ¬F(T) ≡ ¬A ∨ ¬B ∨ C'
      )
    );

    // Tabla de verdad completa de las 8 combinaciones
    const wrapTabla = crearEl('div', 'overflow-x-auto pg-elevated rounded-xl p-3');
    const tabla = crearEl('table', 'w-full text-xs font-mono-tabular text-center border-collapse');
    const thead = document.createElement('thead');
    const trHead = crearEl('tr', 'border-b border-slate-500/20');
    [
      { latex: 'A\\;(\\text{Saldo})', txt: 'A (Saldo)' },
      { latex: 'B\\;(\\text{PIN})', txt: 'B (PIN)' },
      { latex: 'C\\;(\\text{Alerta Fraude})', txt: 'C (Fraude)' },
      { latex: '\\neg C', txt: '¬C' },
      { latex: 'F(T) = A \\land B \\land \\neg C', txt: 'F(T)' },
      { latex: '\\neg A \\lor \\neg B \\lor C', txt: '¬F(T)' }
    ].forEach(function (col) {
      const th = crearEl('th', 'py-2 px-2 font-bold');
      th.appendChild(LatexUI.crearNodoLatex(col.latex, false, '', col.txt));
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    tabla.appendChild(thead);

    const tbody = document.createElement('tbody');
    Reglas.generarTablaDeVerdad().forEach(function (fila) {
      const esAprobada = fila.F === 1;
      const tr = crearEl(
        'tr',
        'border-b border-slate-500/10 ' +
          (esAprobada ? 'bg-emerald-500/15 font-extrabold text-emerald-400' : 'opacity-85')
      );
      [fila.A, fila.B, fila.C, fila.noC, fila.F, fila.deMorganRechazo].forEach(function (val) {
        tr.appendChild(crearEl('td', 'py-1.5 px-2', String(val)));
      });
      tbody.appendChild(tr);
    });
    tabla.appendChild(tbody);
    wrapTabla.appendChild(tabla);
    cardLogica.appendChild(wrapTabla);
    grilla.appendChild(cardLogica);

    // =========================================================================
    // 4. MÓDULO IV: ÁRBOL DE DECISIÓN (IA) E INVARIANTE DE CONSERVACIÓN MONETARIA
    // =========================================================================
    const cardIA = crearEl('article', 'lg:col-span-5 pg-surface rounded-2xl p-5 space-y-4');
    const cabIA = crearEl('div', 'flex items-center justify-between gap-2 border-b border-slate-500/15 pb-3');
    const titIA = crearEl('div', '');
    titIA.appendChild(
      crearEl(
        'span',
        'text-[10px] font-extrabold uppercase tracking-wider text-purple-400',
        'Módulo IV · Clasificador IA e Invariante de Sistema'
      )
    );
    titIA.appendChild(
      crearEl('h3', 'text-base font-extrabold mt-0.5', 'Árbol de Decisión e Invariante Monetario')
    );
    cabIA.appendChild(titIA);
    cabIA.appendChild(
      LatexUI.crearNodoLatex(
        'h(x) \\in \\{0, 1\\}',
        false,
        'px-2.5 py-1 rounded-lg pg-elevated text-xs font-bold',
        'h(x) in {0,1}'
      )
    );
    cardIA.appendChild(cabIA);

    cardIA.appendChild(
      crearEl(
        'p',
        'text-xs pg-text-muted leading-relaxed',
        'El módulo antifraude implementa un Árbol de Decisión determinista de profundidad 1 (un único nodo raíz de partición sobre el atributo continuo monto) que alimenta directamente la proposición lógica C:'
      )
    );

    cardIA.appendChild(
      LatexUI.crearNodoLatex(
        'h(\\text{monto}) = \\begin{cases} 1 \\;(\\text{Alerta sospechosa } C=1), & \\text{si } \\text{monto} > \\$5.000.000 \\\\ 0 \\;(\\text{Operación normal } C=0), & \\text{si } \\text{monto} \\le \\$5.000.000 \\end{cases}',
        true,
        'pg-elevated rounded-xl p-3 text-xs',
        'h(monto) = 1 si monto > $5.000.000; 0 si monto <= $5.000.000'
      )
    );

    cardIA.appendChild(
      crearEl(
        'p',
        'text-xs pg-text-muted leading-relaxed',
        'Invariante de Conservación de la Masa Monetaria: dado que cada transacción aprobada descuenta (monto + comisión) de la cuenta origen, acredita (monto) en la cuenta destino y acumula (comisión) en la bolsa de la red, la suma global permanece constante en todo instante t:'
      )
    );

    cardIA.appendChild(
      LatexUI.crearNodoLatex(
        '\\forall t \\ge 0: \\quad \\sum_{i=0}^{4} \\text{saldo}_t(v_i) + C_{\\text{acum}, t} = M_0 = \\$78.500.000\\text{ COP}',
        true,
        'pg-elevated rounded-xl p-3 text-xs',
        'Para todo t >= 0: Σ saldo_t(v_i) + C_acum,t = $78.500.000 COP'
      )
    );

    cardIA.appendChild(
      crearEl(
        'div',
        'pg-status-neutral rounded-xl p-3 text-xs leading-relaxed',
        'Nota metodológica: Todas las ecuaciones de esta vista constituyen los axiomas invariantes del sistema. Para observar cómo se evalúan con los números específicos de una transferencia concreta, abre la vista «4. Paso a paso».'
      )
    );

    grilla.appendChild(cardIA);
    contenedorRaiz.appendChild(grilla);
  }

  return Object.freeze({
    inicializarFundamentos: inicializarFundamentos
  });
});
