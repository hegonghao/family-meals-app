import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Poem } from './entities/poem.entity';
import { PoemsController } from './poems.controller';
import { PoemsService } from './poems.service';

@Module({
  imports: [TypeOrmModule.forFeature([Poem]), AuthModule],
  controllers: [PoemsController],
  providers: [PoemsService],
  exports: [PoemsService],
})
export class PoemsModule {}
