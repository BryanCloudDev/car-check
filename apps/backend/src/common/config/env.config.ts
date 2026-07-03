export const envConfiguration = () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  appEnv: process.env.APP_ENV as 'dev' | 'qa' | 'prod',
  database: {
    url: process.env.DATABASE_URL,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    name: process.env.POSTGRES_DB,
    port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '24h',
  },
  aws: {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    s3Bucket: process.env.S3_BUCKET,
  },
});
