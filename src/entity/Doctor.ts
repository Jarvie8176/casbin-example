import { Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { MedicalRecord } from "./MedicalRecord";

@Entity()
export class Doctor {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToMany(() => MedicalRecord, medicalRecord => medicalRecord.doctorsAssigned)
  medicalRecords: MedicalRecord[];
}
