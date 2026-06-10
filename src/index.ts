import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging, Message } from "firebase-admin/messaging";

initializeApp();

const db = getFirestore();

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

async function getLatestId(): Promise<number | undefined> {
  const docRef = db.collection("xkcd").doc("comics");
  const doc = await docRef.get();
  return doc.get("latest");
}

async function setLatestId(id: number): Promise<void> {
  const docRef = db.collection("xkcd").doc("comics");
  await docRef.set({
    latest: id,
  });
}

function constructNotification(comic: XKCDComic): Message {
  return {
    topic: topicName,
    notification: {
      title: "New XKCD Comic",
      body: comic.title,
    },
    android: {
      notification: {
        imageUrl: comic.img,
        channelId: "new_xkcd_comic",
      },
    },
  };
}

export const checkxkcd = onSchedule("every 5 minutes", async () => {
  try {
    const response = await fetch("https://xkcd.com/info.0.json");
    if (!response.ok) {
      throw new Error(`Failed to fetch latest comic: ${response.statusText}`);
    }
    const comic = (await response.json()) as XKCDComic;

    const latestId = await getLatestId();

    if (latestId === undefined || comic.num > latestId) {
      logger.info("New XKCD Comic!", comic);

      await setLatestId(comic.num);

      const notification = constructNotification(comic);

      try {
        await getMessaging().send(notification);
        logger.info("notification sent");
      } catch (err) {
        logger.error("notification error", err);
      }
    }
  } catch (err) {
    logger.error("Error in checkxkcd job", err);
  }
});
