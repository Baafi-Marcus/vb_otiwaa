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

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsString()
    operatingHours?: string;

    @IsOptional()
    @IsString()
    paymentMethods?: string;

    @IsOptional()
    @IsString()
    momoNumber?: string;

    @IsOptional()
    @IsString()
    logoUrl?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    latitude?: number;

    @IsOptional()
    @IsNumber()
    longitude?: number;
}
