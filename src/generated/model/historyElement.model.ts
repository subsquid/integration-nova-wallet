import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import * as marshal from "../marshal"
import {Reward} from "./reward"
import {Extrinsic} from "./extrinsic"
import {Transfer} from "./transfer.model"

@Entity_()
export class HistoryElement {
  constructor(props?: Partial<HistoryElement>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("integer", {nullable: false})
  blockNumber!: number

  @Column_("text", {nullable: true})
  extrinsicIdx!: string | undefined | null

  @Column_("text", {nullable: true})
  extrinsicHash!: string | undefined | null

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  timestamp!: bigint

  @Column_("text", {nullable: false})
  address!: string

  @Column_("jsonb", {transformer: {to: obj => obj == null ? undefined : obj.toJSON(), from: obj => obj == null ? undefined : new Reward(undefined, obj)}, nullable: true})
  reward!: Reward | undefined | null

  @Column_("jsonb", {transformer: {to: obj => obj == null ? undefined : obj.toJSON(), from: obj => obj == null ? undefined : new Extrinsic(undefined, obj)}, nullable: true})
  extrinsic!: Extrinsic | undefined | null

  @Index_()
  @ManyToOne_(() => Transfer, {nullable: true})
  transfer!: Transfer | undefined | null
}
