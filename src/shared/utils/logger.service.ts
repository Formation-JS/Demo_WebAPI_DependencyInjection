import { injectable } from 'inversify';

@injectable()
export class LoggerService {
  public log(message: string) {
    console.log(`[LOG] ${new Date().toISOString()} : ${message}`);
  }

  public warn(message: string) {
    console.log(`[WAR] ${new Date().toISOString()} : ${message}`);
  }

  public error(message: string) {
    console.log(`[ERR] ${new Date().toISOString()} : ${message}`);
  }
}
