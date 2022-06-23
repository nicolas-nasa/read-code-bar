import request from 'supertest';
import { app } from '../../config/express/index';

describe('Test read code bar', () => {
    it('return', async () => {
        const res = await request(app).get('/api/ticket/read/21290001192110001210904475617405975870000002000')
        expect(res.body).toHaveProperty('amount', '20.00')
    })
}
)
