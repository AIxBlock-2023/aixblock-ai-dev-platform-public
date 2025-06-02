import {useMemo} from "react";
import styles from "./TemplateItem.module.scss";
import { convertHtmlToText } from "@/utils/html";
import { formatFloat } from "@/utils/customFormat";
import { TWorkflowTemplateCategoryModel, TWorkflowTemplateModel } from "@/models/workflowTemplate";
import { Converter } from "showdown";
import UserName from "@/components/UserName/UserName";

const mdConverter = new Converter();

const TagIcon = ({...props}) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M14.8725 6.52485L11.475 3.12735C10.7625 2.41485 9.77998 2.03235 8.77498 2.08485L5.02498 2.26485C3.52498 2.33235 2.33248 3.52485 2.25748 5.01735L2.07748 8.76735C2.03248 9.77235 2.40748 10.7549 3.11998 11.4674L6.51748 14.8649C7.91248 16.2599 10.1775 16.2599 11.58 14.8649L14.8725 11.5724C16.275 10.1849 16.275 7.91985 14.8725 6.52485ZM7.12498 9.28485C5.93248 9.28485 4.96498 8.31735 4.96498 7.12485C4.96498 5.93235 5.93248 4.96485 7.12498 4.96485C8.31748 4.96485 9.28498 5.93235 9.28498 7.12485C9.28498 8.31735 8.31748 9.28485 7.12498 9.28485Z"
      fill="#292D32"/>
  </svg>
)

const DotIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="5" height="4" viewBox="0 0 5 4" fill="none">
    <circle cx="2.75" cy="2" r="2" fill="#6F728F"/>
  </svg>
)

const BlueDollarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M9.5625 11.9402H10.05C10.5375 11.9402 10.9425 11.5052 10.9425 10.9802C10.9425 10.3277 10.71 10.2002 10.3275 10.0652L9.57 9.80273V11.9402H9.5625Z"
      fill="#5050FF"/>
    <path
      d="M8.97755 1.42482C4.83755 1.43982 1.48505 4.80732 1.50005 8.94732C1.51505 13.0873 4.88255 16.4398 9.02255 16.4248C13.1625 16.4098 16.515 13.0423 16.5 8.90232C16.4851 4.76232 13.1175 1.41732 8.97755 1.42482ZM10.6951 8.99982C11.2801 9.20232 12.0676 9.63732 12.0676 10.9798C12.0676 12.1348 11.16 13.0648 10.05 13.0648H9.56255V13.4998C9.56255 13.8073 9.30755 14.0623 9.00005 14.0623C8.69255 14.0623 8.43755 13.8073 8.43755 13.4998V13.0648H8.16755C6.93755 13.0648 5.94005 12.0298 5.94005 10.7548C5.94005 10.4473 6.19505 10.1923 6.50255 10.1923C6.81005 10.1923 7.06505 10.4473 7.06505 10.7548C7.06505 11.4073 7.56005 11.9398 8.16755 11.9398H8.43755V9.40482L7.30505 8.99982C6.72005 8.79732 5.93255 8.36232 5.93255 7.01982C5.93255 5.86482 6.84005 4.93482 7.95005 4.93482H8.43755V4.49982C8.43755 4.19232 8.69255 3.93732 9.00005 3.93732C9.30755 3.93732 9.56255 4.19232 9.56255 4.49982V4.93482H9.83255C11.0625 4.93482 12.0601 5.96982 12.0601 7.24482C12.0601 7.55232 11.805 7.80732 11.4976 7.80732C11.1901 7.80732 10.9351 7.55232 10.9351 7.24482C10.9351 6.59232 10.4401 6.05982 9.83255 6.05982H9.56255V8.59482L10.6951 8.99982Z"
      fill="#5050FF"/>
    <path
      d="M7.06494 7.02707C7.06494 7.67957 7.29744 7.80707 7.67994 7.94207L8.43744 8.20457V6.05957H7.94994C7.46244 6.05957 7.06494 6.49457 7.06494 7.02707Z"
      fill="#5050FF"/>
  </svg>
)

export type TModelItemProps = {
  item: TWorkflowTemplateModel;
  onClick?: (item: TWorkflowTemplateModel) => void;
  noPrice?: boolean;
  categories: TWorkflowTemplateCategoryModel[];
}

export default function TemplateItem({
  item,
  onClick,
  noPrice,
  categories,
}: TModelItemProps) {
  const desc = useMemo(() => {
    return item.description ? convertHtmlToText(mdConverter.makeHtml(item.description)) : "";
  }, [ item.description ]);

  return (
    <div className={ styles.container } onClick={() => onClick?.(item)}>
      <div className={ styles.top }>
        <img
          className={ styles.logo }
          src={ require("@/assets/images/logo.png") }
          alt={ item.name }
        />
        <div className={ styles.badges }>
          {!noPrice && (
            item.price > 0
              ? (
                <span className={styles.price}>
                  <BlueDollarIcon/>
                  ${formatFloat(item.price, 2)}
                </span>
              ) : (
                <span className={styles.free}>
                  <BlueDollarIcon/>
                  FREE
                </span>
              )
          )}
        </div>
      </div>
      <div className={styles.name}>{item.name}</div>
      {desc.length > 0 && (
        <div className={styles.desc}>
          {desc.length > 190 ? desc.substring(0, 190) + "..." : desc}
        </div>
      )}
      <div className={styles.bottom}>
        <span>
          <TagIcon/>
          {
            item.categoryId === "Community"
              ? "Community"
              : (
                item.categoryId.length > 0
                  ? (categories.find(c => c.id === item.categoryId)?.displayName ?? "Uncategorized")
                  : "Uncategorized"
              )
          }
        </span>
        <DotIcon/>
        <span>
          Author: {item.userId === -1 ? "AIxBlock" : <UserName userID={item.userId} />}
        </span>
      </div>
    </div>
  )
}
