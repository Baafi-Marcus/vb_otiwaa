import { IsString, IsEnum } from 'class-validator';

export class CreateUpgradeRequestDto {
    @IsString()
    requestedTier: string;
}
