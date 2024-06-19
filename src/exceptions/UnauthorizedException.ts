class UnauthorizedException extends Error {
  statusCode: number;

  constructor(message: string) {
    super(message);
    this.statusCode = 401;
    this.name = 'UnauthorizedException';
  }
}

export default UnauthorizedException;
