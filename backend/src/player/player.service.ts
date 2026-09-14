import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import type { Response } from 'express';

const execAsync = promisify(exec);

// Cache TTL: Keep audio files on disk for 30 minutes of inactivity before cleaning up
const FILE_CACHE_TTL_MS = 30 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

@Injectable()
export class PlayerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PlayerService.name);
  private readonly tempDir = path.resolve(process.cwd(), 'temp_audio');
  private activeDownloads = new Map<string, Promise<string>>();
  private fileLastAccessed = new Map<string, number>();
  private cleanupTimer: NodeJS.Timeout | null = null;

  async onModuleInit() {
    await this.ensureTempDirExists();
    await this.cleanupAllTempFiles();

    // Start background cleanup timer
    this.cleanupTimer = setInterval(() => {
      this.sweepExpiredFiles().catch((err) => {
        this.logger.error(`Error during sweep of expired audio files: ${err.message}`);
      });
    }, CLEANUP_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  private async ensureTempDirExists() {
    if (!fs.existsSync(this.tempDir)) {
      await fs.promises.mkdir(this.tempDir, { recursive: true });
    }
  }

  private async cleanupAllTempFiles() {
    try {
      const files = await fs.promises.readdir(this.tempDir);
      for (const file of files) {
        if (file.endsWith('.mp3') || file.endsWith('.tmp')) {
          await fs.promises.unlink(path.join(this.tempDir, file)).catch(() => {});
        }
      }
      this.fileLastAccessed.clear();
      this.logger.log('Temporary audio directory cleaned up.');
    } catch (err: any) {
      this.logger.error(`Error cleaning up temp directory: ${err.message}`);
    }
  }

  /**
   * Sweeps and deletes files that have not been accessed for more than FILE_CACHE_TTL_MS.
   */
  private async sweepExpiredFiles() {
    const now = Date.now();
    try {
      const files = await fs.promises.readdir(this.tempDir);
      for (const file of files) {
        if (!file.endsWith('.mp3')) continue;

        const videoId = file.replace('.mp3', '');
        const lastAccess = this.fileLastAccessed.get(videoId);

        // If file has not been accessed in the last 30 minutes
        if (!lastAccess || now - lastAccess > FILE_CACHE_TTL_MS) {
          const filePath = path.join(this.tempDir, file);
          await fs.promises.unlink(filePath).catch(() => {});
          this.fileLastAccessed.delete(videoId);
          this.logger.log(`Expired cached audio file deleted: ${file}`);
        }
      }
    } catch (err: any) {
      this.logger.error(`Error sweeping expired files: ${err.message}`);
    }
  }

  /**
   * Downloads audio for a given YouTube videoId using yt-dlp.
   * Ensures only one download per videoId runs concurrently.
   */
  async getOrDownloadAudio(videoId: string): Promise<string> {
    // Sanitize videoId to prevent path traversal or shell injection
    if (!/^[a-zA-Z0-9_-]+$/.test(videoId)) {
      throw new Error('Invalid videoId parameter');
    }

    await this.ensureTempDirExists();
    const filePath = path.join(this.tempDir, `${videoId}.mp3`);

    // If file already exists, update access time and return its path
    if (fs.existsSync(filePath)) {
      this.fileLastAccessed.set(videoId, Date.now());
      return filePath;
    }

    // If already downloading, wait for current download
    if (this.activeDownloads.has(videoId)) {
      return this.activeDownloads.get(videoId)!;
    }

    // Start download process
    const downloadPromise = (async () => {
      try {
        this.logger.log(`Downloading audio for videoId ${videoId} via yt-dlp...`);
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        const outputTemplate = path.join(this.tempDir, `${videoId}.%(ext)s`);

        const command = `yt-dlp -x --audio-format mp3 --audio-quality 0 --extractor-args "youtube:player_client=android" -o "${outputTemplate}" --no-playlist "${url}"`;
        await execAsync(command);

        if (!fs.existsSync(filePath)) {
          throw new Error(`Audio file was not created at expected path: ${filePath}`);
        }

        this.fileLastAccessed.set(videoId, Date.now());
        this.logger.log(`Audio successfully downloaded for videoId ${videoId}`);
        return filePath;
      } catch (error: any) {
        this.logger.error(`Failed to download audio for videoId ${videoId}: ${error.message}`);
        // Cleanup potential broken file
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath).catch(() => {});
        }
        throw error;
      } finally {
        this.activeDownloads.delete(videoId);
      }
    })();

    this.activeDownloads.set(videoId, downloadPromise);
    return downloadPromise;
  }

  /**
   * Streams audio file to HTTP response with HTTP 206 Range support.
   */
  async streamAudioFile(videoId: string, reqHeaders: Record<string, string | string[] | undefined>, res: Response) {
    const filePath = await this.getOrDownloadAudio(videoId);
    this.fileLastAccessed.set(videoId, Date.now());

    const stat = await fs.promises.stat(filePath);
    const fileSize = stat.size;

    const range = reqHeaders.range;
    if (range && typeof range === 'string') {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res.status(416).setHeader('Content-Range', `bytes */${fileSize}`).end();
        return;
      }

      const chunksize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      });

      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
      });

      fs.createReadStream(filePath).pipe(res);
    }
  }

  /**
   * Manually delete audio file if needed.
   */
  async deleteAudioFile(videoId: string): Promise<boolean> {
    const filePath = path.join(this.tempDir, `${videoId}.mp3`);
    this.fileLastAccessed.delete(videoId);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  }
}
