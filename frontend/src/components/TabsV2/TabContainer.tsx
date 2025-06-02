import React, { useEffect, useMemo, useState } from 'react';
import "./Index.scss";
import Tab from './Tab';
import TabContent from './TabContent';
import IconArrowLeft from '../../assets/icons/IconArrowLeft';
import { SetURLSearchParams } from 'react-router-dom';
import Button from "@/components/Button/Button"; // Import Button
import ModelSourceDialog from "../../pages/Flow/Shared/Model/ModelSourceDialogv2";
import {TProjectModel} from "@/models/project";
import Modal from "@/components/Modal/Modal";
import RoutingModeTable from '../RoutingModeTable';
import WorkflowEditor from '../WorkflowEditor';
import { Tooltip } from 'react-tooltip';

export type TabV2 = {
  label: string;
  content?: JSX.Element | string;
  key: number;
  netWorkId: number;
}

export type TabsProps = {
  tabs: TabV2[];
  setCurrentTab: React.Dispatch<React.SetStateAction<number | undefined>>,
  searchParams: URLSearchParams,
  setSearchParams: SetURLSearchParams,
  project?: TProjectModel | null;
  showRoutingBtn?: boolean;
  showWorkFlowBtn?: boolean;
}

const TabContainer: React.FC<TabsProps> = ({ tabs, setCurrentTab, searchParams, setSearchParams, project, showRoutingBtn, showWorkFlowBtn }) => {
  const tabActive = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<number>(Number(tabActive));
  const [currentPage, setCurrentPage] = useState(0);
  const [tabFrom, setTabFrom] = useState<number>(tabs[0].key);
  const [showAddModel, setShowAddModel] = useState(false); // State để mở ModelSourceDialog
  const [showRoutingModeTable, setShowRoutingModeTable] = useState(false)
  const [showWorkflowTable, setShowWorkflowTable] = useState(false);
  const tabsPerPage = 5;

  const handleTabClick = (key: number, mlId: number) => {
    setActiveTab(mlId);
    setCurrentTab(mlId);
    setTabFrom(key);
    searchParams.set("tab", mlId.toString());
    setSearchParams(searchParams);
  };

  const handleNextPage = () => {
    if ((currentPage + 1) * tabsPerPage < tabs.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const currentTabs = useMemo(() => {
    return tabs.slice(currentPage * tabsPerPage, (currentPage + 1) * tabsPerPage);
  }, [currentPage, tabs]);

  useEffect(() => {
    searchParams.set("tab", tabActive ?? tabs[0].netWorkId.toString());
    setSearchParams(searchParams);
    setActiveTab(tabs[0].netWorkId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="tab-container">
      <div className="tabs-heading">
        <div className="tabs">
          <button disabled={currentPage <= 0} className="nav-button left" onClick={handlePrevPage}>
            <IconArrowLeft width={14} height={14} />
          </button>
          {currentTabs.map((tab, index) => (
            <Tab
              key={`key-${tab.label}-${index}`}
              label={tab.label}
              isActive={activeTab === tab.netWorkId}
              onClick={() => handleTabClick(tab.key, tab.netWorkId)}
              tabId={index}
            />
          ))}
          <button
            disabled={(currentPage + 1) * tabsPerPage >= tabs.length}
            className="nav-button right"
            onClick={handleNextPage}
          >
            <IconArrowLeft width={14} height={14} />
          </button>
        </div>
        <div className='open-model-button-container'>
          <Button className="open-model-button add-button" onClick={() => setShowAddModel(true)} id="add-new-network-btn">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-plus"
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>

          </Button>
          <Tooltip
            place="top"
            positionStrategy="fixed"
            content="Add new network"
            anchorSelect={"#add-new-network-btn"}
            style={{maxWidth: 360}}
          />
          {showRoutingBtn && <Button
            className="open-model-button routing-button"
            onClick={() => {
              setShowRoutingModeTable(true)
            }}
            id='training-mode-btn'
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-route"
            >
              <circle cx={6} cy={19} r={3} />
              <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
              <circle cx={18} cy={5} r={3} />
            </svg>
          </Button>}
          <Tooltip
            place="top"
            positionStrategy="fixed"
            content="Training Mode"
            anchorSelect={"#training-mode-btn"}
            style={{maxWidth: 360}}
          />
          {showWorkFlowBtn && <Button
            className="open-model-button routing-button"
            onClick={() => {
              setShowWorkflowTable(true)
            }}
            id="workflow-editor-btn"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-workflow"
            >
              <rect width={8} height={8} x={3} y={3} rx={2} />
              <path d="M7 11v4a2 2 0 0 0 2 2h4" />
              <rect width={8} height={8} x={13} y={13} rx={2} />
            </svg>
          </Button>}
          <Tooltip
            place="top"
            positionStrategy="fixed"
            content="Workflow Editor"
            anchorSelect={"#workflow-editor-btn"}
            style={{maxWidth: 360}}
          />
        </div>

        <div className="tabs-heading__page">
          {`${tabFrom} - ${tabs.length}`}
        </div>
        
      </div>

      {tabs.map((tab, index) => (
        <TabContent
          key={`key-${tab.label}-${index}`}
          label={tab.label}
          content={tab.content}
          isActive={activeTab === tab.netWorkId}
        />
      ))}

      {showAddModel && project && (
        <ModelSourceDialog
          project={project}
          isOpen={true}
          onAdded={() => setShowAddModel(false)}
          onClose={() => setShowAddModel(false)}
        />
      )}
      <Modal
        title="Routing node"
        open={showRoutingModeTable}
        onClose={() => setShowRoutingModeTable(false)}
        onCancel={() => setShowRoutingModeTable(false)}
      >
        <RoutingModeTable projectId={project?.id} />
      </Modal>

      <Modal
        title="Workflow"
        open={showWorkflowTable}
        onClose={() => setShowWorkflowTable(false)}
        className='workflow-modal'
      >
        <WorkflowEditor projectId={project?.id} netWorkId={activeTab} />
      </Modal>
    </div>
  );
};

export default TabContainer;
