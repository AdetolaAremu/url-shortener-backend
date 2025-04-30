import { Response, Request, NextFunction } from "express";
import catchAsync from "v1/utils/CatchAsync";

export const encodeURL = catchAsync(async (req: Request, res: Response) => {});

export const decodeURL = catchAsync(async (req: Request, res: Response) => {});

export const urlRedirection = catchAsync(
  async (req: Request, res: Response) => {}
);

export const urlStatistics = catchAsync(
  async (req: Request, res: Response) => {}
);

export const allURL = catchAsync(async (req: Request, res: Response) => {});
