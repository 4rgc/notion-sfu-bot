import express from 'express';
import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const app = express();

app.listen(8080, () => {
	console.log('Listening on port 8080...');
});
