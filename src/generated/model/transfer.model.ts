import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import {FeesPaid} from "./feesPaid.model"

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

  @Index_()
  @ManyToOne_(() => FeesPaid, {nullable: false})
  fee!: FeesPaid

  @Column_("text", {nullable: false})
  eventIdx!: string

  @Column_("text", {nullable: false})
  extrinisicIdx!: string

  @Column_("bool", {nullable: false})
  success!: boolean
}
