import { createParamDecorator } from "@nestjs/common";

export const Cookie = createParamDecorator((data, req) => {
  return req.cookies;
});
