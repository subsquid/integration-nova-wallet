const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class nova1638846580628 {
    name = 'nova1638846580628'

    async up(queryRunner) {
        await queryRunner.query(`CREATE INDEX transfer_from on transfer ("from")`);
        await queryRunner.query(`CREATE INDEX transfer_to on transfer ("to")`);

        await queryRunner.query(`CREATE INDEX account_history_block_number on account_history (block_number)`);
        await queryRunner.query(`CREATE INDEX account_history_address on account_history (address)`);

        await queryRunner.query(`CREATE INDEX era_validator_era on era_validator_info (era)`);
        await queryRunner.query(`CREATE INDEX era_validator_info_address on era_validator_info (address)`);


        await queryRunner.query(`CREATE INDEX stake_change_address on stake_change (address)`);
        await queryRunner.query(`CREATE INDEX stake_change_block_number on stake_change (block_number)`);

    }

    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "error_event"`);
        await queryRunner.query(`DROP TABLE "accumulated_stake"`);
        await queryRunner.query(`DROP TABLE "stake_change"`);
        await queryRunner.query(`DROP TABLE "era_validator_info"`);
        await queryRunner.query(`DROP TABLE "accumulated_reward"`);
        await queryRunner.query(`DROP TABLE "account_history"`);
        await queryRunner.query(`DROP TABLE "transfer"`);
    }
}
