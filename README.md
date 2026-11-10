# PayGraph — Simulador de Pagos Digitales Seguro y Optimizado

**Proyecto de Aula · Matemáticas Discretas (3.er Semestre)**  
**Programa:** Ingeniería en Ciencias de la Computación e Inteligencia Artificial — Universidad de Santander (UDES)  
**Autores:** Breyner Cermeño Castellanos, Darwin Samuel Machuca Gonzales, Jarik Manuel Rodríguez Morales  
**Docente:** Yudi Caterine Díaz Perdomo

---

## 1. Descripción General

**PayGraph** es una aplicación web interactiva que simula una pasarela de pagos interbancaria integrando cuatro componentes de las Matemáticas Discretas y la Inteligencia Artificial:
1. **Aritmética Modular y Criptografía RSA por Bloques (`js/core/rsa.js`):** cifra el PIN de 4 dígitos en dos bloques de 2 dígitos ($m_i \in [0, 99] < n = 3233$) mediante potenciación modular rápida (`BigInt`) con $p=61, q=53, n=3233, \varphi(n)=3120, e=17$ y clave privada $d=2753$ encapsulada en la clausura del servidor simulado.
2. **Teoría de Grafos y Algoritmo de Dijkstra (`js/core/grafo.js`):** modela las 5 cuentas ($v_0 \dots v_4$) sobre una matriz de adyacencia simétrica $5 \times 5$ y calcula en $O(|V|^2)$ la ruta de comisión mínima y su reconstrucción por predecesores.
3. **Lógica Proposicional sin Cortocircuito (`js/core/reglas.js`):** evalúa siempre las tres proposiciones $A$ (saldo suficiente), $B$ (PIN válido) y $C$ (alerta de fraude) bajo la fórmula $F(T) = A \land B \land (\neg C)$ y desglosa todas las causas de rechazo mediante la ley de De Morgan $\neg F(T) \equiv \neg A \lor \neg B \lor C$.
4. **Árbol de Decisión de un Umbral (`js/core/reglas.js`):** clasifica como operación sospechosa ($C=1$) todo monto estrictamente superior a $\$5.000.000\text{ COP}$.

---

## 2. Cómo Abrir la Consola Backoffice (Doble Clic, sin Servidor)

1. Ubica el archivo [`index.html`](./index.html) en la raíz del proyecto.
2. Haz **doble clic** sobre `index.html` para abrirlo directamente en **Google Chrome**, **Mozilla Firefox** o **Microsoft Edge** (protocolo `file://`).
3. **KaTeX local integrado:** las fórmulas matemáticas se renderizan mediante **KaTeX 0.19.1** empaquetado localmente en `vendor/katex/`, permitiendo visualización matemática de alta fidelidad **100% offline** sin dependencias externas obligatorias.
4. **Navegación por 6 vistas modulares (Backoffice):**
   - **📊 1. Panel General (`#/panel`):** monitoreo de KPIs en tiempo real (Masa monetaria con invariante $\sum \text{saldo}(v_i) + C_{\text{acum}} = M_0$, comisiones acumuladas, tasa de aprobación, latencia matemática media), tabla interactiva de liquidez por entidad con barras porcentuales y libro mayor de órdenes recientes.
   - **⚡ 2. Operar Transferencia (`#/operar`):** terminal de órdenes con franja de cuentas interactivas, montos rápidos, autocompletado de PIN en 1 clic (`🔑 Usar PIN`), selector de inversión (`⇄`), comprobante visual y resumen inmediato de los 3 pilares.
   - **🕸️ 3. Red Interbancaria (`#/red`):** mapa topológico a pantalla completa del grafo $G=(V, E, w)$, matriz de adyacencia $M$, matriz de costos mínimos $D$ y tabla viva de relajación de Dijkstra para el par seleccionado.
   - **🔍 4. Paso a Paso (`#/pasos`):** stepper vertical con fórmulas LaTeX que sustituyen los números reales de la transacción (RSA, Dijkstra y Lógica/IA), controles de reproducción secuencial (`▶ ⏸ ⏭`, selector de velocidad) y modo didáctico con descifrado demostrativo.
   - **📐 5. Fundamentos (`#/fundamentos`):** explicación teórica formal separada de la operación activa: módulo RSA con justificación de bloques de 2 dígitos y laboratorio en vivo, optimización en grafos, tabla de verdad completa de 8 filas y clasificador de árbol de decisión.
   - **📜 6. Auditoría y Trazas (`#/auditoria`):** bitácora técnica acumulativa con copiado al portapapeles y enmascaramiento estricto de credenciales.
5. **Casos de prueba rápida:** despliega el menú **«⚡ Escenarios Didácticos»** en la barra superior para ejecutar los vectores canónicos de prueba (S1 a S4) en un solo clic de forma limpia, organizada y sin sobrecargar la pantalla.

---

## 3. Cómo Ejecutar las Pruebas Automatizadas

El núcleo matemático (`js/core/`) utiliza un patrón UMD clásico sin dependencias externas y cuenta con una suite de 24 pruebas en Node.js (`node:assert/strict`) que verifica todos los vectores de prueba:

```bash
node tests/run.js
```

También puedes abrir la consola de desarrollador del navegador (`F12`) con `index.html` abierto y ejecutar:

```javascript
PayGraph.verificar()
```

---

## 4. Estructura del Proyecto

```text
paygraph/
  index.html                        # Consola Backoffice SPA con 6 vistas (compatible con file://)
  vendor/
    katex/                          # KaTeX 0.19.1 local (offline, CSS, JS y fuentes WOFF2)
  css/
    styles.css                      # Tokens Backoffice, tema oscuro (por defecto) y claro, KaTeX y animaciones
  js/
    core/
      datos.js                      # Parámetros RSA públicos, matriz M 5x5, cuentas semilla y escenarios
      rsa.js                        # modPow (BigInt), Euclides extendido, bloques de 2 dígitos y clausura d
      grafo.js                      # Dijkstra O(|V|^2), reconstrucción de ruta y Floyd-Warshall
      reglas.js                     # Regla F(T) = A ∧ B ∧ ¬C, De Morgan, tabla de verdad y árbol IA
      transaccion.js                # Pipeline de 7 pasos, validación en borde e invariante monetario
    ui/
      latex.js                      # Envoltorio KaTeX seguro, animador de números y transiciones
      router.js                     # Enrutador por hash para las 6 vistas independientes
      dashboard.js                  # KPIs animados, tabla de liquidez, ledger y matrices M y D
      fundamentos.js                # Vista de teoría matemática formal y laboratorio interactivo RSA
      canvas.js                     # Lienzo HTML5 Canvas HiDPI interactivo y animaciones de ruta
      panel.js                      # Stepper vertical paso a paso con fórmulas LaTeX sustituidas
      terminal.js                   # Bitácora monoespaciada acumulativa (copiable y sin PIN en claro)
      escenarios.js                 # Botonera de los 4 escenarios didácticos (S1..S4)
      main.js                       # Orquestación de interfaz, tema claro/oscuro y PayGraph.verificar()
  tests/
    run.js                          # Suite de pruebas automatizadas con assert nativo de Node.js
  design/
    DESIGN.md                       # Especificación del sistema de diseño, componentes y 9 estados
    design-tokens.json              # Tokens de color, tipografía, espaciado 4/8, radios y movimiento
    capturas/                       # Evidencias visuales de las 6 vistas (oscuro, claro, móvil y escenarios)
  docs/
    modelo_matematico.md            # Desarrollo matemático completo y verificado en LaTeX
    6.2_marco_conceptual.md         # Glosario conceptual (15 términos) para el documento del equipo
    6.3_marco_tecnologico.md        # Matriz tecnológica, arquitectura y límites asumidos
  fuentes/
    Documento_Final_de_Proyecto_de_Aula.md
    proyecto_maatematicas_discretas_bancos_docx.md
  extras/
    customtkinter/                  # Tarea independiente (§10): entorno virtual aislado y smoke test
  README.md
```

---

## 5. Supuestos Académicos Declarados

1. **Datos semilla editables (`js/core/datos.js`):** las cinco cuentas ($v_0$ Usuario A con $\$8.000.000$ y PIN `1234`, $v_1$ Banco Alfa con $\$40.000.000$ y PIN `2468`, $v_2$ Usuario B con $\$3.500.000$ y PIN `1357`, $v_3$ Banco Beta con $\$25.000.000$ y PIN `9753`, y $v_4$ Usuario C con $\$2.000.000$ y PIN `4096`) son valores ficticios configurables en un único archivo.
2. **Corrección del cifrado de PIN por bloques:** dado que $n = 3233 < 9999$, cifrar un PIN de 4 dígitos como un solo entero produce colisiones para todo $\text{PIN} \ge 3233$ ($3300 \mapsto 67$, $4000 \mapsto 767$). Por ello dividimos cada PIN en dos bloques de 2 dígitos $[m_1, m_2] \in [0, 99]^2$.
3. **Conservación de la masa monetaria:** los nodos intermediarios en una ruta (como $v_1$ Banco Alfa en la ruta $v_0 \to v_1 \to v_4$) actúan como conmutadores de red y no alteran su saldo; la comisión descontada al nodo origen se acumula en `comisionesAcumuladas`, manteniendo constante la suma $\sum \text{saldos} + \text{comisionesAcumuladas} = \$78.500.000\text{ COP}$.

---

## 6. Exportación de Documentos a Microsoft Word (`.docx`)

Los tres documentos en `docs/` están escritos en Markdown con ecuaciones LaTeX (`$...$`). Para convertirlos a archivos de Word usando Pandoc:

```bash
pandoc docs/modelo_matematico.md -o docs/modelo_matematico.docx
pandoc docs/6.2_marco_conceptual.md -o docs/6.2_marco_conceptual.docx
pandoc docs/6.3_marco_tecnologico.md -o docs/6.3_marco_tecnologico.docx
```
