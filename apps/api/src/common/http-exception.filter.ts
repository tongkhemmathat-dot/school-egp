import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      const body =
        typeof payload === "string"
          ? { message: payload }
          : (payload as { message?: string; errors?: unknown });

      response.status(status).json({
        message: body.message || "Request failed",
        errors: body.errors,
        path: request?.url,
        statusCode: status
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Internal server error",
      path: request?.url,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR
    });
  }
}
