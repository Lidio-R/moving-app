export default {
  pages: [
    "pages/index/index",
    "pages/order-create/order-create",
    "pages/order-detail/order-detail",
    "pages/my-orders/my-orders",
    "pages/price-detail/price-detail",
    "pages/coupons/coupons",
    "pages/profile/profile",
  ],
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#1677ff",
    navigationBarTitleText: "搬家服务",
    navigationBarTextStyle: "white",
  },
  permission: {
    "scope.userLocation": {
      desc: "需要获取您的位置用于搬家计价",
    },
  },
};
