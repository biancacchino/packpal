import { PrismaClient } from '@prisma/client';
import { genSaltSync, hashSync } from 'bcrypt-ts';

// Use Prisma Client so the database defaults (cuid()) generate ids server-side
const prisma = new PrismaClient();

export async function getUser(email: string) {
  return await prisma.user.findUnique({ where: { email } });
}

export async function createUser(email: string, password: string) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);

  return await prisma.user.create({ data: { email, password: hash } });
}

// Export the raw Prisma client in case other modules need it
export { prisma };

