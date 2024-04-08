import { Request } from "express";

export interface FollowRequest extends Request {
  params: {
    profileId: string;
  };
}
export interface UnfollowRequest extends Request {
  params: {
    profileId: string;
  };
}

export interface PublicPlaylistsRequest extends Request {
  params: {
    profileId: string;
  };
  query: {
    limit: string;
    pageNumber: string;
  };
}

export interface GetRecommendedAudiosRequest extends Request {
  query: {
    limit: string;
  };
}

export interface PublicProfileRequest extends Request {
  params: {
    profileId: string;
  };
}

export interface GetFollowersRequest extends Request {
  query: {
    limit: string;
    pageNumber: string;
  };
}

export interface GetFollowersForPublicProfileRequest extends Request {
  params: {
    profileId: string;
  };
  query: {
    limit: string;
    pageNumber: string;
  };
}

export interface GetFollowingsRequest extends Request {
  query: {
    limit: string;
    pageNumber: string;
  };
}

export interface GetIsFollowingRequest extends Request {
  params: {
    profileId: string;
  };
}
