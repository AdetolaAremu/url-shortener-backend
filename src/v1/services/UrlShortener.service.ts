import { createShortenerDto } from "../dto/Shortener.dto";
import * as dotenv from "dotenv";
import geoip from "geoip-lite";
import Redis from "ioredis";
import { uuidv4 } from "../../v1/utils/Helper";

const redis = new Redis();
dotenv.config();

export class UrlShortenerService {
  static async createUrlShortener(
    urlDto: createShortenerDto,
    generatedString: string,
    generatedUrl: string
  ) {
    const id = uuidv4();

    await redis.set(`original:${urlDto.url.toLowerCase()}`, generatedString);

    await redis.hset(`meta:${generatedString}`, {
      id,
      originalURL: urlDto.url.toLowerCase(),
      generatedURL: generatedUrl,
      shortCode: generatedString,
    });

    await redis.set(`generated:${generatedUrl.toLowerCase()}`, generatedString);
  }

  static async getByOriginalUrl(url: string) {
    let shortCode = await redis.get(`original:${url.toLowerCase()}`);

    if (!shortCode) {
      shortCode = await redis.get(`generated:${url.toLowerCase()}`);
    }

    if (!shortCode) return null;

    const meta = await redis.hgetall(`meta:${shortCode}`);
    if (!meta || !meta.id) return null;

    return {
      id: meta.id,
      shortCode,
      originalURL: meta.originalURL,
      generatedURL: meta.generatedURL,
    };
  }

  static async getByShortenedUrl(generatedUrl: string) {
    const shortCode = await redis.get(
      `generated:${generatedUrl.toLowerCase()}`
    );
    if (!shortCode) return null;

    const meta = await redis.hgetall(`meta:${shortCode}`);
    if (!meta || !meta.id) return null;

    return {
      id: meta.id,
      shortCode,
      originalURL: meta.originalURL,
      generatedURL: meta.generatedURL,
    };
  }

  static async getByShortCode(shortCode: string) {
    const meta = await redis.hgetall(`meta:${shortCode}`);
    if (!meta || !meta.id) return null;

    return {
      id: meta.id,
      shortCode,
      originalURL: meta.originalURL,
      generatedURL: meta.generatedURL,
    };
  }

  static async computegenerateStringAndUrl(shortcode: string) {
    return process.env.SHORTENER_BASE_URL + shortcode;
  }

  static async decodeAndExtractString(url: string) {
    const trimmedUrl = url.replace(/\/+$/, "");
    const parts = trimmedUrl.split("/");
    return parts[parts.length - 1];
  }

  static async createStatAuditTrail(
    shortenerId: string,
    ip: string = null,
    agent: string = null
  ) {
    const statKey = `stat:${shortenerId}`;

    const geo = geoip.lookup(ip || "");

    console.log("IP", ip);
    console.log("agent", agent);
    console.log("geo", geo);

    const visitData = {
      ip,
      agent,
      country: geo?.country?.toLowerCase() || "",
      region: geo?.region?.toLowerCase() || "",
      timestamp: Date.now(),
    };

    await redis.rpush(statKey, JSON.stringify(visitData));

    // Increment country counter here
    if (geo?.country) {
      await redis.hincrby(
        `stat:country:${shortenerId}`,
        geo.country.toLowerCase() || "unknown",
        1
      );
    } else {
      await redis.hincrby(`stat:country:${shortenerId}`, "unknown", 1);
    }

    // Increment region counter here
    if (geo?.region) {
      await redis.hincrby(
        `stat:region:${shortenerId}`,
        geo.region.toLowerCase() || "unknown",
        1
      );
    } else {
      await redis.hincrby(`stat:region:${shortenerId}`, "unknown", 1);
    }

    // Increment agent counter here
    await redis.hincrby(`stat:agent:${shortenerId}`, agent || "unknown", 1);
  }

  static async getStatsForShortCode(shortCode: string) {
    const meta = await redis.hgetall(`meta:${shortCode}`);

    if (!meta || !meta.id) {
      return null;
    }

    const shortenerId = meta.id;

    const countryStats = await redis.hgetall(`stat:country:${shortenerId}`);
    const mostVisitedCountry = Object.entries(countryStats).reduce(
      (acc, [country, count]) =>
        parseInt(count as string) > parseInt(acc[1] as string)
          ? [country, count]
          : acc,
      ["unknown", "0"]
    )[0];

    const regionStats = await redis.hgetall(`stat:region:${shortenerId}`);
    const mostVisitedRegion = Object.entries(regionStats).reduce(
      (acc, [region, count]) =>
        parseInt(count as string) > parseInt(acc[1] as string)
          ? [region, count]
          : acc,
      ["unknown", "0"]
    )[0];

    const visitLogsRaw = await redis.lrange(`stat:${shortenerId}`, 0, -1);
    const allHits = visitLogsRaw
      .map((entry) => {
        try {
          return JSON.parse(entry);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    // last 15 hits
    const visitLogsRawForFifteen = await redis.lrange(
      `stat:${shortenerId}`,
      -15,
      -1
    );
    const las15Hits = visitLogsRawForFifteen
      .map((entry) => {
        try {
          return JSON.parse(entry);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    return {
      shortCode,
      originalURL: meta.originalURL,
      generatedURL: meta.generatedURL,
      mostVisitedCountry,
      mostVisitedRegion,
      totalHits: allHits.length,
      las15Hits,
    };
  }

  static async getAllShortenedURLs(
    page: number = 1,
    limit: number = 10,
    search: string = ""
  ) {
    const shortCodes: string[] = [];
    let cursor = "0";

    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        "MATCH",
        "meta:*",
        "COUNT",
        "100"
      );
      cursor = nextCursor;
      shortCodes.push(...keys.map((key) => key.replace("meta:", "")));
    } while (cursor !== "0");

    const allStats = await Promise.all(
      shortCodes.map((code) => UrlShortenerService.getStatsForShortCode(code))
    );

    const filtered = allStats.filter(Boolean);

    let searched = search
      ? filtered.filter(
          (entry) =>
            entry.originalURL.toLowerCase().includes(search.toLowerCase()) ||
            entry.generatedURL.toLowerCase().includes(search.toLowerCase())
        )
      : filtered;

    searched = searched.sort((a, b) => b.totalHits - a.totalHits);

    const resultsWithoutLast15Hits = searched.map(
      ({ las15Hits, ...rest }) => rest
    );

    const total = resultsWithoutLast15Hits.length;
    const totalPages = Math.ceil(total / limit);
    const paginated = resultsWithoutLast15Hits.slice(
      (page - 1) * limit,
      page * limit
    );

    return {
      paginated,
      page,
      limit,
      total,
      totalPages,
    };
  }
}
