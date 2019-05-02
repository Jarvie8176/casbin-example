import { Module } from "@nestjs/common";
import { metadata } from "./common/metadata/api.module.metadata";

@Module(metadata)
export class ApiModule {}
