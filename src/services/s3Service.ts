import multer, { FileFilterCallback } from 'multer';
import multerS3 from 'multer-s3';

const aws = require('aws-sdk');

aws.config.update({
	secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
	accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
	region: process.env.AWS_S3_REGION,
});

const s3: AWS.S3 = new aws.S3();

const fileFilter = (
	req: any,
	file: Express.Multer.File,
	cb: FileFilterCallback,
) => {
	if (
		file.mimetype === 'image/jpeg' ||
		file.mimetype === 'image/jpg' ||
		file.mimetype === 'image/png'
	) {
		cb(null, true);
	} else {
		cb(new Error('Invalid file type, only JPEG and PNG is allowed!'));
	}
};

const multerS3Options = {
	acl: 'public-read',
	s3,
	bucket: String(process.env.AWS_S3_BUCKET),
	metadata: function(
		req: Express.Request,
		file: Express.Multer.File,
		cb: (error: any, metadata?: any) => void,
	) {
		cb(null, { fieldName: 'TESTING_METADATA' });
	},
	key: function(
		req: Express.Request,
		file: Express.Multer.File,
		cb: (error: any, key?: string) => void,
	) {
		cb(null, Date.now().toString());
	},
};

const options: multer.Options = {
	fileFilter,
	limits: {
		fileSize: 1024 * 1024 * 5, // Only 5 MB files are allowed
	},
	storage: multerS3(multerS3Options),
};

const uploadImg = multer(options);

const deleteImg: (key: string) => Promise<void> = async imgKey => {
	s3.deleteObject(
		{
			Bucket: String(process.env.AWS_S3_BUCKET),
			Key: imgKey,
		},
		function(err, data) {},
	);
};

export default { uploadImg, deleteImg };
