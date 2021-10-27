import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToOne as OneToOne_, Index as Index_, JoinColumn as JoinColumn_} from "typeorm"
import * as marshal from "../marshal"
import {Transfer} from "./transfer.model"

@Entity_()
export class FeesPaid {
  constructor(props?: Partial<FeesPaid>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("text", {nullable: false})
  extrinisicIdx!: string

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  fee!: bigint

  @Column_("text", {nullable: false})
  blockProducerAddress!: string

  @Index_({unique: true})
  @OneToOne_(() => Transfer, {nullable: false})
  @JoinColumn_()
  transfer!: Transfer
}
