import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddListingFlow1746515592000 implements MigrationInterface {
    name = 'AddListingFlow1746515592000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE flow ADD COLUMN "listingName" varchar
        `)
        await queryRunner.query(`
            ALTER TABLE flow ADD COLUMN "listingPrice" NUMERIC CHECK ("listingPrice" >= 0)
        `)
        await queryRunner.query(`
            ALTER TABLE flow ADD COLUMN "listingStatus" BOOLEAN,
            ADD COLUMN "listingDescription" TEXT
        `)
        await queryRunner.query(`
            ALTER TABLE flow ADD COLUMN "listingDescription" TEXT
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE flow DROP COLUMN "listingName"
        `)
        await queryRunner.query(`
            ALTER TABLE flow DROP COLUMN "listingPrice"
        `)
        await queryRunner.query(`
            ALTER TABLE flow DROP COLUMN "listingStatus"
        `)
        await queryRunner.query(`
            ALTER TABLE flow DROP COLUMN "listingDescription"
        `)
    }
}
