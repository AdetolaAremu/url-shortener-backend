import request from "supertest";
import app from "../index";
import { UrlShortenerService } from "../src/v1/services/UrlShortener.service";

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
    expect(mockedService.createUrlShortener).toHaveBeenCalled();
  });
});
