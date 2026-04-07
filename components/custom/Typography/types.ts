import type { ReactNode } from "react";
import type { variants } from "./utils/variants";

export type FontTagsType = keyof typeof variants.tag;

export type FontColorsType = keyof typeof variants.color;

type FontFamiliesType = keyof typeof variants.font;

type FontWeightsType = keyof typeof variants.weight;

export type FontAlignType = keyof typeof variants.align;

type FontSizeType = keyof typeof variants.size;

export type TypographyProps = {
  children?: ReactNode;
  label?: string;
  tag: FontTagsType;
  style?: FontTagsType;
  size?: FontSizeType;
  color?: FontColorsType;
  font?: FontFamiliesType;
  weight?: FontWeightsType;
  align?: FontAlignType;
  className?: string;
  underline?: boolean;
};
