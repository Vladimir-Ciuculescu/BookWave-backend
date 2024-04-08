import { Request } from "express";

export interface GetFavoritesRequest extends Request {
  query: {
    limit: string;
    pageNumber: string;
    //test
    categories: string;
    title?: string;
  };
}

export interface GetFavoritesTotalCountRequest extends Request {
  query: {
    title: string;
    categories: string;
  };
}
