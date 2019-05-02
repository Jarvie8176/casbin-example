import { Module } from "@nestjs/common";
import { PatientsController } from "./api/patients.controller";
import { PatientsService } from "./service/patients/patients.service";
import { AuthzModule } from "./authz.module";

@Module({
  imports: [AuthzModule],
  controllers: [PatientsController],
  providers: [PatientsService]
})
export class ApiModule {}
