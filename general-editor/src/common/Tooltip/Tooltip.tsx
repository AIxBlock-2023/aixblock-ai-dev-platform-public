import { Children, cloneElement, CSSProperties, forwardRef, MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Block, Elem } from "../../utils/bem";
import { aroundTransition } from "../../utils/transition";
import { alignElements, ElementAlignment } from "../../utils/dom";
import "./Tooltip.styl";
import { useFullscreen } from "../../hooks/useFullscreen";

export interface TooltipProps {
  title: string;
  children: JSX.Element;
  theme?: "light" | "dark";
  defaultVisible?: boolean;
  mouseEnterDelay?: number;
  enabled?: boolean;
  style?: CSSProperties;
}

export const Tooltip = forwardRef<HTMLElement, TooltipProps>(({
  title,
  children,
  defaultVisible,
  mouseEnterDelay = 100,
  enabled = true,
  theme = "light",
  style,
}, ref) => {
  if (!children || Array.isArray(children)) {
    throw new Error("Tooltip does accept a single child only");
  }

  const triggerElement = (ref ?? useRef<HTMLElement>()) as MutableRefObject<HTMLElement>;
  const tooltipElement = useRef<HTMLElement>();
  const [offset, setOffset] = useState({});
  const [visibility, setVisibility] = useState(defaultVisible ? "visible" : null);
  const [injected, setInjected] = useState(false);
  const [align, setAlign] = useState<ElementAlignment>("top-center");
  const timeout = useRef<NodeJS.Timeout>();

  const calculatePosition = useCallback(() => {
    const { left, top, align: resultAlign } = alignElements(
      triggerElement.current,
      tooltipElement.current!,
      align,
      10,
    );

    setOffset({ left, top });
    setAlign(resultAlign);
  }, [triggerElement.current, tooltipElement.current]);

  const performAnimation = useCallback((visible: boolean, disableAnimation?: boolean) => {
    if (tooltipElement.current) {
      if (disableAnimation) {
        setInjected(false);
        return;
      }

      aroundTransition(tooltipElement.current, {
        beforeTransition() {
          setVisibility(visible ? "before-appear" : "before-disappear");
        },
        transition() {
          if (visible) calculatePosition();
          setVisibility(visible ? "appear" : "disappear");
        },
        afterTransition() {
          setVisibility(visible ? "visible" : null);
          if (visible === false) setInjected(false);
        },
      });
    }
  }, [calculatePosition, tooltipElement]);

  const visibilityClasses = useMemo(() => {
    switch (visibility) {
      case "before-appear":
        return "before-appear";
      case "appear":
        return "appear before-appear";
      case "before-disappear":
        return "before-disappear";
      case "disappear":
        return "disappear before-disappear";
      case "visible":
        return "visible";
      default:
        return visibility ? "visible" : null;
    }
  }, [visibility]);

  const tooltip = useMemo(() => {
    return injected ? (
      <Block
        ref={tooltipElement}
        name="tooltip"
        mod={{ align, theme }}
        mix={visibilityClasses}
        style={{ ...offset, ...(style ?? {}) }}
      >
        <Elem name="body">{title}</Elem>
      </Block>
    ) : null;
  }, [injected, offset, title, visibilityClasses, tooltipElement]);

  const child = Children.only(children);
  const clone = cloneElement(child, {
    ...child.props,
    ref: triggerElement,
  });

  useEffect(() => {
    if (injected) performAnimation(true);
  }, [injected]);

  useEffect(() => {
    const el = triggerElement.current;

    const handleTooltipAppear = () => {
      if (enabled === false) return;

      clearTimeout(timeout.current);

      timeout.current = setTimeout(() => {
        setInjected(true);
      }, mouseEnterDelay);
    };

    const handleTooltipHiding = () => {
      if (enabled === false) return;

      clearTimeout(timeout.current);
      performAnimation(false);
    };

    if (el) {
      el.addEventListener("mouseenter", handleTooltipAppear);
      el.addEventListener("mouseleave", handleTooltipHiding);
      window.addEventListener('scroll', handleTooltipHiding);
    }

    return () => {
      clearTimeout(timeout.current);

      if (el) {
        el.removeEventListener("mouseenter", handleTooltipAppear);
        el.removeEventListener("mouseleave", handleTooltipHiding);
        window.removeEventListener('scroll', handleTooltipHiding);
      }
    };
  }, [enabled, mouseEnterDelay]);

  useFullscreen({
    onEnterFullscreen: () => performAnimation(false, true),
    onExitFullscreen: () => performAnimation(false, true),
  }, []);


  return (
    <>
      {clone}
      {createPortal(tooltip, document.body)}
    </>
  );
});

Tooltip.displayName = "Tooltip";
