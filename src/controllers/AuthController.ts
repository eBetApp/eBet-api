import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { getRepository, Repository } from 'typeorm';
import { validate, ValidationError } from 'class-validator';
import passport from 'passport';
import { User } from '../entity/User';
import { SendMail, Mail } from '../services/mailGunService';
import { signupService } from '../services/userAuthServices';

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

	static signup = async (req: Request, res: Response): Promise<Response> => {
		const { nickname, password, email } = req.body;
		try {
			const result = await signupService(nickname, password, email);
			return res.status(result.status).json(result);
		} catch (error) {
			return res.status(error.status).send(error.err);
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

	// TODO: create service to use also graphQL
	static signin = async (
		req: Request,
		res: Response,
	): Promise<Response | void> => {
		console.log('#SIGN IN');

		passport.authenticate(
			'local',
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
