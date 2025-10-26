import { AppDataSource } from '../../config/data-source';
import { Poem } from '../../poems/entities/poem.entity';
import { PoemCategory } from '../../common/enums/poem-category.enum';

/**
 * Seed 20 initial poems for Dashboard welcome section
 * Distribution: 10 general, 6 season, 4 festival
 */
export async function seedPoems() {
  await AppDataSource.initialize();
  const poemRepository = AppDataSource.getRepository(Poem);

  const poems = [
    // General poems (10 items) - food, family, contentment themes
    { text: '粗茶淡饭,知足常乐', category: PoemCategory.GENERAL, weight: 1 },
    { text: '食不厌精,脍不厌细', category: PoemCategory.GENERAL, weight: 1 },
    { text: '民以食为天,食以安为先', category: PoemCategory.GENERAL, weight: 1 },
    { text: '家常便饭,温暖人心', category: PoemCategory.GENERAL, weight: 1 },
    { text: '饮食有节,起居有常', category: PoemCategory.GENERAL, weight: 1 },
    { text: '天下大事,必作于细', category: PoemCategory.GENERAL, weight: 1 },
    { text: '烟火人间,最是温情', category: PoemCategory.GENERAL, weight: 1 },
    { text: '一饮一啄,皆有定数', category: PoemCategory.GENERAL, weight: 1 },
    { text: '食而知味,品味人生', category: PoemCategory.GENERAL, weight: 1 },
    { text: '家和万事兴,食足百业旺', category: PoemCategory.GENERAL, weight: 1 },

    // Season poems (6 items) - four seasons and harvest themes
    { text: '春种秋收,四季轮回', category: PoemCategory.SEASON, weight: 2 },
    { text: '春生夏长,秋收冬藏', category: PoemCategory.SEASON, weight: 2 },
    { text: '时令而食,顺应自然', category: PoemCategory.SEASON, weight: 2 },
    { text: '春食野菜,秋食蟹黄', category: PoemCategory.SEASON, weight: 2 },
    { text: '夏吃苦瓜,冬补羊肉', category: PoemCategory.SEASON, weight: 2 },
    { text: '应时而食,不时不食', category: PoemCategory.SEASON, weight: 2 },

    // Festival poems (4 items) - traditional festivals
    { text: '团圆佳节,共享美食', category: PoemCategory.FESTIVAL, weight: 3 },
    { text: '岁岁年年,阖家欢聚', category: PoemCategory.FESTIVAL, weight: 3 },
    { text: '佳节良辰,美食相伴', category: PoemCategory.FESTIVAL, weight: 3 },
    { text: '节庆团圆,幸福满满', category: PoemCategory.FESTIVAL, weight: 3 },
  ];

  try {
    console.log('Seeding poems...');

    // Check if poems already exist to avoid duplicates
    const existingCount = await poemRepository.count();
    if (existingCount > 0) {
      console.log(`Database already has ${existingCount} poems. Skipping seed.`);
      await AppDataSource.destroy();
      return;
    }

    // Insert all poems
    await poemRepository.save(poems);

    console.log('✓ Inserted 20 poems successfully');
    console.log('✓ Poem categories: 10 general, 6 season, 4 festival');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error seeding poems:', error);
    await AppDataSource.destroy();
    throw error;
  }
}

// Run seed if executed directly
if (require.main === module) {
  seedPoems()
    .then(() => {
      console.log('Poem seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Poem seeding failed:', error);
      process.exit(1);
    });
}
