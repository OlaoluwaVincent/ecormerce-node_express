class BadRequestException extends Error {
  statusCode: number;

  constructor(message: string) {
    super(message);
    this.statusCode = 400;
    this.name = 'BadRequestException';
  }
}

export default BadRequestException;
