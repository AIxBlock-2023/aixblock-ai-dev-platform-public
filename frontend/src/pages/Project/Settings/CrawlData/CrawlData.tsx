import React, { useCallback, useEffect, useState } from "react";
import IconSearch from "@/assets/icons/iconSearch";
import Button from "@/components/Button/Button";
import InputBase from "@/components/InputBase/InputBase";
import Select from "@/components/Select/Select";
import "./CrawlData.scss";
import { TProjectModel } from "@/models/project";
import LayoutSettings from "../LayoutSettings/Index";
import { TApiCallResult, useApi } from "@/providers/ApiProvider";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import Modal from "@/components/Modal/Modal";
import Spin from "@/components/Spin/Spin";
import Notice from "@/components/Notice/Notice";
import IconInfo from "@/assets/icons/IconInfo";
import Table from "@/components/Table/Table";
import { convertDate } from "@/utils/formatDate";
import VideoPlayer from "@/components/VideoPlayer/VideoPlayer";
import AudioPlayer from "@/components/AudioPlayer/AudioPlayer";
import IconDetail from "@/assets/icons/IconDetail";
import EmptyContent from "@/components/EmptyContent/EmptyContent";
type TCrawlDataProps = {
  data?: TProjectModel | null;
};

export type TItemCrawl = {
  id: number;
  title?: string;
  url?: string;
  thumbnail?: string;
  viewCount?: string;
  duration?: string;
  create_date?: string;
  publishedTime?: string;
  "{caption}"?: string;
  content?: string;
};

const TYPE_CRAWL = {
  label: "Type",
  options: [
    {
      label: "Text",
      value: "Text",
    },
    {
      label: "Photo",
      value: "Photo",
    },
    {
      label: "Video",
      value: "Video",
    },
    {
      label: "Podcast",
      value: "Podcast",
    },
    {
      label: "Camera",
      value: "Camera",
    },
    {
      label: "Audio",
      value: "Audio",
    },
    // {
    //   label: "Tiktok",
    //   value: "Tiktok",
    // },
  ],
};

enum TYPE_ENUM {
  TEXT = "Text",
  PHOTO = "Photo",
  VIDEO = "Video",
  PODCAST = "Podcast",
  CAMERA = "Camera",
  AUDIO = "Audio",
  // TIKTOK = "Tiktok",
}

const CrawlData = React.memo((props: TCrawlDataProps) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useParams();
  const projectID = parseInt(params.projectID ?? "0");
  const [typeCrawl, setTypeCrawl] = useState(TYPE_CRAWL);
  const [loadingError, setLoadingError] = React.useState<null | string>(null);
  const api = useApi();
  const [isPageLoaded, setPageLoaded] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isShowModal, setIsShowModal] = useState<boolean>(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [disabled, setDisabled] = useState<boolean>(true);
  const [type, setType] = useState<string>(searchParams.get("type") || "");
  const [label] = useState<string>(searchParams.get("label") || "");
  const [selectedItem, setSelectedItem] = useState<any>({});
  const [currentResultType, setCurrentResultType] = useState<string | null>(
    localStorage.getItem("crawl_type")
  );

  const [defaultValueType, setDefaultValueType] = useState({
    label: searchParams.get("type") || "Select type",
    value: searchParams.get("type") || "",
  });

  const [listItem, setListItem] = useState([]);

  const [keyword, setKeyword] = useState<string>(
    searchParams.get("keyword") || ""
  );
  const [quantity, setQuantity] = useState<string>(
    searchParams.get("quantity") || "10"
  );

  const handleImageClick = (item: TItemCrawl) => {
    setShowImageModal(true);
    setSelectedItem(item);
  };

  const removeLocalStorage = () => {
    localStorage.removeItem("crawl_search_id");
    localStorage.removeItem("crawl_keyword");
    localStorage.removeItem("crawl_type");
    localStorage.removeItem("crawl_quantity");
    localStorage.removeItem("crawl_label");
  };

  const items = React.useMemo(() => {
    let updatedList: TItemCrawl[] = [];
    for (let i = 0; i <= 10 && i < listItem.length; i++) {
      const item = listItem[i] as any;
      if (
        type.toLocaleLowerCase() === TYPE_ENUM.PHOTO.toLocaleLowerCase() ||
        type.toLocaleLowerCase() === TYPE_ENUM.TEXT.toLocaleLowerCase()
      ) {
        updatedList.push({
          id: item.id,
          title: item.title,
          url: item.url,
          create_date: item.create_date || item.created_date,
        });
      }
      if (
        type.toLocaleLowerCase() === TYPE_ENUM.VIDEO.toLocaleLowerCase() ||
        type.toLocaleLowerCase() === TYPE_ENUM.AUDIO.toLocaleLowerCase() 
        // type.toLocaleLowerCase() === TYPE_ENUM.TIKTOK.toLocaleLowerCase()
      ) {
        updatedList.push({
          id: item.id,
          title: item.title,
          url: item.url,
          thumbnail: item.thumbnail,
          viewCount: item.viewCount,
          duration: item.duration,
          create_date: item.create_date,
          publishedTime: item.publishedTime,
        });
      }
      if (type.toLocaleLowerCase() === TYPE_ENUM.PODCAST.toLocaleLowerCase()) {
        updatedList.push({
          id: item.id,
          url: item.url,
          title: item["{caption}"],
          thumbnail: item.thumbnail,
          create_date: item.create_date,
        });
      }
      if (type.toLocaleLowerCase() === TYPE_ENUM.CAMERA.toLocaleLowerCase()) {
        updatedList.push({
          id: item.id,
          url: item.url,
          title: item.title,
          content: item.content,
          thumbnail: item.thumbnail,
          create_date: item.create_date,
        });
      }
    }
    return updatedList.map((item) => (
      <>
        {type.toLocaleLowerCase() === TYPE_ENUM.PHOTO.toLocaleLowerCase() && (
          <div
            key={"item-" + item.id}
            className="c-crawldata__item"
            onClick={() => handleImageClick(item)}
          >
            <div className="c-crawldata__item-image">
              <img src={item.url} alt={item.title} />
            </div>
            <div className="c-crawldata__item-name">{item.title}</div>
          </div>
        )}
        {/* video */}
        {type.toLocaleLowerCase() === TYPE_ENUM.VIDEO.toLocaleLowerCase() && (
          <div
            key={"item-" + item.id}
            className="c-crawldata__item"
            onClick={() => handleImageClick(item)}
          >
            <div className="c-crawldata__item-image">
              <img src={item.thumbnail} alt={item.title} />
            </div>
            <div className="c-crawldata__item-name">{item.title}</div>
          </div>
        )}

        {/* tiktok */}
        {/* {type.toLocaleLowerCase() === TYPE_ENUM.TIKTOK.toLocaleLowerCase() && (
          <div
            key={"item-" + item.id}
            className="c-crawldata__item"
            onClick={() => handleImageClick(item)}
          >
            <div className="c-crawldata__item-image">
              <img src={item.thumbnail} alt={item.title} />
            </div>
            <div className="c-crawldata__item-name">{item.title}</div>
          </div>
        )} */}

        {/* audio or podcast */}
        {type.toLocaleLowerCase() === TYPE_ENUM.AUDIO.toLocaleLowerCase() && (
          <div
            key={"item-" + item.id}
            className="c-crawldata__item"
            onClick={() => handleImageClick(item)}
          >
            <div className="c-crawldata__item-image">
              <img
                src={require("@/assets/images/no-audio.jpg")}
                alt={item.title}
              />
            </div>
            <div className="c-crawldata__item-name">{item.title}</div>
          </div>
        )}

        {type.toLocaleLowerCase() === TYPE_ENUM.CAMERA.toLocaleLowerCase() && (
          <div
            key={"item-" + item.id}
            className="c-crawldata__item"
            onClick={() => handleImageClick(item)}
          >
            <div className="c-crawldata__item-image">
              <img
                src={
                  item.thumbnail ||
                  require("@/assets/images/no-camera.jpg")
                }
                alt={item.title}
              />
            </div>
            <div className="c-crawldata__item-name">{item.title}</div>
          </div>
        )}
        {type.toLocaleLowerCase() === TYPE_ENUM.PODCAST.toLocaleLowerCase() && (
          <div
            key={"item-" + item.id}
            className="c-crawldata__item"
            onClick={() => handleImageClick(item)}
          >
            <div className="c-crawldata__item-image">
              <img
                src={
                  item.thumbnail ||
                  require("@/assets/images/no-audio.jpg")
                }
                alt={item.title}
              />
            </div>
            <div className="c-crawldata__item-name">{item.title}</div>
          </div>
        )}
      </>
    ));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listItem]);

  const emptyItems = React.useMemo(() => {
    const list = [];
    const imageMapping = {
      [TYPE_ENUM.PHOTO.toLocaleLowerCase()]: require("@/assets/images/no-image.jpg"),
      [TYPE_ENUM.VIDEO.toLocaleLowerCase()]: require("@/assets/images/no-video.jpg"),
      [TYPE_ENUM.AUDIO.toLocaleLowerCase()]: require("@/assets/images/no-audio.jpg"),
      [TYPE_ENUM.CAMERA.toLocaleLowerCase()]: require("@/assets/images/no-camera.jpg")
      // [TYPE_ENUM.TIKTOK.toLocaleLowerCase()]: require("@/assets/images/no-video.jpg"),
    };
    for (let i = 0; i < 25 - items.length; i++) {
      const imageSource =
        imageMapping[type.toLocaleLowerCase()] ||
        require("@/assets/images/no-image.jpg");

      list.push(
        <div key={"empty-item-" + i} className="c-crawldata__item">
          <div className="c-crawldata__item-image">
            <img src={imageSource} alt="No title" />
          </div>
        </div>
      );
    }

    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);
  
  const fetchData = React.useCallback(() => {
    setLoading(true);
    
    setTypeCrawl({
      ...TYPE_CRAWL,
    });

    const ar = api.call("projectDetail", {
      params: {id: projectID.toString()}
    });

    ar.promise
      .then(async r => {
        const data = await r.json();
        if('text' in data.data_types){
          setTypeCrawl({
            label: "Type",
            options: [
              {
                label: "Text",
                value: "Text",
              },
            ],
          });
        }
        else if('image' in data.data_types){
          setTypeCrawl({
            label: "Type",
            options: [
              {
                label: "Photo",
                value: "Photo",
              },
              {
                label: "Camera",
                value: "Camera",
              },
            ],
          });
        }
        else if('video' in data.data_types){
          setTypeCrawl({
            label: "Type",
            options: [
              {
                label: "Video",
                value: "Video",
              },
              {
                label: "Camera",
                value: "Camera",
              },
            ],
          });
        }
        else if('audio' in data.data_types){
          setTypeCrawl({
            label: "Type",
            options: [
              {
                label: "Podcast",
                value: "Podcast",
              },
              {
                label: "Audio",
                value: "Audio",
              },
            ],
          });
        }
        else{
          setTypeCrawl({
            ...TYPE_CRAWL,
          });
        }})
      .catch(e => {
        if (ar.controller.signal.aborted) {
          return;
        }

        let msg = "An error occurred while loading project information.";

        if (e instanceof Error) {
          msg += " Error: "  + e.message + ".";
        }

        setLoadingError(msg + " Please try again!");

        if (window.APP_SETTINGS.debug) {
          console.error(e);
        }
      })
      .finally(() => {   
        setLoading(false);
      });
  }, [api, projectID]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = useCallback(
    async (isPreview: boolean, isReload?: boolean) => {
      if (isPreview && !isReload) {
        removeLocalStorage();
      }
      setListItem([]);
      setError(null);
      setLoading(true);
      const searchAll =
        isPreview !== undefined ? (isPreview ? "false" : "true") : "true";
      let searchId = "";
      if ((isPreview && isReload) || searchAll === "true") {
        searchId = localStorage.getItem("crawl_search_id") ?? "";
      }

      const queryParams: Record<string, string> = {
        keyword: keyword.toString().toLowerCase(),
        quantity: quantity.toString().toLowerCase(),
        // page_size: quantity.toString().toLowerCase(),
        page_size:"8",
        type: type.toString().toLowerCase(),
        label: label.toString().toLowerCase(),
        all: searchAll,
        search_id: searchId,
        project_id: projectID.toString().toLowerCase(),
      };

      const crawlHistory = api.call("crawlHistory",{
        body: {
          "project_id": projectID.toString().toLowerCase(),
          "keyword": keyword.toString().toLowerCase(),
          "type": type.toString().toLowerCase(),
          "quantity": quantity.toString().toLowerCase(),
          "searchAll": searchAll
        },
      });

      const crawlHistoryResult = await crawlHistory.promise;
        if (crawlHistoryResult){
          console.log(crawlHistoryResult)
          const crawl = await crawlHistoryResult.json();
          if (crawl.search_id) {
            queryParams.search_id = crawl.search_id
          }

          const response: TApiCallResult = api.call("crawlData", {
            query: new URLSearchParams(queryParams),
          });

          if (!isPreview) {
            // removeLocalStorage();
            navigate(`/projects/${props?.data?.id}/data`);
          }
          
          console.log(queryParams)
          try {
          
            const res = await response.promise;
            if (response.controller.signal.aborted) return;

            if (res.ok) {
              const data = await res.json();
              // set params search to url
              searchParams.set("keyword", keyword.toString().toLowerCase());
              searchParams.set("quantity", quantity.toString().toLowerCase());
              searchParams.set("type", type.toString().toLowerCase());
              searchParams.set("label", label.toString().toLowerCase());
              setCurrentResultType(type.toString().toLowerCase());
              setSearchParams(searchParams);
              // set params search to localStorage
              localStorage.setItem("crawl_search_id", data?.search_id);
              localStorage.setItem("crawl_keyword", keyword);
              localStorage.setItem("crawl_type", type);
              localStorage.setItem("crawl_quantity", quantity);
              localStorage.setItem("crawl_label", label);
              setListItem(data?.results);
              setDisabled(false);
              
              // if (searchAll==="false"){
              //   api.call("crawlHistory",{
              //     body: {
              //       "project_id": projectID.toString().toLowerCase(),
              //       "keyword": keyword.toString().toLowerCase(),
              //       "type": type.toString().toLowerCase(),
              //       "quantity": quantity.toString().toLowerCase(),
              //       "search_id": data?.search_id
              //     },
              //   });
              // }
              if (!isPreview) {
                removeLocalStorage();
                // navigate(`/projects/${props?.data?.id}/data`);
              }
            } else {
              throw new Error(`Failed to fetch data. Status: ${res.status}`);
          }
        } catch (e) {
          setError("Error crawl data");
          setLoading(false);
          if (response.controller.signal.aborted) return;

          let msg = "An error occurred while loading model";

          if (e instanceof Error) {
            msg += " Error: " + e.message + ".";
            setError(msg);
          }

          if (window.APP_SETTINGS.debug) {
            console.error(e);
          }
        } finally {
        if (!response.controller.signal.aborted) {
          setLoading(false);
        }
      }}
    },
    [api, keyword, label, navigate, projectID, props?.data?.id, quantity, searchParams, setSearchParams, type]
  );
  useEffect(() => {
    const storedSearchId = localStorage.getItem("crawl_search_id");
    const storedKeyword = localStorage.getItem("crawl_keyword");
    const storedType = localStorage.getItem("crawl_type");
    const storedLabel = localStorage.getItem("crawl_label");
    const storedQuantity = localStorage.getItem("crawl_quantity");
    setError(null);

    if (
      isPageLoaded &&
      storedSearchId &&
      storedType?.toLocaleLowerCase() === type.toLocaleLowerCase()  &&
      storedKeyword === keyword &&
      storedLabel === label &&
      storedQuantity === quantity
    ) {
      handleSearch(true, true);
      setDisabled(false);
    }
    setPageLoaded(false);
  }, [handleSearch, keyword, label, quantity, type, isPageLoaded]);
  
  

  if (loadingError) {
    return <div className="c-crawldata m-307 loading-error">
      <EmptyContent message={loadingError} buttons={[
        {
          children: "Retry",
          type: "hot",
          onClick: () => fetchData(),
        }
      ]} />
    </div>
  }

  return (
    <div className="m-335">
      <div className="c-crawldata m-308">
        <div className="c-crawldata__toolbar">
          <InputBase
            placeholder="Keywords..."
            value={keyword}
            onChange={(e) => {
              const value = e.target.value;
              setKeyword(value);
              setSearchParams(searchParams);
            }}
          />
          <Select
            defaultValue={defaultValueType}
            withContent="250px"
            data={[typeCrawl]}
            onChange={(item) => {
              setType(item.value);
              setDefaultValueType(item);
              setSearchParams(searchParams);
            }}
          />
          <InputBase
            placeholder="Quantity"
            value={quantity}
            type="number"
            onChange={(e) => {
              const value = e.target.value;
              setQuantity(value);
              setSearchParams(searchParams);
            }}
          />
          {/* <Select
            defaultValue={defaultValueLabels}
            withContent="250px"
            data={[
              {
                label: "Labels",
                options: labels.map((label: any) => ({
                  label: label.label,
                  value: label.value,
                })),
              },
            ]}
            onChange={(item) => {
              setLabel(item.value);
              setDefaultValueLabels(item);
              setSearchParams(searchParams);
            }}
          /> */}
          <Button
            type="primary"
            size="small"
            icon={<IconSearch />}
            disabled={!keyword || !type}
            className="c-crawldata__action--search"
            onClick={() => {
              handleSearch(true);
            }}
          >
            Search
          </Button>
        </div>
        {error && (
          <div className="error">
            <Notice icon={<IconInfo />} title={error} status="error" />
          </div>
        )}

        <div
          className={
            currentResultType === TYPE_ENUM.TEXT.toLocaleLowerCase()
              ? "c-crawldata__text"
              : "c-crawldata__list"
          }
        >
          {loading && <Spin loading={loading} />}

          {!loading && listItem.length > 0 ? (
            <>
              {/* show data with type !== text */}
              {currentResultType !== TYPE_ENUM.TEXT.toLocaleLowerCase() &&
                items}
              {/* show data with type === text */}
              {currentResultType === TYPE_ENUM.TEXT.toLocaleLowerCase() && (
                <Table
                  columns={[
                    { label: "ID", dataKey: "id", noWrap: true },
                    { label: "Title", dataKey: "title", noWrap: true },
                    { label: "URL", dataKey: "url" },
                    {
                      label: "Date",
                      dataKey: "create_date",

                      renderer: (value) => convertDate(value.created_date),
                    },
                  ]}
                  data={listItem.slice(0, 10)}
                />
              )}
              {/* show skeleton with type !== text */}
              {currentResultType !== TYPE_ENUM.TEXT.toLocaleLowerCase() &&
                emptyItems}
              {/* show skeleton with type === text */}
              {currentResultType === TYPE_ENUM.TEXT.toLocaleLowerCase() && (
                <Table
                  columns={[
                    { label: "ID", dataKey: "id", noWrap: true },
                    { label: "Title", dataKey: "title", noWrap: true },
                    { label: "URL", dataKey: "url", noWrap: true },
                    {
                      label: "Date",
                      dataKey: "created_date",
                      noWrap: true,
                      renderer: (value) => convertDate(value.created_date),
                    },
                  ]}
                  skeleton={true}
                  headHidden={true}
                  data={listItem.slice(0, 8)}
                />
              )}

              {/* button search all */}
              <div className="c-crawldata__list-search-all">
                <Button
                  className="search-all"
                  size="large"
                  disabled={disabled}
                  onClick={() => {
                    setIsShowModal(true);
                  }}
                >
                  Add to project
                </Button>
                <Modal
                  open={isShowModal}
                  onCancel={() => setIsShowModal(false)}
                  title={`Are you sure to craw ${quantity} file `}
                  cancelText="No"
                  submitText="Yes"
                  children={`Are you sure you want to include all this data in your project?`}
                  onSubmit={() => {
                    setIsShowModal(false);
                    handleSearch(false);
                  }}
                />
              </div>
            </>
          ) : (
            <div className="c-crawldata__list-hidden"></div>
          )}
        </div>
        <Modal
          open={showImageModal}
          onCancel={() => setShowImageModal(false)}
          title={`Detail ${type}`}
          className="c-crawldata-_modal"
          iconTitle={<IconDetail />}
        >
          {(currentResultType === TYPE_ENUM.AUDIO.toLocaleLowerCase() ||
            currentResultType === TYPE_ENUM.PODCAST.toLocaleLowerCase()) && (
            <AudioPlayer url={selectedItem.url} data={selectedItem} />
          )}
          {(currentResultType === TYPE_ENUM.VIDEO.toLocaleLowerCase() ||
            currentResultType === TYPE_ENUM.CAMERA.toLocaleLowerCase()) && (
            <VideoPlayer url={selectedItem.url} />
          )}
          {currentResultType === TYPE_ENUM.PHOTO.toLocaleLowerCase() && (
            <img
              className="c-crawldata__modal-img"
              src={
                selectedItem.url
                  ? selectedItem.url
                  : require("@/assets/images/no-image.jpg")
              }
              alt="No title"
            />
          )}
          <span className="c-crawldata__modal-item">Kind: {type}</span>
          <span className="c-crawldata__modal-item">
            Title: {selectedItem.title}
          </span>
          {selectedItem.viewCount && (
            <span className="c-crawldata__modal-item">
              View: {selectedItem.viewCount}
            </span>
          )}
          {selectedItem.duration && (
            <span className="c-crawldata__modal-item">
              Duration: {selectedItem.duration}
            </span>
          )}
          {selectedItem.create_date && (
            <span className="c-crawldata__modal-item">
              Created: {selectedItem.create_date}
            </span>
          )}
          {selectedItem.publishedTime && (
            <span className="c-crawldata__modal-item">
              Published: {selectedItem.publishedTime}
            </span>
          )}
        </Modal>
      </div>
      <LayoutSettings.Footer
        prevUrl={"/projects/" + props.data?.id + `/import/cloud`}
        nextUrl={"/projects/" + props.data?.id + `/import/contact_us`}
        onSkip={() => navigate("/projects/" + props.data?.id + `/import/contact_us`)}
      />
    </div>
  );
});

export default CrawlData;
