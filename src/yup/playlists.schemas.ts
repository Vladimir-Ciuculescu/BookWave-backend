import { isValidObjectId } from "mongoose";
import { visibilites } from "types/enums/visibility.enum";
import * as Yup from "yup";

export const addPlayListSchema = Yup.object().shape({
  title: Yup.string().required("Title is missing !"),
  audioId: Yup.string().transform(function (value) {
    if (this.isType(value) && isValidObjectId(value)) {
      return value;
    }
    return "";
  }),
  visibility: Yup.string().oneOf(visibilites, "Invalid visibility option !").required("Visibility is requiredddd !"),
});

export const updatePlayListSchema = Yup.object().shape({
  title: Yup.string().required("Title is required !"),
  id: Yup.string()
    .transform(function (value) {
      if (this.isType(value) && isValidObjectId(value)) {
        return value;
      }
      return "";
    })
    .required("Playlist id is required !"),
  audioId: Yup.string().transform(function (value) {
    if (this.isType(value) && isValidObjectId(value)) {
      return value;
    }
    return "";
  }),
  visibility: Yup.string().oneOf(visibilites, "Visibility value is not valid !").required("Visibility is required !"),
});
