import packageJson from "@/./../../package.json";

import * as styles from "./title-bar.css";

export function TitleBar() {
  const windowTitle = document.head.querySelector("title")?.innerText;

  return (
    <header className={styles.titleBar}>
      <span className={styles.title}>
        {windowTitle || packageJson.productName}
      </span>
    </header>
  );
}
