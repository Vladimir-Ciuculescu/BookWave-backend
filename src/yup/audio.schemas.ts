import { categories } from "types/enums/audio-category.enum";
import * as Yup from "yup";

export const audioSchema = Yup.object().shape({
  title: Yup.string().required("Title is required !"),
  about: Yup.string().required("Description is required !"),
  category: Yup.string().oneOf(categories, "Invalid category").required("The category is required !"),
});
