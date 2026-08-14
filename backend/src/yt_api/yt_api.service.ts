import { Injectable } from "@nestjs/common";
import { SearchParams } from "./interfaces/SearchParams.inteface";
import { VideosParams } from "./interfaces/VideosParams.interface";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class Yt_apiService {
	private readonly apiKey: string;
	private readonly baseUrl = "https://www.googleapis.com/youtube/v3";


	constructor(private configService: ConfigService) {
		const key = this.configService.get<string>("YT_API_KEY");
		if (!key) throw new Error("Missing YT_API_KEY environment variable");
		this.apiKey = key;
  	}

	private async youtubeGet(endpoint: string, params: SearchParams | VideosParams) {
		const url = new URL(`${this.baseUrl}/${endpoint}`);

		const stringParams: Record<string, string> = {};
		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined)
				stringParams[key] = String(value);
		}

		url.search = new URLSearchParams({ ...stringParams, key: this.apiKey }).toString();

		const res = await fetch(url); //TODO - use axios?
		const data = await res.json();

		if (data.error) throw new Error(data.error.message);
		return data;
	}

	async search(query: string,maxResults?: number, pageToken?: string) {
		return this.youtubeGet("search", {
			part: "snippet",
			type: "video",
			q: query,
			maxResults,
			pageToken
		});
	}

	async findVideos(videoIds) {
		return this.youtubeGet("videos",
			{
				part: "snippet, contentDetails",
				id: videoIds.join(","),
			});
	}
}