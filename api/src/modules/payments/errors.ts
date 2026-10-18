/** Error de negocio del checkout con su status HTTP y un código estable para la web. */
export class CheckoutError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "CheckoutError";
  }
}

export function checkoutFail(status: number, code: string, message: string): never {
  throw new CheckoutError(status, code, message);
}
