import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import express from 'express';

const app = express();
const port: number = parseInt(process.env.PORT!) ;

app.use(express.static(path.join(__dirname, 'static')));
app.listen(port);