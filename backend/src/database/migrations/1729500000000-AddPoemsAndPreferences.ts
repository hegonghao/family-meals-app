import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class AddPoemsAndPreferences1729500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create poems table
    await queryRunner.createTable(
      new Table({
        name: 'poems',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'text',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'category',
            type: 'enum',
            enum: ['season', 'festival', 'general'],
            default: "'general'",
            isNullable: false,
          },
          {
            name: 'weight',
            type: 'int',
            default: 1,
            isNullable: false,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // 2. Create index on poems (isActive, category) for efficient querying
    await queryRunner.createIndex(
      'poems',
      new TableIndex({
        name: 'idx_poems_active_category',
        columnNames: ['isActive', 'category'],
      }),
    );

    // 3. Create user_preferences table
    await queryRunner.createTable(
      new Table({
        name: 'user_preferences',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'remindersEnabled',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // 4. Create unique index on userId to enforce 1:1 relationship
    await queryRunner.createIndex(
      'user_preferences',
      new TableIndex({
        name: 'idx_user_preferences_user_id',
        columnNames: ['userId'],
        isUnique: true,
      }),
    );

    // 5. Create foreign key relationship to users table
    await queryRunner.createForeignKey(
      'user_preferences',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order to avoid foreign key constraints
    await queryRunner.dropTable('user_preferences');
    await queryRunner.dropTable('poems');
  }
}
