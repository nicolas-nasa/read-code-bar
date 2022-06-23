import { Router } from 'express';

import { ticketController } from '../controllers';

const routes = Router();

routes.get('/read/:id', ticketController.readerCodeBar);

export default routes;
