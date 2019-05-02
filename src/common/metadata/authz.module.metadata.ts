import { AuthorizationService } from "../../service/authz/authz.service";
import { Casbin } from "../../service/authz/vendors/casbin/vendors.casbin";

export const metadata = {
  imports: [],
  providers: [
    AuthorizationService,
    Casbin,
    { provide: "AuthzVendor", useClass: Casbin },
    { provide: "AuthzService", useClass: AuthorizationService }
  ],
  exports: [AuthorizationService, { provide: "AuthzService", useClass: AuthorizationService }]
};
