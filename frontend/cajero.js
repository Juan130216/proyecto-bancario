const $ = selector => document.querySelector(selector);

function mostrarTerminal(visible) {
  $('#vistaLogin').classList.toggle('hidden', visible);
  $('#vistaCajero').classList.toggle('hidden', !visible);
}

function mostrarVista(nombre) {
  document.querySelectorAll('.vista').forEach(seccion => seccion.classList.toggle('hidden', seccion.id !== `vista-${nombre}`));
  document.querySelectorAll('[data-vista]').forEach(boton => boton.setAttribute('aria-selected', boton.dataset.vista === nombre));
}

function manejarError(error) {
  if (error.status === 401) {
    alerta('La operación terminó. Ingresa de nuevo.', 'warning');
    mostrarTerminal(false);
    return;
  }
  alerta(error.message, 'error');
}

async function cargarSaldo() {
  const datos = await peticion('/cajero/saldo');
  $('#saldo').textContent = dinero(datos.saldo);
}

async function cargarMovimientos() {
  const movimientos = await peticion('/cajero/movimientos');
  $('#sinMovimientos').classList.toggle('hidden', movimientos.length > 0);
  $('#listaMovimientos').innerHTML = movimientos.map(m => {
    const color = Number(m.valor) < 0 ? 'text-red-400' : 'text-green-400';
    const signo = Number(m.valor) > 0 ? '+' : '';
    return `<li class="flex items-center justify-between gap-4 px-6 py-4">
      <div class="flex items-center gap-3">
        ${iconoMovimiento(m.tipo)}
        <div>
          <p class="font-semibold">${escapar(tiposMovimiento[m.tipo].texto)}</p>
          <p class="text-sm text-slate-400">${escapar(fecha(m.fecha))}</p>
        </div>
      </div>
      <div class="text-right">
        <p class="num font-semibold ${color}">${signo}${dinero(m.valor)}</p>
        <p class="num text-sm text-slate-400">Saldo ${dinero(m.saldo_resultante)}</p>
      </div>
    </li>`;
  }).join('');
  lucide.createIcons();
}

async function abrirVista(nombre) {
  mostrarVista(nombre);
  if (nombre === 'retirar') $('#resultadoRetiro').classList.add('hidden');
  try {
    if (nombre === 'saldo') await cargarSaldo();
    if (nombre === 'movimientos') await cargarMovimientos();
  } catch (error) {
    manejarError(error);
  }
}

document.querySelectorAll('[data-vista]').forEach(boton => boton.addEventListener('click', () => abrirVista(boton.dataset.vista)));

$('#formIngreso').addEventListener('submit', async evento => {
  evento.preventDefault();
  try {
    const cuenta = await peticion('/cajero/ingresar', 'POST', Object.fromEntries(new FormData(evento.target)));
    evento.target.reset();
    $('#cuentaActiva').textContent = `Cuenta **** ${cuenta.numero_cuenta.slice(-4)}`;
    mostrarTerminal(true);
    await abrirVista('saldo');
  } catch (error) {
    alerta(error.message, 'error');
  }
});

$('#formRetirar').addEventListener('click', evento => {
  const boton = evento.target.closest('[data-monto]');
  if (boton) $('#formRetirar').valor.value = boton.dataset.monto;
});

$('#formRetirar').addEventListener('submit', async evento => {
  evento.preventDefault();
  const datos = Object.fromEntries(new FormData(evento.target));
  datos.valor = Number(datos.valor);
  const acepta = await confirmar('¿Confirmar retiro?', `Vas a retirar ${dinero(datos.valor)}.`);
  if (!acepta) return;
  try {
    const movimiento = await peticion('/cajero/retirar', 'POST', datos);
    evento.target.reset();
    $('#retiroValor').textContent = dinero(Math.abs(movimiento.valor));
    $('#retiroSaldo').textContent = dinero(movimiento.saldo_resultante);
    $('#resultadoRetiro').classList.remove('hidden');
    alerta('Retiro realizado');
  } catch (error) {
    manejarError(error);
  }
});

$('#btnFinalizar').addEventListener('click', async () => {
  try {
    await peticion('/cajero/salir', 'POST');
  } catch (error) {
    return manejarError(error);
  }
  mostrarTerminal(false);
  alerta('Operación finalizada. ¡Hasta pronto!');
});

lucide.createIcons();
peticion('/cajero/salir', 'POST').catch(() => {});