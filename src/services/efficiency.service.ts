import mongoose, { Document } from 'mongoose';
import { performance } from 'perf_hooks';

import { Efficiency } from '../models';
import { IVehicleData } from '../models/vehicleData.model';
import Logger from '../config/logger';

const logger = Logger('efficiency-service');

const upsertEfficiency = async (vehicleData: Document): Promise<void> => {
  const startTime = performance.now();
  const { charge_state, drive_state, vehicle_state, vehicle, user } = vehicleData.toJSON() as IVehicleData;
  const { charge_energy_added, charge_miles_added_rated } = charge_state;

  const effRating = (charge_energy_added / charge_miles_added_rated) * 1000;
  const effDoc = await Efficiency.findOneAndUpdate(
    { vehicle, user },
    [
      {
        /* set the main body of the doc
         * {
         *    user      : 53w038...,
         *    vehicle   : 6fq036...,
         *    createdAt : 2022-0...,
         *    updatedAt : 2022-0...,
         *    latest    : 2022.2...,
         *    2022      : {
         *      20 : {
         *          8 : {
         *                ratings : [] ONLY SETS IF NULL
         *              }
         *           }
         *    },
         * }
         */
        $set: {
          user: { $ifNull: ['$user', new mongoose.Types.ObjectId(user)] },
          vehicle: { $ifNull: ['$vehicle', new mongoose.Types.ObjectId(vehicle)] },
          createdAt: { $ifNull: ['$createdAt', new Date(drive_state.timestamp)] },
          updatedAt: new Date(drive_state.timestamp),
          latest: vehicle_state.car_version,
          [`${vehicle_state.car_version}.ratings`]: { $ifNull: [`$${vehicle_state.car_version}.ratings`, []] },
        },
      },
      {
        /* THEN update the ratings array of the current car version
         * if the current rating is not already in the ratings arr
         */
        $set: {
          [`${vehicle_state.car_version}.ratings`]: {
            $cond: [
              {
                /**** IF THIS IS TRUE *****/
                $in: [effRating, `$${vehicle_state.car_version}.ratings`],
              },
              /**** THEN USE THIS *****/
              `$${vehicle_state.car_version}.ratings`,
              {
                /**** ELSE USE THIS *****/
                $concatArrays: [`$${vehicle_state.car_version}.ratings`, [effRating]],
              },
            ],
          },
        },
      },
      {
        /* THEN update the average rating of the current car version */
        $set: {
          [`${vehicle_state.car_version}.avg`]: { $avg: `$${vehicle_state.car_version}.ratings` },
        },
      },
    ],
    { upsert: true, new: true }
  );
  logger.info('upserted efficiency doc', { _id: effDoc._id, vehicle });
  logger.debug(`call to upsertEfficiency took ${performance.now() - startTime} milliseconds`);
};

export default {
  upsertEfficiency,
};
