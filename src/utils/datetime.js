import dayjs from "dayjs"

const INVALID_DATE = "N/A"

/** 格式化日期时间 */
export const formatDateTime = (datetime = "", template = "YYYY-MM-DD HH:mm:ss") => {
  const day = dayjs(datetime)
  return day.isValid() ? day.format(template) : INVALID_DATE
}
