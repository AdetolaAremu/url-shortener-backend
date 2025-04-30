import * as dotenv from "dotenv";
import geoip from "geoip-lite";
import Redis from "ioredis";

const redis = new Redis();
dotenv.config();

export class shortenerService {
  static async createUrlShortener() {}

  static async getShortenedUrl() {}

  static async computegenerateStringAndUrl() {}

  static async decodeAndExtractString() {}

  static async createStatAuditTrail() {}

  static async getShortenedUrlStat() {}
}
