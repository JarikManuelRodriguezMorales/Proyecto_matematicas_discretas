UNIVERSIDAD DE SANTANDER - UDES

Matematicas Discretas

PROYECTO DE AULA

Titulo:

“Simulaciòn de Sistema de Pagos Digitales Seguro y Optimizado Mediante Matematicas Discretas e ingneria en ciencias de la computaciòn e Inteligencia Artificial”.

Presenta :

Breyner Cermeño Castellanos

Darwin Samuel Machuca Gonzales

Jarik Manuel Rodríguez Morales

INGENERIA EN CIENCIAS DE LA COMPUTACIÒN E INTELIGENCIA ARTIFICIAL

Docente :

Yudi Caterine Díaz Perdomo

FACULTAD DE INGENERIAS

Bucaramanga, Santander.

TITULO: “Simulaciòn de Sistema de Pagos Digitales Seguro y Optimizado Mediante Matematicas Discretas e ingneria en ciencias de la computaciòn e Inteligencia Artificial”.

1. **RESUMEN**

En este proyecto se desarrolla una pagina web interactiva que simula un sistema de pagos digitales, basándonos en conceptos de las matemáticas discretas y aplicativos a la ingenería en ciencias de la computación e inteligencia artificial para poder evidenciar como resolver problemas reales de seguridad, enrutamiento eficiente y prevención de fraude. Donde aplicamos la matemática discreta directamente en el código del sistema de pagos, usamos aritmética modular para cifrar contraseñas con un RSA simplificado *(*$c=m^{e}\;\left(mod\:n\right)$*)*, representamos las cuentas y bancos en un grafo dirigido $\boldsymbol{G=}\left(\boldsymbol{V,E}\right)$usando su matriz de adyacencia para calcular comisiones, y evaluamos cada transacción con una fórmula de lógica proposicional $\boldsymbol{F}\left(\boldsymbol{T}\right)\boldsymbol{=A\wedge B\wedge}\left(\boldsymbol{\neg C}\right)$ conectada a un Árbol de Decisión que detecta posibles fraudes. El resultado final es una simulación web interactiva donde cualquiera puede probar transferencias y ver cómo trabaja el algoritmo paso a paso.

- **Palabras claves:** matemáticas discretas, teoría de grafos, aritmética modular, lógica proposicional, inteligencia Artificial.

2. **Introducción**

En la actualidad las plataforma y aplicaciones de transacciones financieras y pasarela de pagos digitales como por ejemplo: Nequi, Bancolombia o Daviplata, son una parte fundamental del comercio electrónico global, dentro del área de la ingeneria de software y la inteligencia artificial representa un reto de alta complejidad algorítmica, ya que se debe garantizar que una transacción sea procesada en milisegundos, con el menor costo de comisión interbancaria y teniendo en cuenta la importancia de los rigurosos estándares de ciberseguridad.

detrás de un  botón de "Transferir" hay varios problemas por resolver: ¿cómo aseguramos que nadie robe la clave en el camino?, ¿cómo se calcula cuál es la ruta más rápida o económica si el dinero pasa por varios bancos?, y ¿cómo se detiene un intento de fraude antes de que sea tarde?

La importancia de este proyecto nació porque muchas veces en clase sentimos que las Matemáticas Discretas se quedan en fórmulas abstractas sobre el papel. Quisimos cambiar eso y demostrar que la teoría de números es la base de la criptografía actual, que la teoría de grafos sirve para modelar la infraestructura de redes y que la lógica proposicional es el cimiento de la programación y los condicionales en las máquinas de estado.

3. **Objetivos**

- 3.1. **Objetivo General**

Diseñar una simulación de un sistema de pagos digitales, utilizando los conceptos de matemáticas discretas como aritmética modular, matrices de adyacencia de grafos y lógica booleana, conectada a un módulo de inteligencia artificial para validar, enrutar y asegurar transacciones dentro de una aplicación web interactiva.

- 3.2. **Objetivos Específicos**

- Crear un módulo de autenticación de claves de usuario utilizando aritmética modular con el algoritmo RSA en una versión simplificada.
- Representar las cuentas y nodos bancarios mediante un grafo dirigido y su matriz de adyacencia para calcular la ruta de envío que cobre menos comisión.
- Construir **un motor de reglas usando condicionales de lógica proposicional conectado a un Árbol de Decisión que identifique intentos de fraude.**
- Desarrollar **una interfaz web interactiva que permita simular transferencias y ver en vivo cómo se ejecutan los cálculos matemáticos paso a paso.**

4. **Planteamiento del problema**

**Cuando una persona hace una transferencia digital los datos viajan por redes públicas donde podrían ser interceptados si no están protegidos y cuando las redes financieras crecen y se conectan entre muchas entidades, decidir por dónde enviar la transacción para que no cobre comisiones exageradas o no demore tanto se vuelve un problema algorítmico real. el problema principal es que para nosotros los estudiantes se nos dificulta ver y entender la relación entre la teoría matemática, el código de software y el funcionamiento en la vida real, por esto es fundamental este proyecto aplicativo donde podamos ver cómo funcionan estas plataformas en el día a día, cómo una matriz de adyacencia o una función modular funcionan dentro de un programa hace que pueda ser posible los pagos digitales.**

5. **Justificación**

**Estaa problemática aporta en tres aspectos:**

- **Práctico porque construimos un sistema simulado que resuelve el ciclo completo de un pago** $(cifrado\to cálculo de comisión\to validación de reglas \to aprobación)$
- **Abordamos las temáticas de matemáticas discretas y es aplicativo a nuestra carrera, acercándonos un poco más a cómo funciona nuestro entorno laboral.**
- **Nos sirve como primera aproximación para entender cómo se integran las reglas lógicas deterministas con modelos de Inteligencia Artificial en un desarrollo de software web.**

6. **Marco de referencia**

   - 6.1. **Marco teórico**

- **Aritmética modular y RSA simplificado**
- **Grafos y matriz de adyacencia**
- **Lógica proposicional**

- 6.2. **Marco conceptual**
- 6.3. **Marco tecnológico**

7. **Marco metodológico**

   - 7.1. **Tipo de investigación**

**Nuestro proyecto es una investigación aplicada con enfoque práctico de desarrollo tecnológico. Basándonos en la teoría sobre grafos, módulos y lógica booleana y la usamos para construir un producto informático que funcione.**

- 7.2. **Metodología del desarrollo**

**Para llevar a cabo la metologia del desarrollo dividimos el prototipado evolutivo en cuatro fases que nos llevaron a poder tener nuestro prototipo de simulación aplicado:**

- **Fase 1: definimos los componentes matemáticos con los que rigen normalmente las aplicaciones, hicimos un análisis y extracción de datos basado en la ruta del syllabus de la asignatura de matemáticas discretas, en este caso hay temáticas que no son vistas pero que son fundamentales y hacen parte de esta área, por lo que es considerable de suma importancia para la realización de la simulación y de manera independiente el grupo de trabajo debe investigar y entender estas temáticas.**
- **Fase 2: hicimos una serie de aplicaciónes  en Python antes de empezar a crear la simulación el pagina web esto con el finde poder entender el funcionamiento de estas aplicaciones**
- **Fase 3: con ayuda de inteligencia artificial diseñamos la interfaz gráfica, dibujamos el grafo y las pestañas para inspeccionar cada módulo. Pudiendo realizar la simulación en html.**
- **Fase 4: entorno de pruebas sobre la simulación como: pagos normales, errores de contraseña y transacciones con montos sospechosos para verificar como funcionaba el sistema y en caso tal rechazara o aprobara correctamente.**

8. **Alcance del proyecto**

- **Funciona la pagina web HTML directamente en cualquier navegador web abriendo un archivo**
- **Muestra un grafo interactivo de 5 nodos (usuarios y bancos) donde se puede hacer clic para seleccionar cuentas.**
- **Cifra y descifra los datos de seguridad usando aritmética modular RSA en tiempo real.**
- **Calcula la comisión más económica buscando en la matriz de adyacencia del grafo.**
- **Evalúa la regla booleana combinada con un Árbol de Decisión que detecta transferencias de montos altos como posibles fraudes.**
- **Muestra una terminal con el registro detallado paso a paso de lo que hace el algoritmo.**

9. **Requerimientos del sistema**

   - 9.1. **Requerimientos Funcionales (RF)**

- **El sistema debe dejar elegir cuenta de origen, cuenta de destino, monto a enviar y un PIN de 4 dígitos.**

- **El sistema debe cifrar el PIN del usuario usando la fórmula** $c=m^{e}\;\left(\mathrm{mod}\:n\right)$**antes de procesar el pago.**

- **El sistema debe evaluar la regla de autorización revisando saldo, PIN y la alerta del modelo de IA.**

- **El sistema debe descontar el dinero de la cuenta origen y sumarlo al destino si todo está bien, o decir la razón exacta si la transacción es rechazada.**

  - 9.2. **Requerimientos No Funcionales (RNF)**

- **El cálculo completo y la actualización en pantalla deben tomar menos de 100 milisegundos.**
- **La pantalla debe ser fácil de entender y tener botones de escenarios de prueba rápida para hacer la demostración en clase.**
- **Debe correr sin problemas en navegadores modernos como Chrome, Firefox o Edge.**

10. **Diseño del sistema**

***Figura 1 : diagrama de flujo realizado en lucidchart, funcionamiento de la pagina web***

*Figura 2: diagrama de fuljo realizado en lucidchart, funcionamiento del modelo matemático.*

11. **Herramientas**

- **Lenguaje: JavaScript (ES6+) para toda la lógica matemática y algorítmica.**
- **Diseño Visual: Tailwind CSS y Lucide Icons para que la interfaz se vea ordenada y moderna.**
- **Visualización de Grafos: HTML5 Canvas API para dibujar los nodos y las conexiones.**
- **Editor: Visual Studio Code para escribir el código y probar el prototipo.**

12. **Beneficios**

El desarrollo del proyecto genera un impacto integral en tres frentes principales: en el aspecto práctico, optimiza las pasarelas de pago al reducir los costos por comisiones y bloquear transacciones sospechosas sin sacrificar el tiempo de respuesta; en el plano académico, sirve como puente entre la teoría de las matemáticas discretas y el desarrollo de software real, y desde la perspectiva tecnológica, ofrece un prototipo escalable y didáctico que demuestra cómo la combinación de estructuras discretas con inteligencia artificial puede aplicarse en la infraestructura financiera e interbancaria del comercio electrónico moderno.

13. **Versiones futuras**

se plantea evolucionar el sistema implementando librerías especializadas en manejo de grandes enteros para escalar la criptografía a un esquema RSA completo de 2048 bits, sustituir el Árbol de Decisión por una Red Neuronal de Grafos (GNN) que analice la topología de la red y detecte conexiones sospechosas entre usuarios, y conectar el prototipo a un servidor backend en Python (mediante FastAPI o Flask) junto a una base de datos real para la persistencia del historial de transacciones.

14. **Referencias**

15. **Apéndices**
