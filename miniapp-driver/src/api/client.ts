import Taro from "@tarojs/taro";

const BASE_URL = "http://localhost:8000/api";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  data?: any;
}

export async function request<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
  const token = Taro.getStorageSync("token");
  const res = await Taro.request({
    url: BASE_URL + url,
    method: options.method || "GET",
    data: options.data,
    header: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

// ---- 用户 ----
export function userLogin(data: { phone: string; password: string }) {
  return request<{ access_token: string; user: any }>("/users/login", { method: "POST", data });
}

// ---- 司机入驻 ----
export function driverApply(data: any) {
  return request<any>("/drivers/apply", { method: "POST", data });
}
export function getDriverMe() {
  return request<any>("/drivers/me");
}
export function toggleOnline() {
  return request<any>("/drivers/toggle-online", { method: "POST" });
}

// ---- 订单 ----
export function getAvailableOrders() {
  return request<any[]>("/orders/driver/available");
}
export function acceptOrder(orderId: number) {
  return request<any>(`/orders/${orderId}/accept`, { method: "POST" });
}
export function updateOrderStatus(orderId: number, status: string) {
  return request<any>(`/orders/${orderId}/status`, { method: "POST", data: { status } });
}
export function getDriverOrders() {
  return request<any[]>("/orders/driver/my-orders");
}
export function getOrderDetail(orderId: number) {
  return request<any>(`/orders/${orderId}`);
}

// ---- 钱包 ----
export function getWallet() {
  return request<any>("/wallet/my");
}
export function getTransactions(params?: { page?: number; size?: number }) {
  return request<any>("/wallet/transactions", { data: params });
}
export function withdraw(data: { amount: number; bank_name: string; bank_account: string }) {
  return request<any>("/wallet/withdraw", { method: "POST", data });
}
export function getWithdrawals() {
  return request<any[]>("/wallet/withdrawals");
}
