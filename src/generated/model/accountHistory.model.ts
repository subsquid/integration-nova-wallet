import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"
import * as marshal from "../marshal"
import {AccountHistoryItem, fromJsonAccountHistoryItem} from "./accountHistoryItem"

@Entity_()
export class AccountHistory {
  constructor(props?: Partial<AccountHistory>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("text", {nullable: false})
  address!: string

  @Column_("integer", {nullable: false})
  blockNumber!: number

  @Column_("text", {nullable: true})
  extrinsicIdx!: string | undefined | null

  @Column_("text", {nullable: true})
  extrinsicHash!: string | undefined | null

  @Column_("timestamp with time zone", {nullable: false})
  timestamp!: Date

  @Column_("jsonb", {transformer: {to: obj => obj.toJSON(), from: obj => fromJsonAccountHistoryItem(obj)}, nullable: false})
  item!: AccountHistoryItem
}
