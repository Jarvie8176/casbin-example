import { Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { MedicalRecord } from "./MedicalRecord";
import { BillingInfo } from "./BillingInfo";

@Entity()
export class Patient {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => BillingInfo, billingInfo => billingInfo.patient)
  billingInfo: BillingInfo;

  @OneToMany(() => MedicalRecord, medicalRecord => medicalRecord.patient)
  medicalRecords: MedicalRecord[];
}
