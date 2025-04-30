class appError extends Error {
  public status: string | number;
  public isOperational: boolean;

  constructor(public message: string, public statusCode: number) {
    super(message);

    this.status = `${this.statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default appError;
