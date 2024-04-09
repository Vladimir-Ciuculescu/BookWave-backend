import { isValidObjectId } from "mongoose";
import * as Yup from "yup";

// export const changePasswordSchema = Yup.object().shape({
//   userId: Yup.string().transform(function (value) {
//     if (this.isType(value) && isValidObjectId(value)) {
//       return value;
//     }

//     return "";
//   }),
//   password: Yup.string().trim().required("Password is required !").min(8, "Password is too short !"),
// });

export const changePasswordSchema = Yup.object().shape({
  email: Yup.string().required("Email is missing").email("Not a valid email !"),
  password: Yup.string().trim().required("Password is missing").min(8, "Password is too short"),
});

export const passwordResetTokenSchem = Yup.object().shape({
  token: Yup.string().trim().required("Token is required !"),
  userId: Yup.string()
    .transform(function (value) {
      if (this.isType(value) && isValidObjectId(value)) {
        return value;
      }

      return "";
    })
    .required("The userId is required !"),
});

export const signInSchema = Yup.object().shape({
  email: Yup.string().required("The email is required !").email("That's not a valid email address !"),
  password: Yup.string().trim().required("The password is required !").min(8, "The password is too short !"),
});

export const tokenSchema = Yup.object().shape({
  token: Yup.string().trim().required("The token is required !"),
  userId: Yup.string()
    .transform(function (value) {
      if (this.isType(value) && isValidObjectId(value)) {
        return value;
      }

      return "";
    })
    .required("Invalid user Id"),
});

export const userSchema = Yup.object().shape({
  name: Yup.string().trim().required("Name is required !").min(3, "Name is too short !").max(20, "Name is too long"),
  email: Yup.string().required("Email is missing").email("Not a valid email !"),
  password: Yup.string().trim().required("Password is missing").min(8, "Password is too short"),
});
