import { Entity, PrimaryGeneratedColumn, Column, Unique } from "typeorm";
import { Length, IsNotEmpty, IsEmail } from "class-validator";
import * as bcrypt from "bcryptjs";

/**
 * @swagger
 *  components:
 *    schemas:
 *      User:
 *        type: object
 *        required:
 *          - nickname
 *          - email
 *          - password
 *        properties:
 *          nickname:
 *            type: string
 *            description: needs to be unique
 *          email:
 *            type: string
 *            format: email
 *          password:
 *            type: string
 *            format: min. 4 characters
 *        example:
 *           name: Bob
 *           email: bob@gmail.com
 *           password: bob1
 *      ResponseUserRegistered:
 *        example:
 *           data:
 *            user:
 *              uuid: 4c2d544a-803f-4668-b4ed-410a1f
 *              nickname: Bob
 *              email: bob@gmail.com
 *              password: bob1
 *           meta:
 *            token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjRjMmQ1NDRhLTgwM2YtNDY2OC1iNGVkLTQxMGExZjQwZTU4NSIsIm5pY2tuYW1lIjoiZGVsZXRlMjIiLCJ
 *      ResponseArrayOfUsers:
 *        type: array
 *        example:
 *          - uuid: 4c2d544a-803f-4668-b4ed-410a1f
 *            nickname: Bob1
 *            email: bob1@gmail.com
 *            password: bob1
 *          - uuid: 4c2d544a-803f-4668-b4ed-410a1f
 *            nickname: Bob2
 *            email: bob2@gmail.com
 *            password: bob2
 *      ResponseUserSingle:
 *        example:
 *          uuid: 4c2d544a-803f-4668-b4ed-410a1f
 *          nickname: Bob1
 *          email: bob1@gmail.com
 *          password: bob1
 *      ResponseUserDeleted:
 *        example:
 *          nickname: Bob1
 *          email: bob1@gmail.com
 *          password: bob1
 */

@Entity()
@Unique(["nickname"])
export class User {
	@PrimaryGeneratedColumn("uuid")
	uuid!: string;

	@Column("text", { nullable: true })
	@IsNotEmpty()
	nickname!: string;

	@Column("text", { nullable: true })
	@IsNotEmpty()
	@IsEmail()
	email!: string;

	@Column("text", { nullable: true })
	@Length(4, 20)
	@IsNotEmpty()
	password!: string;

	hashPassword(): void {
		this.password = bcrypt.hashSync(this.password, 8);
	}

	checkIfUnencryptedPasswordIsValid(unencryptedPassword: string): boolean {
		return bcrypt.compareSync(unencryptedPassword, this.password);
	}
}
