export default {
  pages: [
    "pages/index/index",
    "pages/apply/apply",
    "pages/orders/orders",
    "pages/order-detail/order-detail",
    "pages/wallet/wallet",
    "pages/withdrawals/withdrawals",
    "pages/profile/profile",
  ],
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#1677ff",
    navigationBarTitleText: "司机端",
    navigationBarTextStyle: "white",
  },
  permission: {
    "scope.userLocation": { desc: "需要获取您的位置以便接单导航" },
  },
};
