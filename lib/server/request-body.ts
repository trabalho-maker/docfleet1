export async function parseJsonBody<T>(
  request: Request,
): Promise<
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
    }
> {
  try {
    return {
      success: true,
      data: (await request.json()) as T,
    };
  } catch {
    return {
      success: false,
    };
  }
}
