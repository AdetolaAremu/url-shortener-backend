import request from "supertest";
import app from "../index";
import { UrlShortenerService } from "../src/v1/services/UrlShortener.service";
import Redis from "ioredis";

jest.mock("../src/v1/services/UrlShortener.service");

const mockedService = UrlShortenerService as jest.Mocked<
  typeof UrlShortenerService
>;

describe("POST /api/v1/encode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle existing URLs", async () => {
    mockedService.getByOriginalUrl.mockResolvedValue({
      id: "1",
      shortCode: "abc123",
      originalURL: "https://example.com",
      generatedURL: "https://indi.na/abc123",
    });

    const response = await request(app)
      .post("/api/v1/encode")
      .send({ url: "https://example.com" });

    expect(response.status).toBe(200);
    expect(mockedService.getByOriginalUrl).toHaveBeenCalledWith(
      "https://example.com"
    );
  });

  it("should create new short URLs", async () => {
    mockedService.getByOriginalUrl.mockResolvedValue(null);
    mockedService.computegenerateStringAndUrl.mockResolvedValue(
      "https://indi.na/new123"
    );
    mockedService.createUrlShortener.mockResolvedValue({
      id: "2",
      shortCode: "new123",
      originalURL: "https://example.com",
      generatedURL: "https://indi.na/new123",
    } as unknown as void);

    const response = await request(app)
      .post("/api/v1/encode")
      .send({ url: "https://example.com" });

    expect(response.status).toBe(201);
    expect(mockedService.getByOriginalUrl).toHaveBeenCalled();
  });
});

describe("POST /api/v1/decode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the original URL if short URL exists", async () => {
    const shortUrl = "https://indi.na/abc123";

    mockedService.getByShortenedUrl.mockResolvedValue({
      id: "1",
      shortCode: "abc123",
      originalURL: "https://example.com",
      generatedURL: shortUrl,
    });

    const response = await request(app)
      .post("/api/v1/decode")
      .send({ url: shortUrl });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Link retrieved successfully");
    expect(response.body.data.originalURL).toBe("https://example.com");

    expect(mockedService.getByShortenedUrl).toHaveBeenCalledWith(shortUrl);
  });

  it("should return 404 if short URL is not found", async () => {
    const shortUrl = "https://indi.na/notfound123";

    mockedService.getByShortenedUrl.mockResolvedValue(null);

    const response = await request(app)
      .post("/api/v1/decode")
      .send({ url: shortUrl });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Url does not exists");
    expect(mockedService.getByShortenedUrl).toHaveBeenCalledWith(shortUrl);
  });

  it("should return 400 for invalid URL format", async () => {
    const invalidUrl = "http://not-valid.com";

    const response = await request(app)
      .post("/api/v1/decode")
      .send({ url: invalidUrl });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/not valid/i);
    expect(mockedService.getByShortenedUrl).not.toHaveBeenCalled();
  });
});
