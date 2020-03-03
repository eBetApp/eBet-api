import express, { Express } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import passport from "passport";
import Routes from "./routes";
import "./middlewares/passport";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const app: Express = express();

app.use(passport.initialize());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.use("/api", Routes);

app.get("/", (req, res) => res.status(200).end("Type /api to use it"));

// Swagger set up
const options = {
	swaggerDefinition: {
		openapi: "3.0.0",
		info: {
			title: "API My S3 - Documentation",
			version: "1.0.0",
			description: "An api project based on main AWS S3 concepts",
			// license: {
			//   name: "MIT",
			//   url: "https://choosealicense.com/licenses/mit/"
			// },
			// contact: {
			//   name: "Swagger",
			//   url: "https://swagger.io",
			//   email: "Info@SmartBear.com"
			// }
		},
		servers: [
			{
				url: `http://localhost:${process.env.PORT || 3000}/api/`,
			},
		],
	},
	apis: [
		"./src/entity/User.ts",
		"./src/controllers/AuthController.ts",
		"./src/controllers/UserController.ts",
	],
};
const specs = swaggerJsdoc(options);
app.use("/docs", swaggerUi.serve);
app.get(
	"/docs",
	swaggerUi.setup(specs, {
		explorer: true,
	}),
);

export default app;
