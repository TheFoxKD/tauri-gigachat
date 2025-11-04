import { JSX } from "solid-js";

interface IconProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  size?: number;
}

const baseProps = (props: IconProps) => ({
  width: props.size ?? 20,
  height: props.size ?? 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": "1.8",
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
  ...props,
});

export const IconSend = (props: IconProps) => (
  <svg {...baseProps(props)}>
    <path d="M22 2 11 13" />
    <path d="M22 2 15 22 11 13 2 9Z" />
  </svg>
);

export const IconPlus = (props: IconProps) => (
  <svg {...baseProps(props)}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

export const IconMenu = (props: IconProps) => (
  <svg {...baseProps(props)}>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
  </svg>
);

export const IconStream = (props: IconProps) => (
  <svg {...baseProps(props)}>
    <path d="M13 2 6 12h5l-2 10 9-12h-6l1-8z" />
  </svg>
);

export const IconSettings = (props: IconProps) => (
  <svg {...baseProps(props)}>
    <path d="m12 15 3-3-3-3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83l-.17.17a2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2h-.24a2 2 0 0 1-1.76-1.06 1.65 1.65 0 0 0-1.51-1 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0l-.17-.17a2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H1a2 2 0 0 1-2-2v-.24a2 2 0 0 1 1.06-1.76 1.65 1.65 0 0 0 1-1.51 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83l.17-.17a2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33h.09A1.65 1.65 0 0 0 7 4.59V4a2 2 0 0 1 2-2h.24a2 2 0 0 1 1.76 1.06 1.65 1.65 0 0 0 1.51 1 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0l.17.17a2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1h.73a2 2 0 0 1 2 2v.24a2 2 0 0 1-1.06 1.76 1.65 1.65 0 0 0-1 1.51Z" />
  </svg>
);

export const IconChevronLeft = (props: IconProps) => (
  <svg {...baseProps(props)}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);

export const IconChevronRight = (props: IconProps) => (
  <svg {...baseProps(props)}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);
