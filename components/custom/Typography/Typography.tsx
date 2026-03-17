import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { TypographyProps } from "./types";
import { variants } from "./utils/variants";

const typographyVariants = cva("text-gray-900", {
  variants,
  defaultVariants: {
    tag: "p",
    color: "gray-900",
  },
});

const Typography = ({
  children,
  label,
  tag,
  style,
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
