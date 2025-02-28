import { types } from "mobx-state-tree";
import Registry from "../core/Registry";
import RegionsMixin from "../mixins/Regions";
import { AudioRedactRegionModel } from "./AudioRedactRegion";
import { LanguagePairRegionModel } from "./LanguagePairRegion";
import { RectRegionModel } from "./RectRegion";
import { KeyPointRegionModel } from "./KeyPointRegion";
import { AreaMixin } from "../mixins/AreaMixin";
import { AudioRegionModel } from "./AudioRegion";
import { PolygonRegionModel } from "./PolygonRegion";
import { EllipseRegionModel } from "./EllipseRegion";
import { RichTextRegionModel } from "./RichTextRegion";
import { BrushRegionModel } from "./BrushRegion";
import { TimeSeriesRegionModel } from "./TimeSeriesRegion";
import { ParagraphsRegionModel } from "./ParagraphsRegion";
import { VideoRectangleRegionModel } from "./VideoRectangleRegion";
import { QuestionRegionModel } from "./QuestionRegion";

// general Area type for classification Results which doesn't belong to any real Area
const ClassificationArea = types.compose(
  "ClassificationArea",
  RegionsMixin,
  AreaMixin,
  types
    .model({
      object: types.late(() => types.reference(types.union(...Registry.objectTypes()))),
      classification: true,
    })
    .actions(() => ({
      serialize: () => ({}),
    })),
);

const Area = types.union(
  {
    dispatcher(sn) {
      if ("question" in sn.value || sn.value?.type === "question") {
        return QuestionRegionModel;
      } else if ("languagepair" in sn.value || sn.value?.type === "languagepair") {
        return LanguagePairRegionModel;
      } else if ("audioredact" in sn.value || sn.value?.type === "audioredact") {
        return AudioRedactRegionModel;
      }

      // for some deserializations
      if (sn.$treenode) return sn.$treenode.type;
      if (
        !sn.points && // dirty hack to make it work with polygons, but may be the whole condition is not necessary at all
        !sn.sequence &&
        sn.value &&
        Object.values(sn.value).length <= 1 &&
        !("question" in sn.value || sn.value?.type === "question") &&
        !("languagepair" in sn.value || sn.value?.type === "languagepair") &&
        !("audioredact" in sn.value || sn.value?.type === "audioredact")
      )
        return ClassificationArea;
      // may be a tag itself or just its name
      const objectName = sn.object.name || sn.object;
      // we have to use current config to detect Object tag by name
      const tag = window.Htx.annotationStore.names.get(objectName);
      // provide value to detect Area by data
      const available = Registry.getAvailableAreas(tag.type, sn);
      // union of all available Areas for this Object type

      if (!available.length) return ClassificationArea;
      return types.union(...available, ClassificationArea);
    },
  },
  AudioRegionModel,
  ParagraphsRegionModel,
  TimeSeriesRegionModel,
  RectRegionModel,
  RichTextRegionModel,
  KeyPointRegionModel,
  EllipseRegionModel,
  PolygonRegionModel,
  BrushRegionModel,
  VideoRectangleRegionModel,
  ClassificationArea,
  QuestionRegionModel,
  LanguagePairRegionModel,
  AudioRedactRegionModel,
);

export default Area;
