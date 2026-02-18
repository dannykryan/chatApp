export const config = {
  JWT_SECRET: process.env.JWT_SECRET || "SECRET_KEY",
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  PORT: process.env.PORT || 3000,
};