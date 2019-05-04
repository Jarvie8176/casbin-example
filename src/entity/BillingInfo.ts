import { Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Patient } from "./Patient";
import { Accountant } from "./Accountant";

@Entity()
export class BillingInfo {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Patient, patient => patient.billingInfo)
  patient: Patient;

  @ManyToOne(() => Accountant, accountant => accountant.id)
  @JoinTable()
  accountant?: Accountant;

  @Column()
  address: string;
}
