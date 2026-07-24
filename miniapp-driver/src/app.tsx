import { PropsWithChildren } from "react";
import { useLaunch } from "@tarojs/taro";
import "./app.scss";

function App({ children }: PropsWithChildren<{}>) {
  useLaunch(() => {
    console.log("搬家司机小程序启动");
  });
  return <>{children}</>;
}

export default App;
