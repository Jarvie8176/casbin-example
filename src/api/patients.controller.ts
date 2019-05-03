import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Injectable,
  Param,
  ParseIntPipe,
  Query,
  UseInterceptors
} from "@nestjs/common";
import { Patient } from "../entity/Patient";
import { PatientsService } from "../service/patients/patients.service";
import { TransformInterceptor } from "../common/interceptors/transform.interceptor";
import { Cookie } from "../common/decorators/cooke.decorator";
import { UserContext } from "../common/interfaces/authz";

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
  async list(@Query("fields") fields?: string, @Cookie() cookie?): Promise<Patient[]> {
    return this.getPatientsService().list(this.retrieveUser(cookie), fields && fields.split(","));
  }

  @Get(":id")
  async detail(
    @Param("id", ParseIntPipe) patientId: number,
    @Query("fields") fields?: string,
    @Cookie() cookie?
  ): Promise<Patient> {
    return this.getPatientsService().detail(this.retrieveUser(cookie), patientId, fields && fields.split(","));
  }

  private retrieveUser(cookie): UserContext {
    let defaults = { id: null, persona: [] };
    try {
      return JSON.parse(cookie.context) || defaults;
    } catch (err) {
      return defaults;
    }
  }
}
