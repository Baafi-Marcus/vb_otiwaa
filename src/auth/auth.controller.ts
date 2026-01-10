import { Controller, Post, Body, UnauthorizedException, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    async login(@Body() body: any) {
        const { username, password, type } = body;
        const user = await this.authService.validateUser(username, password, type);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return this.authService.login(user);
    }

    @Post('setup')
    async setup(@Body() body: any) {
        const { id, password, type, token } = body;
        // In a real app, verify the token here. For this setup, we allow it if the user has no password.
        const user = await this.authService.setInitialPassword(id, password, type);
        return { success: true, message: 'Password set successfully' };
    }
}
