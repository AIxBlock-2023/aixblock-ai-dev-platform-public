/**
* Libraries
*/
import React, { Component } from "react";
import { Result, Spin } from "antd";
import { getEnv, getRoot } from "mobx-state-tree";
import { observer, Provider } from "mobx-react";

/**
 * Core
 */
import Tree from "../../core/Tree";
import { GeneralPanel, RegionsPanel } from "../SidePanels/DetailsPanel/DetailsPanel";
import { OutlinerTree } from "../SidePanels/OutlinerPanel/OutlinerTree";
import { ViewControls } from "../SidePanels/OutlinerPanel/ViewControls";

/**
 * Components
 */
import { TopBar } from "../TopBar/TopBar";
import Debug from "../Debug";
import Segment from "../Segment/Segment";
import Settings from "../Settings/Settings";
import { RelationsOverlay } from "../RelationsOverlay/RelationsOverlay";

/**
 * Tags
 */
import "../../tags/object";
import "../../tags/control";
import "../../tags/visual";
import "../../tags/ai";

/**
 * Styles
 */
import { TreeValidation } from "../TreeValidation/TreeValidation";
import { guidGenerator } from "../../utils/unique";
import Grid from "./Grid";
import { SidebarPage, SidebarTabs } from "../SidebarTabs/SidebarTabs";
import { AnnotationTab } from "../AnnotationTab/AnnotationTab";
import { SidePanels } from "../SidePanels/SidePanels";
import { Block, Elem } from "../../utils/bem";
import './App.styl';
import { Space } from "../../common/Space/Space";
import { DynamicPreannotationsControl } from "../AnnotationTab/DynamicPreannotationsControl";
import { isDefined } from "../../utils/utilities";
import { FF_DEV_1170, isFF } from "../../utils/feature-flags";
import { Annotation } from "./Annotation";
import { Button } from "../../common/Button/Button";
import { sanitizeHTML, validateScriptContent } from "../../utils/security";

/**
 * App
 */
class App extends Component {
  relationsRef = React.createRef();
  mainContent = React.createRef();
  mainContentTimeout = -1;

  componentDidMount() {
    // Hack to activate app hotkeys
    window.blur();
    document.body.focus();
    let oldContentHeight = 0;

    const updateContentHeight = () => {
      const rect = this.mainContent.current?.getBoundingClientRect();

      if (rect && oldContentHeight !== rect.height) {
        this.mainContent.current?.setAttribute("style", `--main-content-height: ${rect.height}px`);
        oldContentHeight = rect.height;
      }
    };

    this.mainContentTimeout = setInterval(() => {
      updateContentHeight();
    }, 1000);

    updateContentHeight();
  }

  componentWillUnmount() {
    clearInterval(this.mainContentTimeout);
  }

  // Security: Sanitize description content to prevent XSS
  sanitizeDescription(description) {
    if (!description || typeof description !== 'string') {
      return '';
    }

    if (!validateScriptContent(description)) {
      console.warn('Security: Potentially dangerous description content blocked', description);
      return 'Description content blocked for security reasons.';
    }

    return sanitizeHTML(description);
  }

  renderSuccess() {
    return <Result status="success" title={getEnv(this.props.store).messages.DONE} />;
  }

  renderNoAnnotation() {
    return <Result status="success" title={getEnv(this.props.store).messages.NO_COMP_LEFT} />;
  }

  renderNothingToLabel(store) {
    return (
      <Block
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          paddingBottom: "30vh",
        }}
      >
        <Result status="success" title={getEnv(this.props.store).messages.NO_NEXT_TASK} />
        <Block name="sub__result">You have completed all tasks in the queue!</Block>
        {store.canGoPrevTask && (
          <Button onClick={() => store.prevTask()} look="outlined" style={{ margin: "16px 0" }}>
            Go to Previous Task
          </Button>
        )}
      </Block>
    );
  }



  renderNoAccess() {
    return <Result status="warning" title={getEnv(this.props.store).messages.NO_ACCESS} />;
  }

  renderConfigValidationException(store) {
    return (
      <Block name="main-view">
        <Elem name="annotation">
          <TreeValidation errors={this.props.store.annotationStore.validation} />
        </Elem>
        {store.hasInterface('infobar') && (
          <Elem name="infobar">
            Task #{store.task.id}
          </Elem>
        )}
      </Block>
    );
  }

  renderLoader() {
    return (
      <Result
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          zIndex: 102,
          background: "white",
        }}
        icon={<Spin size="large" />}
      />
    );
  }

  _renderAll(obj) {
    if (obj.length === 1) return <Segment annotation={obj[0]}>{[Tree.renderItem(obj[0].root)]}</Segment>;

    return (
      <div className="ls-renderall">
        {obj.map((c, i) => (
          <div key={`all-${i}`} className="ls-fade">
            <Segment annotation={c}>{[Tree.renderItem(c.root)]}</Segment>
          </div>
        ))}
      </div>
    );
  }

  _renderUI(root, as) {
    return (
      <>
        {!as.viewingAllAnnotations && !as.viewingAllPredictions && (
          <Block
            key={(as.selectedHistory ?? as.selected)?.id}
            name="main-view"
            onScrollCapture={this._notifyScroll}
          >
            <Elem name="annotation">
              {<Annotation root={root} annotation={as.selected} />}
              {this.renderRelations(as.selected)}
            </Elem>
            {getRoot(as).hasInterface('infobar') && this._renderInfobar(as)}
            {as.selected.onlyTextObjects === false && (
              <DynamicPreannotationsControl />
            )}
          </Block>
        )}
        {as.viewingAllAnnotations && this.renderAllAnnotations()}
        {as.viewingAllPredictions && this.renderAllPredictions()}
      </>
    );
  }

  _renderInfobar(as) {
    const { id, queue } = getRoot(as).task;

    return (
      <Elem name="infobar" tag={Space} size="small">
        <span>Task #{id}</span>

        {queue && <span>{queue}</span>}
      </Elem>
    );
  }

  renderAllAnnotations() {
    const cs = this.props.store.annotationStore;

    return <Grid store={cs} annotations={[...cs.annotations, ...cs.predictions]} root={cs.root} />;
  }

  renderAllPredictions() {
    return this._renderAll(this.props.store.annotationStore.predictions);
  }

  renderRelations(selectedStore) {
    const store = selectedStore.relationStore;
    const taskData = this.props.store.task?.data;

    return (
      <RelationsOverlay
        key={guidGenerator()}
        store={store}
        ref={this.relationsRef}
        tags={selectedStore.names}
        taskData={taskData}
      />
    );
  }

  render() {
    const { store } = this.props;
    const as = store.annotationStore;
    const root = as.selected && as.selected.root;
    const { settings } = store;

    // if (store.isLoading) return this.renderLoader();

    if (store.noTask) return this.renderNothingToLabel(store);

    if (store.noAccess) return this.renderNoAccess();

    if (store.labeledSuccess) return this.renderSuccess();

    if (!root) return this.renderNoAnnotation();

    const viewingAll = as.viewingAllAnnotations || as.viewingAllPredictions;

    const mainContent = (
      <Block name="main-content" ref={this.mainContent}>
        {as.validation === null
          ? this._renderUI(as.selectedHistory?.root ?? root, as)
          : this.renderConfigValidationException(store)}
      </Block>
    );

    const newUIEnabled = isFF(FF_DEV_1170);

    return (
      <>
        <Block ref={r => store.setEditor(r)} name="editor" mod={{ fullscreen: settings.fullscreen, "hide-topbar": !store.showTopBar }}>
          {(store.isLoading || store.isApplyingRedact) && this.renderLoader()}
          <Settings store={store} />
          <Provider store={store}>
            {store.showingDescription && (
              <Segment className="lsf-editor_description">
                <div dangerouslySetInnerHTML={{ __html: this.sanitizeDescription(store.description) }} />
              </Segment>
            )}

            {isDefined(store) && store.hasInterface('topbar') && <TopBar store={store}/>}
            <Block name="wrapper" mod={{ viewAll: viewingAll || !store.showSidebar, bsp: settings.bottomSidePanel, outliner: newUIEnabled }}>
              {newUIEnabled ? (
                <SidePanels
                  panelsHidden={viewingAll}
                  currentEntity={as.selectedHistory ?? as.selected}
                  regions={as.selected.regionStore}
                >
                  {mainContent}
                </SidePanels>
              ) : (
                <>
                  {mainContent}

                  {viewingAll === false && store.showSidebar && (
                    <Block name="menu" mod={{ bsp: settings.bottomSidePanel }}>
                      {store.hasInterface("side-column") && (
                        <SidebarTabs active="annotation" panelsHidden={false}>
                          <SidebarPage name="annotation" title="Annotation">
                            <AnnotationTab store={store}/>
                          </SidebarPage>

                          {this.props.panels.map(({ name, title, Component }) => (
                            <SidebarPage key={name} name={name} title={title}>
                              <Component/>
                            </SidebarPage>
                          ))}

                          <SidebarPage name="outliner" title="Outliner">
                            {as.selected.regionStore?.regions?.length > 0 ? (
                              <>
                                <ViewControls
                                  grouping={as.selected.regionStore.group}
                                  ordering={as.selected.regionStore.sort}
                                  orderingDirection={as.selected.regionStore.sortOrder}
                                  onOrderingChange={value => as.selected.regionStore.setSort(value)}
                                  onGroupingChange={value => as.selected.regionStore.setGrouping(value)}
                                />
                                <OutlinerTree
                                  regions={as.selected.regionStore}
                                  selectedKeys={as.selected.regionStore.selection?.keys}
                                />
                                {as.selected.regionStore.selection?.size ? (
                                  <RegionsPanel regions={(as.selectedHistory ?? as.selected)?.regionStore?.selection}/>
                                ) : (
                                  <GeneralPanel currentEntity={as.selectedHistory ?? as.selected}/>
                                )}
                              </>
                            ) : (
                              <Elem name="empty" style={{ padding: 8 }}>
                                Regions not added
                              </Elem>
                            )}
                          </SidebarPage>
                        </SidebarTabs>
                      )}
                    </Block>
                  )}

                  <Elem
                    name="sidebar-toggle"
                    onClick={() => store.toggleSidebar()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="8 0 10 24" strokeWidth="1.5" stroke="currentColor" width="8px">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </Elem>
                </>
              )}

            </Block>
          </Provider>
          {store.hasInterface("debug") && <Debug store={store} />}
        </Block>
      </>
    );
  }

  _notifyScroll = () => {
    if (this.relationsRef.current) {
      this.relationsRef.current.onResize();
    }
  };
}

export default observer(App);
