import { Request, Response } from "express";
import HistoryModel from "models/history.model";
import { Types } from "mongoose";
import { History } from "types/common/History";
import { RemoveHistoryRequest, UpdateHistoryRequest } from "types/requests/history.requests";

const updateHistory = async (req: UpdateHistoryRequest, res: Response) => {
  const userId = req.user.id;
  const { audio, date, progress } = req.body;

  try {
    const oldHistory = await HistoryModel.findOne({ owner: userId });
    const history: History = { audio, date: new Date(date), progress: parseInt(progress), _id: new Types.ObjectId() };

    if (!oldHistory) {
      await HistoryModel.create({
        owner: userId,
        last: history,
        all: [history],
      });

      return res.status(200).json({ success: true });
    } else {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const histories = await HistoryModel.aggregate([
        { $match: { owner: userId } },
        { $unwind: "$all" },
        {
          $match: {
            "all.date": {
              $gte: startOfDay,
              $lt: endOfDay,
            },
          },
        },
        { $project: { audio: "$all.audio", _id: 0 } },
      ]);

      const sameDayHistory = histories.find((item) => item.audio.toString() === audio);

      if (sameDayHistory) {
        await HistoryModel.findOneAndUpdate({ owner: userId, "all.audio": audio }, { $set: { "all.$.progress": progress, "all.$.date": new Date(date) } });
      } else {
        await HistoryModel.findByIdAndUpdate(oldHistory._id, {
          $push: { all: { $each: [history], $position: 0 } },
          $set: { last: history },
        });
      }

      return res.status(200).json({ success: true });
    }
  } catch (error) {
    console.log(error);
    return res.status(422).json({ error });
  }
};

const removeHistory = async (req: RemoveHistoryRequest, res: Response) => {
  const { all, histories } = req.query;

  const userId = req.user.id;

  try {
    if (all === "yes") {
      await HistoryModel.findOneAndDelete({ owner: userId });

      return res.status(200).json({ messaage: "History deleted entirely !" });
    } else {
      const ids = JSON.parse(histories);

      await HistoryModel.findOneAndUpdate(
        {
          owner: userId,
        },
        { $pull: { all: { audio: { $in: ids } } } },
      );

      return res.status(200).json({ message: "Record(s) from history deleted !" });
    }
  } catch (error) {
    console.log(error);
    return res.status(422).json({ error });
  }
};

const getHistories = async (req: Request, res: Response) => {
  const userId = req.user.id;

  try {
    const histories = await HistoryModel.aggregate([
      { $match: { owner: userId } },
      { $project: { all: "$all" } },
      { $unwind: "$all" },
      { $lookup: { from: "audios", localField: "all.audio", foreignField: "_id", as: "audioInfo" } },
      { $unwind: "$audioInfo" },
      { $project: { _id: 0, id: "$all._id", audioId: "$audioInfo._id", title: "$audioInfo.title", date: "$all.date", poster: "$audioInfo.poster.url" } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, audios: { $push: "$$ROOT" } } },
      { $project: { _id: 0, date: "$_id", audios: "$$ROOT.audios" } },
      { $sort: { date: -1 } },
    ]);

    return res.status(200).json(histories);
  } catch (error) {
    console.log(error);
    return res.status(422).json({ error });
  }
};

const getRecentlyPlayed = async (req: Request, res: Response) => {
  const userId = req.user.id;

  try {
    const audios = await HistoryModel.aggregate([
      { $match: { owner: userId } },
      { $project: { recentlyPlayed: { $slice: ["$all", 10] } } },
      { $project: { histories: { $sortArray: { input: "$recentlyPlayed", sortBy: { date: -1 } } } } },
      { $unwind: { path: "$histories", includeArrayIndex: "index" } },
      { $lookup: { from: "audios", localField: "histories.audio", foreignField: "_id", as: "audioInfo" } },
      { $unwind: "$audioInfo" },
      { $lookup: { from: "users", localField: "audioInfo.owner", foreignField: "_id", as: "owner" } },
      { $unwind: "$owner" },
      {
        $project: {
          _id: 0,
          owner: { name: "$owner.name", _id: "$owner._id" },
          id: "$audioInfo._id",
          title: "$audioInfo.title",
          about: "$audioInfo.about",
          file: "$audioInfo.file",
          poster: "$audioInfo.poster",
          date: "$histories.date",
          progress: "$histories.progress",
        },
      },
    ]);

    return res.status(200).json({ audios });
  } catch (error) {
    console.log(error);
    return res.status(422).json({ error });
  }
};

const HistoryController = {
  updateHistory,
  removeHistory,
  getHistories,
  getRecentlyPlayed,
};

export default HistoryController;
