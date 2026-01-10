import { Controller, Get, Res, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { Response, Request } from 'express';
import { join } from 'path';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('*')
  serveApp(@Req() req: Request, @Res() res: Response) {
    if (req.path.startsWith('/api')) {
      res.status(404).json({ statusCode: 404, message: 'Not Found' });
      return;
    }
    res.sendFile(join(__dirname, '..', '..', 'frontend', 'dist', 'index.html'));
  }
}
