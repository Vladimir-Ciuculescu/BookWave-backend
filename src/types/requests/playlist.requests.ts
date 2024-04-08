import { Request } from "express";
import { ObjectId } from "mongoose";
import { Visibility } from "types/enums/visibility.enum";

export interface AddPlayListRequest extends Request {
  body: {
    title: string;
    audioId: ObjectId;
    visibility: Visibility;
  };
}
export interface GetPlaylistAudiosRequest extends Request {
  params: {
    playlistId: string;
  };
}

export interface GetPlaylistAudiosTotalCountRequest extends Request {
  query: {
    playlistId: string;
  };
}

export interface GetPlaylistAudiosTotalDurationRequest extends Request {
  query: {
    playlistId: string;
  };
}

export interface GetPlaylistsRequest extends Request {
  query: {
    limit: string;
    pageNumber: string;
    title?: string;
  };
}

export interface GetPlaylistTotalCountRequest extends Request {
  query: {
    title: string;
  };
}

export interface RemovePlayListRequest extends Request {
  query: {
    audioId?: string;
    playlistId: string;
    all: "yes" | "no";
  };
}

export interface UpdatePlayListRequest extends Request {
  body: {
    id: ObjectId;
    title: string;
    audioId: ObjectId;
    visibility: Visibility;
  };
}

export interface GetPlaylistAudios extends Request {
  params: {
    playlistId: string;
  };
  query: {
    limit: string;
    pageNumber: string;
  };
}

export interface getIsExistentInPlaylistRequest extends Request {
  query: {
    audioId: string;
    playlistId: string;
  };
}
