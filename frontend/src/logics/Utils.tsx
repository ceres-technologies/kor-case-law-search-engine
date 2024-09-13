
export interface RequestResult {
  result?: any;
  error?: string;
}

export const requestServer = async (
  path: string,
  data: any,
  method: string = "POST"
) => {
  const url = window.myGlobal.REACT_APP_API_URL + path;
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  if (response.status === 500) throw Error("Internal Server Error");
  if (!response.ok) throw Error("Error: " + response.status);
  return await response.json();
};

export const requestFormData = async (
  path: string,
  data: FormData
) => {
  const url = window.myGlobal.REACT_APP_API_URL + path;
  const response = await fetch(url, {
    method: "POST",
    body: data,
  });
  if (response.status === 500) throw Error("Internal Server Error");
  if (!response.ok) throw Error("Error: " + response.status);
  return await response.json();
};

export const throttleAsync = (func, limit) => {
  let inThrottle;
  return async function (...args: any[]) {
    const context: any = this;
    if (!inThrottle) {
      inThrottle = true;
      try {
        await func.apply(context, args);
      } finally {
        setTimeout(() => (inThrottle = false), limit);
      }
    }
  };
};

export const generateRandomString = (length) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};
