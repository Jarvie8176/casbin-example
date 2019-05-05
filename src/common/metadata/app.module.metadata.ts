import { ApiModule } from "../../api.module";
import { RouterModule } from "nest-router";

export const metadata = {
  imports: [
    ApiModule,
    RouterModule.forRoutes([
      {
        path: "/api",
        module: ApiModule
      }
    ])
  ],
};
