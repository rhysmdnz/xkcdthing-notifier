import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import axios, { AxiosResponse } from "axios";

admin.initializeApp();

const db = admin.firestore();

const topicName = "new_xkcd_comic";

interface XKCDComic {
  month: string;
  num: number;
  year: string;
  link: string;
  news: string;
  safe_title: string;
  transcript: string;
  alt: string;
  img: string;
  title: string;
  day: string;
}

async function getLatestId(): Promise<number> {
  const docRef = db.collection("xkcd").doc("comics");
  const doc = await docRef.get();
  return doc.get("latest");
}

async function setLatestId(id: number) {
  const docRef = db.collection("xkcd").doc("comics");
  await docRef.set({
    latest: id,
  });
}

function constructNotification(comic: XKCDComic): admin.messaging.Message {
  return {
    topic: topicName,
    notification: {
      title: "New XKCD Comic",
      body: comic["title"],
    },
    android: {
      notification: {
        imageUrl: comic["img"],
        channelId: "new_xkcd_comic",
      },
    },
  };
}

export const checkXKCD = onSchedule("eviery 5 minutes", async () => {
  const response: AxiosResponse<XKCDComic> = await axios.get(
    "https://xkcd.com/info.0.json"
  );

  const latestId = await getLatestId();

  if (response.data["num"] > latestId || latestId == undefined) {
    functions.logger.info("New XKCD Comic!", response.data);

    await setLatestId(response.data["num"]);

    const notification = constructNotification(response.data);

    try {
      await admin.messaging().send(notification);
    } catch (err) {
      functions.logger.error("notification error", err);
    }
    functions.logger.info("notification sent");
  }
});
