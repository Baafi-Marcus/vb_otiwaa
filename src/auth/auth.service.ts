import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async validateUser(username: string, pass: string, type: 'admin' | 'merchant'): Promise<any> {
        let user: any;
        if (type === 'admin') {
            user = await (this.prisma as any).admin.findUnique({ where: { username } });
        } else {
            user = await (this.prisma as any).merchant.findFirst({
                where: {
                    OR: [
                        { whatsappPhoneNumberId: username },
                        { twilioPhoneNumber: username },
                        { id: username }
                    ]
                }
            });
        }

        if (user && user.password) {
            const isMatch = await bcrypt.compare(pass, user.password);
            if (isMatch) {
                const { password, ...result } = user;
                return { ...result, type };
            }
        } else if (user && !user.password) {
            const { password, ...result } = user;
            return { ...result, type, setupRequired: true };
        }

        return null;
    }

    async login(user: any) {
        const payload = {
            sub: user.id,
            username: user.username || user.whatsappPhoneNumberId || user.id,
            type: user.type
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                name: user.name || user.username,
                type: user.type,
                setupRequired: user.setupRequired || false
            }
        };
    }

    async setInitialPassword(userId: string, pass: string, type: 'admin' | 'merchant') {
        const hashedPassword = await bcrypt.hash(pass, 10);
        if (type === 'admin') {
            return (this.prisma as any).admin.update({
                where: { id: userId },
                data: { password: hashedPassword }
            });
        } else {
            return (this.prisma as any).merchant.update({
                where: { id: userId },
                data: { password: hashedPassword }
            });
        }
    }
}
