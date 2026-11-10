# Sistema de Diseño UI/UX — PayGraph

## 1. Filosofía y Principio Rector: Consola Backoffice Bancaria Modular

PayGraph se estructura como una **consola operativa de backoffice bancario y tesorería** con navegación lateral persistente, animaciones sutiles a 60 fps y renderizado matemático formal mediante **KaTeX**:

### Estructura de las 6 Vistas Independientes
1. **📊 1. Panel General (`#/panel`):** monitoreo de KPIs de tesorería (Masa monetaria global con verificación del invariante, bolsa de comisiones de red, órdenes procesadas, tasa de aprobación y latencia media), tabla viva de liquidez por entidad con barras porcentuales de participación y libro mayor de transacciones recientes.
2. **⚡ 2. Operar Transferencia (`#/operar`):** terminal de emisión con franja de cuentas interactivas, montos rápidos, autocompletado de PIN en 1 clic (`🔑 Usar PIN`), inversión de flujo (`⇄`), comprobante visual y desglose en vivo antes de autorizar.
3. **🕸️ 3. Red Interbancaria (`#/red`):** mapa topológico espacial completo del grafo $G=(V, E, w)$, matriz de adyacencia simétrica $M$ en LaTeX, matriz de costos mínimos $D$ en LaTeX y tabla de relajación paso a paso de Dijkstra para el par seleccionado.
4. **🔍 4. Paso a Paso (`#/pasos`):** stepper vertical interactivo donde cada fase de la última operación muestra sus **ecuaciones en LaTeX con los valores reales sustituidos** (bloques cifrados, vector de distancias y evaluación booleana $F(T)$), controles de reproducción secuencial (`▶ ⏸ ⏭`) y modo didáctico con descifrado demostrativo.
5. **📐 5. Fundamentos Matemáticos (`#/fundamentos`):** desarrollo teórico axiomático separado e independiente de la transacción activa: formulación RSA y justificación del particionado en bloques de 2 dígitos, laboratorio interactivo de cifrado en vivo, formulación de grafos y Dijkstra, tabla de verdad completa de 8 filas y clasificador de árbol de decisión IA.
6. **📜 6. Auditoría y Trazas (`#/auditoria`):** registro inmutable de auditoría con enmascaramiento estricto de credenciales y botón de copia al portapapeles.

---

## 2. Integración con KaTeX (Offline) y Trazabilidad de Artefactos

- **KaTeX 0.19.1 local (`vendor/katex/`):** empaquetado en el repositorio con hojas de estilo, scripts y fuentes tipográficas WOFF2 para garantizar renderizado matemático de alta fidelidad **100% offline** mediante protocolo `file://`.
- **Fórmulas enriquecidas con valores reales:** en la vista «Paso a paso», las ecuaciones matemáticas no son plantillas estáticas: sustituyen dinámicamente los bloques reales $m_1, m_2$, los valores cifrados $c_1, c_2$, las distancias calculadas y las proposiciones $A, B, C$.
- **Animaciones suaves:** transiciones CSS `cubic-bezier(0.22, 1, 0.36, 1)`, contadores numéricos animados con interpolación cúbica e insignias de estado con micro-pulsos. Desactivación garantizada ante `prefers-reduced-motion: reduce`.
- **Figma Design y FigJam:**
  - Figma Design: [https://www.figma.com/design/mYZSybymT6PRKU89OrV29D](https://www.figma.com/design/mYZSybymT6PRKU89OrV29D) (`file_key: mYZSybymT6PRKU89OrV29D`)
  - FigJam Diagram: [https://www.figma.com/board/WQc2fIoUkVdml2QEpCxQDC](https://www.figma.com/board/WQc2fIoUkVdml2QEpCxQDC)

---

## 3. Tokens de Diseño (`design-tokens.json`)

### 3.1 Paleta Semántica (Claro y Oscuro con Contraste WCAG 2.2 AA)
| Token CSS | Modo Claro | Modo Oscuro | Uso en la Interfaz |
|---|---|---|---|
| `--bg-canvas` | `#F4F7FB` | `#090D16` | Lienzo principal de la red interbancaria |
| `--bg-surface` | `#FFFFFF` | `#111827` | Tarjeta de transferencia y cajón técnico |
| `--bg-elevated` | `#EEF2F8` | `#1E293B` | Chips, pestañas inactivas y controles secundarios |
| `--text-primary` | `#0F172A` | `#F8FAFC` | Títulos, saldos y valores principales ($\ge 16:1$) |
| `--text-secondary` | `#334155` | `#CBD5E1` | Etiquetas de formulario y pasos ($\ge 9:1$) |
| `--text-muted` | `#475569` | `#94A3B8` | Pistas y metadatos ($\ge 6.1:1$, cumple AA) |
| `--accent-primary` | `#0369A1` | `#38BDF8` | Nodo origen seleccionado y acción principal |
| `--accent-destination` | `#6D28D9` | `#C084FC` | Nodo destino seleccionado |
| `--route-optimal` | `#0D9488` | `#2DD4BF` | Aristas de la ruta óptima de Dijkstra y paquete móvil |
| `--semantic-success` | `#15803D` | `#4ADE80` | Transferencia aprobada ($F(T)=1$) |
| `--semantic-warning` | `#B45309` | `#FBBF24` | Alerta del Árbol de Decisión ($C=1$) |
| `--semantic-danger` | `#B91C1C` | `#F87171` | Transferencia rechazada ($F(T)=0$) y errores de validación |

### 3.2 Tipografía y Grilla Espacial
- **Familias tipográficas:**
  - Interfaz y lectura general (`--font-sans`): `'Inter', system-ui, -apple-system, sans-serif`.
  - Fórmulas, tokens cifrados, matrices y terminal (`--font-mono`): `'JetBrains Mono', 'Fira Code', Consolas, monospace` con `font-variant-numeric: tabular-nums`.
- **Grilla base 8 px (subgrilla 4 px):** espaciados en múltiplos estrictos (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`).
- **Objetivos táctiles:** altura y anchura mínima de `44px × 44px` en todos los botones, selectores, interruptores y pestañas.

### 3.3 Movimiento y Rendimiento
- **Transiciones de interfaz:** `120ms` a `280ms` con curva `cubic-bezier(0.22, 1, 0.36, 1)` (*ease-out*), animando únicamente `transform` y `opacity`.
- **Reproducción en el lienzo:** dibujo progresivo de las aristas óptimas y paquete luminoso que recorre la ruta con velocidad ajustable (`0.5x`, `1x`, `2x`) mediante `requestAnimationFrame`.
- **Respeto a `prefers-reduced-motion: reduce`:** desactiva el desplazamiento del paquete, el conteo progresivo de saldos y la vibración de rechazo, aplicando actualizaciones instantáneas.

---

## 4. Inventario de Componentes

1. **Barra Flotante Superior Izquierda (`Escenarios + Controles Globales`):**
   - Menú desplegable / botonera compacta **«Escenarios didácticos»** (`S1`, `S2`, `S3`, `S4`).
   - Interruptor **«Ver comisiones»** en las aristas del grafo.
   - Botón **«Reiniciar simulación»** (restaura saldos semilla y limpia comisiones acumuladas).
   - Conmutador de tema **Claro / Oscuro** (sincronizado con `prefers-color-scheme`).
2. **Lienzo Interactivo del Grafo (`js/ui/canvas.js`):**
   - Escalado nítido con `window.devicePixelRatio`.
   - Nodos diferenciados por forma e icono: Usuarios ($v_0, v_2, v_4$) y Bancos ($v_1, v_3$).
   - Selección por clic o teclado: 1.er clic fija **Origen**, 2.º clic fija **Destino**, 3.er clic reinicia selección.
   - Muestra el peso $w(u,v)$ al pasar el cursor sobre una arista o en todas las aristas al activar «Ver comisiones».
3. **Tarjeta Compacta de Transferencia:**
   - Selectores accesibles `<select>` para Origen y Destino (alternativa completa por teclado al lienzo).
   - Campo numérico de Monto en COP y campo de PIN de 4 dígitos (`inputmode="numeric"`, `maxlength="4"`).
   - Mensajes de error de validación en línea junto a cada campo (`role="alert"`).
   - Banner de resultado con icono + título + lista completa de razones de rechazo + chip de latencia RNF-01 (`x.xx ms`).
4. **Cajón Técnico Inferior (`js/ui/panel.js` y `js/ui/terminal.js`):**
   - Se abre con el botón **«Ver cómo funciona»** (y automáticamente al lanzar un escenario didáctico).
   - Controles de reproducción paso a paso: `▶ Reproducir / ⏸ Pausar`, `⏭ Siguiente paso`, selector de velocidad (`0.5x`, `1x`, `2x`) e interruptor **«Modo didáctico (solo demostración)»** (desactivado por defecto; cuando se activa, muestra los bloques descifrados con aviso explícito).
   - **4 Pestañas:**
     - **RSA:** partición en 2 bloques, potenciación modular rápida ($17 = 10001_2$) y verificación en el servidor simulado.
     - **Grafo:** iteraciones de Dijkstra paso a paso, ruta óptima y matriz de costos mínimos $D$.
     - **Lógica e IA:** evaluación de $A, B, C$ sin cortocircuito, representación visual del Árbol de Decisión ($monto > \$5.000.000$) y tabla de verdad resaltando la fila activa.
     - **Terminal:** bitácora monoespaciada acumulativa (`aria-live="polite"`) con botones **«Copiar registro»** y **«Limpiar»**.

---

## 5. Matriz de los 9 Estados de Interfaz

| # | Estado | Indicador en Lienzo (Canvas) | Indicador en Tarjeta y Banner (` icono + color + texto `) |
|---|---|---|---|
| 1 | **Reposo** | Nodos en estilo neutro; aristas suaves; leyenda de clic (1.º origen, 2.º destino). | Formulario listo; banner neutro indicando seleccionar origen y destino. |
| 2 | **Origen seleccionado** | Anillo azul (`--accent-primary`) y etiqueta `ORIGEN` sobre el nodo elegido. | Selector «Origen» sincronizado; pista indica elegir el nodo destino. |
| 3 | **Destino seleccionado** | Anillo violeta (`--accent-destination`), etiqueta `DESTINO` y previsualización punteada de la ruta óptima. | Selector «Destino» sincronizado y vista previa de comisión mínima estimada. |
| 4 | **Procesando / Reproduciendo** | La ruta óptima se traza progresivamente (`--route-optimal`) y el paquete recorre los tramos. | Indicador de paso activo sincronizado con los controles `▶ ⏸ ⏭`. |
| 5 | **Aprobada ($F=1$)** | Pulso radial verde en el nodo destino y actualización animada de los saldos en origen y destino. | Banner verde (`CheckCircle2`): «Transferencia aprobada» + resumen de descuento y comisión + chip `< 100 ms`. |
| 6 | **Rechazada por PIN ($B=0$)** | Vibración horizontal sutil ($\le 180\text{ ms}$) en el nodo origen; saldos sin cambios. | Banner rojo (`ShieldAlert`): «Transferencia rechazada — PIN incorrecto.» |
| 7 | **Rechazada por saldo ($A=0$)** | Vibración horizontal sutil ($\le 180\text{ ms}$) en el nodo origen; saldos sin cambios. | Banner rojo (`WalletCards`): «Saldo insuficiente: necesitas $X (monto + comisión) y tienes $Y.» |
| 8 | **Rechazada por fraude IA ($C=1$)** | Vibración sutil y halo ámbar (`--semantic-warning`) sobre la operación bloqueada. | Banner ámbar/rojo (`AlertTriangle`): «Alerta de fraude (IA): monto superior a $5.000.000.» |
| 9 | **Error de validación** | Lienzo permanece estable sin ejecutar el pipeline matemático. | Borde rojo y mensaje específico junto al campo inválido (`origen = destino`, `monto <= 0`, `PIN` mal formado). |
