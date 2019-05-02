import { PatientsController } from "../../api/patients.controller";
import { PatientsService } from "../../service/patients/patients.service";
import { AuthzModule } from "../../authz.module";

export const metadata = getMetadata(false);

export function getMetadata(authzEnable: boolean) {
  return {
    imports: [AuthzModule],
    controllers: [PatientsController],
    providers: [PatientsService, { provide: "AUTHZ_ENABLE", useValue: authzEnable }],
    exports: [PatientsService, { provide: "AUTHZ_ENABLE", useValue: authzEnable }]
  };
}
