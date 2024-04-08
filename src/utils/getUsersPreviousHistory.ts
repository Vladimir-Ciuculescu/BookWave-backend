import { Request, Response } from "express";
import HistoryModel from "models/history.model";
import moment from "moment";

export const getUsersPreviousHistory = async (req: Request) => {
  const userId = req.user.id;

  try {
    const [result] = await HistoryModel.aggregate([
      { $match: { owner: userId } },
      { $unwind: "$all" },
      { $match: { "all.date": { $gte: moment().subtract(30, "days").toDate() } } },
      { $group: { _id: "$all.audio" } },
      { $lookup: { from: "audios", localField: "_id", foreignField: "_id", as: "audio" } },
      { $unwind: "$audio" },
      { $group: { _id: null, category: { $addToSet: "$audio.category" } } },
    ]);

    if (result) {
      return result.category;
    } else {
      return [];
    }
  } catch (error) {
    console.log(error);
  }
};
