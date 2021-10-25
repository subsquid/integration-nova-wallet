import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_} from "typeorm"
import * as marshal from "../marshal"
import {IndividualExposure} from "./individualExposure"

@Entity_()
export class EraValidatorInfo {
  constructor(props?: Partial<EraValidatorInfo>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("text", {nullable: false})
  address!: string

  @Column_("integer", {nullable: false})
  era!: number

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  total!: bigint

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  own!: bigint

  @Column_("jsonb", {transformer: {to: obj => obj.map((val: any) => val == null ? undefined : val.toJSON()), from: obj => marshal.fromList(obj, val => val == null ? undefined : new IndividualExposure(undefined, val))}, nullable: false})
  others!: (IndividualExposure | undefined | null)[]
}
