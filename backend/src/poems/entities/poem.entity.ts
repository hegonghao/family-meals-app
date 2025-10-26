import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsBoolean, IsEnum, IsNotEmpty, Length, Min } from 'class-validator';
import { PoemCategory } from '../../common/enums/poem-category.enum';

@Entity('poems')
export class Poem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  @Length(10, 30, { message: '诗句长度必须在10-30字符之间' })
  @IsNotEmpty()
  text!: string;

  @Column({ type: 'enum', enum: PoemCategory, default: PoemCategory.GENERAL })
  @IsEnum(PoemCategory)
  category!: PoemCategory;

  @Column({ type: 'int', default: 1 })
  @Min(1)
  weight!: number;

  @Column({ default: true })
  @IsBoolean()
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
