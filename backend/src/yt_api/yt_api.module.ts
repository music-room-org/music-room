import { Module } from '@nestjs/common';
import { Yt_apiController } from './yt_api.controller'
import { Yt_apiService } from './yt_api.service';

@Module({
	controllers: [Yt_apiController],
	providers: [Yt_apiService],
})
export class Yt_apiModule {}