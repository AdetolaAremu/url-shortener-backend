import { randomBytes } from "crypto";
import { Request, Response } from "express";

export const successResponse = (
  res: any,
  message: string,
  data: any = null,
  statusCode: number = 200,
  status: string = "success"
) => {
  return res.status(statusCode).json({
    status,
    message,
    data,
  });
};

export const failResponse = (
  res: any,
  message: string,
  statusCode: number = 400,
  status: string = "fail",
  error: any = null
) => {
  return res.status(statusCode).json({
    status,
    message,
    error,
  });
};

export const generateCryptoCode = (length: number = 6): string => {
  const ALPHABET =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

  const bytes = randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return result;
};

export const validateUrl = (url: string): boolean => {
  console.log("url", url);
  return url.match(/https:\/\/[^\s]+\.[a-zA-Z]{2,}(\S*)?/) !== null;
};

export const validateUrlToMatchOurBaseUrl = (url: string): boolean => {
  return url.match(/^(https:\/\/)?.*indi\.na\/.*$/) !== null;
};

export function getIPAndAgentInfo(req: Request) {
  const ip =
    req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
    req.socket.remoteAddress ||
    "";

  const userAgent = req.headers["user-agent"] || "";
  return { ipAddress: ip, userAgent };
}

export const uuidv4 = () => {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (
      +c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
    ).toString(16)
  );
};
