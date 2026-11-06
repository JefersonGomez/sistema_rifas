// Datos de prueba: una rifa activa a medio vender, una rifa pasada y 30 clientes ficticios.
// Uso:  npm run seed -w api                 (solo si la base está vacía)
//       npm run seed -w api -- --reiniciar  (BORRA todo y vuelve a cargar)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const reiniciar = process.argv.includes('--reiniciar');

// Generador pseudoaleatorio con semilla fija: siempre produce los mismos datos.
let semilla = 20261102;
const azar = () => ((semilla = (semilla * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
const elegir = (lista) => lista[Math.floor(azar() * lista.length)];

const nombres = [
  'María Rodríguez', 'José Vargas', 'Ana Jiménez', 'Carlos Mora', 'Laura Solís', 'Luis Rojas',
  'Sofía Araya', 'Jorge Castro', 'Daniela Chaves', 'Andrés Quesada', 'Gabriela Brenes', 'Pablo Murillo',
  'Karla Alfaro', 'Diego Herrera', 'Valeria Salazar', 'Esteban Vega', 'Fernanda Ramírez', 'Mauricio Sánchez',
  'Paola Calderón', 'Ricardo Méndez', 'Natalia Navarro', 'Fabián Campos', 'Melissa Cordero', 'Alonso Arias',
  'Raquel Segura', 'Hugo Fallas', 'Silvia Monge', 'Óscar Zúñiga', 'Tatiana Ulate', 'Marco Villalobos',
];

const numerosAlAzar = (cantidad) => {
  const todos = Array.from({ length: 100 }, (_, i) => String(i).padStart(2, '0'));
  for (let i = todos.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [todos[i], todos[j]] = [todos[j], todos[i]];
  }
  return todos.slice(0, cantidad);
};

async function venderNumeros(rifa, clientes, cantidad, { todoPagado }) {
  for (const numero of numerosAlAzar(cantidad)) {
    const cliente = elegir(clientes);
    // Activa: 50 % pagado, 25 % con abono parcial, 25 % sin pagar.
    const tipo = todoPagado ? 'pagado' : elegir(['pagado', 'pagado', 'abono', 'nada']);
    const pagos = [];
    if (tipo === 'pagado' && azar() < 0.3) {
      const primero = rifa.precioNumero / 2;
      pagos.push({ monto: primero, metodo: 'efectivo' }, { monto: rifa.precioNumero - primero, metodo: 'sinpe' });
    } else if (tipo === 'pagado') {
      pagos.push({ monto: rifa.precioNumero, metodo: elegir(['efectivo', 'sinpe']) });
    } else if (tipo === 'abono') {
      pagos.push({ monto: rifa.precioNumero / 2, metodo: elegir(['efectivo', 'sinpe']) });
    }

    await prisma.boleto.create({
      data: {
        rifaId: rifa.id,
        numero,
        clienteId: cliente.id,
        estado: tipo === 'pagado' ? 'pagado' : 'apartado',
        pagos: {
          create: pagos.map((p) => ({ ...p, referencia: p.metodo === 'sinpe' ? String(Math.floor(azar() * 1e8)) : null })),
        },
      },
    });
  }
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('El seed de prueba no se puede correr en producción.');
  }

  if (reiniciar) {
    await prisma.$transaction([
      prisma.pago.deleteMany(),
      prisma.recordatorio.deleteMany(),
      prisma.boleto.deleteMany(),
      prisma.cliente.deleteMany(),
      prisma.rifa.deleteMany(),
    ]);
  } else if ((await prisma.rifa.count()) > 0) {
    console.log('La base ya tiene rifas. Para borrar todo y recargar use: npm run seed -w api -- --reiniciar');
    return;
  }

  await prisma.cliente.createMany({
    data: nombres.map((nombre, i) => ({ nombre, telefono: String(60000000 + i * 1234567).slice(0, 8) })),
  });
  const clientes = await prisma.cliente.findMany();

  const pasada = await prisma.rifa.create({
    data: {
      titulo: 'Rifa del Combo de ollas',
      precioNumero: 1000,
      fechaSorteo: new Date('2026-10-18T19:00:00-06:00'),
      reglaGanador: 'Juega con los premios de la Lotería Nacional de Costa Rica.',
      estado: 'finalizada',
      sinpeNumero: '83260382',
      whatsapp: '83260482',
      creadaEn: new Date('2026-09-20T10:00:00-06:00'),
      finalizadaEn: new Date('2026-10-18T21:00:00-06:00'),
      premios: {
        create: [
          { lugar: 1, descripcion: 'Combo de 5 ollas de acero', costo: 45000, numeroGanador: '42' },
          { lugar: 2, descripcion: 'Licuadora', costo: 15000, numeroGanador: '07' },
        ],
      },
    },
  });
  await venderNumeros(pasada, clientes, 92, { todoPagado: true });

  const activa = await prisma.rifa.create({
    data: {
      titulo: 'Rifa de la Freidora de aire',
      descripcion: 'Freidora de aire de 5 litros, nueva en caja.',
      precioNumero: 2000,
      fechaSorteo: new Date('2026-11-15T19:00:00-06:00'),
      reglaGanador: 'Juega con los premios de la Lotería Nacional de Costa Rica.',
      estado: 'activa',
      premios: {
        create: [
          { lugar: 1, descripcion: 'Freidora de aire', costo: 35000 },
          { lugar: 2, descripcion: 'Olla arrocera', costo: 12000 },
          { lugar: 3, descripcion: '₡5 000 en efectivo', costo: 5000 },
        ],
      },
      sinpeNumero: '83260382',
      whatsapp: '83260482',
    },
  });
  await venderNumeros(activa, clientes, 63, { todoPagado: false });

  console.log(`Listo: ${clientes.length} clientes, rifa pasada (#${pasada.id}) y rifa activa (#${activa.id}) con 63 números vendidos.`);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
