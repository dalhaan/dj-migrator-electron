import { clsx } from "clsx";
import { HTMLAttributes } from "react";

import * as styles from "./app-container.css";

export function AppContainer(props: HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props;

  return <div className={clsx(className, styles.appContainer)} {...rest} />;
}
