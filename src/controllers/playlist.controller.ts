import { Response } from "express";
import AudioModel from "models/audio.model";
import PlayListModel, { PlayListDocument } from "models/playlist.model";
import { PipelineStage, Schema, Types, isValidObjectId } from "mongoose";
import {
  AddPlayListRequest,
  GetPlaylistAudiosRequest,
  GetPlaylistAudiosTotalCountRequest,
  GetPlaylistAudiosTotalDurationRequest,
  GetPlaylistTotalCountRequest,
  GetPlaylistsRequest,
  RemovePlayListRequest,
  UpdatePlayListRequest,
  getIsExistentInPlaylistRequest,
} from "types/requests/playlist.requests";

const createPlayList = async (req: AddPlayListRequest, res: Response) => {
  const { title, audioId, visibility } = req.body;

  const ownerId = req.user.id as Schema.Types.ObjectId;

  try {
    if (audioId) {
      const audio = await AudioModel.findById(audioId);

      if (!audio) {
        return res.status(404).json({ error: "Audio not found !" });
      }
    }

    const playlist: PlayListDocument = {
      title,
      owner: ownerId,
      visibility,
      items: [],
    };

    if (audioId) {
      playlist.items.push(audioId);
    }

    const createdPlaylist = await PlayListModel.create<PlayListDocument>(playlist);

    return res.status(200).json({ playlist: createdPlaylist });
  } catch (error) {
    console.log(error);
    return res.status(422).json({ error });
  }
};

const updatePlayList = async (req: UpdatePlayListRequest, res: Response) => {
  const { title, id, audioId, visibility } = req.body;
  const userId = req.user.id;

  try {
    const playlist = await PlayListModel.findOneAndUpdate({ _id: id, owner: userId }, { title, visibility }, { new: true });

    if (!playlist) {
      return res.status(422).json({ error: "Audio file not found !" });
    }

    if (audioId) {
      await PlayListModel.findByIdAndUpdate(playlist._id, { visibility, title, $addToSet: { items: audioId } });
    }

    return res.status(200).json({
      playlist: {
        id: playlist.id,
        title,
        visibility,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(422).json({ error });
  }
};

const removePlayList = async (req: RemovePlayListRequest, res: Response) => {
  const { playlistId, audioId, all } = req.query;
  const userId = req.user.id;

  try {
    if (!isValidObjectId(playlistId)) {
      return res.status(422).json({ error: "Playlist Id not valid !" });
    }

    if (all === "yes") {
      const playlistToDelete = await PlayListModel.findByIdAndDelete(playlistId);

      if (!playlistToDelete) {
        return res.status(404).json({ error: "Playlist not found !" });
      }

      return res.status(200).json({ message: "Playlist deleted succesfully !" });
    } else {
      const playlist = await PlayListModel.findOneAndUpdate({ _id: playlistId, owner: userId }, { $pull: { items: audioId } });

      if (!playlist) {
        return res.status(404).json({ error: "Playlist not found !" });
      }

      return res.status(200).json({ message: "Audio succesfully removed !" });
    }
  } catch (error) {
    console.log(error);
    return res.status(422).json({ error });
  }
};

const getPlaylistsByUser = async (req: GetPlaylistsRequest, res: Response) => {
  const userId = req.user.id;
  const { limit = "20", pageNumber = "0", title } = req.query;

  // * Fetch only the summary of each playlist, not all audios from each one
  try {
    const pipeline: PipelineStage[] = [
      { $match: { owner: userId, visibility: { $ne: "auto" } } },

      {
        $project: {
          audio: { $slice: ["$items", parseInt(limit) * parseInt(pageNumber), parseInt(limit)] },
          title: "$title",
          visibility: "$visibility",
          updatedAt: "$updatedAt",
          createdAt: "$createdAt",
        },
      },

      { $unwind: { path: "$audio", preserveNullAndEmptyArrays: true } },
      { $lookup: { from: "audios", localField: "audio", foreignField: "_id", as: "audio" } },
      {
        $group: {
          _id: "$_id",
          title: { $first: "$title" },
          visibility: { $first: "$visibility" },
          updatedAt: { $first: "$updatedAt" },
          createdAt: { $first: "$createdAt" },
          audios: { $push: { $ifNull: [{ $arrayElemAt: ["$audio", 0] }, null] } },
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          visibility: 1,
          audios: {
            $cond: {
              if: { $eq: [{ $arrayElemAt: ["$audios", 0] }, null] },
              then: [],
              else: {
                $map: {
                  input: "$audios",
                  as: "audio",
                  in: {
                    $cond: {
                      if: { $eq: [{ $indexOfArray: ["$audios", "$$audio"] }, 0] },
                      then: { _id: "$$audio._id", poster: "$$audio.poster.url" },
                      else: { _id: "$$audio._id" },
                    },
                  },
                },
              },
            },
          },
          updatedAt: 1,
          createdAt: 1,
        },
      },
    ];

    if (title) {
      pipeline.push({ $match: { title: { $regex: title, $options: "i" } } }, { $sort: { title: 1 } });
    } else {
      pipeline.push({ $sort: { createdAt: -1 } });
    }

    pipeline.push({ $skip: parseInt(limit) * parseInt(pageNumber) }, { $limit: parseInt(limit) });

    const playlists = await PlayListModel.aggregate(pipeline);

    return res.status(200).json({ playlists: playlists });
  } catch (error) {
    console.log(error);
    return res.status(422).json({ error });
  }
};

const getPlayListsTotalCount = async (req: GetPlaylistTotalCountRequest, res: Response) => {
  const { title } = req.query;
  const userId = req.user.id;

  try {
    const filter: any[] = [{ owner: userId, visibility: { $in: ["public", "private"] } }];

    if (title) {
      filter.push({ title: { $regex: title } });
    }

    const totalCount = await PlayListModel.collection.countDocuments({ $and: filter });

    return res.status(200).json(totalCount);
  } catch (error) {
    console.log(error);
    return res.status(422).json({ error });
  }
};

export const getPlaylistAudiosTotalCount = async (req: GetPlaylistAudiosTotalCountRequest, res: Response) => {
  const { playlistId } = req.query;
  const userId = req.user.id;

  try {
    if (!isValidObjectId(playlistId)) {
      return res.status(422).json({ error: "Invalid playlist id !" });
    }
    const playlist = await PlayListModel.findOne({ _id: playlistId, owner: userId });

    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found !" });
    }

    return res.status(200).json(playlist.items.length);
  } catch (error) {
    return res.status(422).json(error);
  }
};

export const getPlaylistAudiosTotalDuration = async (req: GetPlaylistAudiosTotalDurationRequest, res: Response) => {
  const { playlistId } = req.query;

  const userId = req.user.id;

  try {
    if (!isValidObjectId(playlistId)) {
      return res.status(422).json({ error: "Invalid playlist id !" });
    }

    const data = await PlayListModel.aggregate([
      { $match: { _id: new Types.ObjectId(playlistId) } },
      { $unwind: "$items" },
      {
        $project: {
          audio: "$items",
        },
      },
      { $lookup: { from: "audios", localField: "audio", foreignField: "_id", as: "audio" } },
      { $project: { duration: "$audio.duration" } },
      { $unwind: "$duration" },
      { $group: { _id: null, duration: { $sum: "$duration" } } },
    ]);

    return res.status(200).json(data[0].duration);
  } catch (error) {
    return res.status(422).json(error);
  }
};

const getPlayListAudios = async (req: GetPlaylistAudiosRequest, res: Response) => {
  const { playlistId } = req.params;
  const userId = req.user.id;

  try {
    if (!isValidObjectId(playlistId)) {
      return res.status(422).json({ error: "Invalid playlist id !" });
    }

    const playlist = await PlayListModel.findOne({ _id: playlistId, owner: userId }).populate({
      path: "items",
      populate: { path: "owner", select: "name " },
    });

    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found !" });
    }

    const audios: any = playlist.items.map((audio: any) => {
      return {
        id: audio._id,
        title: audio.title,
        about: audio.about,
        category: audio.category,
        file: audio.file.url,
        poster: audio.poster ? audio.poster.url : null,
        owner: {
          id: audio.owner.id,
          name: audio.owner.name,
        },
        duration: audio.duration,
      };
    });

    return res.status(200).json({ audios });
  } catch (error) {
    console.log(error);
    return res.status(422).json(error);
  }
};

const getIsExistentInPlaylist = async (req: getIsExistentInPlaylistRequest, res: Response) => {
  const { playlistId, audioId } = req.query;

  try {
    if (!isValidObjectId(audioId)) {
      return res.status(422).json({ error: "Audio id is not valid !" });
    }

    const existsInPlayList = await PlayListModel.findOne({ _id: playlistId, items: audioId });

    return res.status(200).json(existsInPlayList ? true : false);
  } catch (error) {
    console.log(error);
    return res.status(422).json({ error });
  }
};

const PlaylistController = {
  createPlayList,
  updatePlayList,
  removePlayList,
  getPlaylistsByUser,
  getPlayListsTotalCount,
  getPlayListAudios,
  getPlaylistAudiosTotalCount,
  getPlaylistAudiosTotalDuration,
  getIsExistentInPlaylist,
};

export default PlaylistController;
