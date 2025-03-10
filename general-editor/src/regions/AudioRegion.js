import { getParent, getRoot, types } from "mobx-state-tree";

import WithStatesMixin from "../mixins/WithStates";
import Constants from "../core/Constants";
import NormalizationMixin from "../mixins/Normalization";
import RegionsMixin from "../mixins/Regions";
import Utils from "../utils";
import { AudioModel } from "../tags/object/AudioNext";
import { AreaMixin } from "../mixins/AreaMixin";
import Registry from "../core/Registry";

const Model = types
  .model("AudioRegionModel", {
    type: "audioregion",
    object: types.late(() => types.reference(AudioModel)),

    start: types.number,
    end: types.number,

    selectedregionbg: types.optional(types.string, "rgba(0, 0, 0, 0.5)"),
  })
  .volatile(() => ({
    hideable: true,
  }))
  .views(self => ({
    getRegionElement() {
      return self.wsRegionElement(self._ws_region);
    },

    wsRegionElement(wsRegion) {
      if (!wsRegion) return null;

      const elID = wsRegion.id;
      const el = document.querySelector(`[data-id="${elID}"]`);

      return el;
    },

    get wsRegionOptions() {
      const reg = {
        id: self.id,
        start: self.start,
        end: self.end,
        color: "orange",
      };

      if (self.readonly) {
        reg.drag = false;
        reg.resize = false;
      }
      return reg;
    },
  }))
  .actions(self => ({
    /**
     * @example
     * {
     *   "original_length": 18,
     *   "value": {
     *     "start": 3.1,
     *     "end": 8.2,
     *     "labels": ["Voice"]
     *   }
     * }
     * @typedef {Object} AudioRegionResult
     * @property {number} original_length length of the original audio (seconds)
     * @property {Object} value
     * @property {number} value.start start time of the fragment (seconds)
     * @property {number} value.end end time of the fragment (seconds)
     */

    /**
     * @returns {AudioRegionResult}
     */
    serialize() {
      const res = {
        original_length: self.object._ws?.getDuration(),
        value: {
          start: self.start,
          end: self.end,
        },
      };

      return res;
    },

    updateColor(alpha = 1) {
      const color = Utils.Colors.convertToRGBA(self.getOneColor(), alpha);
      // eslint-disable-next-line no-unused-expressions

      try {
        self._ws_region?.update({ color });
      } catch {
        /**
         * Sometimes this method is called too soon in the new UI so it fails.
         * Will be good on the next execution
         * */
      }
    },

    updateAppearenceFromState() {
      if (self._ws_region?.update) {
        self._ws_region.start = self.start;
        self._ws_region.end = self.end;
        self.applyCSSClass(self._ws_region);
      }
    },

    applyCSSClass(wsRegion) {
      self.updateColor(0.3);

      const settings = getRoot(self).settings;
      const el = self.wsRegionElement(wsRegion);

      if (!el) return;

      const lastClassList = el.className.split(' ');

      for(const obj in lastClassList){
        if(lastClassList[obj].indexOf('htx-label') >= 0){
          lastClassList.splice(obj, 1);
        }
      }

      const classes = [...new Set([...lastClassList, "htx-highlight", "htx-highlight-last"])];

      if (!self.parent.showlabels && !settings.showLabels) {
        classes.push("htx-no-label");
      } else {
        const cssCls = Utils.HTML.labelWithCSS(el, {
          labels: self.labeling?.mainValue,
          score: self.score,
        });

        classes.push(cssCls);
      }

      el.className = classes.filter(Boolean).join(" ");
    },

    /**
     * Select audio region
     */
    selectRegion() {
      self._ws_region?.update({ color: Utils.Colors.convertToRGBA("#ed05c7", 0.7) });

      const el = self.wsRegionElement(self._ws_region);

      if (el) {
        // scroll object tag but don't scroll the document
        const container = window.document.scrollingElement;
        const top = container.scrollTop;
        const left = container.scrollLeft;

        el.scrollIntoViewIfNeeded ? el.scrollIntoViewIfNeeded() : el.scrollIntoView();
        window.document.scrollingElement.scrollTo(left, top);
      }
    },

    /**
     * Unselect audio region
     */
    afterUnselectRegion() {
      self.updateColor(0.3);
    },

    setHighlight(val) {
      self._highlighted = val;

      if (!self._ws_region) return;

      if (val) {
        self.updateColor(0.8);
        self._ws_region.element.style.border = Constants.HIGHLIGHTED_CSS_BORDER;
      } else {
        self.updateColor(0.3);
        self._ws_region.element.style.border = "none";
      }
    },

    beforeDestroy() {
      if (self._ws_region) self._ws_region.remove();
    },

    onClick(wavesurfer, ev) {
      // if (! self.editable) return;

      if (!self.annotation.relationMode) {
        // Object.values(wavesurfer.regions.list).forEach(r => {
        //   // r.update({ color: self.selectedregionbg });
        // });

        self._ws_region.update({ color: Utils.Colors.rgbaChangeAlpha(self.selectedregionbg, 0.8) });
      }

      self.onClickRegion(ev);

      if (self.object.autoPlaySelection && (!self.object._ws.isPlaying() || self.object.loopPlay)) {
        self.play(true);
      }
    },

    onMouseOver() {
      if (self.annotation.relationMode) {
        self.setHighlight(true);
        self._ws_region.element.style.cursor = Constants.RELATION_MODE_CURSOR;
      }
    },

    onMouseLeave() {
      if (self.annotation.relationMode) {
        self.setHighlight(false);
        self._ws_region.element.style.cursor = Constants.MOVE_CURSOR;
      }
    },

    onUpdateEnd() {
      self.start = self._ws_region.start;
      self.end = self._ws_region.end;
      self.updateColor(self.selected ? 0.8 : 0.3);
      self.notifyDrawingFinished();
    },

    toggleHidden(e) {
      self.hidden = !self.hidden;
      self._ws_region.element.style.display = self.hidden ?  "none" : "block";
      e?.stopPropagation();
    },

    setStart(v) {
      self.start = v;
      self._ws_region?.update({ start: v });
    },

    setEnd(v) {
      self.end = v;
      self._ws_region?.update({ end: v });
    },

    play(force = false) {
      self.object.removeLoop();

      if (self.object.loopPlay) {
        self._ws_region?.wavesurfer?.fireEvent("play-region-loop", self._ws_region, force);
        self.object.setLoopRegion(self._ws_region?.id);
      } else {
        self._ws_region?.wavesurfer?.fireEvent("play-region", self._ws_region, force);
        self.object.setLoopRegion(null);
      }
    },
  }));

const AudioRegionModel = types.compose(
  "AudioRegionModel",
  WithStatesMixin,
  RegionsMixin,
  AreaMixin,
  NormalizationMixin,
  Model,
);

Registry.addRegionType(AudioRegionModel, "audioplus");
Registry.addRegionType(AudioRegionModel, "audio");

export { AudioRegionModel };
