const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class fearless1635425090525 {
    name = 'fearless1635425090525'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "fees_paid" ("id" character varying NOT NULL, "fee" numeric NOT NULL, "block_producer_address" text NOT NULL, CONSTRAINT "PK_0b92b5f61752bd99bc4864c114d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "transfer" ("id" character varying NOT NULL, "amount" text NOT NULL, "to" text NOT NULL, "from" text NOT NULL, "event_idx" text NOT NULL, "extrinisic_idx" text NOT NULL, "success" boolean NOT NULL, "fee_id" character varying NOT NULL, CONSTRAINT "PK_fd9ddbdd49a17afcbe014401295" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f6b9e9b86a1ce51c26cd08f596" ON "transfer" ("fee_id") `);
        await queryRunner.query(`CREATE TABLE "accumulated_reward" ("id" character varying NOT NULL, "amount" numeric NOT NULL, CONSTRAINT "PK_43a34960ffea1cfdf37fb441ed2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "history_element" ("id" character varying NOT NULL, "block_number" integer NOT NULL, "extrinsic_idx" text, "extrinsic_hash" text, "timestamp" numeric NOT NULL, "address" text NOT NULL, "reward" jsonb, "extrinsic" jsonb, "transfer_id" character varying, CONSTRAINT "PK_b10b09ee684b794e1ca6dc2470c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_005288c58d209d8f60bb8b7a38" ON "history_element" ("transfer_id") `);
        await queryRunner.query(`CREATE TABLE "era_validator_info" ("id" character varying NOT NULL, "address" text NOT NULL, "era" integer NOT NULL, "total" numeric NOT NULL, "own" numeric NOT NULL, "others" jsonb NOT NULL, CONSTRAINT "PK_8a494e2a4a4400b9297e2a6bec8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "stake_change" ("id" character varying NOT NULL, "block_number" integer NOT NULL, "extrinsic_hash" text, "event_idx" text NOT NULL, "timestamp" numeric NOT NULL, "address" text NOT NULL, "amount" numeric NOT NULL, "accumulated_amount" numeric NOT NULL, "type" text NOT NULL, CONSTRAINT "PK_c8caa97569762773f19cf127103" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "accumulated_stake" ("id" character varying NOT NULL, "amount" numeric NOT NULL, CONSTRAINT "PK_b8067048d2065bcf1c7dd1a6ae0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "error_event" ("id" character varying NOT NULL, "description" text NOT NULL, CONSTRAINT "PK_c2e5dc904a1e06d26e1538544ed" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "transfer" ADD CONSTRAINT "FK_f6b9e9b86a1ce51c26cd08f596a" FOREIGN KEY ("fee_id") REFERENCES "fees_paid"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "history_element" ADD CONSTRAINT "FK_005288c58d209d8f60bb8b7a381" FOREIGN KEY ("transfer_id") REFERENCES "transfer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "history_element" DROP CONSTRAINT "FK_005288c58d209d8f60bb8b7a381"`);
        await queryRunner.query(`ALTER TABLE "transfer" DROP CONSTRAINT "FK_f6b9e9b86a1ce51c26cd08f596a"`);
        await queryRunner.query(`DROP TABLE "error_event"`);
        await queryRunner.query(`DROP TABLE "accumulated_stake"`);
        await queryRunner.query(`DROP TABLE "stake_change"`);
        await queryRunner.query(`DROP TABLE "era_validator_info"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_005288c58d209d8f60bb8b7a38"`);
        await queryRunner.query(`DROP TABLE "history_element"`);
        await queryRunner.query(`DROP TABLE "accumulated_reward"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f6b9e9b86a1ce51c26cd08f596"`);
        await queryRunner.query(`DROP TABLE "transfer"`);
        await queryRunner.query(`DROP TABLE "fees_paid"`);
    }
}
