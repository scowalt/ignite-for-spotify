import dotenv from 'dotenv';
dotenv.config();

import express from 'express';

const app = express();
const port: number = parseInt(process.env.PORT!) ;

app.get('/', (req, res) => {
	res.send('Hello World!');
});
app.listen(port);