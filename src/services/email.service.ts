import axios from '../config/axios';
import { ITeslaAccount } from '../models/teslaAccount.model';

const { appApi } = axios;

const sendDataCollectionStoppedEmail = async (teslaAccount: Partial<ITeslaAccount>): Promise<void> => {
  try {
    const endpoint = `/v1/tesla-account/send-data-collection-stopped-email?teslaAccountId=${teslaAccount._id}&userId=${teslaAccount.user}`;
    await appApi.post(endpoint);
  } catch (error) {
    // fail silently for now
  }
};

export default {
  sendDataCollectionStoppedEmail,
};
