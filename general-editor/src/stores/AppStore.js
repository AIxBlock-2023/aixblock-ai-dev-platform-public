/* global LSF_VERSION */

import { flow, getEnv, getSnapshot, types } from "mobx-state-tree";

import uniqBy from "lodash/uniqBy";
import InfoModal from "../components/Infomodal/Infomodal";
import { Hotkey } from "../core/Hotkey";
import ToolsManager from "../tools/Manager";
import Utils from "../utils";
import messages from "../utils/messages";
import { guidGenerator } from "../utils/unique";
import { delay, isDefined } from "../utils/utilities";
import AnnotationStore from "./Annotation/store";
import Project from "./ProjectStore";
import Settings from "./SettingsStore";
import Task from "./TaskStore";
import { UserExtended } from "./UserStore";
import { UserLabels } from "./UserLabels";
import { FF_DEV_1536, isFF } from "../utils/feature-flags";
import { CommentStore } from "./Comment/CommentStore";

const hotkeys = Hotkey("AppStore", "Global Hotkeys");

export default types
  .model("AppStore", {
    /**
     * XML config
     */
    config: types.string,

    /**
     * Task with data, id and project
     */
    task: types.maybeNull(Task),

    project: types.maybeNull(Project),

    /**
     * History of task {taskId, annotationId}:
    */
    taskHistory: types.array(types.model({
      taskId: types.number,
      annotationId: types.maybeNull(types.string),
    }), []),

    /**
     * Configure the visual UI shown to the user
     */
    interfaces: types.array(types.string),

    /**
     * Flag for labeling of tasks
     */
    explore: types.optional(types.boolean, false),

    /**
     * Annotations Store
     */
    annotationStore: types.optional(AnnotationStore, {
      annotations: [],
      predictions: [],
      history: [],
    }),

    /**
     * Comments Store
     */
    commentStore: types.optional(CommentStore, {
      comments: [],
    }),

    /**
     * User of Label Studio
     */
    user: types.optional(types.maybeNull(types.safeReference(UserExtended)), null),

    /**
     * Debug for development environment
     */
    debug: window.HTX_DEBUG === true,

    /**
     * Settings of Label Studio
     */
    settings: types.optional(Settings, {}),

    /**
     * Data of description flag
     */
    description: types.maybeNull(types.string),
    // apiCalls: types.optional(types.boolean, true),

    /**
     * Flag for settings
     */
    showingSettings: types.optional(types.boolean, false),
    /**
     * Flag
     * Description of task in Label Studio
     */
    showingDescription: types.optional(types.boolean, false),
    /**
     * Loading of Label Studio
     */
    isLoading: types.optional(types.boolean, false),
    /**
     * Submitting task; used to prevent from duplicating requests
     */
    isSubmitting: false,
    /**
     * Flag for disable task in Label Studio
     */
    noTask: types.optional(types.boolean, false),
    /**
     * Flag for no access to specific task
     */
    noAccess: types.optional(types.boolean, false),
    /**
     * Finish of labeling
     */
    labeledSuccess: types.optional(types.boolean, false),

    /**
     * Show or hide comments section
     */
    showComments: false,

    /**
     * Dynamic preannotations
     */
    _autoAnnotation: false,

    /**
     * Auto accept suggested annotations
     */
    _autoAcceptSuggestions: false,

    /**
     * Indicator for suggestions awaiting
     */
    awaitingSuggestions: false,

    users: types.optional(types.array(UserExtended), []),

    userLabels: isFF(FF_DEV_1536) ? types.optional(UserLabels, { controls: {} }) : types.undefined,

    showTopBar: types.optional(types.boolean, true),

    showSidebar: types.optional(types.boolean, true),

    canCreateLabel: types.optional(types.boolean, false),

    loadingPredictUrl: types.optional(types.boolean, false),

    hasPredict: types.optional(types.boolean, false),

    predicting: types.optional(types.boolean, false),

    hasMlAssisted: types.optional(types.boolean, false),

    usePromptPredict: types.optional(types.boolean, false),

    prompt: types.optional(types.string, ""),

    isApplyingRedact: types.optional(types.boolean, false),

    canApplyRedact: types.optional(types.boolean, false),
  })
  .preProcessSnapshot((sn) => {
    // This should only be handled if the sn.user value is an object, and converted to a reference id for other
    // entities.
    if (typeof sn.user !== 'number') {
      const currentUser = sn.user ?? window.APP_SETTINGS?.user ?? null;

      // This should never be null, but just incase the app user is missing from constructor or the window
      if (currentUser) {
        sn.user = currentUser.id;

        sn.users = sn.users?.length ? [
          currentUser,
          ...sn.users.filter(({ id }) => id !== currentUser.id),
        ] : [currentUser];
      }

    }
    return {
      ...sn,
      _autoAnnotation: localStorage.getItem("autoAnnotation") === "true",
      _autoAcceptSuggestions: localStorage.getItem("autoAcceptSuggestions") === "true",
    };
  })
  .volatile(() => ({
    version: typeof LSF_VERSION === "string" ? LSF_VERSION : "0.0.0",
    initialized: false,
    suggestionsRequest: null,
    editor: null,
  }))
  .views(self => ({
    /**
     * Get alert
     */
    get alert() {
      return getEnv(self).alert;
    },

    get hasSegmentation() {
      // not an object and not a classification
      const isSegmentation = t => !t.getAvailableStates && !t.perRegionVisible;

      return Array.from(self.annotationStore.names.values()).some(isSegmentation);
    },
    get canGoNextTask() {
      const hasHistory = self.task && self.taskHistory && self.taskHistory.length > 1;

      if (hasHistory) {
        const lastTaskId = self.taskHistory[self.taskHistory.length - 1].taskId;
        
        return self.task.id !== lastTaskId;
      }
      return false;
    },
    get canGoPrevTask() {
      const hasHistory = self.task && self.taskHistory && self.taskHistory.length > 1;

      if (hasHistory) {
        const firstTaskId = self.taskHistory[0].taskId;

        return self.task.id !== firstTaskId;
      }
      return false;
    },
    get forceAutoAnnotation() {
      return getEnv(self).forceAutoAnnotation;
    },
    get forceAutoAcceptSuggestions() {
      return getEnv(self).forceAutoAcceptSuggestions;
    },
    get autoAnnotation() {
      return self.forceAutoAnnotation || self._autoAnnotation;
    },
    get autoAcceptSuggestions() {
      return self.forceAutoAcceptSuggestions || self._autoAcceptSuggestions;
    },
  }))
  .actions(self => {
    /**
     * Update settings display state
     */
    function toggleSettings() {
      self.showingSettings = !self.showingSettings;
    }

    /**
     * Update description display state
     */
    function toggleDescription() {
      self.showingDescription = !self.showingDescription;
    }

    function setFlags(flags) {
      const names = [
        "showingSettings",
        "showingDescription",
        "isLoading",
        "isSubmitting",
        "noTask",
        "noAccess",
        "labeledSuccess",
        "awaitingSuggestions",
        "loadingPredictUrl",
        "hasPredict",
        "predicting",
        "hasMlAssisted",
        "usePromptPredict",
        "prompt",
        "samplePrompt",
        "loadingSamplePrompt",
        "isApplyingRedact",
      ];

      for (const n of names) if (n in flags) self[n] = flags[n];
    }

    /**
     * Check for interfaces
     * @param {string} name
     * @returns {string | undefined}
     */
    function hasInterface(...names) {
      return self.interfaces.find(i => names.includes(i)) !== undefined;
    }

    function addInterface(name) {
      return self.interfaces.push(name);
    }

    function toggleInterface(name, value) {
      const index = self.interfaces.indexOf(name);
      const newValue = value ?? (index < 0);

      if (newValue) {
        if (index < 0) self.interfaces.push(name);
      } else {
        if (index < 0) return;
        self.interfaces.splice(index, 1);
      }
    }

    function toggleComments(state) {
      return (self.showComments = state);
    }

    /**
     * Function
     */
    function afterCreate() {
      ToolsManager.setRoot(self);

      // important thing to detect Area atomatically: it hasn't access to store, only via global
      window.Htx = self;

      self.attachHotkeys();

      getEnv(self).events.invoke('AIxBlockLoad', self);
    }

    function attachHotkeys() {
      // Unbind previous keys in case LS was re-initialized
      hotkeys.unbindAll();

      /**
       * Hotkey for submit
       */
      if (self.hasInterface("submit", "update", "review")) {
        hotkeys.addNamed("annotation:submit", () => {
          const annotationStore = self.annotationStore;

          if (annotationStore.viewingAll) return;

          const entity = annotationStore.selected;


          if (self.hasInterface("review")) {
            self.acceptAnnotation();
          } else if (!isDefined(entity.pk) && self.hasInterface("submit")) {
            self.submitAnnotation();
          } else if (self.hasInterface("update")) {
            self.updateAnnotation();
          }
        });
      }

      /**
       * Hotkey for skip task
       */
      if (self.hasInterface("skip", "review")) {
        hotkeys.addNamed("annotation:skip", () => {
          if (self.annotationStore.viewingAll) return;

          if (self.hasInterface("review")) {
            self.rejectAnnotation();
          } else {
            self.skipTask();
          }
        });
      }

      /**
       * Hotkey for delete
       */
      hotkeys.addNamed("region:delete-all", () => {
        const { selected } = self.annotationStore;

        if (window.confirm(messages.CONFIRM_TO_DELETE_ALL_REGIONS)) {
          selected.deleteAllRegions();
        }
      });

      // create relation
      hotkeys.overwriteNamed("region:relation", () => {
        const c = self.annotationStore.selected;

        if (c && c.highlightedNode && !c.relationMode) {
          c.startRelationMode(c.highlightedNode);
        }
      });

      // Focus fist focusable perregion when region is selected
      hotkeys.addNamed("region:focus", (e) => {
        e.preventDefault();
        const c = self.annotationStore.selected;

        if (c && c.highlightedNode && !c.relationMode) {
          c.highlightedNode.requestPerRegionFocus();
        }
      });

      // unselect region
      hotkeys.addNamed("region:unselect", function() {
        const c = self.annotationStore.selected;

        if (c && !c.relationMode) {
          c.unselectAll();
        }
      });

      hotkeys.addNamed("region:visibility", function() {
        const c = self.annotationStore.selected;

        if (c && c.highlightedNode && !c.relationMode) {
          c.highlightedNode.toggleHidden();
        }
      });

      hotkeys.addNamed("annotation:undo", function() {
        const annotation = self.annotationStore.selected;

        if (!annotation.isDrawing) annotation.undo();
      });

      hotkeys.addNamed("annotation:redo", function() {
        const annotation = self.annotationStore.selected;

        if (!annotation.isDrawing) annotation.redo();
      });

      hotkeys.addNamed("region:exit", () => {
        const c = self.annotationStore.selected;

        if (c && c.relationMode) {
          c.stopRelationMode();
        } else {
          c.unselectAll();
        }
      });

      hotkeys.addNamed("region:delete", () => {
        const c = self.annotationStore.selected;

        if (c) {
          c.deleteSelectedRegions();
        }
      });

      hotkeys.addNamed("region:cycle", () => {
        const c = self.annotationStore.selected;

        c && c.regionStore.selectNext();
      });

      // duplicate selected regions
      hotkeys.addNamed("region:duplicate", (e) => {
        const { selected } = self.annotationStore;
        const { serializedSelection } = selected || {};

        if (!serializedSelection?.length) return;
        e.preventDefault();
        const results = selected.appendResults(serializedSelection);

        selected.selectAreas(results);
      });
    }

    /**
     *
     * @param {*} taskObject
     */
    function assignTask(taskObject) {
      if (taskObject && !Utils.Checkers.isString(taskObject.data)) {
        taskObject = {
          ...taskObject,
          data: JSON.stringify(taskObject.data),
        };
      }
      self.task = Task.create(taskObject);
      if (self.taskHistory.findIndex((x) => x.taskId === self.task.id) === -1) {
        self.taskHistory.push({
          taskId: self.task.id,
          annotationId: null,
        });
      }
    }

    function assignConfig(config) {
      const cs = self.annotationStore;

      self.config = config;
      cs.initRoot(self.config);
    }

    /* eslint-disable no-unused-vars */
    function showModal(message, type = "warning") {
      InfoModal[type](message);

      // InfoModal.warning("You need to label at least something!");
    }
    /* eslint-enable no-unused-vars */

    function submitDraft(c, params = {}) {
      return new Promise(resolve => {
        const events = getEnv(self).events;

        if (!events.hasEvent('submitDraft')) return resolve();
        const res = events.invokeFirst('submitDraft', self, c, params);

        if (res && res.then) res.then(resolve);
        else resolve(res);
      });
    }

    // Set `isSubmitting` flag to block [Submit] and related buttons during request
    // to prevent from sending duplicating requests.
    // Better to return request's Promise from SDK to make this work perfect.
    function handleSubmittingFlag(fn, defaultMessage = "Error during submit", cb = undefined) {
      self.setFlags({ isSubmitting: true });
      const res = fn();
      // Wait for request, max 5s to not make disabled forever broken button;
      // but block for at least 0.2s to prevent from double clicking.

      Promise.race([Promise.all([res, delay(200)]), delay(5000)])
        .catch(err => {
          showModal(err?.message || err || defaultMessage);
          console.error(err);
        })
        .then(() => {
          self.setFlags({ isSubmitting: false });
          cb?.();
        });
    }

    function submitAnnotation(cb = undefined) {
      if (self.isSubmitting) return false;

      const entity = self.annotationStore.selected;
      const event = entity.exists ? 'updateAnnotation' : 'submitAnnotation';

      entity.beforeSend();

      if (!entity.validate()) return false;

      entity.sendUserGenerate();
      handleSubmittingFlag(async () => {
        await getEnv(self).events.invoke(event, self, entity);
        cb?.();
      }, "Error during submit");
      entity.dropDraft();
      return true;
    }

    function updateAnnotation(extraData = undefined, cb = undefined) {
      if (self.isSubmitting) return false;

      const entity = self.annotationStore.selected;

      entity.beforeSend();

      if (!entity.validate()) return false;

      handleSubmittingFlag(async () => {
        await getEnv(self).events.invoke('updateAnnotation', self, entity, extraData);
        cb?.();
      }, "Error during submit");
      entity.dropDraft();
      !entity.sentUserGenerate && entity.sendUserGenerate();
      return true;
    }

    function skipTask(extraData) {
      handleSubmittingFlag(() => {
        getEnv(self).events.invoke('skipTask', self, extraData);
      }, "Error during skip, try again");
    }

    function unskipTask() {
      handleSubmittingFlag(() => {
        getEnv(self).events.invoke('unskipTask', self);
      }, "Error during cancel skipping task, try again");
    }

    function acceptAnnotation() {
      if (self.isSubmitting) return;

      handleSubmittingFlag(async () => {
        const entity = self.annotationStore.selected;

        entity.beforeSend();
        if (!entity.validate()) return;

        const isDirty = entity.history.canUndo;

        entity.dropDraft();
        await getEnv(self).events.invoke('acceptAnnotation', self, { isDirty, entity });
      }, "Error during accept, try again");
    }

    function rejectAnnotation({ comment = null }) {
      if (self.isSubmitting) return;

      handleSubmittingFlag(async () => {
        const entity = self.annotationStore.selected;

        entity.beforeSend();
        if (!entity.validate()) return;

        const isDirty = entity.history.canUndo;

        entity.dropDraft();
        await getEnv(self).events.invoke('rejectAnnotation', self, { isDirty, entity, comment });
      }, "Error during reject, try again");
    }

    /**
     * Reset annotation store
     */
    function resetState(callback = null) {
      // Tools are attached to the control and object tags
      // and need to be recreated when we st a new task
      ToolsManager.removeAllTools();

      // Same with hotkeys
      Hotkey.unbindAll();
      self.attachHotkeys();

      self.annotationStore = AnnotationStore.create({
        selected: null,
        selectedHistory: null,
        names: {},
        toNames: {},
        annotations: [],
        predictions: [],
        history: [],
        viewingAllAnnotations: true,
        viewingAllPredictions: true,
        validation: null,
      });

      // const c = self.annotationStore.addInitialAnnotation();

      // self.annotationStore.selectAnnotation(c.id);

      if (callback) {
        callback();
      }

      self.initialized = false;
    }

    /**
     * Function to initilaze annotation store
     * Given annotations and predictions
     * `completions` is a fallback for old projects; they'll be saved as `annotations` anyway
     */
    function initializeStore({ annotations, completions, predictions, annotationHistory }) {
      const as = self.annotationStore;

      as.initRoot(self.config);

      // eslint breaks on some optional chaining https://github.com/eslint/eslint/issues/12822
      /* eslint-disable no-unused-expressions */
      (predictions ?? []).forEach(p => {
        const obj = as.addPrediction(p);

        as.selectPrediction(obj.id);
        obj.deserializeResults(p.result.map(r => ({
          ...r,
          origin: "prediction",
        })));
      });

      [...(completions ?? []), ...(annotations ?? [])]?.forEach((c) => {
        const obj = as.addAnnotation(c);

        as.selectAnnotation(obj.id);
        obj.deserializeResults(c.draft || c.result);
        obj.reinitHistory();
      });

      const current = as.annotations[as.annotations.length - 1];

      if (current) current.setInitialValues();

      self.setHistory(annotationHistory);
      /* eslint-enable no-unused-expressions */

      if (!self.initialized) {
        self.initialized = true;
        getEnv(self).events.invoke('storageInitialized', self);
      }
    }

    function setHistory(history = []) {
      const as = self.annotationStore;

      as.clearHistory();

      (history ?? []).forEach(item => {
        const obj = as.addHistory(item);

        obj.deserializeResults(item.result ?? [], { hidden: true });
      });
    }

    const setAutoAnnotation = (value) => {
      self._autoAnnotation = value;
      localStorage.setItem("autoAnnotation", value);
    };

    const setAutoAcceptSuggestions = (value) => {
      self._autoAcceptSuggestions = value;
      localStorage.setItem("autoAcceptSuggestions", value);
    };

    const loadSuggestions = flow(function* (request, dataParser) {
      const requestId = guidGenerator();

      self.suggestionsRequest = requestId;

      self.setFlags({ awaitingSuggestions: true });
      const response = yield request;

      if (requestId === self.suggestionsRequest) {
        self.annotationStore.selected.setSuggestions(dataParser(response));
        self.setFlags({ awaitingSuggestions: false });
      }
    });

    function addAnnotationToTaskHistory(annotationId) {
      const taskIndex = self.taskHistory.findIndex(({ taskId }) => taskId === self.task.id);

      if (taskIndex >= 0) {
        self.taskHistory[taskIndex].annotationId = annotationId;
      }
    }

    async function postponeTask() {
      const annotation = self.annotationStore.selected;

      if (!annotation.versions.draft) {
        // annotation created from prediction, so no draft was created
        annotation.versions.draft = annotation.versions.result;
      }

      await self.submitDraft(annotation, { was_postponed: true });
      await getEnv(self).events.invoke('nextTask');
    }

    function nextTask() {
      if (self.canGoNextTask) {
        const { taskId, annotationId } = self.taskHistory[self.taskHistory.findIndex((x) => x.taskId === self.task.id) + 1];

        getEnv(self).events.invoke('nextTask', taskId, annotationId);
      }
    }

    function prevTask() {
      if (self.canGoPrevTask) {
        const { taskId, annotationId } = self.taskHistory[self.taskHistory.findIndex((x) => x.taskId === self.task.id) - 1];

        getEnv(self).events.invoke('prevTask', taskId, annotationId);
      }
    }

    function setUsers(users) {
      self.users.replace(users);
    }

    function mergeUsers(users) {
      self.setUsers(uniqBy([...getSnapshot(self.users), ...users], 'id'));
    }

    function toggleTopBar() {
      self.showTopBar = !self.showTopBar;
    }

    function toggleSidebar() {
      self.showSidebar = !self.showSidebar;
    }

    function toggleFullscreen() {
      if (!document.fullscreenElement && self.editor) {
        self.editor.requestFullscreen();
      } else if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }

    function setEditor(ele) {
      self.editor = ele;
    }

    function externalLabelsAdded(labels) {
      getEnv(self).events.invoke("externalLabelsAdded", labels);
    }

    function externalLabelDeleted(label) {
      getEnv(self).events.invoke("externalLabelDeleted", label);
    }

    function externalPiiAdded(entity) {
      self.annotationStore.names.get(entity["name"])?.addEntity(entity["entity"]);
    }

    function externalPiiDeleted(entity) {
      self.annotationStore.names.get(entity["name"])?.deleteEntity(entity["entity"]);
    }

    return {
      setFlags,
      addInterface,
      hasInterface,
      toggleInterface,

      afterCreate,
      assignTask,
      assignConfig,
      resetState,
      initializeStore,
      setHistory,
      attachHotkeys,

      skipTask,
      unskipTask,
      submitDraft,
      submitAnnotation,
      updateAnnotation,
      acceptAnnotation,
      rejectAnnotation,
      setUsers,
      mergeUsers,

      showModal,
      toggleComments,
      toggleSettings,
      toggleDescription,

      setAutoAnnotation,
      setAutoAcceptSuggestions,
      loadSuggestions,

      addAnnotationToTaskHistory,
      nextTask,
      prevTask,
      postponeTask,
      toggleTopBar,
      toggleSidebar,
      toggleFullscreen,
      setEditor,
      externalLabelsAdded,
      externalLabelDeleted,
      externalPiiAdded,
      externalPiiDeleted,
      beforeDestroy() {
        ToolsManager.removeAllTools();
        Hotkey.unbindAll();
      },
    };
  });
