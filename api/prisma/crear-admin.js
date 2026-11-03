// Crea el usuario administrador, o le cambia la contraseña si ya existe.
// Uso: npm run crear-admin -w api
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const rl = readline.createInterface({ input, output });
const lineas = rl[Symbol.asyncIterator]();
const preguntar = async (texto) => {
  output.write(texto);
  return (await lineas.next()).value ?? '';
};

try {
  const usuario = (await preguntar('Usuario: ')).trim().toLowerCase();
  const password = await preguntar('Contraseña (mínimo 8 caracteres): ');

  if (!/^[a-z0-9._-]{3,30}$/.test(usuario)) {
    throw new Error('El usuario debe tener de 3 a 30 letras o números, sin espacios.');
  }
  if (password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');

  const passwordHash = await bcrypt.hash(password, 12);
  const existe = await prisma.admin.findUnique({ where: { usuario } });
  await prisma.admin.upsert({ where: { usuario }, update: { passwordHash }, create: { usuario, passwordHash } });
  console.log(existe ? `Contraseña de "${usuario}" actualizada.` : `Usuario "${usuario}" creado.`);
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  rl.close();
  await prisma.$disconnect();
}
