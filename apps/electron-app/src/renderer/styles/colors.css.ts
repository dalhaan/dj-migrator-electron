import { createGlobalTheme } from "@vanilla-extract/css";

import { colors as commonColors } from "../../common/colors";

export const colors = createGlobalTheme(":root", commonColors);
