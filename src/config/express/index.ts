import cors from 'cors';
import express from 'express';

import routes from '../../routes/index';

const app = express();

const corsOptions = {
    origin: '*',
    methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    preflightContinue: false,
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

app.use(express.json());

Object.keys(routes).forEach(key => app.use(`/api/${key}`, routes[key]));

export { app };
