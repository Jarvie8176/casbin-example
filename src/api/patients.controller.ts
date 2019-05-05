import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Headers,
  Injectable,
  Param,
  ParseIntPipe,
  Query,
  UseInterceptors
} from "@nestjs/common";
import { Patient } from "../entity/Patient";
import { PatientsService } from "../service/patients/patients.service";
import { TransformInterceptor } from "../common/interceptors/transform.interceptor";
import { UserIdentity } from "../common/interfaces/authz";

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
  async list(@Query("fields") fields?: string, @Headers("identity") identity?: string): Promise<Patient[]> {
    return this.getPatientsService().list(this.retrieveUser(identity), fields && fields.split(","));
  }

  @Get(":id")
  async detail(
    @Param("id", ParseIntPipe) patientId: number,
    @Query("fields") fields?: string,
    @Headers("identity") identity?: string
  ): Promise<Patient> {
    return this.getPatientsService().detail(this.retrieveUser(identity), patientId, fields && fields.split(","));
  }

  private retrieveUser(identity: string): UserIdentity {
    let defaults = { id: null, persona: [] };
    try {
      return JSON.parse(identity) || defaults;
    } catch (err) {
      return defaults;
    }
  }
}
