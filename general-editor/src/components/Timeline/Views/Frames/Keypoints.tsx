import chroma from "chroma-js";
import { CSSProperties, FC, memo, MouseEvent, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { Block, Elem } from "../../../../utils/bem";
import { guidGenerator } from "../../../../utils/unique";
import { clamp } from "../../../../utils/utilities";
import { TimelineContext } from "../../Context";
import { TimelineRegion } from "../../Types";
import "./Keypoints.styl";
import { Lifespan, visualizeLifespans } from "./Utils";

export interface KeypointsProps {
  idx?: number;
  region: TimelineRegion;
  startOffset: number;
  renderable: boolean;
  onSelectRegion?: (e: MouseEvent<HTMLDivElement>, id: string, select?: boolean) => void;
  position?: number;
}

export const Keypoints: FC<KeypointsProps> = ({
  idx,
  region,
  startOffset,
  renderable,
  onSelectRegion,
  position,
}) => {
  const { step, seekOffset, visibleWidth, length } = useContext(TimelineContext);
  const { label, color, visible, sequence, selected } = region;
  const ref = useRef<HTMLElement>();

  const extraSteps = useMemo(() => {
    return Math.round(visibleWidth / 2);
  }, [visibleWidth]);

  const minVisibleKeypointPosition = useMemo(() => {
    return clamp(seekOffset - extraSteps, 0, length);
  }, [seekOffset, extraSteps, length]);

  const maxVisibleKeypointPosition = useMemo(() => {
    return clamp(seekOffset + visibleWidth + extraSteps, 0, length);
  }, [seekOffset, visibleWidth, extraSteps, length]);

  const firtsPoint = sequence[0];
  const start = firtsPoint.frame - 1;
  const offset = start * step;

  const styles = useMemo((): CSSProperties => ({
    '--offset': `${startOffset}px`,
    '--color': color,
    '--point-color': chroma(color).alpha(1).css(),
    '--lifespan-color': chroma(color).alpha(visible ? 0.4 : 1).css(),
  }), [startOffset, color, visible]);

  const lifespans = useMemo(() => {
    if (!renderable) return [];

    return visualizeLifespans(sequence, step).map((span) => {
      span.points = span.points.filter(({ frame }) => {
        return frame >= minVisibleKeypointPosition && frame <= maxVisibleKeypointPosition;
      });

      return span;
    });
  }, [sequence, start, step, renderable, minVisibleKeypointPosition, maxVisibleKeypointPosition]);

  const onSelectRegionHandler = useCallback((e: MouseEvent<HTMLDivElement>, select?: boolean) => {
    e.stopPropagation();
    onSelectRegion?.(e, region.id, select);
  }, [region.id, onSelectRegion]);

  useEffect(() => {
    if (!selected || !ref.current) return;
    console.log(position);
    const frame = document.querySelector(".lsf-timeline-frames__scroll");

    if (!frame) return;

    const timeout = setTimeout(() => {
      if (!ref.current) return;

      if (ref.current.offsetTop > frame.scrollTop + frame.clientHeight) {
        frame.scrollTo({ top: ref.current.offsetTop, behavior: "smooth" });
      } else if (ref.current.offsetTop < frame.scrollTop) {
        frame.scrollTo({ top: ref.current.offsetTop, behavior: "smooth" });
      }
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [selected, position]);

  return (
    <Block
      name="keypoints"
      style={styles}
      mod={{ selected }}
      ref={ref}
    >
      <Elem name="label" onClick={onSelectRegionHandler}>
        <Elem name="name">
          {label}
        </Elem>
        <Elem name="data">
          <Elem name="data-item" mod={{ faded: true }}>{region.idx ?? idx}</Elem>
        </Elem>
      </Elem>
      <Elem name="keypoints" onClick={(e: any) => onSelectRegionHandler(e, true)}>
        <LifespansList
          lifespans={lifespans}
          step={step}
          visible={visible}
          offset={offset}
        />
      </Elem>
    </Block>
  );
};

interface LifespansListProps {
  lifespans: Lifespan[];
  step: number;
  offset: number;
  visible: boolean;
}

const LifespansList: FC<LifespansListProps> = ({
  lifespans,
  step,
  offset,
  visible,
}) => {
  return (
    <>
      {lifespans.map((lifespan, i) => {
        const isLast = i + 1 === lifespans.length;
        const { points, ...data } = lifespan;

        return (
          <LifespanItem
            key={`${i}-${points.length}-${isLast}-${visible}`}
            mainOffset={offset}
            step={step}
            isLast={isLast}
            visible={visible}
            points={points.map(({ frame }) => frame)}
            {...data}
          />
        );
      })}
    </>
  );
};

interface LifespanItemProps {
  mainOffset: number;
  width: string | number;
  step: number;
  start: number;
  offset: number;
  enabled: boolean;
  visible: boolean;
  isLast: boolean;
  points: number[];
}

const LifespanItem: FC<LifespanItemProps> = memo(({
  mainOffset,
  width,
  start,
  step,
  offset,
  enabled,
  visible,
  isLast,
  points,
}) => {
  const left = useMemo(() => {
    return mainOffset + offset + (step / 2);
  }, [mainOffset, offset, step]);

  const right = useMemo(() => {
    return (isLast && enabled) ? 0 : 'auto';
  }, [isLast, enabled]);

  const finalWidth = useMemo(() => {
    return (isLast && enabled) ? 'auto' : width;
  }, [isLast, enabled]);

  const style = useMemo(() => {
    return { left, width: finalWidth, right };
  }, [left, right, finalWidth]);

  return (
    <Elem name="lifespan" mod={{ hidden: !visible }} style={style}>
      {points.map((frame, i) => {
        const left = (frame - start) * step;

        return <Elem key={i} name="point" style={{ left }} />;
      })}
    </Elem>
  );
});
