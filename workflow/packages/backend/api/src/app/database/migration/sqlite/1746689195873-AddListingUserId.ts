import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddListingUserId1746689195873 implements MigrationInterface {
    name = 'AddListingUserId1746689195873'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE flow 
            ADD COLUMN "listingUserId" INTEGER,
            ADD COLUMN "listingCategoryId" varchar(21) 
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE flow 
            DROP COLUMN "listingUserId",
            DROP COLUMN "listingCategoryId" 
        `)
    }
}
