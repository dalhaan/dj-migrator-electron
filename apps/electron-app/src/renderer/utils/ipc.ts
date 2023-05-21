import {
  DirectoryNotFoundError,
  InvalidSeratoDirError,
  IpcResponse,
} from "@dj-migrator/common";

export function parseIpcResponse<ReturnType>(
  response: IpcResponse<ReturnType>
) {
  switch (response.type) {
    case "success": {
      return response.response;
    }
    case "DirectoryNotFound": {
      throw new DirectoryNotFoundError(response.error);
    }
    case "InvalidSeratoDirError": {
      throw new InvalidSeratoDirError(response.error);
    }
    default: {
      throw new Error("Unknown error");
    }
  }
}
