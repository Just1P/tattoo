import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { TypographyProps } from "./types";
import { variants } from "./utils/variants";

const typographyVariants = cva("", {
  variants,
  defaultVariants: {
    tag: "p",
    color: "foreground",
  },
});

const Typography = ({
  children,
  label,
  tag,
  style,
  size,
  font,
  weight,
  className,
  color,
  align,
  underline,
}: TypographyProps) => {
  const Tag = tag;

  if (
    !label?.trim() &&
    (!children || (typeof children === "string" && !children.trim()))
  ) {
    return null;
  }

  return (
    <Tag
      className={cn(
        typographyVariants({
          tag: style ?? tag,
          size,
          color,
          font,
          weight,
          align,
          underline,
        }),
        className,
      )}
    >
      {label ?? children}
    </Tag>
  );
};

export default Typography;
