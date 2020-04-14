import { getRepository, Repository } from 'typeorm';
import { Request, Response } from 'express';
import { User } from '../entity/User';
import { validate, ValidationError } from 'class-validator';
import { SendMail, Mail } from '../services/mailGunService';
import S3 from '../services/s3Service';
import {
	UploadAvatar_Request,
	UploadAvatar_Response,
} from './UserController.types';

const imageUpload = S3.uploadImg.single('file');

export default class UserController {
	/**
	 * @swagger
	 * path:
	 *  /user:
	 *    get:
	 *      summary: Get list of ALL users
	 *      tags: [Users]
	 *      parameters:
	 *        - in: header
	 *          name: Authorization
	 *          description: Bearer + TOKEN
	 *          schema:
	 *            type: string
	 *            format: token
	 *          required: true
	 *      responses:
	 *        "200":
	 *          description: List of ALL registered users is returned
	 *          content:
	 *            application/json:
	 *              schema:
	 *                $ref: '#/components/schemas/ResponseArrayOfUsers'
	 *        "401":
	 *          description: Wrong token - Response null
	 */

	static all = async (
		request: Request,
		response: Response,
	): Promise<void> => {
		console.log('Route ALL is called');
		const userRepository: Repository<User> = getRepository(User);
		userRepository
			.find()
			.then(result => response.status(200).send(result))
			.catch(err => {
				// Should never occure
				console.log(err);
				response.status(500).send(err);
			});
	};

	/**
	 * @swagger
	 * path:
	 *  /user/{id}:
	 *    get:
	 *      summary: Get complete informations of specified user
	 *      tags: [Users]
	 *      parameters:
	 *        - in: path
	 *          name: User uuid
	 *          schema:
	 *            type: integer
	 *          required: true
	 *        - in: header
	 *          name: Authorization
	 *          description: Bearer + TOKEN
	 *          schema:
	 *            type: string
	 *            format: token
	 *          required: true
	 *      responses:
	 *        "200":
	 *          description: Complete informations of specified user is returned
	 *          content:
	 *            application/json:
	 *              schema:
	 *                $ref: '#/components/schemas/ResponseUserSingle'
	 *        "401":
	 *          description: Token is incorrectly formatted
	 *        "500":
	 *          description: Wrong token
	 */
	static one = async (
		request: Request,
		response: Response,
	): Promise<void> => {
		console.log('Route ONE is called');
		const userRepository: Repository<User> = getRepository(User);
		userRepository
			.findOne(request.params.id)
			.then(result => response.status(200).send(result))
			.catch(err => {
				const errMsg = `Incorrect id, error: ${err}`;
				console.log(errMsg);
				response.status(401).send(errMsg);
			});
	};

	/**
	 * @swagger
	 * path:
	 *  /user/{id}:
	 *    delete:
	 *      summary: Delete specified user
	 *      tags: [Users]
	 *      parameters:
	 *        - in: path
	 *          name: User uuid
	 *          schema:
	 *            type: integer
	 *          required: true
	 *        - in: header
	 *          name: Authorization
	 *          description: Bearer + TOKEN
	 *          schema:
	 *            type: string
	 *            format: token
	 *          required: true
	 *      responses:
	 *        "200":
	 *          description: User id deleted
	 *          content:
	 *            application/json:
	 *              schema:
	 *                $ref: '#/components/schemas/ResponseUserDeleted'
	 *        "401":
	 *          description: Token is incorrectly formatted
	 *        "404":
	 *          description: User does not exist
	 *        "500":
	 *          description: Wrong token
	 */
	static delete = async (
		request: Request,
		response: Response,
	): Promise<void> => {
		console.log('Route DELETE is called');
		const userRepository: Repository<User> = getRepository(User);
		userRepository
			.findOne(request.params.id)
			.then(userToRemove => {
				if (userToRemove == undefined) throw new Error();
				// user founded
				userRepository
					.remove(userToRemove!)
					.then(result => {
						response.status(200).send(result);
						const data: Mail = {
							from: 'eBet <eBet@eBet.org>',
							to: userToRemove.email,
							subject: 'Unsubscription',
							text: `Hey ${userToRemove.nickname}! We are worried to confirm that your account has been successfully deleted. We hope to see you back soon!`,
						};

						SendMail(data);
					})
					.catch(err => {
						// Should never occure
						const errMsg = `Impossible to remove user${userToRemove}, err: ${err}`;
						console.log(errMsg);
						response.status(500).send(errMsg);
					});
			})
			.catch(err => {
				const errMsg = `User not found, err: ${err}`;
				console.log(errMsg);
				response.status(404).send(errMsg);
			});
	};

	/**
	 * @swagger
	 * path:
	 *  /user/:
	 *    put:
	 *      summary: Update specified user in body
	 *      tags: [Users]
	 *      requestBody:
	 *        required: true
	 *        content:
	 *          application/json:
	 *            schema:
	 *              $ref: '#/components/schemas/User'
	 *      parameters:
	 *        - in: path
	 *          name: User uuid
	 *          schema:
	 *            type: integer
	 *          required: true
	 *        - in: header
	 *          name: Authorization
	 *          description: Bearer + TOKEN
	 *          schema:
	 *            type: string
	 *            format: token
	 *          required: true
	 *      responses:
	 *        "200":
	 *          description: User id updated
	 *          content:
	 *            application/json:
	 *              schema:
	 *                $ref: '#/components/schemas/ResponseUserSingle'
	 *        "400":
	 *          description: Incorrect body data
	 *        "401":
	 *          description: Token is incorrectly formatted
	 *        "404":
	 *          description: User does not exist
	 *        "500":
	 *          description: Wrong token or missing data in body
	 */
	static update = async (
		request: Request,
		response: Response,
	): Promise<void> => {
		console.log('Route UPDATE is called');

		const { id, nickname, email } = request.body;

		const userRepository: Repository<User> = getRepository(User);

		const userToUpdate: User = new User();
		userToUpdate.password = 'password'; // fake, only to pass validation
		userToUpdate.nickname = nickname;
		userToUpdate.email = email;

		const errors: ValidationError[] = await validate(userToUpdate);

		if (errors.length > 0) {
			response.status(400).send(errors);
			return;
		}

		await userRepository
			.update(id, { nickname, email })
			.then(async () => {
				const userUpdated:
					| User
					| undefined = await userRepository.findOne(id);
				response.status(200).send(userUpdated);
			})
			.catch(error => {
				response.status(500).json(error.message);
			});
	};

	// TODO: doc swagger
	/**
	 * @swagger
	 * path:
	 *  /user/upload-avatar:
	 *    post:
	 *      summary: Update avatar of user specified by uuid in body
	 *      tags: [Users]
	 *      requestBody:
	 *        required: true
	 *        content:
	 *          application/json:
	 *            schema:
	 *              $ref: '#/components/schemas/RequestBodyUserUpdateAvatar'
	 *      parameters:
	 *        - in: header
	 *          name: Authorization
	 *          description: Bearer + TOKEN
	 *          schema:
	 *            type: string
	 *            format: token
	 *          required: true
	 *      responses:
	 *        "200":
	 *          description: User id updated
	 *          content:
	 *            application/json:
	 *              schema:
	 *                $ref: '#/components/schemas/ResponseUserWithAvatar'
	 *        "422":
	 *          description: Incorrect image data
	 */
	static uploadAvatar = (
		req: any,
		res: any,
		// req: UploadAvatar_Request,
		// res: UploadAvatar_Response,
	): void => {
		imageUpload(req, res, async (err: { message: any }) => {
			if (err) {
				console.log('ERROR in image uploading: ', err.message);

				return res.status(422).send({
					errors: [
						{
							title: 'Image Upload Error',
							detail: err.message,
						},
					],
				});
			}

			const { uuid } = req.body;

			const userRepository: Repository<User> = getRepository(User);

			const userToUpdate: User = new User();
			userToUpdate.avatar = req.file.location;

			const errors: ValidationError[] = await validate(userToUpdate, {
				skipMissingProperties: true,
			});

			if (errors.length > 0) {
				res.status(400).send(errors);
				return;
			}

			await userRepository
				.update(uuid, { avatar: userToUpdate.avatar })
				.then(async () => {
					const user: User | undefined = await userRepository.findOne(
						uuid,
					);
					console.log('user updated:');
					console.log(user);
					res.status(200).send({ user });
				})
				.catch((error: { message: any }) => {
					res.status(500).json(error.message);
				});
		});
	};

	/**
	 * @swagger
	 * path:
	 *  /user/delete-avatar:
	 *    delete:
	 *      summary: Delete avatar from AWS S3 by id
	 *      tags: [Users]
	 *      parameters:
	 *        - in: path
	 *          name: Photo id
	 *          schema:
	 *            type: integer
	 *          required: true
	 *        - in: header
	 *          name: Authorization
	 *          description: Bearer + TOKEN
	 *          schema:
	 *            type: string
	 *            format: token
	 *          required: true
	 *      responses:
	 *        "200":
	 *          description: Image correctly deleted
	 *          content:
	 *            application/json:
	 *              message:
	 *        "500":
	 *          description: Image cannot be deleted
	 *          content:
	 *            application/json:
	 *              message:
	 */
	static deleteAvatar = (req: Request, res: Response): Response => {
		console.log('DELETE');
		try {
			console.log('params');
			console.log(req.params);
			S3.deleteImg(req.params.fileKey);
			return res.status(200).json({
				message: 'Success - Image deleted from S3 or not existing',
			});
		} catch (err) {
			return res.status(500).json({ message: 'error', error: err.stack });
		}
	};
}
