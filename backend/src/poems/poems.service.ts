import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Poem } from './entities/poem.entity';
import { PoemCategory } from '../common/enums/poem-category.enum';
import { PoemDto, PoemsResponseDto } from './dto/poem-response.dto';

@Injectable()
export class PoemsService {
  constructor(
    @InjectRepository(Poem)
    private readonly poemRepository: Repository<Poem>,
  ) {}

  /**
   * Get all active poems, optionally filtered by category
   * Used by frontend for random selection with 30% refresh probability
   */
  async findAll(category?: PoemCategory): Promise<PoemsResponseDto> {
    const queryBuilder = this.poemRepository
      .createQueryBuilder('poem')
      .where('poem.isActive = :isActive', { isActive: true });

    if (category) {
      queryBuilder.andWhere('poem.category = :category', { category });
    }

    const [poems, total] = await queryBuilder
      .orderBy('poem.weight', 'DESC')
      .addOrderBy('poem.createdAt', 'ASC')
      .getManyAndCount();

    const data: PoemDto[] = poems.map((poem) => ({
      id: poem.id,
      text: poem.text,
      category: poem.category,
      weight: poem.weight,
    }));

    return { data, total };
  }
}
