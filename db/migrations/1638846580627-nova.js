const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class nova1638846580628 {
    name = 'nova1638846580628'

    async up(queryRunner) {

        await queryRunner.query(`CREATE INDEX transfer_from on transfer ("from")`);
        await queryRunner.query(`CREATE INDEX transfer_to on transfer ("to")`);
        await queryRunner.query(`CREATE INDEX transfer_id on transfer (id)`);

        await queryRunner.query(`CREATE INDEX account_history_block_number on account_history (block_number)`);
        await queryRunner.query(`CREATE INDEX account_history_address on account_history (address)`);
        await queryRunner.query(`CREATE INDEX account_history_id on account_history (id)`);

        await queryRunner.query(`CREATE INDEX era_validator_era on era_validator_info (era)`);
        await queryRunner.query(`CREATE INDEX era_validator_info_address on era_validator_info (address)`);
        await queryRunner.query(`CREATE INDEX era_validator_info_id on era_validator_info (id)`);

        await queryRunner.query(`CREATE INDEX accumulated_reward_id on accumulated_reward (id)`);

        await queryRunner.query(`CREATE INDEX stake_change_address on stake_change (address)`);
        await queryRunner.query(`CREATE INDEX stake_change_block_number on stake_change (block_number)`);
        await queryRunner.query(`CREATE INDEX stake_change_id on stake_change (id)`);

        await queryRunner.query(`CREATE INDEX accumulated_stake_id on accumulated_stake (id)`);

        // await queryRunner.query(`CREATE TABLE "transfer" ("id" character varying NOT NULL, "amount" text NOT NULL, "to" text NOT NULL, "from" text NOT NULL, "fee" numeric NOT NULL, "event_idx" text NOT NULL, "extrinisic_idx" text NOT NULL, "success" boolean NOT NULL, CONSTRAINT "PK_fd9ddbdd49a17afcbe014401295" PRIMARY KEY ("id"))`);
        // await queryRunner.query(`CREATE TABLE "account_history" ("id" character varying NOT NULL, "address" text NOT NULL, "block_number" integer NOT NULL, "extrinsic_idx" text, "extrinsic_hash" text, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "item" jsonb NOT NULL, CONSTRAINT "PK_de0652296aa9d641c6269104b98" PRIMARY KEY ("id"))`);
        // await queryRunner.query(`CREATE TABLE "accumulated_reward" ("id" character varying NOT NULL, "amount" numeric NOT NULL, CONSTRAINT "PK_43a34960ffea1cfdf37fb441ed2" PRIMARY KEY ("id"))`);
        // await queryRunner.query(`CREATE TABLE "era_validator_info" ("id" character varying NOT NULL, "address" text NOT NULL, "era" integer NOT NULL, "total" numeric NOT NULL, "own" numeric NOT NULL, "others" jsonb NOT NULL, CONSTRAINT "PK_8a494e2a4a4400b9297e2a6bec8" PRIMARY KEY ("id"))`);
        // await queryRunner.query(`CREATE TABLE "stake_change" ("id" character varying NOT NULL, "block_number" integer NOT NULL, "extrinsic_hash" text, "event_idx" text NOT NULL, "timestamp" numeric NOT NULL, "address" text NOT NULL, "amount" numeric NOT NULL, "accumulated_amount" numeric NOT NULL, "type" text NOT NULL, CONSTRAINT "PK_c8caa97569762773f19cf127103" PRIMARY KEY ("id"))`);
        // await queryRunner.query(`CREATE TABLE "accumulated_stake" ("id" character varying NOT NULL, "amount" numeric NOT NULL, CONSTRAINT "PK_b8067048d2065bcf1c7dd1a6ae0" PRIMARY KEY ("id"))`);
        // await queryRunner.query(`CREATE TABLE "error_event" ("id" character varying NOT NULL, "description" text NOT NULL, CONSTRAINT "PK_c2e5dc904a1e06d26e1538544ed" PRIMARY KEY ("id"))`);
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
