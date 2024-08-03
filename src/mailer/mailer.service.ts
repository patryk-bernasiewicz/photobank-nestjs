import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private transporter: nodemailer.transporter;

  public constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAILER_HOST,
      port: parseInt(process.env.MAILER_PORT),
      secure: String(process.env.MAILER_SECURE) === 'true',
      auth: {
        user: process.env.MAILER_USER || null,
        pass: process.env.MAILER_PASSWORD || null,
      },
    });
  }

  async sendMail(to: string, subject: string, text: string) {
    const emailOptions = {
      from: '"Photobank" <' + process.env.MAILER_USER + '>',
      to,
      subject,
      text,
    };

    await this.transporter.sendMail(emailOptions);
  }
}
