import packageJson from "@/./../../package.json";

import * as styles from "./title-bar.css";

export function TitleBar() {
  return (
    <header className={styles.titleBar}>
      <span className={styles.title}>{packageJson.productName}</span>
    </header>
  );
}
