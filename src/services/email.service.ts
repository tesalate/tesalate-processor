import axios from '../config/axios';
import { ITeslaAccount } from '../models/teslaAccount.model';

const { appApi } = axios;

const sendDataCollectionStoppedEmail = async (teslaAccount: Partial<ITeslaAccount>): Promise<void> => {
  try {
    const endpoint = `/v1/tesla-account/send-data-collection-stopped-notification?teslaAccountId=${teslaAccount._id}&userId=${teslaAccount.user}`;
    await appApi.post(endpoint);
  } catch (error) {
    // fail silently for now
  }
};

const sendEndOfWeekEmail = async (teslaAccount: Partial<ITeslaAccount>, vehicle: string): Promise<void> => {
  const endpoint = `/v1/tesla-account/send-end-of-week-email?teslaAccountId=${teslaAccount._id}&userId=${teslaAccount.user}&vehicle=${vehicle}`;
  await appApi.post(endpoint);
};

export default {
  sendDataCollectionStoppedEmail,
  sendEndOfWeekEmail,
};
