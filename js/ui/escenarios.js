/**
 * @file escenarios.js
 * @description Controlador de los casos de prueba rápida (escenarios didácticos S1 a S4).
 * Presenta los escenarios en un menú desplegable elegante y profesional, evitando
 * alarmas o botones de depuración invasivos en la cabecera principal.
 */
(function (root, factory) {
  'use strict';
  const namespace = (root.PayGraph = root.PayGraph || {});
  namespace.EscenariosUI = factory(namespace.Datos);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Datos) {
  'use strict';

  const CONFIG_ESCENARIOS = Object.freeze({
    S1: {
      badge: 'Aprobado',
      badgeClass: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      icono: '<svg class="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
      etiqueta: 'Caso 1: Transferencia Exitosa',
      detalle: 'Envío regular de $500.000 con fondos suficientes'
    },
    S2: {
      badge: 'Rechazado',
      badgeClass: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
      icono: '<svg class="w-3.5 h-3.5 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>',
      etiqueta: 'Caso 2: Clave Incorrecta',
      detalle: 'Intento de transferencia con PIN no autorizado'
    },
    S3: {
      badge: 'Rechazado',
      badgeClass: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
      icono: '<svg class="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
      etiqueta: 'Caso 3: Saldo Insuficiente',
      detalle: 'Fondos insuficientes para cubrir el débito'
    },
    S4: {
      badge: 'Bloqueado',
      badgeClass: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
      icono: '<svg class="w-3.5 h-3.5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
      etiqueta: 'Caso 4: Alerta de Fraude',
      detalle: 'Monto inusual que activa bloqueo preventivo'
    }
  });

  /**
   * Inicializa el menú desplegable de escenarios didácticos (S1 a S4).
   *
   * @param {{
   *   contenedorBotones: HTMLElement,
   *   botonMenuMovil: HTMLButtonElement,
   *   panelDesplegable: HTMLElement,
   *   alEjecutarEscenario: Function
   * }} opciones
   */
  function inicializarEscenarios(opciones) {
    const contenedor = opciones.contenedorBotones;
    const botonMenu = opciones.botonMenuMovil;
    const panelMenu = opciones.panelDesplegable;
    const alEjecutar = opciones.alEjecutarEscenario;

    if (!contenedor) {
      return;
    }

    while (contenedor.firstChild) {
      contenedor.removeChild(contenedor.firstChild);
    }

    Datos.ESCENARIOS_DIDACTICOS.forEach(function (escenario) {
      const cfg = CONFIG_ESCENARIOS[escenario.id] || {
        badge: escenario.id,
        badgeClass: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
        icono: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
        etiqueta: escenario.titulo,
        detalle: escenario.subtitulo
      };

      const tarjetaBtn = document.createElement('button');
      tarjetaBtn.type = 'button';
      tarjetaBtn.id = 'btn-escenario-' + escenario.id;
      tarjetaBtn.dataset.escenarioId = escenario.id;
      tarjetaBtn.className =
        'w-full text-left p-2.5 rounded-xl pg-elevated hover:bg-slate-500/10 hover:border-purple-500/40 border border-slate-500/15 transition-all flex items-start gap-2.5 cursor-pointer group';
      tarjetaBtn.title = escenario.descripcion;

      const iconoWrap = document.createElement('span');
      iconoWrap.className =
        'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ' +
        cfg.badgeClass;
      iconoWrap.innerHTML = cfg.icono;
      iconoWrap.setAttribute('aria-hidden', 'true');

      const colTexto = document.createElement('div');
      colTexto.className = 'flex-1 min-w-0';

      const filaSup = document.createElement('div');
      filaSup.className = 'flex items-center justify-between gap-1 mb-0.5';

      const tituloSpan = document.createElement('span');
      tituloSpan.className =
        'text-xs font-bold group-hover:text-purple-400 transition-colors truncate';
      tituloSpan.textContent = cfg.etiqueta;

      const badgeSpan = document.createElement('span');
      badgeSpan.className =
        'text-[9.5px] font-mono-tabular font-bold px-1.5 py-0.5 rounded-md shrink-0 ' +
        cfg.badgeClass;
      badgeSpan.textContent = cfg.badge;

      filaSup.appendChild(tituloSpan);
      filaSup.appendChild(badgeSpan);

      const descSpan = document.createElement('p');
      descSpan.className = 'text-[11px] pg-text-muted leading-tight truncate';
      descSpan.textContent = cfg.detalle;

      colTexto.appendChild(filaSup);
      colTexto.appendChild(descSpan);

      tarjetaBtn.appendChild(iconoWrap);
      tarjetaBtn.appendChild(colTexto);

      tarjetaBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (panelMenu) {
          panelMenu.classList.add('hidden');
          if (botonMenu) {
            botonMenu.setAttribute('aria-expanded', 'false');
          }
        }
        if (typeof alEjecutar === 'function') {
          alEjecutar(escenario);
        }
      });

      contenedor.appendChild(tarjetaBtn);
    });

    if (botonMenu && panelMenu) {
      botonMenu.addEventListener('click', function (e) {
        e.stopPropagation();
        const estaOculto = panelMenu.classList.toggle('hidden');
        botonMenu.setAttribute('aria-expanded', estaOculto ? 'false' : 'true');
      });

      // Cerrar al hacer clic fuera del panel desplegable
      document.addEventListener('click', function (e) {
        if (!panelMenu.contains(e.target) && !botonMenu.contains(e.target)) {
          panelMenu.classList.add('hidden');
          botonMenu.setAttribute('aria-expanded', 'false');
        }
      });

      // Cerrar con la tecla Escape
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !panelMenu.classList.contains('hidden')) {
          panelMenu.classList.add('hidden');
          botonMenu.setAttribute('aria-expanded', 'false');
          botonMenu.focus();
        }
      });
    }
  }

  return Object.freeze({
    inicializarEscenarios: inicializarEscenarios
  });
});
