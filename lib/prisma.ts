import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['warn', 'error'],
  })
}
//log: ['query', 'info', 'warn', 'error'],

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma
if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma