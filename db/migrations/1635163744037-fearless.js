const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class fearless1635163744037 {
    name = 'fearless1635163744037'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "accumulated_reward" ("id" character varying NOT NULL, "amount" numeric NOT NULL, CONSTRAINT "PK_43a34960ffea1cfdf37fb441ed2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "history_element" ("id" character varying NOT NULL, "block_number" integer NOT NULL, "extrinsic_idx" text, "extrinsic_hash" text, "timestamp" numeric NOT NULL, "address" text NOT NULL, "reward" jsonb, "extrinsic" jsonb, "transfer" jsonb, CONSTRAINT "PK_b10b09ee684b794e1ca6dc2470c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "era_validator_info" ("id" character varying NOT NULL, "address" text NOT NULL, "era" integer NOT NULL, "total" numeric NOT NULL, "own" numeric NOT NULL, "others" jsonb NOT NULL, CONSTRAINT "PK_8a494e2a4a4400b9297e2a6bec8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "stake_change" ("id" character varying NOT NULL, "block_number" integer NOT NULL, "extrinsic_hash" text, "event_idx" text NOT NULL, "timestamp" numeric NOT NULL, "address" text NOT NULL, "amount" numeric NOT NULL, "accumulated_amount" numeric NOT NULL, "type" text NOT NULL, CONSTRAINT "PK_c8caa97569762773f19cf127103" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "accumulated_stake" ("id" character varying NOT NULL, "amount" numeric NOT NULL, CONSTRAINT "PK_b8067048d2065bcf1c7dd1a6ae0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "error_event" ("id" character varying NOT NULL, "description" text NOT NULL, CONSTRAINT "PK_c2e5dc904a1e06d26e1538544ed" PRIMARY KEY ("id"))`);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "error_event"`);
        await queryRunner.query(`DROP TABLE "accumulated_stake"`);
        await queryRunner.query(`DROP TABLE "stake_change"`);
        await queryRunner.query(`DROP TABLE "era_validator_info"`);
        await queryRunner.query(`DROP TABLE "history_element"`);
        await queryRunner.query(`DROP TABLE "accumulated_reward"`);
    }
}
