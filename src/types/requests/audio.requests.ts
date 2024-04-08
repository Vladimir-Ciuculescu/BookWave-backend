import { Category } from "types/enums/audio-category.enum";
import { FilesRequest } from "./files.request";
import { Request } from "express";

export interface AddAudioRequest extends FilesRequest {
  body: {
    title: string;
    about: string;
    category: Category;
  };
}

export interface getAudiosRequest extends Request {
  query: {
    limit: string;
    pageNumber: string;
  };
}

export interface GetLatestUploadsRequest extends Request {
  query: {
    limit: string;
  };
}

export interface ToggleFavoriteAudioRequest extends Request {
  query: {
    audioId: any;
  };
}
