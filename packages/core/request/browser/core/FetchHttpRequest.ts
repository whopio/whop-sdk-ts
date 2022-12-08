/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiRequestOptions } from "../../core/ApiRequestOptions";
import { BaseHttpRequest } from "../../core/BaseHttpRequest";
import type { CancelablePromise } from "../../core/CancelablePromise";
import type { OpenAPIConfig } from "../../core/OpenAPI";
import { request as __request } from "./request";

export class FetchHttpRequest extends BaseHttpRequest {
  constructor(config: OpenAPIConfig) {
    super(config);
  }

  /**
   * Request method
   * @param options The request options from the service
   * @returns CancelablePromise<T>
   * @throws ApiError
   */
  public override request<T>(options: ApiRequestOptions): CancelablePromise<T> {
    return __request(this.config, options);
  }
}
