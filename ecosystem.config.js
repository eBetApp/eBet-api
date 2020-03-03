module.exports = {
	apps: [
		{
			name: 'app',
			script: './.dist/main.js',

			// Options reference: https://pm2.keymetrics.io/docs/usage/application-declaration/
			args: 'one two',
			instances: 2,
			autorestart: true,
			watch: false,
			max_memory_restart: '1G',
		},
	],
};
