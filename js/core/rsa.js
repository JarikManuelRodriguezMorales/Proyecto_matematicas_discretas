/**
 * @file rsa.js
 * @description Módulo de aritmética modular y criptografía RSA simplificada por bloques.
 * Implementa potenciación modular rápida (BigInt), algoritmo de Euclides extendido,
 * cifrado en cliente de PIN de 4 dígitos en 2 bloques de 2 dígitos, y servidor simulado
 * con clave privada d encapsulada en clausura.
 */
(function (root, factory) {
  'use strict';
  const namespace = (root.PayGraph = root.PayGraph || {});
  const datos =
    namespace.Datos ||
    (typeof require === 'function' ? require('./datos.js') : null);
  const modulo = factory(datos);
  namespace.Rsa = modulo;
  if (typeof module === 'object' && module.exports) {
    module.exports = modulo;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Datos) {
  'use strict';

  const EXP_PUBLICO = Datos.RSA_PUBLICO.e;
  const MODULO_N = Datos.RSA_PUBLICO.n;
  const PHI_N = Datos.RSA_PUBLICO.phi;
  const PATRON_PIN = /^\d{4}$/;

  /**
   * Calcula la potenciación modular rápida mediante cuadrados sucesivos.
   * Fórmula: \text{modPow}(b, e, n) = b^e \bmod n
   * Complejidad temporal: O(\log_2 e) multiplicaciones modulares usando BigInt.
   *
   * @param {number|bigint} base - Base entera no negativa b.
   * @param {number|bigint} exponente - Exponente entero no negativo e.
   * @param {number|bigint} modulo - Módulo entero positivo n > 0.
   * @returns {number} Residuo en [0, n - 1].
   */
  function modPow(base, exponente, modulo) {
    const m = BigInt(modulo);
    if (m <= 0n) {
      throw new RangeError('El módulo n debe ser un entero positivo.');
    }
    let e = BigInt(exponente);
    if (e < 0n) {
      throw new RangeError('El exponente e no puede ser negativo.');
    }
    let b = ((BigInt(base) % m) + m) % m;
    let resultado = 1n % m;

    while (e > 0n) {
      if ((e & 1n) === 1n) {
        resultado = (resultado * b) % m;
      }
      b = (b * b) % m;
      e >>= 1n;
    }
    return Number(resultado);
  }

  /**
   * Ejecuta potenciación modular rápida registrando cada iteración bit a bit.
   * Fórmula: b^e \bmod n = \prod_{k : e_k = 1} \left(b^{2^k} \bmod n\right) \bmod n
   *
   * @param {number} base - Mensaje o bloque entero b.
   * @param {number} exponente - Exponente entero e.
   * @param {number} modulo - Módulo entero n.
   * @returns {{ resultado: number, pasos: Array<Object> }} Resultado y traza paso a paso.
   */
  function modPowConPasos(base, exponente, modulo) {
    const m = BigInt(modulo);
    let e = BigInt(exponente);
    let b = ((BigInt(base) % m) + m) % m;
    let acumulador = 1n % m;
    const pasos = [];
    let indiceBit = 0;

    while (e > 0n) {
      const bitActual = Number(e & 1n);
      const baseAntes = Number(b);
      const acumuladorAntes = Number(acumulador);
      if (bitActual === 1) {
        acumulador = (acumulador * b) % m;
      }
      const acumuladorDespues = Number(acumulador);
      const baseCuadrado = (b * b) % m;

      pasos.push({
        iteracion: indiceBit,
        exponenteRestante: Number(e),
        bitBinario: bitActual,
        baseModular: baseAntes,
        acumuladorPrevio: acumuladorAntes,
        multiplica: bitActual === 1,
        acumuladorNuevo: acumuladorDespues,
        siguienteBaseCuadrada: Number(baseCuadrado)
      });

      b = baseCuadrado;
      e >>= 1n;
      indiceBit += 1;
    }

    return {
      resultado: Number(acumulador),
      pasos: pasos
    };
  }

  /**
   * Algoritmo de Euclides extendido para hallar mcd(a, b) y coeficientes de Bézout.
   * Fórmula: a \cdot x + b \cdot y = \gcd(a, b)
   *
   * @param {number} a - Primer entero positivo (por ejemplo, e = 17).
   * @param {number} b - Segundo entero positivo (por ejemplo, φ(n) = 3120).
   * @returns {{ mcd: number, x: number, y: number, inversoPositivo: number, pasos: Array<Object> }}
   */
  function euclidesExtendido(a, b) {
    let rViejo = Math.trunc(a);
    let rActual = Math.trunc(b);
    let sViejo = 1;
    let sActual = 0;
    let tViejo = 0;
    let tActual = 1;
    const pasos = [];
    let paso = 1;

    while (rActual !== 0) {
      const cociente = Math.trunc(rViejo / rActual);
      const residuo = rViejo - cociente * rActual;
      const sNuevo = sViejo - cociente * sActual;
      const tNuevo = tViejo - cociente * tActual;

      pasos.push({
        paso: paso,
        dividendo: rViejo,
        divisor: rActual,
        cociente: cociente,
        residuo: residuo,
        s: sNuevo,
        t: tNuevo
      });

      rViejo = rActual;
      rActual = residuo;
      sViejo = sActual;
      sActual = sNuevo;
      tViejo = tActual;
      tActual = tNuevo;
      paso += 1;
    }

    const inversoPositivo = ((sViejo % b) + b) % b;
    return {
      mcd: rViejo,
      x: sViejo,
      y: tViejo,
      inversoPositivo: inversoPositivo,
      pasos: pasos
    };
  }

  /**
   * Valida que el PIN sea una cadena exacta de 4 dígitos decimales ('0000'..'9999').
   * Fórmula: \text{pin} \in \{0,1,\dots,9\}^4
   *
   * @param {string} pin - Cadena de 4 dígitos.
   * @returns {boolean} true si cumple exactamente ^\d{4}$.
   */
  function esPinFormatoValido(pin) {
    return typeof pin === 'string' && PATRON_PIN.test(pin);
  }

  /**
   * Divide un PIN de 4 dígitos en dos bloques enteros de 2 dígitos cada uno.
   * Fórmula: \text{PIN} = d_1 d_2 d_3 d_4 \mapsto [m_1, m_2] = [10 d_1 + d_2,\; 10 d_3 + d_4] \in [0, 99]^2
   * Como 99 < n = 3233, garantiza biyectividad RSA en cada bloque (m_i < n).
   *
   * @param {string} pin - Cadena de 4 dígitos ('0000' a '9999').
   * @returns {Array<number>} Par de bloques enteros [m1, m2].
   */
  function dividirPinEnBloques(pin) {
    if (!esPinFormatoValido(pin)) {
      throw new TypeError('El PIN debe ser una cadena de exactamente 4 dígitos numéricos.');
    }
    const bloqueAlto = Number.parseInt(pin.slice(0, 2), 10);
    const bloqueBajo = Number.parseInt(pin.slice(2, 4), 10);
    return [bloqueAlto, bloqueBajo];
  }

  /**
   * Reconstruye la cadena de 4 dígitos a partir de dos bloques enteros en [0, 99],
   * preservando ceros a la izquierda en cada bloque de 2 dígitos.
   * Fórmula: [m_1, m_2] \mapsto \text{pad}_2(m_1) \mathbin{\Vert} \text{pad}_2(m_2)
   *
   * @param {Array<number>} bloques - Par de enteros [m1, m2] en [0, 99].
   * @returns {string} PIN reconstruido de 4 caracteres.
   */
  function reconstruirPinDesdeBloques(bloques) {
    if (!Array.isArray(bloques) || bloques.length !== 2) {
      throw new TypeError('Se requieren exactamente 2 bloques para reconstruir el PIN.');
    }
    const b0 = Number(bloques[0]);
    const b1 = Number(bloques[1]);
    if (
      !Number.isInteger(b0) ||
      !Number.isInteger(b1) ||
      b0 < 0 ||
      b0 > 99 ||
      b1 < 0 ||
      b1 > 99
    ) {
      throw new RangeError('Cada bloque descifrado debe ser un entero en el rango [0, 99].');
    }
    return String(b0).padStart(2, '0') + String(b1).padStart(2, '0');
  }

  /**
   * Cifra un bloque entero m < n con la clave pública (e, n).
   * Fórmula: c = m^e \bmod n = m^{17} \bmod 3233
   *
   * @param {number} mensaje - Entero m en [0, n - 1].
   * @param {number} [e=EXP_PUBLICO] - Exponente público RSA.
   * @param {number} [n=MODULO_N] - Módulo RSA.
   * @returns {number} Criptograma c en [0, n - 1].
   */
  function cifrarEntero(mensaje, e, n) {
    const exp = e !== undefined ? e : EXP_PUBLICO;
    const mod = n !== undefined ? n : MODULO_N;
    const m = Number(mensaje);
    if (!Number.isInteger(m) || m < 0 || m >= mod) {
      throw new RangeError('El bloque m debe ser un entero tal que 0 <= m < n.');
    }
    return modPow(m, exp, mod);
  }

  /**
   * Cifra en el cliente un PIN de 4 dígitos dividiéndolo en 2 bloques de 2 dígitos.
   * Fórmula: [m_1, m_2] \mapsto [c_1, c_2] = [m_1^{17} \bmod 3233,\; m_2^{17} \bmod 3233]
   * Seguridad: no retorna el PIN en texto plano para evitar su exposición en logs/DOM.
   *
   * @param {string} pin - Cadena de 4 dígitos.
   * @returns {{
   *   bloquesCifrados: [number, number],
   *   tokenFormateado: string,
   *   trazaBloque1: Object,
   *   trazaBloque2: Object,
   *   bloquesDemostracion: [number, number]
   * }}
   */
  function cifrarPinPorBloques(pin) {
    const bloques = dividirPinEnBloques(pin);
    const traza1 = modPowConPasos(bloques[0], EXP_PUBLICO, MODULO_N);
    const traza2 = modPowConPasos(bloques[1], EXP_PUBLICO, MODULO_N);
    const bloquesCifrados = [traza1.resultado, traza2.resultado];

    return {
      bloquesCifrados: bloquesCifrados,
      tokenFormateado: '[' + bloquesCifrados[0] + ', ' + bloquesCifrados[1] + ']',
      trazaBloque1: traza1,
      trazaBloque2: traza2,
      bloquesDemostracion: bloques
    };
  }

  /**
   * Demuestra por qué cifrar un PIN de 4 dígitos como un solo entero m falla cuando m >= n = 3233.
   * Fórmula defectuosa: \tilde{m} = (m^e \bmod n)^d \bmod n = m \bmod n \neq m \quad (\forall m \ge 3233)
   *
   * @param {number} pinComoEntero - Valor entero del PIN (ej. 3300 o 4000).
   * @returns {{ original: number, cifrado: number, descifradoDefectuoso: number, colisionaCon: number }}
   */
  function demostrarDefectoPinSinBloques(pinComoEntero) {
    const dDerivado = euclidesExtendido(EXP_PUBLICO, PHI_N).inversoPositivo;
    const cifrado = modPow(pinComoEntero, EXP_PUBLICO, MODULO_N);
    const descifrado = modPow(cifrado, dDerivado, MODULO_N);
    return {
      original: pinComoEntero,
      cifrado: cifrado,
      descifradoDefectuoso: descifrado,
      colisionaCon: pinComoEntero % MODULO_N
    };
  }

  /**
   * Cuenta y lista los puntos fijos de RSA donde m^e ≡ m (mod n) en [0, n - 1].
   * Fórmula teórica: (1 + \gcd(e - 1, p - 1)) \cdot (1 + \gcd(e - 1, q - 1)) = 25.
   *
   * @returns {Array<number>} Lista de los 25 mensajes invariantes bajo cifrado.
   */
  function obtenerPuntosFijosRSA() {
    const puntosFijos = [];
    for (let m = 0; m < MODULO_N; m += 1) {
      if (modPow(m, EXP_PUBLICO, MODULO_N) === m) {
        puntosFijos.push(m);
      }
    }
    return puntosFijos;
  }

  /**
   * Crea una instancia del Servidor Simulado que encapsula en clausura privada:
   * 1) La clave privada d = 2753 (derivada de 17 * d ≡ 1 mod 3120).
   * 2) El registro de tokens cifrados / PINs de las cuentas semilla.
   * Ninguna propiedad pública del objeto retornado expone d ni los PIN en claro.
   *
   * @param {Array<Object>} [cuentasSemilla=Datos.CUENTAS_SEMILLA] - Cuentas con pinSemilla.
   * @returns {Object} Interfaz pública del servidor simulado.
   */
  function crearServidorSimulado(cuentasSemilla) {
    const listaCuentas = cuentasSemilla || Datos.CUENTAS_SEMILLA;
    const calculoEuclides = euclidesExtendido(EXP_PUBLICO, PHI_N);
    const CLAVE_PRIVADA_D = calculoEuclides.inversoPositivo; // 2753, oculta en clausura

    // Almacena los PIN registrados dentro de la clausura del servidor
    const registroPinPorCuenta = new Map();
    for (let i = 0; i < listaCuentas.length; i += 1) {
      const cuenta = listaCuentas[i];
      registroPinPorCuenta.set(cuenta.id, String(cuenta.pinSemilla));
    }

    /**
     * Descifra un entero c usando la clave privada d encapsulada en el servidor.
     * Fórmula: m = c^d \bmod n = c^{2753} \bmod 3233
     *
     * @param {number} criptograma - Bloque cifrado c en [0, n - 1].
     * @returns {number} Entero descifrado m en [0, n - 1].
     */
    function descifrarEnteroPrivado(criptograma) {
      const c = Number(criptograma);
      if (!Number.isInteger(c) || c < 0 || c >= MODULO_N) {
        throw new RangeError('El criptograma c debe ser un entero en [0, n - 1].');
      }
      return modPow(c, CLAVE_PRIVADA_D, MODULO_N);
    }

    /**
     * Descifra un par de bloques cifrados [c1, c2] y reconstruye el PIN de 4 dígitos.
     * Fórmula: [c_1, c_2] \mapsto [c_1^{2753} \bmod 3233,\; c_2^{2753} \bmod 3233] \mapsto \text{PIN}
     *
     * @param {Array<number>} bloquesCifrados - Par [c1, c2].
     * @returns {{ bloquesDescifrados: [number, number], pinReconstruido: string }}
     */
    function descifrarBloquesPin(bloquesCifrados) {
      if (!Array.isArray(bloquesCifrados) || bloquesCifrados.length !== 2) {
        throw new TypeError('El token cifrado debe contener exactamente 2 bloques.');
      }
      const m1 = descifrarEnteroPrivado(bloquesCifrados[0]);
      const m2 = descifrarEnteroPrivado(bloquesCifrados[1]);
      const pinReconstruido = reconstruirPinDesdeBloques([m1, m2]);
      return {
        bloquesDescifrados: [m1, m2],
        pinReconstruido: pinReconstruido
      };
    }

    /**
     * Verifica en el servidor simulado si el token cifrado coincide con el PIN registrado
     * de la cuenta origen (proposición B).
     * Fórmula: B \iff (\text{descifrar}([c_1, c_2]) = \text{PIN}_{\text{registrado}}(v_{\text{origen}}))
     *
     * @param {number} idCuentaOrigen - Índice del nodo origen (0..4).
     * @param {Array<number>} bloquesCifrados - Par de criptogramas [c1, c2].
     * @returns {{
     *   pinValido: boolean,
     *   bloquesCifradosRecibidos: [number, number],
     *   bloquesCifradosEsperados: [number, number],
     *   bloquesDescifradosDemo: [number, number]
     * }}
     */
    function verificarAutenticacionPin(idCuentaOrigen, bloquesCifrados) {
      if (!registroPinPorCuenta.has(idCuentaOrigen)) {
        throw new RangeError('Cuenta de origen no registrada en el servidor.');
      }
      const pinRegistrado = registroPinPorCuenta.get(idCuentaOrigen);
      const bloquesEsperados = cifrarPinPorBloques(pinRegistrado).bloquesCifrados;
      const resultadoDescifrado = descifrarBloquesPin(bloquesCifrados);
      const coincide = resultadoDescifrado.pinReconstruido === pinRegistrado;

      return {
        pinValido: coincide,
        bloquesCifradosRecibidos: [bloquesCifrados[0], bloquesCifrados[1]],
        bloquesCifradosEsperados: bloquesEsperados,
        bloquesDescifradosDemo: resultadoDescifrado.bloquesDescifrados
      };
    }

    return Object.freeze({
      verificarAutenticacionPin: verificarAutenticacionPin,
      descifrarEntero: descifrarEnteroPrivado,
      descifrarBloquesPin: descifrarBloquesPin
    });
  }

  return Object.freeze({
    modPow: modPow,
    modPowConPasos: modPowConPasos,
    euclidesExtendido: euclidesExtendido,
    esPinFormatoValido: esPinFormatoValido,
    dividirPinEnBloques: dividirPinEnBloques,
    reconstruirPinDesdeBloques: reconstruirPinDesdeBloques,
    cifrarEntero: cifrarEntero,
    cifrarPinPorBloques: cifrarPinPorBloques,
    demostrarDefectoPinSinBloques: demostrarDefectoPinSinBloques,
    obtenerPuntosFijosRSA: obtenerPuntosFijosRSA,
    crearServidorSimulado: crearServidorSimulado
  });
});
