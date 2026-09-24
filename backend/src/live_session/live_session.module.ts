import { Global, Module } from '@nestjs/common';
import { LiveSessionService } from './live_session.service';
import { LiveSessionController } from './live_session.controller';

@Global()
@Module({
	controllers: [LiveSessionController],
	providers: [LiveSessionService]
})
export class LiveSessionModule {}