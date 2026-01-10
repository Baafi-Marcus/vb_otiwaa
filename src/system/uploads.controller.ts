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

        this.logger.log(`[Uploads] Serving image ${id} (${image.mimeType}, ${image.data.length} bytes) to User-Agent: ${userAgent}`);

        res.set({
            'Content-Type': image.mimeType,
            'Content-Length': image.data.length,
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=3600',
        });

        res.end(image.data);
    }
}
