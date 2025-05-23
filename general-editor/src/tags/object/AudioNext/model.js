import { observe } from "mobx";
import { getRoot, getType, types } from "mobx-state-tree";
import { customTypes } from "../../../core/CustomTypes";
import { guidGenerator, restoreNewsnapshot } from "../../../core/Helpers.ts";
import { AnnotationMixin } from "../../../mixins/AnnotationMixin";
import IsReadyMixin from "../../../mixins/IsReadyMixin";
import ProcessAttrsMixin from "../../../mixins/ProcessAttrs";
import { SyncMixin } from "../../../mixins/SyncMixin";
import { AudioRegionModel } from "../../../regions/AudioRegion";
import Utils from "../../../utils";
import { FF_DEV_2461, isFF } from "../../../utils/feature-flags";
import { isDefined } from "../../../utils/utilities";
import ObjectBase from "../Base";
import { WS_SPEED, WS_VOLUME, WS_ZOOM_X } from "./constants";


/**
 * The Audio tag plays audio and shows its waveform. Use for audio annotation tasks where you want to label regions of audio, see the waveform, and manipulate audio during annotation.
 *
 * Use with the following data types: audio
 * @example
 * <!--Labeling configuration to label regions of audio and rate the audio sample-->
 * <View>
 *   <Labels name="lbl-1" toName="audio-1">
 *     <Label value="Guitar" />
 *     <Label value="Drums" />
 *   </Labels>
 *   <Rating name="rate-1" toName="audio-1" />
 *   <Audio name="audio-1" value="$audio" />
 * </View>
 * @name Audio
 * @meta_title Audio Tag for Audio Labeling
 * @meta_description Customize Label Studio with the Audio tag for advanced audio annotation tasks for machine learning and data science projects.
 * @param {string} name - Name of the element
 * @param {string} value - Data field containing path or a URL to the audio
 * @param {boolean=} [volume=false] - Whether to show a volume slider (from 0 to 1)
 * @param {string} [defaultvolume=1] - Default volume level (from 0 to 1)
 * @param {boolean} [speed=false] - Whether to show a speed slider (from 0.5 to 3)
 * @param {string} [defaultspeed=1] - Default speed level (from 0.5 to 2)
 * @param {boolean} [zoom=true] - Whether to show the zoom slider
 * @param {string} [defaultzoom=1] - Default zoom level (from 1 to 1500)
 * @param {string} [hotkey] - Hotkey used to play or pause audio
 * @param {string} [sync] object name to sync with
 * @param {string} [cursorwidth=1] - Audio pane cursor width. it's Measured in pixels.
 * @param {string} [cursorcolor=#333] - Audio pane cursor color. Color should be specify in hex decimal string
 * @param {string} [defaultscale=1] - Audio pane default y-scale for waveform
 * @param {boolean} [autocenter=true] – Always place cursor in the middle of the view
 * @param {boolean} [scrollparent=true] – Wave scroll smoothly follows the cursor
 * @param {string} [mode="wavesurfer|simple"] – Player mode
 * @param {string} [extreplacements="{'wav':'ogg'}"] – Replace file extension
 */
const TagAttrs = types.model({
  name: types.identifier,
  value: types.maybeNull(types.string),
  muted: types.optional(types.boolean, false),
  zoom: types.optional(types.boolean, true),
  defaultzoom: types.optional(types.string, WS_ZOOM_X.default.toString()),
  volume: types.optional(types.boolean, true),
  defaultvolume: types.optional(types.string, WS_VOLUME.default.toString()),
  speed: types.optional(types.boolean, true),
  defaultspeed: types.optional(types.string, WS_SPEED.default.toString()),
  hotkey: types.maybeNull(types.string),
  showlabels: types.optional(types.boolean, false),
  showscores: types.optional(types.boolean, false),
  height: types.optional(types.string, "88"),
  cursorwidth: types.optional(types.string, "2"),
  cursorcolor: types.optional(customTypes.color, "#333"),
  defaultscale: types.optional(types.string, "1"),
  autocenter: types.optional(types.boolean, true),
  scrollparent: types.optional(types.boolean, true),
  mode: types.optional(types.enumeration(["simple", "wavesurfer"]), "wavesurfer"),
  extreplacements: types.optional(types.string, ""),
});

export const AudioModel = types.compose(
  "AudioModel",
  TagAttrs,
  SyncMixin,
  ProcessAttrsMixin,
  ObjectBase,
  AnnotationMixin,
  IsReadyMixin,
  types.model("AudioModel", {
    type: "audio",
    _value: types.optional(types.string, ""),

    playing: types.optional(types.boolean, false),
    regions: types.array(AudioRegionModel),
    loopPlay: types.optional(types.boolean, false),
    autoPlaySelection: types.optional(types.boolean, false),
    loopRegion: types.maybeNull(types.string),
    redactMode: types.optional(types.boolean, false),
    reloadKey: types.optional(types.string, guidGenerator),
  })
    .volatile(() => ({
      errors: [],
    }))
    .views(self => ({
      get hasStates() {
        const states = self.states();

        return states && states.length > 0;
      },

      get store() {
        return getRoot(self);
      },

      get regs() {
        return self.annotation?.regionStore.regions.filter(r => r.object === self) || [];
      },

      states() {
        return self.annotation.toNames.get(self.name);
      },

      activeStates() {
        const states = self.states();

        return states && states.filter(s => getType(s).name === "LabelsModel" && s.isSelected);
      },

      get redactRegs() {
        return self.annotation?.regionStore.regions.filter(r => r.type === "audioredact") || [];
      },

      get redactArr() {
        return self.redactRegs.reduce((a, r) => [...a, r.wsReg.start, r.wsReg.end], []);
      },

      get redactor() {
        if (!self.states()) {
          return null;
        }

        return Array.from(self.states()).find(n => n.type === "redactor");
      },

      get redactable() {
        return !!self.redactor;
      },
    }))
    .actions(self => ({
      toggleRedactMode() {
        if (!self.redactMode) {
          self.handleSyncPause();
        }

        self.redactMode = !self.redactMode;
      },

      needsUpdate() {
        self.handleNewRegions();
      },

      onReady() {
        self.setReady(true);
      },

      handleSyncPlay() {
        if (!self._ws) return;
        if (self._ws.isPlaying()) return;

        self._ws?.play();
      },

      handleSyncPause() {
        if (!self._ws) return;
        if (!self._ws.isPlaying()) return;

        self._ws?.pause();
      },

      handleSyncSpeed() {},

      handleSyncSeek(time) {
        try {
          if (self._ws && time !== self._ws.getCurrentTime()) {
            self._ws.setCurrentTime(time);
          }
        } catch (err) {
          console.log(err);
        }
      },

      handleNewRegions() {
        if (!self._ws?.isReady) return;
        self.regs.map(reg => {
          if (reg._ws_region) return;
          self.createWsRegion(reg);
        });
      },

      onHotKey(e) {
        e && e.preventDefault();
        self._ws.playPause();
        return false;
      },

      fromStateJSON(obj, fromModel) {
        let r;
        let m;

        const fm = self.annotation.names.get(obj.from_name);

        fm.fromStateJSON(obj);

        if (!fm.perregion && fromModel.type !== "labels") return;

        /**
       *
       */
        const tree = {
          pid: obj.id,
          start: obj.value.start,
          end: obj.value.end,
          normalization: obj.normalization,
          score: obj.score,
          readonly: obj.readonly,
        };

        r = self.findRegion({ start: obj.value.start, end: obj.value.end });

        if (fromModel) {
          m = restoreNewsnapshot(fromModel);
          // m.fromStateJSON(obj);

          if (!r) {
          // tree.states = [m];
            r = self.createRegion(tree, [m]);
          // r = self.addRegion(tree);
          } else {
            r.states.push(m);
          }
        }

        if (self._ws) {
          self._ws.addRegion({
            start: r.start,
            end: r.end,
          });
        }

        // if (fm.perregion)
        //     fm.perRegionCleanup();

        r.updateAppearenceFromState();

        return r;
      },

      setRangeValue(val) {
        self.rangeValue = val;
      },

      setPlaybackRate(val) {
        self.playBackRate = val;
      },

      createRegion(wsRegion, states) {
        let bgColor = self.selectedregionbg;
        const st = states.find(s => s.type === "labels");

        if (st) bgColor = Utils.Colors.convertToRGBA(st.getSelectedColor(), 0.3);

        const r = AudioRegionModel.create({
          id: wsRegion.id ? wsRegion.id : guidGenerator(),
          pid: wsRegion.pid ? wsRegion.pid : guidGenerator(),
          parentID: wsRegion.parent_id === null ? "" : wsRegion.parent_id,
          start: wsRegion.start,
          end: wsRegion.end,
          score: wsRegion.score,
          readonly: wsRegion.readonly,
          regionbg: self.regionbg,
          selectedregionbg: bgColor,
          normalization: wsRegion.normalization,
          states,
        });

        r._ws_region = wsRegion;

        self.regions.push(r);
        self.annotation.addRegion(r);

        return r;
      },

      selectRange(ev, ws_region) {
        const selectedRegions = self.regs.filter(r=>r.start >= ws_region.start && r.end <= ws_region.end);

        ws_region.remove && ws_region.remove();
        if (!selectedRegions.length) return;
        // @todo: needs preventing drawing with ctrl pressed
        // if (ev.ctrlKey || ev.metaKey) {
        //   self.annotation.extendSelectionWith(selectedRegions);
        //   return;
        // }
        self.annotation.selectAreas(selectedRegions);
      },

      addRegion(wsRegion) {
        // area id is assigned to WS region during deserealization
        const find_r = self.annotation.areas.get(wsRegion.id);

        if (find_r) {
          find_r.applyCSSClass(wsRegion);

          find_r._ws_region = wsRegion;
          return find_r;
        }

        const states = self.getAvailableStates();

        if (states.length === 0) {
          wsRegion.on("update-end", ev=>self.selectRange(ev,wsRegion));
          return;
        }

        const control = self.activeStates()[0];
        const labels = { [control.valueType]: control.selectedValues() };
        const r = self.annotation.createResult(wsRegion, labels, control, self);

        r._ws_region = wsRegion;
        r.updateAppearenceFromState();
        return r;
      },

      /**
     * Play and stop
     */
      handlePlay() {
        if (self._ws) {
          self.playing = self._ws.isPlaying();
          self._ws.isPlaying() ? self.triggerSyncPlay() : self.triggerSyncPause();
        }
      },

      handleSeek() {
        if (!self._ws || (isFF(FF_DEV_2461) && self.syncedObject?.type === "paragraphs")) return;

        self.triggerSyncSeek(self._ws.getCurrentTime());
      },

      handleSpeed(speed) {
        self.triggerSyncSpeed(speed);
      },

      createWsRegion(region) {
        const r = self._ws.addRegion(region.wsRegionOptions);

        region._ws_region = r;
        region.updateAppearenceFromState();
      },

      onLoad(ws) {
        self._ws = ws;

        self.regs.forEach(reg => {
          self.createWsRegion(reg);
        });

        if (!self.redactable) {
          return;
        }

        self.redactRegs.forEach(reg => {
          const wsReg = ws.regions.add({
            id: reg.id,
            start: reg.results?.[0]?.value?.audioredact?.start,
            end: reg.results?.[0]?.value?.audioredact?.end,
            attributes: {
              redact: "1",
            },
          });

          reg?.attachWsRegion(wsReg);
        });
      },

      onError(error) {
        self.errors = [error];
      },

      wsCreated(ws) {
        self._ws = ws;
      },

      beforeDestroy() {
        try {
          if (isDefined(self._ws)) {
            self._ws.destroy();
            self._ws = null;
          }
        } catch (err) {
          self._ws = null;
          console.warn("Already destroyed");
        }
      },

      processedValue() {
        let v = self._value;

        try {
          const map = JSON.parse(self.extreplacements);

          for (const ext in map) {
            v = v.replaceAll("." + ext, "." + map[ext]);
          }
        } catch (e) {
          // console.error(e);
        }

        return(v);
      },

      toggleLoopPlay() {
        self.loopPlay = !self.loopPlay;

        if (self.loopPlay) {
          self.loopCurrentRegion();
        } else {
          self.removeLoop();
          self.loopRegion = null;
        }
      },

      toggleAutoPlaySelection() {
        self.autoPlaySelection = !self.autoPlaySelection;
      },

      setLoopRegion(regionId = null) {
        self.loopRegion = regionId;
      },

      removeLoop() {
        const rIds = Object.keys(self._ws.regions.list);

        for (let i = 0; i < rIds.length; i++) {
          self._ws.regions.list[rIds[i]].setLoop(false);
          self._ws.regions.list[rIds[i]].update({
            loop: false,
          });
        }
      },

      loopCurrentRegion() {
        self.removeLoop();
        const rIds = Object.keys(self._ws.regions.list);

        for (let i = 0; i < rIds.length; i++) {
          console.log(self._ws.regions.list[rIds[i]]._region.selected);
          if (self._ws.regions.list[rIds[i]]._region.selected) {
            self._ws.pause();
            self._ws.regions.list[rIds[i]].playLoop();
            break;
            // self._ws.regions.list[rIds[i]].setLoop(true);
            // self._ws.regions.list[rIds[i]].update({
            //   loop: true,
            // });
          }
        }
      },

      reload() {
        self.reloadKey = guidGenerator();
      },

    })),
);
