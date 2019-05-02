import { Module } from "@nestjs/common";
import { metadata } from "./common/metadata/authz.module.metadata";

@Module(metadata)
export class AuthzModule {}
