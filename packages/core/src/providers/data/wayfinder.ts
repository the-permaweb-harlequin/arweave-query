import {
  DataProvider,
  DataQueryConfig,
  isDataQueryById,
  isDataQueryByOffset,
} from "../../types";
import { Wayfinder, createWayfinderClient } from "@ar.io/wayfinder-core";
export interface WayfinderProviderConfig {
  wayfinder?: Wayfinder;
}

export class WayfinderProvider implements DataProvider {
  name = "wayfinder-data-provider";
  private wayfinder: Wayfinder;

  constructor({
    wayfinder = createWayfinderClient(),
  }: WayfinderProviderConfig = {}) {
    this.wayfinder = wayfinder;
  }

  async getData<T>(
    params: DataQueryConfig,
  ): Promise<{ data: T; contentType: string | undefined }> {
    if (isDataQueryById(params)) {
      const data = await this.wayfinder.request(`ar://${params.id}`);
      return {
        data: data.body as T,
        contentType: data.headers.get("content-type") ?? undefined,
      };
    }
    if (isDataQueryByOffset(params)) {
      const { rootParentId, rootParentOffset, dataOffset, dataLength } = params;
      const start = rootParentOffset + dataOffset;
      const end = start + dataLength;
      const data = await this.wayfinder.request(`ar://${rootParentId}`, {
        headers: {
          Range: `bytes=${start}-${end}`,
        },
      });
      return {
        data: data.body as T,
        contentType: data.headers.get("content-type") ?? undefined,
      };
    }
    throw new Error("Invalid data query config");
  }

  async getDataStream<T>(
    params: DataQueryConfig,
  ): Promise<{ data: ReadableStream<T>; contentType: string | undefined }> {
    if (isDataQueryById(params)) {
      const data = await this.wayfinder.request(`ar://${params.id}`);
      const s = await data.blob().then((blob) => {
        return blob.stream();
      });
      return {
        data: s as ReadableStream<T>,
        contentType: data.headers.get("content-type") ?? undefined,
      };
    }
    if (isDataQueryByOffset(params)) {
      const { dataOffset, rootParentId, rootParentOffset, dataLength } = params;
      const start = rootParentOffset + dataOffset;
      const end = start + dataLength;
      const data = await this.wayfinder.request(`ar://${rootParentId}`, {
        headers: {
          Range: `bytes=${start}-${end}`,
        },
      });
      const s = await data.blob().then((blob) => {
        return blob.stream();
      });
      return {
        data: s as ReadableStream<T>,
        contentType: data.headers.get("content-type") ?? undefined,
      };
    }

    throw new Error("Invalid data query config");
  }
}
