import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Dish } from '../menu/entities/dish.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Poem } from '../poems/entities/poem.entity';
import { User } from '../users/entities/user.entity';
import { UserPreference } from '../users/entities/user-preference.entity';

export const buildTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DB_HOST', 'postgres'),
  port: parseInt(configService.get<string>('DB_PORT', '5432'), 10),
  username: configService.get<string>('DB_USER', 'postgres'),
  password: configService.get<string>('DB_PASSWORD', 'postgres'),
  database: configService.get<string>('DB_NAME', 'family_meals'),
  entities: [User, UserPreference, Dish, Order, OrderItem, Poem],
  migrations: ['dist/database/migrations/*.js'],
  synchronize: configService.get<string>('NODE_ENV') === 'development', // Only in dev
  migrationsRun: configService.get<string>('NODE_ENV') === 'production', // Auto-run in prod
  logging: configService.get<string>('NODE_ENV') !== 'production',
});
