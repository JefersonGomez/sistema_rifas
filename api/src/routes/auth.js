import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import { loginSchema } from '../schemas.js';
import { ErrorApp } from '../middleware/errores.js';
import { COOKIE, DURACION_MS, crearToken, opcionesCookie, sesionActual } from '../middleware/auth.js';

export const authRouter = Router();

// Hash de relleno para que el tiempo de respuesta no revele si el usuario existe.
const HASH_FALSO = bcrypt.hashSync('relleno-para-comparar', 10);

const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos fallidos. Espere 15 minutos y vuelva a intentar.' },
});

authRouter.post('/login', limiteLogin, async (req, res) => {
  const { usuario, password } = loginSchema.parse(req.body);
  const admin = await prisma.admin.findUnique({ where: { usuario: usuario.toLowerCase() } });
  const valida = await bcrypt.compare(password, admin?.passwordHash ?? HASH_FALSO);
  if (!admin || !valida) {
    throw new ErrorApp(401, 'Usuario o contraseña incorrectos. Revise y vuelva a intentar.');
  }
  res.cookie(COOKIE, crearToken(admin), { ...opcionesCookie, maxAge: DURACION_MS });
  res.json({ usuario: admin.usuario });
});

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE, opcionesCookie);
  res.json({ ok: true });
});

authRouter.get('/me', (req, res) => {
  const sesion = sesionActual(req);
  if (!sesion) throw new ErrorApp(401, 'No hay sesión activa.');
  res.json({ usuario: sesion.usuario });
});
