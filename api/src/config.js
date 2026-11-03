export const config = {
  port: Number(process.env.PORT) || 3000,
  esProduccion: process.env.NODE_ENV === 'production',
};
