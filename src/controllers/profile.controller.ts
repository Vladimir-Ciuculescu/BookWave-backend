import { Request, Response } from "express";
import AudioModel from "../models/audio.model";
import AutoPlayListModel from "../models/autogenerated-playlist";
import HistoryModel from "../models/history.model";
import PlayListModel from "../models/playlist.model";
import UserModel from "../models/user.model";
import { PipelineStage, Types, isValidObjectId } from "mongoose";
import { getAudiosRequest } from "../types/requests/audio.requests";
import { GetPlaylistAudios } from "../types/requests/playlist.requests";
import {
  FollowRequest,
  GetFollowersForPublicProfileRequest,
  GetFollowersRequest,
  GetFollowingsRequest,
  GetIsFollowingRequest,
  GetRecommendedAudiosRequest,
  PublicPlaylistsRequest,
  PublicProfileRequest,
  UnfollowRequest,
} from "../types/requests/profile.requests";
import { getUsersPreviousHistory } from "../utils/getUsersPreviousHistory";

const followProfile = async (req: FollowRequest, res: Response) => {
  const { profileId } = req.params;
  const userId = req.user.id;

  try {
    if (!isValidObjectId(profileId)) {
      return res.status(422).json({ error: "Invalid profile Id" });
    }

    // ? Update the list of followings for current logged in user
    await UserModel.findByIdAndUpdate(userId, { $addToSet: { followings: profileId } });

    // ? Update the list of followers for the followed user
    await UserModel.findByIdAndUpdate(profileId, { $addToSet: { followers: userId } });

    return res.status(200).json({ message: "Profile added to follow !" });
  } catch (error) {
    console.log(error);
    return res.status(422).json({ error });
  }
};

const unfollowProfile = async (req: UnfollowRequest, res: Response) => {
  const { profileId } = req.params;
  const userId = req.user.id;

  try {
    if (!isValidObjectId(profileId)) {
      return res.status(422).json({ error: "Invalid object id !" });
    }

    // ? Remove the profile from followings list of the current logged in user
    await UserModel.findByIdAndUpdate(userId, { $pull: { followings: profileId } });

    // ? Remove the current logged in user from followers list of the profile user
    await UserModel.findByIdAndUpdate(profileId, { $pull: { followers: userId } });

    return res.status(200).json({ message: "Profile removed from follow !" });
  } catch (error) {
    console.log(error);
    return res.status(422).json({ error });
  }
};

const getAudiosTotalCount = async (req: Request, res: Response) => {
  const userId = req.user.id;

  try {
    const response = await AudioModel.countDocuments({ owner: userId });

    return res.status(200).json(response);
  } catch (error: any) {
    console.log(error);
    return res.status(422).json({ error });
  }
};

const getAudios = async (req: getAudiosRequest, res: Response) => {
  const userId = req.user.id;
  const { limit = "20", pageNumber = "0" } = req.query;

  try {
    const response = await AudioModel.find({ owner: userId })
      .sort({ createdAt: "desc" })
      .skip(parseInt(pageNumber) * parseInt(limit))
      .limit(parseInt(limit));

    const audios = response.map((audio) => {
      return {
        id: audio._id,
        title: audio.title,
        about: audio.about,
        category: audio.category,
        file: audio.file.url,
        poster: audio.poster?.url,
        date: audio.createdAt,
        owner: { id: userId, name: req.user.name },
        duration: audio.duration,
      };
    });

    return res.status(200).json({ audios });
  } catch (error) {
    console.log(error);
    return res.status(422).json(error);
  }
};

const getPublicProfile = async (req: PublicProfileRequest, res: Response) => {
  const { profileId } = req.params;

  try {
    if (!isValidObjectId(profileId)) {
      return res.status(422).json({ error: "Invalid Profile id !" });
    }

    const profile = await UserModel.findById(profileId);

    if (!profile) {
      return res.status(404).json({ error: "Profile not found !" });
    }

    return res.status(200).json({
      id: profile._id,
      name: profile.name,
      email: profile.email,
      followers: profile.followers.length,
      followings: profile.followings.length,
      avatar: profile.avatar?.url,
    });
  } catch (error) {
    console.log(error);
    return res.status(422).json({ error });
  }
};

const getPublicPlaylists = async (req: PublicPlaylistsRequest, res: Response) => {
  const { profileId } = req.params;
  const { limit, pageNumber } = req.query;

  try {
    if (!isValidObjectId(profileId)) {
      return res.status(422).json({ error: "Invalid profile id !" });
    }

    const playlists = await PlayListModel.find({
      owner: profileId,
      visibility: "public",
    })
      .sort({ createdAt: "desc" })
      .skip(parseInt(limit) * parseInt(pageNumber))
      .limit(parseInt(limit));

    return res.status(200).json({
      playlists: playlists.map((playlist) => {
        return {
          id: playlist._id,
          title: playlist.title,
          items: playlist.items.length,
        };
      }),
    });
  } catch (error) {
    console.log(error);
    return res.status(422).json({ error });
  }
};

const getRecommendedAudios = async (req: GetRecommendedAudiosRequest, res: Response) => {
  const user = req.user;
  const { limit = "20" } = req.query;

  let matchOptions: PipelineStage.Match = { $match: { _id: { $exists: true } } };

  try {
    if (user) {
      const categories = await getUsersPreviousHistory(req);

      if (categories.length) {
        matchOptions = { $match: { category: { $in: categories } } };
      }
    }
    // Get generic audios
    const audios = await AudioModel.aggregate([
      { $addFields: { likesLength: { $size: "$likes" } } },
      // { $match: { _id: { $exists: true } } },
      matchOptions,
      { $sort: { likesLength: -1 } },
      { $limit: parseInt(limit) },
      { $lookup: { from: "users", localField: "owner", foreignField: "_id", as: "owner" } },
      { $unwind: "$owner" },
      {
        $project: {
          _id: 0,
          owner: { name: "$owner.name", id: "$owner._id" },
          id: "$_id",
          title: "$title",
          category: "$category",
          about: "$about",
          file: "$file.url",
          poster: "$poster.url",
          duration: "$duration",
        },
      },
      { $limit: parseInt(limit) },
    ]);

    return res.status(200).json({ audios });
  } catch (error) {
    console.log(error);
    return res.status(422).json({ error });
  }
};

const getAutoGeneratedPlaylists = async (req: Request, res: Response) => {
  try {
    let matchOptions: PipelineStage.Match = { $match: { _id: { $exists: true } } };

    const [result] = await HistoryModel.aggregate([
      { $match: { owner: req.user.id } },
      { $unwind: "$all" },
      { $group: { _id: "$all.audio", items: { $addToSet: "$all.audio" } } },
      { $sample: { size: 20 } },
      { $group: { _id: null, items: { $push: "$_id" } } },
    ]);

    if (result) {
      await PlayListModel.updateOne(
        { owner: req.user.id, title: "Mixed 20" },
        { $set: { title: "Mixed 20", items: result.items, visibility: "auto" } },
        { upsert: true },
      );
    }

    const categories = await getUsersPreviousHistory(req);

    if (categories.length) {
      matchOptions = { $match: { title: { $in: categories } } };
    }

    const playlists = await AutoPlayListModel.aggregate([
      matchOptions,
      { $sample: { size: 4 } },
      { $project: { _id: 0, id: "$_id", title: "$title", itemsCount: { $size: "$items" } } },
    ]);

    const mixedPlaylist = await PlayListModel.findOne({ owner: req.user.id, title: "Mixed 20" });

    playlists.push({
      id: mixedPlaylist?._id,
      title: mixedPlaylist?.title,
      itemsCount: mixedPlaylist?.items.length,
    });

    return res.status(200).json({ playlists });
  } catch (error) {
    console.log(error);
  }
};

const getFollowers = async (req: GetFollowersRequest, res: Response) => {
  const userId = req.user.id;

  const { limit = "20", pageNumber = "0" } = req.query;

  try {
    const followers = await UserModel.aggregate([
      { $match: { _id: userId } },
      { $project: { _id: 0, followers: { $slice: ["$followers", parseInt(limit) * parseInt(pageNumber), parseInt(limit)] } } },
      { $unwind: "$followers" },
      { $lookup: { from: "users", localField: "followers", foreignField: "_id", as: "follower" } },
      { $unwind: "$follower" },
      { $project: { _id: "$follower._id", name: "$follower.name", avatar: "$follower.avatar.url" } },
    ]);

    return res.status(200).json({ followers });
  } catch (error) {
    console.log(error);
    return res.status(422).json({ error });
  }
};

const getFollowersForPublicProfile = async (req: GetFollowersForPublicProfileRequest, res: Response) => {
  const { profileId } = req.params;

  const { limit = "20", pageNumber = "0" } = req.query;
  try {
    if (!isValidObjectId(profileId)) {
      return res.status(422).json({ error: "Invalid profile Id !" });
    }

    const followers = await UserModel.aggregate([
      { $match: { _id: new Types.ObjectId(profileId) } },
      { $project: { _id: 0, followers: { $slice: ["$followers", parseInt(limit) * parseInt(pageNumber), parseInt(limit)] } } },
      { $unwind: "$followers" },
      { $lookup: { from: "users", localField: "followers", foreignField: "_id", as: "follower" } },
      { $unwind: "$follower" },
      { $project: { _id: "$follower._id", name: "$follower.name", avatar: "$follower.avatar.url" } },
    ]);

    return res.status(200).json({ followers });
  } catch (error) {
    console.log(error);
    return res.status(200).json({ error });
  }
};

const getFollowings = async (req: GetFollowingsRequest, res: Response) => {
  const userId = req.user.id;
  const { limit = "20", pageNumber = "0" } = req.query;

  try {
    const followings = await UserModel.aggregate([
      { $match: { _id: userId } },
      { $project: { _id: 0, followings: { $slice: ["$followings", parseInt(limit) * parseInt(pageNumber), parseInt(limit)] } } },
      { $unwind: "$followings" },
      { $lookup: { from: "users", localField: "followings", foreignField: "_id", as: "following" } },
      { $unwind: "$following" },
      { $project: { _id: "$following._id", name: "$following.name", avatar: "$following.avatar.url" } },
    ]);

    return res.status(200).json({ followings });
  } catch (error) {
    console.log(error);
    return res.status(422).json({ error });
  }
};

const getIsFollowing = async (req: GetIsFollowingRequest, res: Response) => {
  const { profileId } = req.params;
  const userId = req.user.id;

  try {
    if (!isValidObjectId(profileId)) {
      return res.status(422).json({ error: "Invalid progfile Id !" });
    }

    const data = await UserModel.findOne({ _id: userId, followings: profileId });

    return res.status(200).json({ status: data ? true : false });
  } catch (error) {
    console.log(error);
    return res.status(422).json({ error });
  }
};

const getPlaylistAudios = async (req: GetPlaylistAudios, res: Response) => {
  const { playlistId } = req.params;
  const { limit = "20", pageNumber = "0" } = req.query;

  const aggregation = [
    { $match: { _id: new Types.ObjectId(playlistId), visibility: { $ne: "private" } } },
    { $project: { title: "$title", items: { $slice: ["$items", parseInt(limit) * parseInt(pageNumber), parseInt(limit)] } } },
    { $unwind: "$items" },
    { $lookup: { from: "audios", localField: "items", foreignField: "_id", as: "audio" } },
    { $unwind: "$audio" },
    { $lookup: { from: "users", localField: "audio.owner", foreignField: "_id", as: "owner" } },
    { $unwind: "$owner" },
    {
      $group: {
        _id: {
          id: "$_id",
          title: "$title",
        },
        audios: {
          $push: {
            id: "$audio._id",
            title: "$audio.title",
            about: "$audio.about",
            category: "$audio.category",
            file: "$audio.file.url",
            poster: "$audio.poster.url",
            owner: {
              name: "$owner.name",
              id: "$owner._id",
            },
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        id: "$_id.id",
        title: "$_id.title",
        audios: "$$ROOT.audios",
      },
    },
  ];

  try {
    const [audios] = await PlayListModel.aggregate(aggregation);

    if (!audios) {
      const [audios] = await AutoPlayListModel.aggregate(aggregation);

      if (!audios) {
        return res.status(200).json({});
      }

      return res.status(200).json(audios);
    }

    return res.status(200).json(audios);
  } catch (error) {
    console.log(error);
    return res.status(200).json({ error });
  }
};

const getPrivatePlaylistAudios = async (req: GetPlaylistAudios, res: Response) => {
  const { playlistId } = req.params;
  const { limit = "20", pageNumber = "0" } = req.query;
  const userId = req.user.id;

  const aggregation = [
    { $match: { _id: new Types.ObjectId(playlistId), owner: userId } },
    { $project: { title: "$title", items: { $slice: ["$items", parseInt(limit) * parseInt(pageNumber), parseInt(limit)] } } },
    { $unwind: "$items" },
    { $lookup: { from: "audios", localField: "items", foreignField: "_id", as: "audio" } },
    { $unwind: "$audio" },
    { $lookup: { from: "users", localField: "audio.owner", foreignField: "_id", as: "owner" } },
    { $unwind: "$owner" },
    {
      $group: {
        _id: {
          id: "$_id",
          title: "$title",
        },
        audios: {
          $push: {
            id: "$audio._id",
            title: "$audio.title",
            about: "$audio.about",
            category: "$audio.category",
            file: "$audio.file.url",
            poster: "$audio.poster.url",
            owner: {
              name: "$owner.name",
              id: "$owner._id",
            },
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        id: "$_id.id",
        title: "$_id.title",
        audios: "$$ROOT.audios",
      },
    },
  ];

  try {
    const [audios] = await PlayListModel.aggregate(aggregation);

    if (!audios) {
      const [audios] = await AutoPlayListModel.aggregate(aggregation);

      if (!audios) {
        return res.status(200).json({});
      }

      return res.status(200).json(audios);
    }

    return res.status(200).json(audios);
  } catch (error) {
    console.log(error);
    return res.status(200).json({ error });
  }
};

const ProfileController = {
  followProfile,
  unfollowProfile,
  getAudiosTotalCount,
  getAudios,
  getPublicProfile,
  getPublicPlaylists,
  getRecommendedAudios,
  getAutoGeneratedPlaylists,
  getFollowers,
  getFollowersForPublicProfile,
  getFollowings,
  getPlaylistAudios,
  getPrivatePlaylistAudios,
  getIsFollowing,
};

export default ProfileController;
