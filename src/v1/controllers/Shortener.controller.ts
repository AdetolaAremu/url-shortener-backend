import { createShortenerDto } from "../dto/Shortener.dto";
import { shortenerService } from "../services/UrlShortener.service";
import { Response, Request, NextFunction } from "express";
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
  const checkIfUrlExist = await shortenerService.getByShortenedUrl(
    shortenerDTO.url
  );

  // if it exists then return it
  if (checkIfUrlExist)
    return successResponse(res, "Link generated successfully", checkIfUrlExist);

  // else
  // generate a unique random string as short code and encode it
  const generateCode = generateCryptoCode();

  const computeGeneratedlink =
    await shortenerService.computegenerateStringAndUrl(generateCode);

  // save it alongisde the decoded url
  const createShortenedLink = await shortenerService.createUrlShortener(
    shortenerDTO,
    generateCode,
    computeGeneratedlink
  );

  return successResponse(
    res,
    "Link generated successfully",
    {
      shortenedlink: computeGeneratedlink,
      createdRecord: createShortenedLink,
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
  const getUrl = await shortenerService.getByShortenedUrl(shortenerDTO.url);

  if (!getUrl) return failResponse(res, "Url does not exists", 404);

  return successResponse(res, "Link retrieved successfully", getUrl);
});

export const urlRedirection = catchAsync(
  async (req: Request, res: Response) => {
    const { url_path } = req.params;

    // check if it exits in the redis/db
    const getByShortenedUrl = await shortenerService.getByShortCode(url_path);

    if (!getByShortenedUrl)
      return failResponse(res, "Url does not exists", 404);

    const { ipAddress, userAgent } = getIPAndAgentInfo(req);

    // save the stat
    await shortenerService.createStatAuditTrail(
      getByShortenedUrl.id,
      ipAddress,
      userAgent
    );

    res.redirect(getByShortenedUrl.originalURL);
  }
);

export const urlStatistics = catchAsync(async (req: Request, res: Response) => {
  const { shortCode } = req.params;

  const getByShortenedUrl = await shortenerService.getByShortCode(shortCode);

  if (!getByShortenedUrl) return failResponse(res, "Url does not exists", 404);

  const getStats = await shortenerService.getStatsForShortCode(shortCode);
  console.log("statiiiii", getStats);

  return successResponse(res, "Statistics retrieved successfully", getStats);
});

export const allURL = catchAsync(async (req: Request, res: Response) => {
  // return successResponse(res, 201, "Account created successfully", newUser);
});
