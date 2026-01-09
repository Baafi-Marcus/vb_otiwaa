import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { TwilioService } from '../twilio/twilio.service';
import axios, { AxiosRequestConfig } from 'axios';
import * as path from 'path';
import { writeFileSync, existsSync, mkdirSync } from 'fs';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly twilioService: TwilioService,
    private readonly httpService: HttpService,
  ) { }

  async sendWhatsAppMessage(
    to: string,
    message: string,
    phoneNumberId?: string,
  ) {
    try {
      this.logger.log(`Sending WhatsApp message to ${to}`);
      const response = await this.twilioService.sendMessage(to, message);
      this.logger.log('Message Sent. SID:', response.sid);
      return response.sid;
    } catch (error: any) {
      this.logger.error('Error Sending WhatsApp Message');
      this.logger.error(error.message);
      return 'Axle broke!! Abort mission!!';
    }
  }

  async markRead(messageSid: string) {
    return this.twilioService.markMessageAsRead(messageSid);
  }

  async sendImageByUrl(to: string, imageUrl: string, caption?: string) {
    try {
      this.logger.log(`Sending WhatsApp image to ${to}: ${imageUrl}`);
      const response = await this.twilioService.sendMediaMessage(to, imageUrl, caption);
      this.logger.log('Image Sent. SID:', response.sid);
      return response.sid;
    } catch (error: any) {
      this.logger.error('Error Sending WhatsApp Image');
      this.logger.error(error.message);
      return 'Axle broke!! Abort mission!!';
    }
  }

  async sendAudioByUrl(to: string, audioUrl: string) {
    try {
      this.logger.log(`Sending WhatsApp audio to ${to}: ${audioUrl}`);
      const response = await this.twilioService.sendMediaMessage(to, audioUrl);
      this.logger.log('Audio Sent. SID:', response.sid);
      return response.sid;
    } catch (error: any) {
      this.logger.error('Error Sending WhatsApp Audio');
      this.logger.error(error.message);
      return 'Axle broke!! Abort mission!!';
    }
  }

  async downloadMedia(mediaUrl: string, fileID: string) {
    const config: AxiosRequestConfig = {
      responseType: 'arraybuffer',
    };

    try {
      this.logger.log(`Downloading media from ${mediaUrl}`);
      const response = await axios.get(mediaUrl, config);

      const fileType = response?.headers['content-type'];
      const fileExtension = fileType?.split('/')[1] || 'bin';
      const fileName = `${fileID}.${fileExtension}`;
      const folderName = process.env.AUDIO_FILES_FOLDER || 'audio_files';
      const folderPath = path.join(process.cwd(), folderName);
      const filePath = path.join(folderPath, fileName);

      if (!existsSync(folderPath)) {
        mkdirSync(folderPath, { recursive: true });
      }

      writeFileSync(filePath, response.data);
      return { status: 'success', data: filePath };
    } catch (e) {
      this.logger.error('Error downloading media', e);
      return { status: 'error', data: 'Error downloading media' };
    }
  }
}
