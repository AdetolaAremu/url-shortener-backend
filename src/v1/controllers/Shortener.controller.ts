import { createShortenerDto } from "../dto/Shortener.dto";
import { UrlShortenerService } from "../services/UrlShortener.service";
import { Response, Request } from "express";
import catchAsync from "../../v1/utils/CatchAsync";
import {
  failResponse,
  generateCryptoCode,
  getIPAndAgentInfo,
  successResponse,
  validateUrl,
} from "../../v1/utils/Helper";
import { validateInput } from "../../v1/utils/Validator";

export const encodeURL = catchAsync(async (req: Request, res: Response) => {
  const shortenerDTO = new createShortenerDto();
  Object.assign(shortenerDTO, req.body);
  await validateInput(shortenerDTO); // move to middleware (maybe)

  // check if the url exists in the redis/db already
  const checkIfUrlExist = await UrlShortenerService.getByOriginalUrl(
    shortenerDTO.url
  );

  // if it exists then return it
  if (checkIfUrlExist)
    return successResponse(res, "Link generated successfully", {
      shortenedlink: checkIfUrlExist.generatedURL,
    });

  // else
  // generate a unique random string as short code and encode it
  const generateCode = generateCryptoCode();

  const computeGeneratedlink =
    await UrlShortenerService.computegenerateStringAndUrl(generateCode);

  return successResponse(
    res,
    "Link generated successfully",
    {
      shortenedlink: computeGeneratedlink,
    },
    201
  );
});

export const decodeURL = catchAsync(async (req: Request, res: Response) => {
  const shortenerDTO = new createShortenerDto();
  Object.assign(shortenerDTO, req.body);
  await validateInput(shortenerDTO);

  // check if the url is a valid url
  if (!validateUrl(shortenerDTO.url))
    return failResponse(
      res,
      "The url is not valid. It must start with https and end with e.g .com, .io etc"
    );

  // check if it exits in the redis/db
  const getUrl = await UrlShortenerService.getByShortenedUrl(shortenerDTO.url);

  if (!getUrl) return failResponse(res, "Url does not exists", 404);

  return successResponse(res, "Link retrieved successfully", getUrl);
});

export const urlRedirection = catchAsync(
  async (req: Request, res: Response) => {
    const { url_path } = req.params;

    // check if it exits in the redis/db
    const getByShortenedUrl = await UrlShortenerService.getByShortCode(
      url_path
    );

    if (!getByShortenedUrl)
      return failResponse(res, "Url does not exists", 404);

    const { ipAddress, userAgent } = getIPAndAgentInfo(req);

    // save the stat (this should be a job in real life scenario)
    await UrlShortenerService.createStatAuditTrail(
      getByShortenedUrl.id,
      ipAddress,
      userAgent
    );

    res.redirect(301, getByShortenedUrl.originalURL);
  }
);

export const urlStatistics = catchAsync(async (req: Request, res: Response) => {
  const { shortCode } = req.params;

  const getByShortenedUrl = await UrlShortenerService.getByShortCode(shortCode);

  if (!getByShortenedUrl) return failResponse(res, "Url does not exists", 404);

  const getStats = await UrlShortenerService.getStatsForShortCode(shortCode);

  return successResponse(res, "Statistics retrieved successfully", getStats);
});

export const allURL = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 15;
  const searchQuery = (req.query.searchQuery as string) || "";

  const shortenedURL = await UrlShortenerService.getAllShortenedURLs(
    page,
    limit,
    searchQuery
  );

  return successResponse(res, "All urls retrieved successfully", shortenedURL);
});
