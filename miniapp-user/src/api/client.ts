import Taro from "@tarojs/taro";

// 后端 API 地址 — 开发时连本地，上线后改生产地址
const BASE_URL = "http://localhost:8000/api";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  data?: any;
  header?: Record<string, string>;
}

// 通用请求函数
export async function request<T = any>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const token = Taro.getStorageSync("token");

  const res = await Taro.request({
    url: BASE_URL + url,
    method: options.method || "GET",
    data: options.data,
    header: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.header,
    },
  });

  if (res.statusCode >= 400) {
    if (res.statusCode === 401) {
      Taro.removeStorageSync("token");
      Taro.removeStorageSync("user");
    }
    throw new Error((res.data as any)?.detail || "请求失败");
  }

  return res.data as T;
}

// ---- 用户 API ----

export interface LoginParams {
  phone: string;
  password: string;
}

export function userLogin(data: LoginParams) {
  return request<{ access_token: string; user: any }>("/users/login", {
    method: "POST",
    data,
  });
}

export function userRegister(data: LoginParams & { name: string }) {
  return request<{ access_token: string; user: any }>("/users/register", {
    method: "POST",
    data,
  });
}

export function getUserInfo() {
  return request<any>("/users/me");
}

// ---- 计价 API ----

export function getVehicles() {
  return request<any[]>("/pricing/vehicles");
}

export function getLargeItems() {
  return request<any[]>("/pricing/items");
}

export function calculatePrice(data: {
  vehicle_type_id: number;
  distance_km: number;
  pickup_floor: number;
  pickup_has_elevator: boolean;
  dropoff_floor: number;
  dropoff_has_elevator: boolean;
  large_item_ids: number[];
  coupon_code?: string;
}) {
  return request<any>("/pricing/calculate", { method: "POST", data });
}

// ---- 订单 API ----

export function createOrder(data: any) {
  return request<any>("/orders", { method: "POST", data });
}

export function getMyOrders(params?: { status?: string }) {
  return request<any[]>("/orders/my", { data: params });
}

export function getOrderDetail(orderId: number) {
  return request<any>(`/orders/${orderId}`);
}

export function payOrder(orderId: number) {
  return request<any>(`/orders/${orderId}/pay`, { method: "POST" });
}

export function cancelOrder(orderId: number, reason: string) {
  return request<any>(`/orders/${orderId}/cancel`, {
    method: "POST",
    data: { cancel_reason: reason },
  });
}

export function reviewOrder(
  orderId: number,
  data: { rating: number; review_comment?: string }
) {
  return request<any>(`/orders/${orderId}/review`, { method: "POST", data });
}
