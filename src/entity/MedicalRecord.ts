import { CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Patient } from "./Patient";
import { Doctor } from "./Doctor";

@Entity()
export class MedicalRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Patient, patient => patient.medicalRecords)
  patient: Patient;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToMany(() => Doctor, doctor => doctor.id)
  @JoinTable()
  doctorsAssigned: Doctor[];
}
