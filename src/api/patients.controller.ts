import { ClassSerializerInterceptor, Controller, Get, Injectable, Param, Query, UseInterceptors } from "@nestjs/common";
import { Patient } from "../entity/Patient";
import { PatientsService } from "../service/patients/patients.service";
import { TransformInterceptor } from "../common/interceptors/transform.interceptor";

@Injectable()
@Controller("patients")
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(TransformInterceptor)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  private getPatientsService(): PatientsService {
    return this.patientsService;
  }

  @Get()
  async list(@Query("fields") fields?: string): Promise<Patient[]> {
    return this.getPatientsService().list(null, fields && fields.split(","));
  }

  @Get(":id")
  async detail(@Param("id") patientId: number, @Query("fields") fields?: string): Promise<Patient> {
    return this.getPatientsService().detail(null, patientId, fields && fields.split(","));
  }
}
