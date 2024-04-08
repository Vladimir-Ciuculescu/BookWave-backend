export const convertFormData = (formData: FormData) => {
  let result: any = {};

  Object.entries(formData).forEach(([key, value]) => {
    const initialString = JSON.stringify(value);
    const substractedString = initialString.substring(1, initialString.length - 1);
    const stringValue = substractedString.replace(/"/g, "");

    result[key] = stringValue;
  });

  return result;
};
