import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { getRepository, Repository } from "typeorm";
import { validate, ValidationError } from "class-validator";
import passport from "passport";
import { User } from "../entity/User";

class AuthController {
	/**
	 * @swagger
	 * path:
	 *  /auth/signup:
	 *    post:
	 *      summary: Create a new user
	 *      tags: [Users]
	 *      requestBody:
	 *        required: true
	 *        content:
	 *          application/json:
	 *            schema:
	 *              $ref: '#/components/schemas/User'
	 *      responses:
	 *        "201":
	 *          description: New user created
	 *          content:
	 *            application/json:
	 *              schema:
	 *                $ref: '#/components/schemas/ResponseUserRegistered'
	 *        "400":
	 *          description: Incorrect input data - User not created
	 */

	static signup = async (req: Request, res: Response): Promise<void> => {
		console.log("SIGN UP");
		const { nickname, password, email } = req.body;

		const user: User = new User();
		user.nickname = nickname;
		user.password = password;
		user.email = email;

		const errors: ValidationError[] = await validate(user);
		if (errors.length > 0) {
			res.status(400).send(errors);
			return;
		}

		user.hashPassword();

		try {
			const userRepository: Repository<User> = getRepository(User);
			await userRepository.save(user);
			console.log("User created");
			console.log(user);

			const userPath: string = path.join(
				__dirname,
				"../../myS3DATA",
				user.uuid.toString(),
			);
			console.log(userPath);
			if (!fs.existsSync(userPath)) {
				fs.mkdir(userPath, () => {
					console.log("bucke created");
				});
				// fs.mkdir(userPath, {recursive: true}, err => {})
			}

			const payload = { id: user.uuid, nickname, email };
			const token: string = jwt.sign(
				payload,
				process.env.SECRET as string,
			);

			res.status(201).json({ data: { user }, meta: { token } });
		} catch (error) {
			res.status(400).json({ error: error.message });
		}
	};

	/**
	 * @swagger
	 * path:
	 *  /auth/signin:
	 *    post:
	 *      summary: Create a new user
	 *      tags: [Users]
	 *      requestBody:
	 *        required: true
	 *        content:
	 *          application/json:
	 *            schema:
	 *              $ref: '#/components/schemas/User'
	 *      responses:
	 *        "200":
	 *          description: User logged
	 *          content:
	 *            application/json:
	 *              schema:
	 *                type: array
	 *                $ref: '#/components/schemas/ResponseUserRegistered'
	 *        "400":
	 *          description: Incorrect input data - User not logged
	 */
	static signin = async (
		req: Request,
		res: Response,
	): Promise<Response | void> => {
		console.log("#SIGN IN");

		passport.authenticate(
			"local",
			{ session: false },
			async (err, user: User) => {
				if (err) {
					res.status(400).json({
						error: { message: err },
					});
					return res.status(400);
				}

				const token: string = AuthController.setToken(user);

				res.status(200).json({ data: { user }, meta: { token } });
			},
		)(req, res);
	};

	public static setToken(user: User): string {
		const { uuid, nickname, email } = user;
		const payload = { uuid, nickname, email };
		const token: string = jwt.sign(payload, process.env.SECRET as string);
		return token;
	}
}
export default AuthController;
