import { Controller, Get, Param, Res, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Response } from 'express';

@Controller('uploads')
export class UploadsController {
    private readonly logger = new Logger(UploadsController.name);
    constructor(private prisma: PrismaService) { }

    @Get(':id/:filename?')
    async getImage(@Param('id') id: string, @Res() res: Response) {
        const userAgent = res.req.headers['user-agent'];
        const image = await (this.prisma as any).storedImage.findUnique({
            where: { id }
        });

        if (!image) {
            this.logger.warn(`[Uploads] Image NOT FOUND: ${id}`);
            throw new NotFoundException('Image not found');
        }

        const signature = image.data.slice(0, 4).toString('hex').toUpperCase();
        this.logger.log(`[Uploads] Serving image ${id} (MIME: ${image.mimeType}, Size: ${image.data.length}, Hex: ${signature}) to User-Agent: ${userAgent}`);

        // Simple headers - many media proxies prefer minimal headers
        res.setHeader('Content-Type', image.mimeType);
        res.setHeader('Content-Length', image.data.length);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=3600');

        res.end(image.data);
    }
}
