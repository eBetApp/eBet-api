import { Request, Response } from 'express';
import { User } from '../entity/User';

interface _avatarMulterFile extends Express.Multer.File {
	location: string; // location not present (forgotten?) in multer types
}

export interface UploadAvatar_Request extends Request {
	body: { uuid: string };
	file: _avatarMulterFile;
}

export interface UploadAvatar_Response extends Response {
	user: User;
}
