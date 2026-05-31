import { useState, useCallback } from "react";
import client from "../api/client";
import { AxiosError } from "axios";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

type ApiMethod = "get" | "post" | "patch" | "delete";

export function useApi<T = unknown>(method: ApiMethod, url: string) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (body?: unknown, params?: string) => {
      setState({ data: null, loading: true, error: null });
      try {
        const fullUrl = params ? `${url}/${params}` : url;
        let response;
        if (method === "get" || method === "delete") {
          response = await client[method]<T>(fullUrl);
        } else {
          response = await client[method]<T>(fullUrl, body);
        }
        setState({ data: response.data, loading: false, error: null });
        return response.data;
      } catch (err) {
        const msg =
          err instanceof AxiosError && err.response?.data?.message
            ? err.response.data.message
            : "Error inesperado";
        setState({ data: null, loading: false, error: msg });
        throw err;
      }
    },
    [method, url],
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}
