import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { getRepository, Repository } from 'typeorm';
import { validate, ValidationError } from 'class-validator';
import passport from 'passport';
import { User } from '../entity/User';
import { SendMail, Mail } from '../services/mailGunService';
import { signupService, signinService } from '../services/userAuthServices';

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
		const { nickname, password, email, birthDate } = req.body;
		try {
			const result = await signupService(nickname, password, email, birthDate);
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
	static signin = async (req: Request, res: Response): Promise<Response | void> => {
		try {
			const result = await signinService(req, res);
			return res.status(result.status).json(result);
		} catch (error) {
			return res.status(error.status).send(error.err);
		}
	};

	public static setToken(user: User): string {
		const { uuid, nickname, email, birthDate } = user;
		const payload = { uuid, nickname, email };
		const token: string = jwt.sign(payload, process.env.SECRET as string);
		return token;
	}
}
export default AuthController;
