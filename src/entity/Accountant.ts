import { Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { BillingInfo } from "./BillingInfo";

@Entity()
export class Accountant {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => BillingInfo, billingInfo => billingInfo.id)
  billingInfo: BillingInfo[];
}
