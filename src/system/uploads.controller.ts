import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Response } from 'express';

@Controller('uploads')
export class UploadsController {
    constructor(private prisma: PrismaService) { }

    @Get(':id/:filename?')
    async getImage(@Param('id') id: string, @Res() res: Response) {
        const userAgent = res.req.headers['user-agent'];
        console.log(`[Uploads] Request for image ${id} from User-Agent: ${userAgent}`);
        const image = await (this.prisma as any).storedImage.findUnique({
            where: { id }
        });

        if (!image) {
            throw new NotFoundException('Image not found');
        }

        res.setHeader('Content-Type', image.mimeType);
        res.setHeader('Content-Length', image.data.length);
        res.end(image.data);
    }
}
