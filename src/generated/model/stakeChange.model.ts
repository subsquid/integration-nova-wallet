import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"
import * as marshal from "../marshal"

@Entity_()
export class StakeChange {
  constructor(props?: Partial<StakeChange>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("integer", {nullable: false})
  blockNumber!: number

  @Column_("text", {nullable: true})
  extrinsicHash!: string | undefined | null

  @Column_("text", {nullable: false})
  eventIdx!: string

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  timestamp!: bigint

  @Column_("text", {nullable: false})
  address!: string

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  amount!: bigint

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  accumulatedAmount!: bigint

  @Column_("text", {nullable: false})
  type!: string
}
