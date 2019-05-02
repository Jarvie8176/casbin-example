import { Connection, createConnection, EntitySchema } from "typeorm";

export async function getMockConnection(entities?: (Function | string | EntitySchema<any>)[]): Promise<Connection> {
  return await createConnection({
    type: "sqlite",
    database: ":memory:",
    dropSchema: true,
    entities: entities,
    synchronize: true,
    logging: false
  });
}
