import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

import { joinClassNames } from "../componentUtils";

export interface SidebarNavItemProps {
  readonly to: string;
  readonly label: string;
  readonly icon: ReactNode;
  readonly end?: boolean;
  readonly className?: string;
}

export function SidebarNavItem({ className, end = false, icon, label, to }: SidebarNavItemProps) {
  return (
    <NavLink
      className={({ isActive }) =>
        joinClassNames("sidebar-nav-item", isActive && "sidebar-nav-item--active", className)
      }
      end={end}
      title={label}
      to={to}
    >
      <span aria-hidden="true" className="sidebar-nav-item__icon">
        {icon}
      </span>
      <span className="sidebar-nav-item__label">{label}</span>
    </NavLink>
  );
}
