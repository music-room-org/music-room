import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { Yt_apiService } from './yt_api.service'

@Controller()
export class Yt_apiController {
  constructor(private readonly yt_apiService: Yt_apiService) {}

  @Get("search")
  search(@Query("q") query: string, @Query("maxResults") maxResults: number, @Query("pageToken") pageToken?: string) {
	return this.yt_apiService.search(query, maxResults ,pageToken);
  }

  @Get("Find")
  getVideos(@Query("id") ids: string) {
	if (!ids) {
		throw new BadRequestException("Missing 'ids' query parameter");
	}
	
	const videoIds = ids.split(",").map(id => id.trim()).filter(Boolean);

	if (videoIds.length === 0) {
		throw new BadRequestException("No valid video IDs provided");
	}
	if (videoIds.length > 50) {
		throw new BadRequestException("Maximum 50 video IDs per request");
	}
	return this.yt_apiService.findVideos(videoIds);
  }
}