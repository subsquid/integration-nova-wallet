import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"
import * as marshal from "../marshal"

@Entity_()
export class Transfer {
  constructor(props?: Partial<Transfer>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("text", {nullable: false})
  amount!: string

  @Column_("text", {nullable: false})
  to!: string

  @Column_("text", {nullable: false})
  from!: string

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  fee!: bigint

  @Column_("text", {nullable: false})
  eventIdx!: string

  @Column_("text", {nullable: false})
  extrinisicIdx!: string

  @Column_("bool", {nullable: false})
  success!: boolean
}
