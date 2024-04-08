import { Request, Response } from "express";
import AudioModel from "models/audio.model";
import FavoriteModel, { FavoriteDocument } from "models/favorite.model";
import { PipelineStage, isValidObjectId } from "mongoose";
import { ToggleFavoriteAudioRequest } from "types/requests/audio.requests";
import { GetFavoritesRequest, GetFavoritesTotalCountRequest } from "types/requests/favorite.request";

const toggleFavoriteAudio = async (req: ToggleFavoriteAudioRequest, res: Response) => {
  const { audioId } = req.query;
  const userId = req.user.id;

  try {
    let status;
    let isAdded;

    if (!isValidObjectId(audioId)) {
      return res.status(422).json({ error: "Audio Id is invalid !" });
    }

    const audio = await AudioModel.findById(audioId);

    if (!audio) {
      return res.status(404).json({ error: "Audio does not exist !" });
    }

    const alreadyFavorite = await FavoriteModel.findOne({ owner: userId, items: audioId });

    if (alreadyFavorite) {
      // * Audio is already in list and must be unselected
      isAdded = false;
      await alreadyFavorite.updateOne({ $pull: { items: audioId } });
      status = "removed";
    } else {
      const favoriteList = await FavoriteModel.findOne({ owner: userId });

      if (favoriteList) {
        // * Audio is not in the list and you simply add it
        await favoriteList.updateOne({ $addToSet: { items: audioId } });
        isAdded = true;
        status = "added";
      } else {
        // * Add audio file in newly created favorites list !
        isAdded = true;
        status = "Added & Created";
        const newFavoriteList = {
          owner: userId,
          items: [audioId],
        };

        await FavoriteModel.create<FavoriteDocument>(newFavoriteList);
      }
    }

    // * Also update the like status for the current audio
    if (isAdded) {
      await AudioModel.findByIdAndUpdate(audioId, { $addToSet: { likes: userId } });
    } else {
      await AudioModel.findByIdAndUpdate(audioId, { $pull: { likes: userId } });
    }

    return res.status(200).json({ message: status });
  } catch (error) {
    console.log(error);
    return res.status(422).json({ error });
  }
};

const getFavorites = async (req: GetFavoritesRequest, res: Response) => {
  const userId = req.user.id;
  const { limit = "20", pageNumber = "0", title, categories = "" } = req.query;

  const pipeLine: PipelineStage[] = [
    { $match: { owner: userId } },
    { $project: { audioIds: "$items" } },
    { $unwind: "$audioIds" },
    { $lookup: { from: "audios", localField: "audioIds", foreignField: "_id", as: "audio" } },
    { $unwind: "$audio" },
    { $lookup: { from: "users", localField: "audio.owner", foreignField: "_id", as: "owner" } },
    { $unwind: "$owner" },
    {
      $project: {
        _id: 0,
        id: "$audio._id",
        title: "$audio.title",
        about: "$audio.about",
        category: "$audio.category",
        file: "$audio.file.url",
        poster: "$audio.poster.url",
        duration: "$audio.duration",
        owner: { name: "$owner.name", id: "$owner._id" },
        createdAt: "$audio.createdAt",
      },
    },
  ];

  //Apply filters if required

  if (categories) {
    pipeLine.push({ $match: { category: { $in: categories.split(",") } } });
  }

  if (title) {
    pipeLine.push({ $match: { title: { $regex: title, $options: "i" } } }, { $sort: { title: 1 } });
  } else {
    pipeLine.push({ $sort: { createdAt: -1 } });
  }

  //Add pagination
  pipeLine.push({ $skip: parseInt(limit) * parseInt(pageNumber) }, { $limit: parseInt(limit) });

  try {
    const favorites = await FavoriteModel.aggregate(pipeLine);

    return res.status(200).json({ favorites });
  } catch (error) {
    console.log(error);
    return res.status(422).json({ error });
  }
};

export const getFavoritesTotalCount = async (req: GetFavoritesTotalCountRequest, res: Response) => {
  const { title, categories } = req.query;

  const userId = req.user.id;

  try {
    const pipeline: PipelineStage[] = [
      {
        $match: {
          owner: userId,
        },
      },
      {
        $unwind: "$items",
      },
      {
        $lookup: {
          from: "audios",
          localField: "items",
          foreignField: "_id",
          as: "audio",
        },
      },
      {
        $unwind: "$audio",
      },
    ];

    if (title) {
      pipeline.push({ $match: { "audio.title": { $regex: title, $options: "i" } } });
    }

    if (categories) {
      pipeline.push({ $match: { "audio.category": { $in: categories.split(",") } } });
    }

    const filteredFavorites = await FavoriteModel.aggregate(pipeline);

    return res.status(200).json(filteredFavorites.length);
  } catch (error) {
    console.log(error);
    return res.status(422).json({ error });
  }
};

const getIsFavorite = async (req: Request, res: Response) => {
  const { audioId } = req.query;
  const userId = req.user.id;

  try {
    if (!isValidObjectId(audioId)) {
      return res.status(422).json({ error: "Audio id not valid !" });
    }

    const favorite = await FavoriteModel.findOne({ owner: userId, items: audioId });

    return res.status(200).json(favorite ? true : false);
  } catch (error) {
    console.log(error);
    return res.status(422).json({ error });
  }
};

const FavoriteController = {
  toggleFavoriteAudio,
  getFavorites,
  getFavoritesTotalCount,
  getIsFavorite,
};

export default FavoriteController;
