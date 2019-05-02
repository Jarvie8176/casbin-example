import { Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { BillingInfo } from "./BillingInfo";

@Entity()
export class Accountant {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToMany(() => BillingInfo, billingInfo => billingInfo.id)
  billingInfo: BillingInfo[];
}
