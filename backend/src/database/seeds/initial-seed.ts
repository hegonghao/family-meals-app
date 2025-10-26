import { AppDataSource } from '../../config/data-source';
import { User } from '../../users/entities/user.entity';
import { Dish } from '../../menu/entities/dish.entity';
import { MealSlot } from '../../common/enums/meal-slot.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import * as bcrypt from 'bcrypt';

async function seed() {
  console.log('🌱 Starting database seed...');

  await AppDataSource.initialize();
  console.log('✅ Database connected');

  const userRepository = AppDataSource.getRepository(User);
  const dishRepository = AppDataSource.getRepository(Dish);

  // Create users
  console.log('Creating users...');
  const adminPassword = await bcrypt.hash('password', 10);
  const userPassword = await bcrypt.hash('password', 10);

  const users = [
    {
      username: 'admin',
      displayName: 'Administrator',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      isActive: true,
    },
    {
      username: 'john',
      displayName: 'John Doe',
      passwordHash: userPassword,
      role: UserRole.USER,
      isActive: true,
    },
    {
      username: 'jane',
      displayName: 'Jane Smith',
      passwordHash: userPassword,
      role: UserRole.USER,
      isActive: true,
    },
  ];

  for (const userData of users) {
    const existing = await userRepository.findOne({ where: { username: userData.username } });
    if (!existing) {
      const user = userRepository.create(userData);
      await userRepository.save(user);
      console.log(`  ✅ Created user: ${userData.username}`);
    } else {
      console.log(`  ⏭️  User already exists: ${userData.username}`);
    }
  }

  // Create dishes
  console.log('Creating dishes...');
  const dishes = [
    // Breakfast
    { name: 'Scrambled Eggs', slot: MealSlot.BREAKFAST },
    { name: 'Pancakes', slot: MealSlot.BREAKFAST },
    { name: 'Oatmeal', slot: MealSlot.BREAKFAST },
    { name: 'French Toast', slot: MealSlot.BREAKFAST },
    { name: 'Fruit Salad', slot: MealSlot.BREAKFAST },

    // Lunch
    { name: 'Grilled Chicken Salad', slot: MealSlot.LUNCH },
    { name: 'Vegetable Soup', slot: MealSlot.LUNCH },
    { name: 'Turkey Sandwich', slot: MealSlot.LUNCH },
    { name: 'Caesar Salad', slot: MealSlot.LUNCH },
    { name: 'Pasta Primavera', slot: MealSlot.LUNCH },
    { name: 'Beef Stir Fry', slot: MealSlot.LUNCH },

    // Dinner
    { name: 'Grilled Salmon', slot: MealSlot.DINNER },
    { name: 'Roast Beef', slot: MealSlot.DINNER },
    { name: 'Chicken Parmesan', slot: MealSlot.DINNER },
    { name: 'Vegetable Lasagna', slot: MealSlot.DINNER },
    { name: 'Pork Chops', slot: MealSlot.DINNER },
    { name: 'Shrimp Scampi', slot: MealSlot.DINNER },
    { name: 'Beef Tacos', slot: MealSlot.DINNER },
  ];

  for (const dishData of dishes) {
    const existing = await dishRepository.findOne({ where: { name: dishData.name, slot: dishData.slot } });
    if (!existing) {
      const dish = dishRepository.create({ ...dishData, isActive: true });
      await dishRepository.save(dish);
      console.log(`  ✅ Created dish: ${dishData.name} (${dishData.slot})`);
    } else {
      console.log(`  ⏭️  Dish already exists: ${dishData.name}`);
    }
  }

  await AppDataSource.destroy();
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📝 Test credentials:');
  console.log('  Admin: username=admin, password=password (ADMIN role)');
  console.log('  User 1: username=john, password=password');
  console.log('  User 2: username=jane, password=password');
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
