import { isValidObjectId } from "mongoose";
import * as Yup from "yup";

export const historySchema = Yup.object().shape({
  audio: Yup.string()
    .transform(function (value) {
      if (this.isType(value) && isValidObjectId(value)) {
        return value;
      }
      return "";
    })
    .required("Audio Id required !"),
  progress: Yup.number().typeError("Progress value must be a number").required("Progress number required !"),
  date: Yup.string()
    .transform(function (value) {
      const date = new Date(value);
      if (date instanceof Date) {
        return value;
      }
      return "";
    })
    .required("Date is required !"),
});
