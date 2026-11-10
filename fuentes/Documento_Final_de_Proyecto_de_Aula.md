# PROYECTO DE AULA: PAYGRAPH

## Sistema de Pagos Digitales Seguro y Optimizado Mediante Estructuras Discretas e Inteligencia Artificial

**Programa:** Ingeniería en Ciencias de la Computación e Inteligencia Artificial

**Asignatura:** Matemáticas Discretas – 3.er Semestre

**Equipo de Trabajo:** Proyecto de Aula Integrador

### 1. Resumen

Este proyecto consiste en el desarrollo de una aplicación web interactiva (PayGraph) que simula el funcionamiento de una pasarela de pagos digitales. El objetivo principal fue tomar los conceptos teóricos que vimos en la materia de Matemáticas Discretas e integrarlos con algoritmos sencillos de Inteligencia Artificial para resolver problemas reales de seguridad, cálculo de comisiones y prevención de fraude en transferencias.

Para la seguridad, el sistema usa una versión sencilla del cifrado RSA con aritmética modular ($c = m^e \pmod n$) para no enviar claves en texto plano. Las transferencias entre cuentas las modelamos como un grafo dirigido ponderado $G=(V,E)$ manejado con una matriz de adyacencia para encontrar la ruta con la comisión más barata. Además, pusimos un motor de reglas basado en lógica proposicional $F(T) = A \land B \land (\neg C)$ integrado con un Árbol de Decisión en IA para detectar transacciones sospechosas antes de procesarlas. Al final, creamos una plataforma web interactiva donde se puede ver en tiempo real cómo funciona la matemática y la lógica detrás de cada pago.

**Palabras clave:** Matemáticas Discretas, Teoría de Grafos, Aritmética Modular, Lógica Proposicional, Inteligencia Artificial.

### 2. Introducción

Hoy en día, casi todos usamos aplicaciones como Nequi, Daviplata o pasarelas de pago para mover dinero o comprar por internet. Sin embargo, cuando uno empieza a estudiar Ingeniería de Sistemas o Inteligencia Artificial, se da cuenta de que detrás de un simple botón de "Transferir" hay un montón de problemas por resolver: ¿cómo aseguramos que nadie robe la clave en el camino?, ¿cómo se calcula cuál es la ruta más rápida o económica si el dinero pasa por varios bancos?, y ¿cómo se detiene un intento de fraude antes de que sea tarde?

La idea de este proyecto nació porque muchas veces en clase sentimos que las Matemáticas Discretas se quedan en fórmulas abstractas sobre el papel. Quisimos cambiar eso y demostrar que la teoría de números es la base de la criptografía actual, que la teoría de grafos sirve para modelar la infraestructura de redes y que la lógica proposicional es el cimiento de la programación y los condicionales en las máquinas de estado.

El documento está organizado así: en la Sección 3 planteamos lo que queríamos lograr con el proyecto; en la Sección 4 explicamos el problema y por qué vale la pena resolverlo; en la Sección 5 resumimos las bases teóricas que investigamos; en la Sección 6 mostramos cómo trabajamos paso a paso; en la Sección 7 dejamos claro qué alcanza a hacer el software y qué no; en la Sección 8 listamos los requerimientos; en la Sección 9 mostramos la arquitectura y las fórmulas; en la Sección 10 las herramientas utilizadas; y cerramos con los impactos, recomendaciones a futuro, referencias y apéndices.

### 3. Objetivos

#### 3.1 Objetivo General

Diseñar e implementar un prototipo funcional de un sistema de pagos digitales (PayGraph) utilizando conceptos de matemáticas discretas —como aritmética modular, matrices de adyacencia en grafos y lógica booleana— conectados con un modelo sencillo de Inteligencia Artificial para validar, enrutar y asegurar transacciones dentro de una aplicación web interactiva.

#### 3.2 Objetivos Específicos

1. **Crear** un módulo de autenticación de claves de usuario utilizando aritmética modular con el algoritmo RSA en una versión simplificada.

2. **Representar** las cuentas y nodos bancarios mediante un grafo dirigido $G=(V,E)$ y su matriz de adyacencia para calcular la ruta de envío que cobre menos comisión.

3. **Construir** un motor de reglas usando condicionales de lógica proposicional $F(T) = A \land B \land (\neg C)$ conectado a un Árbol de Decisión que identifique intentos de fraude.

4. **Desarrollar** una interfaz web interactiva que permita simular transferencias y ver en vivo cómo se ejecutan los cálculos matemáticos paso a paso.

### 4. Justificación y Planteamiento del Problema

#### 4.1 Planteamiento del Problema

Cuando una persona hace una transferencia digital, los datos viajan por redes públicas donde podrían ser interceptados si no están protegidos. Por otro lado, cuando las redes financieras crecen y se conectan entre muchas entidades, decidir por dónde enviar la transacción para que no cobre comisiones exageradas o no demore tanto se vuelve un problema algorítmico real.

A nivel de nuestra formación académica, el problema principal es que en tercer semestre a veces cuesta ver la relación entre la teoría matemática abstracta y el código de software. Si no creamos herramientas donde podamos "tocar" o probar cómo una matriz de adyacencia o una función modular funcionan dentro de un programa, nos quedamos solo con la parte teórica sin entender su aplicación en la industria.

#### 4.2 Justificación

Resolvemos este problema porque el proyecto aporta en tres aspectos:

* **Práctico:** Construimos un sistema simulado que resuelve el ciclo completo de un pago (cifrado $\rightarrow$ cálculo de comisión $\rightarrow$ validación de reglas $\rightarrow$ aprobación).

* **Académico:** Ponemos en práctica los temas del programa de Matemáticas Discretas de 3.er semestre, convirtiendo los teoremas en algoritmos ejecutables en JavaScript/Python.

* **Tecnológico:** Nos sirve como primera aproximación para entender cómo se integran las reglas lógicas deterministas con modelos de Inteligencia Artificial en un desarrollo de software web.

### 5. Marco de Referencia

#### 5.1 Marco Teórico

* **Aritmética Modular y RSA Simplificado:** La aritmética modular trabaja con los residuos de la división entera. Decimos que $a \equiv b \pmod n$ si $n$ divide la diferencia entre $a$ y $b$. Para el cifrado de las claves de acceso, usamos una versión simplificada del algoritmo RSA. Elegimos dos primos pequeños ($p=61, q=53$) cuyo producto nos da el módulo $n = 3233$. El cifrado lo hacemos calculando $c = m^e \pmod n$ y el descifrado en el servidor mediante $m = c^d \pmod n$. Para que las operaciones sean rápidas en el navegador y no desborden la memoria, aplicamos el algoritmo de potenciación modular rápida.

* **Teoría de Grafos y Matriz de Adyacencia:** Representamos la red como un grafo dirigido y ponderado $G = (V, E)$, donde los vértices $V$ son los usuarios o bancos y las aristas $E$ son los canales de transferencia. Cada arista tiene un peso que representa la comisión en pesos ($COP$). En el código guardamos esto usando una matriz de adyacencia $M$ de tamaño $n \times n$. Si la celda $M[i][j]$ tiene un valor, ese es el costo directo de enviar dinero del nodo $i$ al $j$; si no hay conexión directa, colocamos un valor infinito ($\infty$).

* **Lógica Proposicional:** Para decidir si una transacción se aprueba o se rechaza, definimos la fórmula booleana:

  $$
  F(T) = A \land B \land (\neg C)
  $$

  Donde evaluamos si las tres condiciones se cumplen simultáneamente para dar el valor de `TRUE`.

#### 5.2 Marco Conceptual

* **Token Cifrado:** Es el número resultante de aplicar la fórmula modular al PIN del usuario para que viaje protegido por la red.

* **Camino Mínimo (Dijkstra):** Algoritmo que revisa el grafo para encontrar la secuencia de conexiones que suma la menor cantidad de comisiones.

* **Árbol de Decisión (IA):** Un algoritmo clasificador sencillo que toma variables de la transacción (como el monto) y decide si tiene patrón de operación normal (`0`) o sospechosa (`1`).

#### 5.3 Marco Tecnológico

* **HTML5 y Tailwind CSS:** Para armar la estructura y el diseño visual tipo panel de control sin complicaciones de estilos desde cero.

* **JavaScript (ES6+):** El lenguaje principal que usamos para escribir los algoritmos de cifrado, la lógica de grafos y el control de la interfaz.

* **Canvas API:** Herramienta nativa del navegador que usamos para dibujar los nodos y las líneas del grafo de forma interactiva.

### 6. Marco Metodológico

#### 6.1 Tipo de Investigación

Nuestro proyecto es una **investigación aplicada** con enfoque práctico de desarrollo tecnológico. No inventamos teoremas matemáticos nuevos, sino que tomamos la teoría que existe sobre grafos, modulos y lógica booleana y la usamos para construir un producto informático que funcione.

#### 6.2 Metodología de Desarrollo (Prototipado Evolutivo)

Trabajamos mediante un enfoque de prototipado en 4 fases principales:

1. **Fase 1: Diseño Matemático (Semanas 1-2):** Definimos los números primos para el RSA, armamos la matriz de adyacencia en papel y escribimos la fórmula de la regla booleana.

2. **Fase 2: Algoritmos en Código (Semanas 3-4):** Escribimos las funciones en JavaScript para probar que la potenciación modular funcionara y que el recorrido del grafo entregara las rutas correctas.

3. **Fase 3: Construcción del Prototipo Web (Semanas 5-6):** Diseñamos la interfaz gráfica, dibujamos el lienzo interactivo del grafo y pusimos las pestañas para inspeccionar cada módulo.

4. **Fase 4: Pruebas y Ajustes (Semanas 7-8):** Probamos varios escenarios (pagos normales, errores de contraseña y transacciones con montos sospechosos) para verificar que el sistema rechazara o aprobara correctamente.

### 7. Alcance del Proyecto

#### 7.1 Lo que SÍ hace el sistema

* Funciona directamente en cualquier navegador web abriendo un archivo `.html` sin instalar servidores complicados.

* Muestra un grafo interactivo de 5 nodos (usuarios y bancos) donde se puede hacer clic para seleccionar cuentas.

* Cifra y descifra los datos de seguridad usando aritmética modular RSA en tiempo real.

* Calcula la comisión más económica buscando en la matriz de adyacencia del grafo.

* Evalúa la regla booleana $F(T) = A \land B \land (\neg C)$ combinada con un Árbol de Decisión que detecta transferencias de montos altos como posibles fraudes.

* Muestra una terminal con el registro detallado paso a paso de lo que hace el algoritmo.

#### 7.2 Lo que NO hace el sistema (Limitaciones)

* **NO** maneja dinero real ni se conecta con bancos de verdad.

* **NO** usa claves RSA gigantes (de 2048 bits) para evitar que el navegador se vuelva lento en nuestras pruebas.

* **NO** guarda la información en una base de datos externa; si se recarga la página, los saldos vuelven a su estado inicial.

### 8. Requerimientos del Sistema

#### 8.1 Requerimientos Funcionales (RF)

* **RF-01:** El sistema debe dejar elegir cuenta de origen, cuenta de destino, monto a enviar y un PIN de 4 dígitos.

* **RF-02:** El sistema debe cifrar el PIN del usuario usando la fórmula $c = m^e \pmod n$ antes de procesar el pago.

* **RF-03:** El sistema debe revisar la matriz de adyacencia del grafo y calcular la comisión total del envío.

* **RF-04:** El sistema debe evaluar la regla de autorización $F(T) = A \land B \land (\neg C)$ revisando saldo, PIN y la alerta del modelo de IA.

* **RF-05:** El sistema debe descontar el dinero de la cuenta origen y sumarlo a la destino si todo está bien, o decir la razón exacta si la transacción es rechazada.

#### 8.2 Requerimientos No Funcionales (RNF)

* **RNF-01 (Rapidez):** El cálculo completo y la actualización en pantalla deben tomar menos de 100 milisegundos.

* **RNF-02 (Facilidad de Uso):** La pantalla debe ser fácil de entender y tener botones de escenarios de prueba rápida para hacer la demostración en clase.

* **RNF-03 (Compatibilidad):** Debe correr sin problemas en navegadores modernos como Chrome, Firefox o Edge.

### 9. Diseño del Sistema

#### 9.1 Arquitectura del Prototipo

```
┌──────────────────────────────────────────────────────────────────┐
│              VISTA INTERACTIVA (HTML5 + Tailwind)                │
│  - Formulario de entrada          - Lienzo interactivo del Grafo │
│  - Módulos de inspección teórica  - Terminal de Logs             │
└────────────────────────────────┬─────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│               LÓGICA DEL SISTEMA (JavaScript Core)               │
│  - Cifrado Modular RSA (modPow)                                  │
│  - Algoritmo de Grafo (Matriz de Adyacencia y Rutas)             │
│  - Evaluador Booleano + Clasificador de Fraude (IA)             │
└────────────────────────────────┬─────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                   DATOS EN MEMORIA (JavaScript)                  │
│  - Cuentas y Saldos               - Matriz de Comisiones         │
└──────────────────────────────────────────────────────────────────┘
```

#### 9.2 Modelo Matemático Aplicado

1. **Cifrado RSA (Aritmética Modular):**

   * Cifrado: $c = m^{17} \pmod{3233}$

   * Descifrado: $m = c^{2753} \pmod{3233}$

2. **Matriz de Adyacencia del Grafo de Pagos ($M$):**

   $$
   M = \begin{pmatrix} 0 & 300 & 800 & \infty & 1200 \\ 300 & 0 & 200 & 400 & 500 \\ 800 & 200 & 0 & 300 & \infty \\ \infty & 400 & 300 & 0 & 600 \\ 1200 & 500 & \infty & 600 & 0 \end{pmatrix}
   $$

3. **Regla Booleana de Aprobación:**

   $$
   F(T) = A \land B \land (\neg C)
   $$

   * $A = (\text{Saldo disponible} \ge \text{Monto} + \text{Comisión})$

   * $B = (\text{PIN descifrado} == \text{PIN registrado})$

   * $C = (\text{Monto} > \$5.000.000 \text{ COP})$ $\rightarrow$ Alerta generada por el Árbol de IA.

### 10. Herramientas y Tecnología

* **Lenguaje:** JavaScript (ES6+) para toda la lógica matemática y algorítmica.

* **Diseño Visual:** Tailwind CSS y Lucide Icons para que la interfaz se vea ordenada y moderna.

* **Visualización de Grafos:** HTML5 Canvas API para dibujar los nodos y las conexiones.

* **Editor:** Visual Studio Code para escribir el código y probar el prototipo.

### 11. Beneficios e Impacto Esperado

* **Para nosotros como estudiantes:** Nos ayudó a entender para qué sirven las Matemáticas Discretas en la vida real y cómo se aplican en la carrera de Computación e IA.

* **En lo académico:** Deja un simulador visual que otros compañeros de semestres anteriores o posteriores pueden usar para ver cómo funcionan la aritmética modular y los grafos en código real.

* **En lo técnico:** Muestra lo útil que es combinar reglas lógicas exactas con modelos de IA para tomar decisiones en un programa de software.

### 12. Recomendaciones para Versiones Futuras

Si tuviéramos más tiempo para continuar con este proyecto en los siguientes semestres, nos gustaría:

1. Usar librerías que permitan trabajar con números de más dígitos para implementar un RSA de 2048 bits completo.

2. Reemplazar el Árbol de Decisión sencillo por una Red Neuronal de Grafos (*GNN*) que analice no solo el monto, sino las conexiones sospechosas entre usuarios.

3. Conectar el proyecto con un servidor backend en Python (usando FastAPI o Flask) y guardar el historial de transacciones en una base de datos real.

### 13. Referencias Bibliográficas

1. Rosen, K. H. (2019). *Discrete Mathematics and Its Applications* (8th ed.). McGraw-Hill.

2. Cormen, T. H., Leiserson, C. E., Rivest, R. L., & Stein, C. (2009). *Introduction to Algorithms* (3rd ed.). MIT Press.

3. Stallings, W. (2017). *Cryptography and Network Security: Principles and Practice* (7th ed.). Pearson.

### 14. Apéndices

#### Apéndice A: Fragmento de Código (Cifrado RSA y Lógica Booleana)

```javascript
// Función para potenciación modular rápida: (base^exp) % mod
function modPow(base, exp, mod) {
    let res = 1n;
    let b = BigInt(base) % BigInt(mod);
    let e = BigInt(exp);
    let m = BigInt(mod);
    while (e > 0n) {
        if (e % 2n === 1n) res = (res * b) % m;
        b = (b * b) % m;
        e = e / 2n;
    }
    return Number(res);
}

// Evaluación de la regla de negocio booleana: F(T) = A y B y (NO C)
function evaluarTransaccion(saldoOk, pinOk, alertaFraudeIA) {
    return saldoOk && pinOk && (!alertaFraudeIA);
}
```

#### Apéndice B: Instrucciones para probar el Simulador

1. Guardar el archivo `index.html` del proyecto en la computadora.

2. Hacer doble clic sobre el archivo para abrirlo en cualquier navegador (Chrome, Firefox, Edge).

3. Usar los botones de "Escenarios Didácticos" en la esquina superior izquierda para probar pagos exitosos, errores de contraseña o alertas de fraude detectadas por la IA.
