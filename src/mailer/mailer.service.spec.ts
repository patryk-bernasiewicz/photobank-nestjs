import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from './mailer.service';

const mockSendMail = jest.fn(() => Promise.resolve({}));

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: mockSendMail,
  })),
}));

describe('MailerService', () => {
  let service: MailerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MailerService],
    }).compile();

    service = module.get<MailerService>(MailerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call the transporter to send an email', async () => {
    await service.sendMail('test', 'test', 'test');
    expect(mockSendMail).toHaveBeenCalledWith({
      from: expect.anything(),
      to: 'test',
      subject: 'test',
      text: 'test',
    });
  });
});
