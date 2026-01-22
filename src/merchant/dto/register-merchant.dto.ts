import { IsString, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';

export class RegisterMerchantDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    whatsappPhoneNumberId?: string;

    @IsOptional()
    @IsString()
    twilioPhoneNumber?: string;

    @IsOptional()
    @IsString()
    contactPhone?: string;

    @IsString()
    category: string;

    @IsString()
    clientVision: string;

    @IsOptional()
    @IsString()
    systemPrompt?: string;

    @IsOptional()
    @IsString()
    menuImageUrl?: string;

    @IsOptional()
    @IsString()
    tier?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    tierDurationMonths?: number;
}
