import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface TrackSearchResult {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  url: string;
  description: string;
}

function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

function cleanTitleAndArtist(rawTitle: string, rawChannel: string): { title: string; artist: string } {
  const decodedTitle = decodeHtmlEntities(rawTitle || '');
  const decodedChannel = decodeHtmlEntities(rawChannel || '');

  let artist = decodedChannel.replace(/\s*-\s*Topic$/i, '').trim() || 'Unknown Artist';
  let title = decodedTitle;

  // Remove common video metadata suffixes from title
  title = title.replace(
    /\s*[\(\[](official\s*(audio|music\s*video|video|visualizer|lyric\s*video|lyrics|hd\s*video|4k)|lyrics?|audio|visualizer|clip\s*officiel|video\s*officielle)[\)\]]/gi,
    '',
  ).trim();

  // If title is in the format "Artist - Song Title", parse both
  const match = title.match(/^([^-]+)\s*-\s*(.+)$/);
  if (match) {
    artist = match[1].trim();
    title = match[2].trim();
  }

  return { title, artist };
}

function formatDescription(rawDescription: string, artistName: string): string {
  const decoded = decodeHtmlEntities(rawDescription || '').trim();
  if (decoded.length > 0) {
    return decoded;
  }
  return `Track by ${artistName}`;
}

function getHighResThumbnail(videoId: string, fallbackUrl?: string): string {
  if (!videoId) return fallbackUrl || '';
  return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
}

@Injectable()
export class YtApiService {
  private readonly logger = new Logger(YtApiService.name);
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';

  /**
   * Search YouTube for music tracks (supports official releases, topic tracks, singles, and music videos).
   */
  async searchTracks(query: string, maxResults = 10): Promise<TrackSearchResult[]> {
    if (!query || !query.trim()) {
      return [];
    }

    const searchQuery = query.trim();
    const apiKey = process.env.YT_API_KEY;

    if (apiKey) {
      try {
        const results = await this.searchViaYoutubeApi(searchQuery, apiKey, maxResults);
        if (results.length > 0) {
          return results;
        }
      } catch (err: any) {
        this.logger.warn(`YouTube API search failed (${err.message}). Falling back to yt-dlp search...`);
      }
    } else {
      this.logger.log('YT_API_KEY not set. Using yt-dlp search fallback...');
    }

    return this.searchViaYtDlp(searchQuery, maxResults);
  }

  private async searchViaYoutubeApi(
    searchQuery: string,
    apiKey: string,
    maxResults: number,
  ): Promise<TrackSearchResult[]> {
    const url = new URL(`${this.baseUrl}/search`);
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('type', 'video');
    url.searchParams.set('videoCategoryId', '10'); // 10 = Music category on YouTube
    url.searchParams.set('q', searchQuery);
    url.searchParams.set('maxResults', maxResults.toString());
    url.searchParams.set('key', apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.error) {
      throw new Error(`YouTube API error: ${data.error.message}`);
    }

    if (!data.items || !Array.isArray(data.items)) {
      return [];
    }

    return data.items.map((item: any) => {
      const videoId = item.id?.videoId;
      const snippet = item.snippet || {};
      const { title, artist } = cleanTitleAndArtist(snippet.title, snippet.channelTitle);
      const fallbackThumbnail = snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url;
      const thumbnail = getHighResThumbnail(videoId, fallbackThumbnail);
      const description = formatDescription(snippet.description, artist);

      return {
        id: videoId,
        title,
        artist,
        thumbnail,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        description,
      };
    });
  }

  private async searchViaYtDlp(
    searchQuery: string,
    maxResults: number,
  ): Promise<TrackSearchResult[]> {
    try {
      const command = `yt-dlp --dump-single-json --flat-playlist --extractor-args "youtube:player_client=android" "ytsearch${maxResults}:${searchQuery.replace(/"/g, '\\"')}"`;
      const { stdout } = await execAsync(command, { maxBuffer: 10 * 1024 * 1024 });
      const data = JSON.parse(stdout);

      const entries = data.entries || [];

      return entries.slice(0, maxResults).map((entry: any) => {
        const videoId = entry.id;
        const rawChannelTitle = entry.uploader || entry.channel || '';
        const { title, artist } = cleanTitleAndArtist(entry.title || 'Unknown Title', rawChannelTitle);
        const fallbackThumbnail = entry.thumbnails?.[0]?.url;
        const thumbnail = getHighResThumbnail(videoId, fallbackThumbnail);
        const description = formatDescription(entry.description, artist);

        return {
          id: videoId,
          title,
          artist,
          thumbnail,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          description,
        };
      });
    } catch (error: any) {
      this.logger.error(`yt-dlp search error: ${error.message}`);
      return [];
    }
  }
}
