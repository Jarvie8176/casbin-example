import { Controller, Get, Injectable, Param, Query } from "@nestjs/common";
import { Patient } from "../entity/Patient";
import { PatientsService } from "../service/patients/patients.service";

@Controller("patients")
@Injectable()
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  async list(@Query("fields") fields?: string): Promise<Patient[]> {
    return this.patientsService.list(fields && fields.split(","));
  }

  @Get(":id")
  async detail(@Param("id") id: number, @Query("fields") fields?: string): Promise<Patient> {
    //
    return this.patientsService.detail(id, fields && fields.split(","));
  }
}
