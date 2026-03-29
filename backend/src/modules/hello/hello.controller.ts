import { Request, Response } from 'express';
import { helloService } from './hello.service';

class HelloController {
  async getHello(req: Request, res: Response): Promise<void> {
    const message = await helloService.sayHello();
    res.json({ message });
  }
}

export const helloController = new HelloController();
