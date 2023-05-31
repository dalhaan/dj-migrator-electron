import clsx from "clsx";
import { Outlet } from "react-router-dom";
import { CustomProvider } from "rsuite";

import { AppContainer } from "@/components/layout/app-container";
import { TitleBar } from "@/components/layout/title-bar";
import { useWindow } from "@/stores/windowStore";
import * as styles from "@/styles/app.css";
import { darkTheme } from "@/styles/themes/darkTheme.css";

import "./styles/colors.css";

export const App = () => {
  const isWindowBlurred = useWindow((state) => !state.isWindowFocused);

  return (
    <CustomProvider theme="dark">
      <div
        className={clsx(darkTheme, styles.app, {
          [styles.windowBlur]: isWindowBlurred,
        })}
      >
        <TitleBar />

        <AppContainer>
          <Outlet />
        </AppContainer>
      </div>
    </CustomProvider>
  );
};
