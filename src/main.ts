import "reflect-metadata";
import { createConnection } from "typeorm";
import app from "./app";
import { User } from "./entity/User";
import * as PostgressConnectionStringParser from "pg-connection-string";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
require("dotenv").config();

if (process.env.DB_DEV_URL == null)
	throw new Error("DB_DEV_URL is required in .env file");

const databaseUrl: string = process.env.DB_DEV_URL as string;

const connectionOptions = PostgressConnectionStringParser.parse(databaseUrl);

const typeOrmOptions: PostgresConnectionOptions = {
	type: "postgres",
	host: connectionOptions.host as string,
	port:
		connectionOptions.port == null
			? 5432
			: (Number.parseInt(connectionOptions.port) as number),
	username: connectionOptions.user as string,
	password: connectionOptions.password as string,
	database: connectionOptions.database as string,
	synchronize: true,
	logging: false,
	entities: [User],
	extra: {
		ssl: process.env.DB_DEV_SSL === "true" ? true : false,
	},
};

createConnection(typeOrmOptions)
	.then(() => {
		app.listen(process.env.PORT || 3000, function() {
			console.log("Example app listening on port 3000!");
		});
	})
	.catch(error => console.log(error));
