"use client";

import { IconBrandDeno, type IconProps } from "@tabler/icons-react";

import { useEffect, useState } from "react";
import type { IconType } from "./types";
import { IconList } from "./utils/iconList";

interface IconComponentProps extends Omit<IconProps, "ref"> {
  icon: IconType;
  className?: string;
}

const Icon = ({ icon, className, ...props }: IconComponentProps) => {
  const [iconFound, setIconFound] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (!icon || !(icon in IconList)) {
      console.warn("Icon not found:", icon);
      setIconFound(false);
    } else {
      setIconFound(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (iconFound === undefined || !iconFound) {
    return <IconBrandDeno className={className} {...props} />;
  }

  const IconComponent = IconList[icon as keyof typeof IconList];
  return <IconComponent className={className} {...props} />;
};

export default Icon;
