import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'
import * as Sentry from '@sentry/node'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Initialize Sentry
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 0.1,
    })
  }

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  // CORS
  app.enableCors({
    origin: process.env.APP_URL || 'http://localhost:3000',
    credentials: true,
  })

  const port = process.env.PORT || 4000
  await app.listen(port)

  console.log(`🚀 The Iceberg Method API running on port ${port}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV}`)
}

bootstrap()
