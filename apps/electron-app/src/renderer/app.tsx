import clsx from "clsx";
import { Outlet } from "react-router-dom";
import { useMedia } from "react-use";
import { CustomProvider } from "rsuite";

import { AppContainer } from "@/components/layout/app-container";
import { TitleBar } from "@/components/layout/title-bar";
import { useWindow } from "@/stores/windowStore";
import * as styles from "@/styles/app.css";
import { MEDIA } from "@/styles/media";
import { darkTheme } from "@/styles/themes/darkTheme.css";
import { lightTheme } from "@/styles/themes/lightTheme.css";

export const App = () => {
  const darkMode = useMedia(MEDIA.DARK_MODE);
  const isWindowBlurred = useWindow((state) => !state.isWindowFocused);

  return (
    <CustomProvider theme={darkMode ? "dark" : "light"}>
      <div
        className={clsx(darkMode ? darkTheme : lightTheme, styles.app, {
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
